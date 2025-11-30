import { describe, it, expect } from '@jest/globals';
import { ProjectionService } from '../../../../src/domain/services/projection-service.js';
import type { QueryResultRow } from '../../../../src/domain/entities/query-result.js';

describe('ProjectionService', () => {
  let service: ProjectionService;

  beforeEach(() => {
    service = new ProjectionService();
  });

  describe('projectRows', () => {
    const sampleRows: QueryResultRow[] = [
      { id: 1, name: 'Alice', age: 30, email: 'alice@example.com', active: true },
      { id: 2, name: 'Bob', age: 25, email: 'bob@example.com', active: false },
      { id: 3, name: 'Charlie', age: 35, email: 'charlie@example.com', active: true },
    ];

    it('should return all rows unchanged when field list is empty', () => {
      const result = service.projectRows(sampleRows, []);
      expect(result).toEqual(sampleRows);
    });

    it('should project single field', () => {
      const result = service.projectRows(sampleRows, ['name']);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'Alice' });
      expect(result[1]).toEqual({ name: 'Bob' });
      expect(result[2]).toEqual({ name: 'Charlie' });
    });

    it('should project multiple fields', () => {
      const result = service.projectRows(sampleRows, ['id', 'name']);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 1, name: 'Alice' });
      expect(result[1]).toEqual({ id: 2, name: 'Bob' });
      expect(result[2]).toEqual({ id: 3, name: 'Charlie' });
    });

    it('should preserve field order from the field list', () => {
      const result = service.projectRows(sampleRows, ['name', 'id']);
      const keys = Object.keys(result[0]);
      expect(keys).toEqual(['name', 'id']);
    });

    it('should handle missing fields gracefully', () => {
      const result = service.projectRows(sampleRows, ['id', 'nonexistent']);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 1, nonexistent: undefined });
    });

    it('should preserve null values', () => {
      const rowsWithNull: QueryResultRow[] = [
        { id: 1, name: null, age: 30 },
        { id: 2, name: 'Bob', age: null },
      ];
      const result = service.projectRows(rowsWithNull, ['id', 'name', 'age']);
      expect(result[0]).toEqual({ id: 1, name: null, age: 30 });
      expect(result[1]).toEqual({ id: 2, name: 'Bob', age: null });
    });

    it('should not mutate original rows', () => {
      const originalRows = [{ id: 1, name: 'Alice', age: 30 }];
      const result = service.projectRows(originalRows, ['id', 'name']);
      
      expect(result[0]).not.toBe(originalRows[0]);
      expect(originalRows[0]).toEqual({ id: 1, name: 'Alice', age: 30 });
    });

    it('should handle empty row array', () => {
      const result = service.projectRows([], ['id', 'name']);
      expect(result).toEqual([]);
    });

    it('should handle duplicate field names in list', () => {
      const result = service.projectRows(sampleRows, ['name', 'name']);
      expect(result[0]).toEqual({ name: 'Alice' });
      expect(Object.keys(result[0])).toEqual(['name']);
    });

    it('should project all fields when requested', () => {
      const result = service.projectRows(sampleRows, ['id', 'name', 'age', 'email', 'active']);
      expect(result).toEqual(sampleRows);
    });
  });
});
