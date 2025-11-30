import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { loadConfig } from '../config/config-loader.js';
import { ProjectConfig, DatasetConfig } from '../../../domain/entities/dataset-config.js';
import { DatasetSchema } from '../../../domain/entities/dataset-schema.js';
import { DatasetId } from '../../../domain/value-objects/dataset-id.js';
import { FieldType } from '../../../domain/value-objects/field-type.js';
import { QueryResultRow } from '../../../domain/entities/query-result.js';
import { ConfigError } from '../../../domain/errors/config-error.js';
import { DatasetNotFoundError } from '../../../domain/errors/dataset-not-found-error.js';
import { DatasetStoragePort } from '../../../ports/secondary/dataset-storage-port.js';

/**
 * Adapter for CSV file storage
 * Handles configuration loading, validation, and CSV data loading
 */
export class CsvStorageAdapter implements DatasetStoragePort {
  private config: ProjectConfig | null = null;
  private schemas: Map<string, DatasetSchema> = new Map();
  private datasetConfigs: Map<string, DatasetConfig> = new Map();

  constructor(private readonly configPath: string) {}

  /**
   * Initialize the adapter by loading and validating configuration
   * This method implements fail-fast validation - any error will prevent startup
   * @throws ConfigError if configuration is invalid
   */
  async initialize(): Promise<void> {
    console.error(`Loading configuration from: ${this.configPath}`);
    
    // Load configuration
    this.config = await this.loadConfiguration();
    
    // Validate each dataset and build schemas
    for (const datasetConfig of this.config.datasets) {
      console.error(`Validating dataset: ${datasetConfig.id}`);
      this.validateDatasetConfig(datasetConfig);
      
      const schema = this.buildSchema(datasetConfig);
      this.schemas.set(schema.id, schema);
      this.datasetConfigs.set(datasetConfig.id, datasetConfig);
    }
    
    console.error(`Successfully loaded ${this.schemas.size} dataset(s)`);
  }

  /**
   * Load configuration from file
   * @throws ConfigError if loading fails
   */
  private async loadConfiguration(): Promise<ProjectConfig> {
    return await loadConfig(this.configPath);
  }

  /**
   * Validate a dataset configuration
   * Performs additional validation beyond schema validation
   * @throws ConfigError if validation fails
   */
  private validateDatasetConfig(config: DatasetConfig): void {
    // Check for duplicate field names (already done in schema, but explicit check here)
    const fieldNames = config.fields.map(f => f.name);
    const uniqueFieldNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueFieldNames.size) {
      throw new ConfigError(
        `Duplicate field names detected. Each field name must be unique.`,
        config.id
      );
    }

    // Validate keyField exists
    if (!fieldNames.includes(config.keyField)) {
      throw new ConfigError(
        `keyField '${config.keyField}' does not exist in fields array.`,
        config.id
      );
    }

    // Validate lookupKeys exist
    for (const lookupKey of config.lookupKeys) {
      if (!fieldNames.includes(lookupKey)) {
        throw new ConfigError(
          `lookupKey '${lookupKey}' does not exist in fields array.`,
          config.id
        );
      }
    }

    // Validate visibleFields exist
    for (const visibleField of config.visibleFields) {
      if (!fieldNames.includes(visibleField)) {
        throw new ConfigError(
          `visibleField '${visibleField}' does not exist in fields array.`,
          config.id
        );
      }
    }

    // Validate visibleFields is not empty
    if (config.visibleFields.length === 0) {
      throw new ConfigError(
        `visibleFields cannot be empty. At least one field must be visible.`,
        config.id
      );
    }

    // Validate limits
    if (config.limits.defaultLimit <= 0) {
      throw new ConfigError(
        `defaultLimit must be positive (got ${config.limits.defaultLimit}).`,
        config.id
      );
    }

    if (config.limits.maxLimit <= 0) {
      throw new ConfigError(
        `maxLimit must be positive (got ${config.limits.maxLimit}).`,
        config.id
      );
    }

    if (config.limits.maxLimit < config.limits.defaultLimit) {
      throw new ConfigError(
        `maxLimit (${config.limits.maxLimit}) must be >= defaultLimit (${config.limits.defaultLimit}).`,
        config.id
      );
    }
  }

  /**
   * Build a DatasetSchema from a DatasetConfig
   */
  private buildSchema(config: DatasetConfig): DatasetSchema {
    return {
      id: config.id,
      name: config.name,
      description: config.description,
      fields: config.fields,
      keyField: config.keyField,
      lookupKeys: config.lookupKeys,
      visibleFields: config.visibleFields,
      limits: {
        defaultLimit: config.limits.defaultLimit,
        maxLimit: config.limits.maxLimit,
      },
    };
  }

  /**
   * Get all schemas (for use by DatasetCatalogService)
   */
  getSchemas(): DatasetSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Get configuration (for debugging/testing)
   */
  getConfig(): ProjectConfig | null {
    return this.config;
  }

  /**
   * Implementation of DatasetStoragePort.listSchemas
   */
  listSchemas(): DatasetSchema[] {
    return this.getSchemas();
  }

  /**
   * Implementation of DatasetStoragePort.loadDataset
   * Loads all rows from a CSV file
   */
  async loadDataset(datasetId: DatasetId): Promise<QueryResultRow[]> {
    const config = this.datasetConfigs.get(datasetId);
    if (!config) {
      throw new DatasetNotFoundError(datasetId);
    }

    // Read CSV file
    const csvContent = await readFile(config.path, 'utf-8');

    // Parse CSV with header row
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Convert and type-cast each row
    return records.map((record: any) => this.convertRow(record, config));
  }

  /**
   * Implementation of DatasetStoragePort.loadById
   * Loads a single row by key field value
   */
  async loadById(datasetId: DatasetId, keyValue: string | number): Promise<QueryResultRow | undefined> {
    const config = this.datasetConfigs.get(datasetId);
    if (!config) {
      throw new DatasetNotFoundError(datasetId);
    }

    // Load all rows (future optimization: stream and find)
    const allRows = await this.loadDataset(datasetId);

    // Find row with matching key field
    return allRows.find((row) => row[config.keyField] === keyValue);
  }

  /**
   * Convert a raw CSV record to a QueryResultRow with proper type casting
   */
  private convertRow(record: Record<string, string>, config: DatasetConfig): QueryResultRow {
    const row: QueryResultRow = {};

    for (const field of config.fields) {
      const rawValue = record[field.name];

      // Handle missing values
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        row[field.name] = null;
        continue;
      }

      // Type cast based on field type
      switch (field.type) {
        case FieldType.String:
        case FieldType.Enum:
          row[field.name] = rawValue;
          break;

        case FieldType.Number:
          const num = Number(rawValue);
          row[field.name] = isNaN(num) ? null : num;
          break;

        case FieldType.Boolean:
          const lower = rawValue.toLowerCase();
          if (lower === 'true' || lower === '1' || lower === 'yes') {
            row[field.name] = true;
          } else if (lower === 'false' || lower === '0' || lower === 'no') {
            row[field.name] = false;
          } else {
            row[field.name] = null;
          }
          break;

        default:
          row[field.name] = null;
      }
    }

    return row;
  }
}
