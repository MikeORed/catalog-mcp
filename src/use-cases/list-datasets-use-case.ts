import type { DatasetStoragePort } from '../ports/secondary/dataset-storage-port.js';
import type { DatasetSchema } from '../domain/entities/dataset-schema.js';

/**
 * Use case for listing all available datasets.
 * 
 * Returns schema information for all datasets in the catalog,
 * allowing clients to discover what data is available.
 */
export class ListDatasetsUseCase {
  constructor(private readonly storage: DatasetStoragePort) {}

  /**
   * Execute the list datasets operation.
   * 
   * @returns Array of all dataset schemas
   */
  async execute(): Promise<DatasetSchema[]> {
    return this.storage.listSchemas();
  }
}
