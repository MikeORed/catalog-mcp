import { describe, it, expect, beforeEach } from '@jest/globals';
import { DescribeDatasetUseCase } from '../../../src/use-cases/describe-dataset-use-case.js';
import { DatasetCatalogService } from '../../../src/domain/services/dataset-catalog-service.js';
import type { DatasetSchema } from '../../../src/domain/entities/dataset-schema.js';
import { FieldType } from '../../../src/domain/value-objects/field-type.js';
import { DatasetNotFoundError } from '../../../src/domain/errors/dataset-not-found-error.js';

describe('DescribeDatasetUseCase', () => {
  let useCase: DescribeDatasetUseCase;
  let catalog: DatasetCatalogService;

  const mockSchema: DatasetSchema = {
    id: 'test-dataset',
    name: 'Test Dataset',
    description: 'A test dataset',
    fields: [
      { name: 'id', type: FieldType.Number, isKey: true, isLookupKey: false },
      { name: 'name', type: FieldType.String, isKey: false, isLookupKey: false },
      { name: 'age', type: FieldType.Number, isKey: false, isLookupKey: false },
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
    catalog = new DatasetCatalogService([mockSchema]);
    useCase = new DescribeDatasetUseCase(catalog);
  });

  describe('execute', () => {
    it('should return schema for existing dataset', async () => {
      const result = await useCase.execute('test-dataset');

      expect(result).toEqual(mockSchema);
      expect(result.id).toBe('test-dataset');
      expect(result.name).toBe('Test Dataset');
      expect(result.fields).toHaveLength(3);
    });

    it('should return complete schema with all properties', async () => {
      const result = await useCase.execute('test-dataset');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('fields');
      expect(result).toHaveProperty('keyField');
      expect(result).toHaveProperty('lookupKeys');
      expect(result).toHaveProperty('visibleFields');
      expect(result).toHaveProperty('limits');
    });

    it('should throw DatasetNotFoundError for non-existent dataset', async () => {
      await expect(useCase.execute('non-existent')).rejects.toThrow(DatasetNotFoundError);
    });

    it('should throw error with dataset ID in message', async () => {
      try {
        await useCase.execute('missing-dataset');
        fail('Should have thrown DatasetNotFoundError');
      } catch (error: any) {
        expect(error).toBeInstanceOf(DatasetNotFoundError);
        expect(error.message).toContain('missing-dataset');
      }
    });
  });
});
