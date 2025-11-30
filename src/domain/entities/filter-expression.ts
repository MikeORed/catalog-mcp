import { FieldName } from '../value-objects/field-name.js';

/**
 * Supported filter operators in MVP
 * Intentionally restricted to simplify implementation
 */
export type FilterOp = 'eq' | 'contains';

/**
 * Filter on a single field
 */
export interface FieldFilter {
  field: FieldName;
  op: FilterOp;
  value: string | number | boolean;
}

/**
 * Compound filter combining multiple filters
 * MVP only supports AND logic
 */
export interface CompoundFilter {
  and: FilterExpression[];
}

/**
 * A filter can be either a field filter or a compound filter
 */
export type FilterExpression = FieldFilter | CompoundFilter;

/**
 * Type guard to check if a filter is a field filter
 */
export function isFieldFilter(filter: FilterExpression): filter is FieldFilter {
  return 'field' in filter && 'op' in filter && 'value' in filter;
}

/**
 * Type guard to check if a filter is a compound filter
 */
export function isCompoundFilter(filter: FilterExpression): filter is CompoundFilter {
  return 'and' in filter;
}
