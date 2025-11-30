import type { DatasetId } from '../domain/value-objects/dataset-id.js';
import type { DatasetSchema } from '../domain/entities/dataset-schema.js';
import { DatasetCatalogService } from '../domain/services/dataset-catalog-service.js';

/**
 * Use case for retrieving detailed schema information for a specific dataset.
 * 
 * Returns complete metadata about a dataset including fields, types,
 * visible fields, and limits.
 */
export class DescribeDatasetUseCase {
  constructor(private readonly catalog: DatasetCatalogService) {}

  /**
   * Execute the describe dataset operation.
   * 
   * @param datasetId - The ID of the dataset to describe
   * @returns The dataset schema
   * @throws DatasetNotFoundError if the dataset doesn't exist
   */
  async execute(datasetId: DatasetId): Promise<DatasetSchema> {
    return this.catalog.getSchema(datasetId);
  }
}
