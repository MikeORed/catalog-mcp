import { describe, it, expect } from '@jest/globals';
import { FieldValidator } from '../../../../src/domain/services/field-validator.js';
import type { DatasetSchema } from '../../../../src/domain/entities/dataset-schema.js';
import { FieldType } from '../../../../src/domain/value-objects/field-type.js';
import { InvalidFieldError } from '../../../../src/domain/errors/invalid-field-error.js';
import type { FilterExpression } from '../../../../src/domain/entities/filter-expression.js';

describe('FieldValidator', () => {
  let validator: FieldValidator;

  const mockSchema: DatasetSchema = {
    id: 'test-dataset',
    name: 'Test Dataset',
    description: 'Test description',
    fields: [
      { name: 'id', type: FieldType.Number, isKey: true, isLookupKey: false },
      { name: 'name', type: FieldType.String, isKey: false, isLookupKey: false },
      { name: 'age', type: FieldType.Number, isKey: false, isLookupKey: false },
      { name: 'active', type: FieldType.Boolean, isKey: false, isLookupKey: false },
    ],
    keyField: 'id',
    lookupKeys: [],
    visibleFields: ['id', 'name', 'age'],
    limits: {
      defaultLimit: 10,
      maxLimit: 100,
    },
  };

  beforeEach(() => {
    validator = new FieldValidator();
  });

  describe('validateFilterFields', () => {
    it('should not throw for valid field in simple filter', () => {
      const filter: FilterExpression = {
        field: 'name',
        op: 'eq',
        value: 'test',
      };

      expect(() => validator.validateFilterFields(filter, mockSchema)).not.toThrow();
    });

    it('should throw InvalidFieldError for invalid field in simple filter', () => {
      const filter: FilterExpression = {
        field: 'nonexistent',
        op: 'eq',
        value: 'test',
      };

      expect(() => validator.validateFilterFields(filter, mockSchema))
        .toThrow(InvalidFieldError);
    });

    it('should validate all fields in compound and filter', () => {
      const filter: FilterExpression = {
        and: [
          { field: 'name', op: 'eq', value: 'test' },
          { field: 'age', op: 'eq', value: 30 },
        ],
      };

      expect(() => validator.validateFilterFields(filter, mockSchema)).not.toThrow();
    });

    it('should throw if any field in compound filter is invalid', () => {
      const filter: FilterExpression = {
        and: [
          { field: 'name', op: 'eq', value: 'test' },
          { field: 'invalid', op: 'eq', value: 30 },
        ],
      };

      expect(() => validator.validateFilterFields(filter, mockSchema))
        .toThrow(InvalidFieldError);
    });

    it('should validate nested compound filters', () => {
      const filter: FilterExpression = {
        and: [
          { field: 'name', op: 'eq', value: 'test' },
          {
            and: [
              { field: 'age', op: 'eq', value: 30 },
              { field: 'active', op: 'eq', value: true },
            ],
          },
        ],
      };

      expect(() => validator.validateFilterFields(filter, mockSchema)).not.toThrow();
    });

    it('should throw for invalid field in nested compound filter', () => {
      const filter: FilterExpression = {
        and: [
          { field: 'name', op: 'eq', value: 'test' },
          {
            and: [
              { field: 'age', op: 'eq', value: 30 },
              { field: 'invalid', op: 'eq', value: true },
            ],
          },
        ],
      };

      expect(() => validator.validateFilterFields(filter, mockSchema))
        .toThrow(InvalidFieldError);
    });

    it('should handle duplicate field names in compound filter', () => {
      const filter: FilterExpression = {
        and: [
          { field: 'name', op: 'eq', value: 'test1' },
          { field: 'name', op: 'contains', value: 'test2' },
        ],
      };

      expect(() => validator.validateFilterFields(filter, mockSchema)).not.toThrow();
    });

    it('should include list of valid fields in error message', () => {
      const filter: FilterExpression = {
        field: 'invalid',
        op: 'eq',
        value: 'test',
      };

      try {
        validator.validateFilterFields(filter, mockSchema);
        fail('Should have thrown InvalidFieldError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidFieldError);
        const err = error as InvalidFieldError;
        expect(err.message).toContain('invalid');
        expect(err.message).toContain('id');
        expect(err.message).toContain('name');
        expect(err.message).toContain('age');
        expect(err.message).toContain('active');
      }
    });
  });

  describe('validateSelectFields', () => {
    it('should not throw for valid select fields', () => {
      const selectFields = ['id', 'name', 'age'];

      expect(() => validator.validateSelectFields(selectFields, mockSchema)).not.toThrow();
    });

    it('should not throw for single valid field', () => {
      const selectFields = ['name'];

      expect(() => validator.validateSelectFields(selectFields, mockSchema)).not.toThrow();
    });

    it('should not throw for empty select fields array', () => {
      const selectFields: string[] = [];

      expect(() => validator.validateSelectFields(selectFields, mockSchema)).not.toThrow();
    });

    it('should throw InvalidFieldError for invalid select field', () => {
      const selectFields = ['id', 'invalid', 'name'];

      expect(() => validator.validateSelectFields(selectFields, mockSchema))
        .toThrow(InvalidFieldError);
    });

    it('should throw InvalidFieldError for all invalid fields', () => {
      const selectFields = ['invalid1', 'invalid2'];

      expect(() => validator.validateSelectFields(selectFields, mockSchema))
        .toThrow(InvalidFieldError);
    });

    it('should include list of valid fields in error message', () => {
      const selectFields = ['invalid'];

      try {
        validator.validateSelectFields(selectFields, mockSchema);
        fail('Should have thrown InvalidFieldError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidFieldError);
        const err = error as InvalidFieldError;
        expect(err.message).toContain('invalid');
        expect(err.message).toContain('id');
        expect(err.message).toContain('name');
        expect(err.message).toContain('age');
        expect(err.message).toContain('active');
      }
    });

    it('should validate fields that are not in visibleFields', () => {
      // 'active' is in schema but not in visibleFields
      const selectFields = ['active'];

      expect(() => validator.validateSelectFields(selectFields, mockSchema)).not.toThrow();
    });

    it('should handle duplicate field names in select fields', () => {
      const selectFields = ['name', 'name', 'age'];

      expect(() => validator.validateSelectFields(selectFields, mockSchema)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle schema with single field', () => {
      const singleFieldSchema: DatasetSchema = {
        ...mockSchema,
        fields: [{ name: 'id', type: FieldType.Number, isKey: true, isLookupKey: false }],
      };

      expect(() => validator.validateSelectFields(['id'], singleFieldSchema)).not.toThrow();
      expect(() => validator.validateSelectFields(['invalid'], singleFieldSchema))
        .toThrow(InvalidFieldError);
    });

    it('should handle deeply nested compound filters', () => {
      const deepFilter: FilterExpression = {
        and: [
          {
            and: [
              {
                and: [
                  { field: 'name', op: 'eq', value: 'test' },
                ],
              },
            ],
          },
        ],
      };

      expect(() => validator.validateFilterFields(deepFilter, mockSchema)).not.toThrow();
    });
  });
});
