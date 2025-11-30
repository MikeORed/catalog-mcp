import { DatasetId } from '../value-objects/dataset-id.js';
import { FieldName } from '../value-objects/field-name.js';
import { DatasetField } from './dataset-field.js';

/**
 * Schema definition for a dataset
 * Contains all metadata needed to understand and query the dataset
 */
export interface DatasetSchema {
  /** Unique identifier for this dataset */
  id: DatasetId;
  
  /** Human-readable name */
  name: string;
  
  /** Optional description */
  description?: string;
  
  /** All field definitions */
  fields: DatasetField[];
  
  /** The field that serves as the primary key */
  keyField: FieldName;
  
  /** Fields that can be used for lookup operations */
  lookupKeys: FieldName[];
  
  /** Fields that are included in list/query results by default */
  visibleFields: FieldName[];
  
  /** Query limits */
  limits: {
    /** Default number of rows to return if not specified */
    defaultLimit: number;
    
    /** Maximum number of rows allowed in a single query */
    maxLimit: number;
  };
}
