import type { DatasetId } from '../../domain/value-objects/dataset-id.js';
import type { DatasetSchema } from '../../domain/entities/dataset-schema.js';
import type { QueryResultRow } from '../../domain/entities/query-result.js';

/**
 * Port for accessing dataset storage systems.
 * 
 * This port abstracts the data loading mechanism, allowing different
 * implementations (CSV files, databases, APIs, etc.) to be used
 * interchangeably.
 */
export interface DatasetStoragePort {
  /**
   * Retrieve all available dataset schemas.
   * 
   * @returns Array of all dataset schemas in the catalog
   */
  listSchemas(): DatasetSchema[];

  /**
   * Load all rows from a specific dataset.
   * 
   * @param datasetId - The unique identifier of the dataset
   * @returns Array of rows, where each row is a map of field names to values
   * @throws DatasetNotFoundError if the dataset doesn't exist
   */
  loadDataset(datasetId: DatasetId): Promise<QueryResultRow[]>;

  /**
   * Load a single row by its key field value.
   * 
   * @param datasetId - The unique identifier of the dataset
   * @param keyValue - The value of the key field to search for
   * @returns The matching row, or undefined if not found
   * @throws DatasetNotFoundError if the dataset doesn't exist
   */
  loadById(datasetId: DatasetId, keyValue: string | number): Promise<QueryResultRow | undefined>;
}
