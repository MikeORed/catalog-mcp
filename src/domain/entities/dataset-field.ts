import { FieldName } from '../value-objects/field-name.js';
import { FieldType } from '../value-objects/field-type.js';

/**
 * Represents a field definition within a dataset schema
 */
export interface DatasetField {
  /** Field name (must be unique within the dataset) */
  name: FieldName;
  
  /** Field data type */
  type: FieldType;
  
  /** Valid enum values (required when type is Enum, must be non-empty) */
  enumValues?: string[];
  
  /** Whether this field serves as the primary key */
  isKey: boolean;
  
  /** Whether this field can be used for lookup operations */
  isLookupKey: boolean;
}
