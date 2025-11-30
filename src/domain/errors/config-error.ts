import { DatasetId } from '../value-objects/dataset-id.js';

/**
 * Error thrown when configuration is invalid
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly datasetId?: DatasetId
  ) {
    const prefix = datasetId ? `Dataset '${datasetId}': ` : 'Configuration error: ';
    super(prefix + message);
    this.name = 'ConfigError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigError);
    }
  }
}
