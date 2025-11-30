import type { FilterExpression } from '../entities/filter-expression.js';
import type { QueryResultRow } from '../entities/query-result.js';
import { InvalidFilterError } from '../errors/invalid-filter-error.js';

/**
 * Service for applying filter expressions to dataset rows.
 * 
 * Supports MVP filter operators:
 * - eq: Strict equality
 * - contains: Substring matching (case-sensitive)
 * - and: Compound filter requiring all conditions
 */
export class FilterService {
  /**
   * Apply a filter expression to an array of rows.
   * 
   * @param rows - The rows to filter
   * @param filter - The filter expression to apply (optional)
   * @returns Filtered rows matching the filter criteria
   */
  applyFilter(rows: QueryResultRow[], filter?: FilterExpression): QueryResultRow[] {
    if (!filter) {
      return rows;
    }

    return rows.filter((row) => this.evaluateFilterExpression(row, filter));
  }

  /**
   * Evaluate whether a single row matches a filter expression.
   * 
   * @param row - The row to evaluate
   * @param filter - The filter expression
   * @returns true if the row matches the filter
   */
  private evaluateFilterExpression(row: QueryResultRow, filter: FilterExpression): boolean {
    // Handle compound 'and' filter
    if ('and' in filter) {
      return filter.and.every((childFilter) => this.evaluateFilterExpression(row, childFilter));
    }

    // Handle field filter
    const { field, op, value } = filter;
    const fieldValue = row[field];

    switch (op) {
      case 'eq':
        return this.evaluateEquality(fieldValue, value);
      
      case 'contains':
        return this.evaluateContains(fieldValue, value);
      
      default:
        // This should never happen if validation is correct, but fail-safe
        throw new InvalidFilterError(
          `Unsupported filter operator: '${op}'. MVP supports: eq, contains, and`,
          op
        );
    }
  }

  /**
   * Evaluate strict equality between field value and filter value.
   * 
   * @param fieldValue - The value from the row
   * @param filterValue - The value to compare against
   * @returns true if values are strictly equal
   */
  private evaluateEquality(
    fieldValue: string | number | boolean | null | undefined,
    filterValue: string | number | boolean
  ): boolean {
    return fieldValue === filterValue;
  }

  /**
   * Evaluate substring containment for string fields.
   * 
   * @param fieldValue - The value from the row
   * @param searchValue - The substring to search for
   * @returns true if fieldValue contains searchValue (case-sensitive)
   */
  private evaluateContains(
    fieldValue: string | number | boolean | null | undefined,
    searchValue: string | number | boolean
  ): boolean {
    // Convert both to strings for substring matching
    const fieldStr = String(fieldValue ?? '');
    const searchStr = String(searchValue);
    
    return fieldStr.includes(searchStr);
  }
}
