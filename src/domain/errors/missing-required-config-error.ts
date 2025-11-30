import { DatasetId } from '../value-objects/dataset-id.js';

/**
 * Error thrown when a required configuration field is missing
 */
export class MissingRequiredConfigError extends Error {
  constructor(
    public readonly field: string,
    public readonly datasetId: DatasetId
  ) {
    super(
      `Dataset '${datasetId}': Missing required field '${field}'. This field is required for MVP.`
    );
    this.name = 'MissingRequiredConfigError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingRequiredConfigError);
    }
  }
}
