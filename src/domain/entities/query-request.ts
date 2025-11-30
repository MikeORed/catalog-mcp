import { DatasetId } from '../value-objects/dataset-id.js';
import { FieldName } from '../value-objects/field-name.js';
import { FilterExpression } from './filter-expression.js';

/**
 * Request parameters for querying a dataset
 */
export interface QueryRequest {
  /** The dataset to query */
  datasetId: DatasetId;
  
  /** Optional filter expression to apply */
  filter?: FilterExpression;
  
  /** Fields to include in results (defaults to visibleFields if not specified) */
  selectFields?: FieldName[];
  
  /** Maximum number of rows to return (defaults to dataset's defaultLimit) */
  limit?: number;
  
  /** Number of rows to skip (for pagination) */
  offset?: number;
}
