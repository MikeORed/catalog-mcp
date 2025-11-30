import { DatasetId } from '../value-objects/dataset-id.js';

/**
 * Error thrown when a requested dataset does not exist
 */
export class DatasetNotFoundError extends Error {
  constructor(public readonly datasetId: DatasetId) {
    super(`Dataset not found: '${datasetId}'`);
    this.name = 'DatasetNotFoundError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatasetNotFoundError);
    }
  }
}
