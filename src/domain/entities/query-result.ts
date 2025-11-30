import { FieldName } from '../value-objects/field-name.js';

/**
 * A single row in a query result
 * Maps field names to their values
 */
export type QueryResultRow = Record<FieldName, string | number | boolean | null>;

/**
 * Result of a dataset query
 */
export interface QueryResult {
  /** The rows returned by the query */
  rows: QueryResultRow[];
  
  /** Total number of rows returned */
  count: number;
  
  /** Whether the result was truncated due to limits */
  truncated: boolean;
  
  /** The fields included in each row */
  fields: FieldName[];
}
