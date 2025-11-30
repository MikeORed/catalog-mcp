import { describe, it, expect } from '@jest/globals';
import { FilterService } from '../../../../src/domain/services/filter-service.js';
import { InvalidFilterError } from '../../../../src/domain/errors/invalid-filter-error.js';
import type { QueryResultRow } from '../../../../src/domain/entities/query-result.js';
import type { FilterExpression } from '../../../../src/domain/entities/filter-expression.js';

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(() => {
    service = new FilterService();
  });

  describe('applyFilter', () => {
    const sampleRows: QueryResultRow[] = [
      { id: 1, name: 'Alice', age: 30, active: true },
      { id: 2, name: 'Bob', age: 25, active: false },
      { id: 3, name: 'Charlie', age: 35, active: true },
      { id: 4, name: 'Alice', age: 28, active: true },
    ];

    it('should return all rows when no filter is provided', () => {
      const result = service.applyFilter(sampleRows);
      expect(result).toEqual(sampleRows);
    });

    it('should return all rows when filter is undefined', () => {
      const result = service.applyFilter(sampleRows, undefined);
      expect(result).toEqual(sampleRows);
    });

    describe('eq operator', () => {
      it('should filter by string equality', () => {
        const filter: FilterExpression = {
          field: 'name',
          op: 'eq',
          value: 'Alice',
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Alice');
        expect(result[1].name).toBe('Alice');
      });

      it('should filter by number equality', () => {
        const filter: FilterExpression = {
          field: 'age',
          op: 'eq',
          value: 30,
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(1);
        expect(result[0].age).toBe(30);
      });

      it('should filter by boolean equality', () => {
        const filter: FilterExpression = {
          field: 'active',
          op: 'eq',
          value: true,
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(3);
        expect(result.every(row => row.active === true)).toBe(true);
      });

      it('should return empty array when no matches', () => {
        const filter: FilterExpression = {
          field: 'name',
          op: 'eq',
          value: 'NonExistent',
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(0);
      });

      it('should handle null values', () => {
        const rowsWithNull: QueryResultRow[] = [
          { id: 1, name: 'Alice', age: null },
          { id: 2, name: 'Bob', age: 25 },
        ];
        const filter: FilterExpression = {
          field: 'age',
          op: 'eq',
          value: 25,
        };
        const result = service.applyFilter(rowsWithNull, filter);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Bob');
      });
    });

    describe('contains operator', () => {
      it('should filter by substring match (case-sensitive)', () => {
        const filter: FilterExpression = {
          field: 'name',
          op: 'contains',
          value: 'li',
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(3); // Alice, Alice, Charlie
      });

      it('should be case-sensitive', () => {
        const filter: FilterExpression = {
          field: 'name',
          op: 'contains',
          value: 'LI',
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(0); // No match due to case sensitivity
      });

      it('should work with numbers converted to strings', () => {
        const filter: FilterExpression = {
          field: 'age',
          op: 'contains',
          value: '3',
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(2); // age 30 and 35
      });

      it('should return empty array when no matches', () => {
        const filter: FilterExpression = {
          field: 'name',
          op: 'contains',
          value: 'xyz',
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(0);
      });

      it('should handle null values as empty string', () => {
        const rowsWithNull: QueryResultRow[] = [
          { id: 1, name: null },
          { id: 2, name: 'Alice' },
        ];
        const filter: FilterExpression = {
          field: 'name',
          op: 'contains',
          value: 'Alice',
        };
        const result = service.applyFilter(rowsWithNull, filter);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Alice');
      });
    });

    describe('and compound operator', () => {
      it('should combine multiple filters with AND logic', () => {
        const filter: FilterExpression = {
          and: [
            { field: 'name', op: 'eq', value: 'Alice' },
            { field: 'age', op: 'eq', value: 30 },
          ],
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Alice');
        expect(result[0].age).toBe(30);
      });

      it('should return empty array when any condition fails', () => {
        const filter: FilterExpression = {
          and: [
            { field: 'name', op: 'eq', value: 'Alice' },
            { field: 'active', op: 'eq', value: false },
          ],
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(0);
      });

      it('should support nested compound filters', () => {
        const filter: FilterExpression = {
          and: [
            {
              and: [
                { field: 'active', op: 'eq', value: true },
                { field: 'name', op: 'contains', value: 'li' },
              ],
            },
            { field: 'age', op: 'eq', value: 30 },
          ],
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Alice');
        expect(result[0].age).toBe(30);
      });

      it('should handle empty and array', () => {
        const filter: FilterExpression = {
          and: [],
        };
        const result = service.applyFilter(sampleRows, filter);
        expect(result).toEqual(sampleRows);
      });
    });

    describe('error handling', () => {
      it('should throw InvalidFilterError for unsupported operator', () => {
        const filter: any = {
          field: 'age',
          op: 'gt', // Not supported in MVP
          value: 30,
        };
        expect(() => service.applyFilter(sampleRows, filter)).toThrow(InvalidFilterError);
      });

      it('should include operator in error message', () => {
        const filter: any = {
          field: 'age',
          op: 'neq',
          value: 30,
        };
        try {
          service.applyFilter(sampleRows, filter);
          fail('Should have thrown InvalidFilterError');
        } catch (error: any) {
          expect(error.message).toContain('neq');
          expect(error.message).toContain('MVP supports');
        }
      });
    });
  });
});
