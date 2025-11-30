import { DatasetId } from '../value-objects/dataset-id.js';
import { DatasetSchema } from '../entities/dataset-schema.js';
import { DatasetNotFoundError } from '../errors/dataset-not-found-error.js';

/**
 * Domain service for managing dataset schemas
 * Provides fast lookup and listing of available datasets
 */
export class DatasetCatalogService {
  private readonly schemas: Map<DatasetId, DatasetSchema>;

  constructor(schemas: DatasetSchema[]) {
    this.schemas = new Map();
    for (const schema of schemas) {
      this.schemas.set(schema.id, schema);
    }
  }

  /**
   * Get schema for a specific dataset
   * @throws DatasetNotFoundError if dataset doesn't exist
   */
  getSchema(datasetId: DatasetId): DatasetSchema {
    const schema = this.schemas.get(datasetId);
    if (!schema) {
      throw new DatasetNotFoundError(datasetId);
    }
    return schema;
  }

  /**
   * List all available dataset schemas
   */
  listSchemas(): DatasetSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Check if a dataset exists
   */
  hasDataset(datasetId: DatasetId): boolean {
    return this.schemas.has(datasetId);
  }
}
