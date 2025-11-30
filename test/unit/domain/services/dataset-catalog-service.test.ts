import { describe, it, expect, beforeEach } from '@jest/globals';
import { DatasetCatalogService } from '../../../../src/domain/services/dataset-catalog-service.js';
import type { DatasetSchema } from '../../../../src/domain/entities/dataset-schema.js';
import { FieldType } from '../../../../src/domain/value-objects/field-type.js';
import { DatasetNotFoundError } from '../../../../src/domain/errors/dataset-not-found-error.js';

describe('DatasetCatalogService', () => {
  let service: DatasetCatalogService;

  const mockSchemas: DatasetSchema[] = [
    {
      id: 'dataset1',
      name: 'Dataset 1',
      description: 'First dataset',
      fields: [
        { name: 'id', type: FieldType.Number, isKey: true, isLookupKey: false },
        { name: 'name', type: FieldType.String, isKey: false, isLookupKey: false },
      ],
      keyField: 'id',
      lookupKeys: [],
      visibleFields: ['id', 'name'],
      limits: { defaultLimit: 10, maxLimit: 100 },
    },
    {
      id: 'dataset2',
      name: 'Dataset 2',
      description: 'Second dataset',
      fields: [
        { name: 'id', type: FieldType.String, isKey: true, isLookupKey: false },
        { name: 'value', type: FieldType.Number, isKey: false, isLookupKey: false },
      ],
      keyField: 'id',
      lookupKeys: [],
      visibleFields: ['id', 'value'],
      limits: { defaultLimit: 20, maxLimit: 200 },
    },
  ];

  beforeEach(() => {
    service = new DatasetCatalogService(mockSchemas);
  });

  describe('getSchema', () => {
    it('should return schema for existing dataset', () => {
      const schema = service.getSchema('dataset1');

      expect(schema).toEqual(mockSchemas[0]);
      expect(schema.id).toBe('dataset1');
      expect(schema.name).toBe('Dataset 1');
    });

    it('should return correct schema for second dataset', () => {
      const schema = service.getSchema('dataset2');

      expect(schema).toEqual(mockSchemas[1]);
      expect(schema.id).toBe('dataset2');
    });

    it('should throw DatasetNotFoundError for non-existent dataset', () => {
      expect(() => service.getSchema('non-existent')).toThrow(DatasetNotFoundError);
    });

    it('should include dataset ID in error message', () => {
      try {
        service.getSchema('missing-dataset');
        fail('Should have thrown DatasetNotFoundError');
      } catch (error: any) {
        expect(error).toBeInstanceOf(DatasetNotFoundError);
        expect(error.message).toContain('missing-dataset');
      }
    });
  });

  describe('listSchemas', () => {
    it('should return all schemas', () => {
      const schemas = service.listSchemas();

      expect(schemas).toHaveLength(2);
      expect(schemas).toEqual(mockSchemas);
    });

    it('should return array with both datasets', () => {
      const schemas = service.listSchemas();

      expect(schemas[0].id).toBe('dataset1');
      expect(schemas[1].id).toBe('dataset2');
    });

    it('should return empty array when no schemas exist', () => {
      const emptyService = new DatasetCatalogService([]);
      const schemas = emptyService.listSchemas();

      expect(schemas).toEqual([]);
      expect(schemas).toHaveLength(0);
    });

    it('should return single schema when only one exists', () => {
      const singleService = new DatasetCatalogService([mockSchemas[0]]);
      const schemas = singleService.listSchemas();

      expect(schemas).toHaveLength(1);
      expect(schemas[0].id).toBe('dataset1');
    });
  });

  describe('hasDataset', () => {
    it('should return true for existing dataset', () => {
      expect(service.hasDataset('dataset1')).toBe(true);
      expect(service.hasDataset('dataset2')).toBe(true);
    });

    it('should return false for non-existent dataset', () => {
      expect(service.hasDataset('non-existent')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.hasDataset('')).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should handle empty schema array', () => {
      const emptyService = new DatasetCatalogService([]);

      expect(emptyService.listSchemas()).toEqual([]);
      expect(emptyService.hasDataset('any')).toBe(false);
    });

    it('should initialize with multiple schemas', () => {
      const multiService = new DatasetCatalogService(mockSchemas);

      expect(multiService.listSchemas()).toHaveLength(2);
      expect(multiService.hasDataset('dataset1')).toBe(true);
      expect(multiService.hasDataset('dataset2')).toBe(true);
    });
  });
});
