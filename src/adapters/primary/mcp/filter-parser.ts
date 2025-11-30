import { FilterExpression, FieldFilter, CompoundFilter } from '../../../domain/entities/filter-expression.js';
import { InvalidFilterError } from '../../../domain/errors/invalid-filter-error.js';

/**
 * MVP Operators allowed in field filters
 */
const MVP_OPERATORS = ['eq', 'contains'] as const;
type MvpOperator = typeof MVP_OPERATORS[number];

/**
 * Parse and validate a filter JSON object into a FilterExpression
 * 
 * Supports two formats:
 * 1. Field filter: { field: "name", op: "eq", value: "test" }
 * 2. Compound filter: { and: [...] }
 * 
 * @param json - The filter object from MCP request
 * @returns Validated FilterExpression
 * @throws InvalidFilterError if filter is malformed or uses unsupported operators
 */
export function parseFilter(json: unknown): FilterExpression {
  if (json === null || json === undefined) {
    throw new InvalidFilterError('Filter cannot be null or undefined');
  }

  if (typeof json !== 'object') {
    throw new InvalidFilterError('Filter must be an object');
  }

  const filter = json as Record<string, unknown>;

  // Check if it's a compound filter (has 'and' property)
  if ('and' in filter) {
    return parseCompoundFilter(filter);
  }

  // Otherwise, treat as field filter
  return parseFieldFilter(filter);
}

/**
 * Parse a compound filter with AND logic
 */
function parseCompoundFilter(filter: Record<string, unknown>): CompoundFilter {
  if (!Array.isArray(filter.and)) {
    throw new InvalidFilterError('Compound filter must have an "and" array');
  }

  if (filter.and.length === 0) {
    throw new InvalidFilterError('Compound filter must have at least one sub-filter');
  }

  // Recursively parse each sub-filter
  const parsedFilters = filter.and.map((subFilter, index) => {
    try {
      return parseFilter(subFilter);
    } catch (error) {
      throw new InvalidFilterError(
        `Invalid sub-filter at index ${index}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  return {
    and: parsedFilters
  };
}

/**
 * Parse a field filter (e.g., eq, contains)
 */
function parseFieldFilter(filter: Record<string, unknown>): FieldFilter {
  // Validate required fields
  if (!filter.field || typeof filter.field !== 'string') {
    throw new InvalidFilterError('Field filter must have a "field" string');
  }

  if (!filter.op || typeof filter.op !== 'string') {
    throw new InvalidFilterError('Field filter must have an "op" string');
  }

  if (!('value' in filter)) {
    throw new InvalidFilterError('Field filter must have a "value" property');
  }

  const operator = filter.op;

  // Validate operator is MVP-supported
  if (!MVP_OPERATORS.includes(operator as MvpOperator)) {
    throw new InvalidFilterError(
      `Operator "${operator}" is not supported. MVP operators: ${MVP_OPERATORS.join(', ')}`
    );
  }

  // Validate value type
  const value = filter.value;
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    throw new InvalidFilterError(
      `Filter value must be string, number, or boolean (got ${typeof value})`
    );
  }

  return {
    field: filter.field,
    op: operator as 'eq' | 'contains',
    value: value
  };
}
