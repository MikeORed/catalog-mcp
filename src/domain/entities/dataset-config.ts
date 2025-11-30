import { DatasetId } from '../value-objects/dataset-id.js';
import { FieldName } from '../value-objects/field-name.js';
import { DatasetField } from './dataset-field.js';

/**
 * Configuration for a single dataset
 * This is loaded from the JSON configuration file
 */
export interface DatasetConfig {
  /** Unique identifier for this dataset */
  id: DatasetId;
  
  /** Human-readable name */
  name: string;
  
  /** Optional description */
  description?: string;
  
  /** Path to the CSV file (relative to config file or absolute) */
  path: string;
  
  /** Field definitions */
  fields: DatasetField[];
  
  /** The field that serves as the primary key */
  keyField: FieldName;
  
  /** Fields that can be used for lookup operations */
  lookupKeys: FieldName[];
  
  /** Fields that are included in results by default */
  visibleFields: FieldName[];
  
  /** Query limits */
  limits: {
    defaultLimit: number;
    maxLimit: number;
  };
}

/**
 * Root configuration containing all datasets
 */
export interface ProjectConfig {
  /** Array of dataset configurations */
  datasets: DatasetConfig[];
}
