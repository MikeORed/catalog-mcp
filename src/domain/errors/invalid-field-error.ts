import { FieldName } from '../value-objects/field-name.js';

/**
 * Error thrown when a field reference is invalid
 */
export class InvalidFieldError extends Error {
  constructor(
    public readonly fieldName: FieldName,
    public readonly validFields: FieldName[]
  ) {
    super(
      `Invalid field: '${fieldName}'. Valid fields are: ${validFields.join(', ')}`
    );
    this.name = 'InvalidFieldError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidFieldError);
    }
  }
}
