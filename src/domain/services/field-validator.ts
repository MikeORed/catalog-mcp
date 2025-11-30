import { FieldName } from '../value-objects/field-name.js';
import { DatasetSchema } from '../entities/dataset-schema.js';
import { FilterExpression, isFieldFilter, isCompoundFilter } from '../entities/filter-expression.js';
import { InvalidFieldError } from '../errors/invalid-field-error.js';

/**
 * Domain service for validating field references
 * Ensures that all field names used in queries and filters exist in the schema
 */
export class FieldValidator {
  /**
   * Validate that all fields in a filter expression exist in the schema
   * @throws InvalidFieldError if any field is invalid
   */
  validateFilterFields(filter: FilterExpression, schema: DatasetSchema): void {
    const filterFields = this.extractFilterFields(filter);
    const validFields = schema.fields.map(f => f.name);
    
    for (const fieldName of filterFields) {
      if (!validFields.includes(fieldName)) {
        throw new InvalidFieldError(fieldName, validFields);
      }
    }
  }

  /**
   * Validate that all select fields exist in the schema
   * @throws InvalidFieldError if any field is invalid
   */
  validateSelectFields(selectFields: FieldName[], schema: DatasetSchema): void {
    const validFields = schema.fields.map(f => f.name);
    
    for (const fieldName of selectFields) {
      if (!validFields.includes(fieldName)) {
        throw new InvalidFieldError(fieldName, validFields);
      }
    }
  }

  /**
   * Extract all field names referenced in a filter expression
   * Handles both simple field filters and compound filters recursively
   */
  private extractFilterFields(filter: FilterExpression): FieldName[] {
    const fields: FieldName[] = [];
    
    if (isFieldFilter(filter)) {
      fields.push(filter.field);
    } else if (isCompoundFilter(filter)) {
      for (const subFilter of filter.and) {
        fields.push(...this.extractFilterFields(subFilter));
      }
    }
    
    // Return unique field names
    return [...new Set(fields)];
  }
}
