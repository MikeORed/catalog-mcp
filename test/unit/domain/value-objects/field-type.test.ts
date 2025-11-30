import { describe, it, expect } from '@jest/globals';
import { FieldType, isValidFieldType, getValidFieldTypes } from '../../../../src/domain/value-objects/field-type.js';

describe('FieldType', () => {
  describe('enum values', () => {
    it('should have String type', () => {
      expect(FieldType.String).toBe('string');
    });

    it('should have Number type', () => {
      expect(FieldType.Number).toBe('number');
    });

    it('should have Boolean type', () => {
      expect(FieldType.Boolean).toBe('boolean');
    });

    it('should have Enum type', () => {
      expect(FieldType.Enum).toBe('enum');
    });
  });

  describe('isValidFieldType', () => {
    it('should return true for valid String type', () => {
      expect(isValidFieldType(FieldType.String)).toBe(true);
      expect(isValidFieldType('string')).toBe(true);
    });

    it('should return true for valid Number type', () => {
      expect(isValidFieldType(FieldType.Number)).toBe(true);
      expect(isValidFieldType('number')).toBe(true);
    });

    it('should return true for valid Boolean type', () => {
      expect(isValidFieldType(FieldType.Boolean)).toBe(true);
      expect(isValidFieldType('boolean')).toBe(true);
    });

    it('should return true for valid Enum type', () => {
      expect(isValidFieldType(FieldType.Enum)).toBe(true);
      expect(isValidFieldType('enum')).toBe(true);
    });

    it('should return false for invalid type strings', () => {
      expect(isValidFieldType('invalid')).toBe(false);
      expect(isValidFieldType('object')).toBe(false);
      expect(isValidFieldType('array')).toBe(false);
      expect(isValidFieldType('null')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidFieldType(123)).toBe(false);
      expect(isValidFieldType(true)).toBe(false);
      expect(isValidFieldType(null)).toBe(false);
      expect(isValidFieldType(undefined)).toBe(false);
      expect(isValidFieldType({})).toBe(false);
      expect(isValidFieldType([])).toBe(false);
    });
  });

  describe('getValidFieldTypes', () => {
    it('should return array of all valid field types', () => {
      const types = getValidFieldTypes();
      expect(types).toEqual([
        FieldType.String,
        FieldType.Number,
        FieldType.Boolean,
        FieldType.Enum,
      ]);
    });

    it('should return array with correct length', () => {
      const types = getValidFieldTypes();
      expect(types).toHaveLength(4);
    });

    it('should return array containing all enum values', () => {
      const types = getValidFieldTypes();
      expect(types).toContain(FieldType.String);
      expect(types).toContain(FieldType.Number);
      expect(types).toContain(FieldType.Boolean);
      expect(types).toContain(FieldType.Enum);
    });
  });
});
