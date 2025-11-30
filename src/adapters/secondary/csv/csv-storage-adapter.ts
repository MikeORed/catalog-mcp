import { loadConfig } from '../config/config-loader.js';
import { ProjectConfig, DatasetConfig } from '../../../domain/entities/dataset-config.js';
import { DatasetSchema } from '../../../domain/entities/dataset-schema.js';
import { ConfigError } from '../../../domain/errors/config-error.js';

/**
 * Adapter for CSV file storage
 * Handles configuration loading and validation
 */
export class CsvStorageAdapter {
  private config: ProjectConfig | null = null;
  private schemas: Map<string, DatasetSchema> = new Map();

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
}
