import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GetByIdUseCase } from '../../../src/use-cases/get-by-id-use-case.js';
import { DatasetCatalogService } from '../../../src/domain/services/dataset-catalog-service.js';
import { FieldValidator } from '../../../src/domain/services/field-validator.js';
import type { DatasetStoragePort } from '../../../src/ports/secondary/dataset-storage-port.js';
import type { DatasetSchema } from '../../../src/domain/entities/dataset-schema.js';
import type { QueryResultRow } from '../../../src/domain/entities/query-result.js';
import { FieldType } from '../../../src/domain/value-objects/field-type.js';
import { InvalidFieldError } from '../../../src/domain/errors/invalid-field-error.js';
import { DatasetNotFoundError } from '../../../src/domain/errors/dataset-not-found-error.js';

describe('GetByIdUseCase', () => {
  let useCase: GetByIdUseCase;
  let mockStorage: jest.Mocked<DatasetStoragePort>;
  let catalog: DatasetCatalogService;
  let fieldValidator: FieldValidator;

  const mockSchema: DatasetSchema = {
    id: 'test-dataset',
    name: 'Test Dataset',
    description: 'Test description',
    fields: [
      { name: 'id', type: FieldType.Number, isKey: true, isLookupKey: false },
      { name: 'name', type: FieldType.String, isKey: false, isLookupKey: false },
      { name: 'age', type: FieldType.Number, isKey: false, isLookupKey: false },
      { name: 'email', type: FieldType.String, isKey: false, isLookupKey: false },
    ],
    keyField: 'id',
    lookupKeys: [],
    visibleFields: ['id', 'name', 'age'],
    limits: {
      defaultLimit: 10,
      maxLimit: 100,
    },
  };

  const mockRow: QueryResultRow = {
    id: 1,
    name: 'Alice',
    age: 30,
    email: 'alice@example.com',
  };

  beforeEach(() => {
    mockStorage = {
      listSchemas: jest.fn(),
      loadDataset: jest.fn(),
      loadById: jest.fn(),
    } as jest.Mocked<DatasetStoragePort>;

    catalog = new DatasetCatalogService([mockSchema]);
    fieldValidator = new FieldValidator();

    useCase = new GetByIdUseCase(mockStorage, catalog, fieldValidator);
  });

  describe('execute', () => {
    it('should return row with visible fields when no select fields specified', async () => {
      mockStorage.loadById.mockResolvedValue(mockRow);

      const result = await useCase.execute('test-dataset', 1);

      expect(result.rows).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.truncated).toBe(false);
      expect(result.fields).toEqual(['id', 'name', 'age']);
      expect(result.rows[0]).toEqual({ id: 1, name: 'Alice', age: 30 });
      expect(mockStorage.loadById).toHaveBeenCalledWith('test-dataset', 1);
    });

    it('should project only selected fields', async () => {
      mockStorage.loadById.mockResolvedValue(mockRow);

      const result = await useCase.execute('test-dataset', 1, ['id', 'name']);

      expect(result.rows).toHaveLength(1);
      expect(result.fields).toEqual(['id', 'name']);
      expect(result.rows[0]).toEqual({ id: 1, name: 'Alice' });
      expect(result.rows[0]).not.toHaveProperty('age');
    });

    it('should return empty result when row not found', async () => {
      mockStorage.loadById.mockResolvedValue(undefined);

      const result = await useCase.execute('test-dataset', 999);

      expect(result.rows).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(result.truncated).toBe(false);
      expect(result.fields).toEqual(['id', 'name', 'age']);
    });

    it('should handle string key values', async () => {
      mockStorage.loadById.mockResolvedValue(mockRow);

      const result = await useCase.execute('test-dataset', 'user-123');

      expect(result.rows).toHaveLength(1);
      expect(mockStorage.loadById).toHaveBeenCalledWith('test-dataset', 'user-123');
    });

    it('should throw DatasetNotFoundError for non-existent dataset', async () => {
      await expect(
        useCase.execute('non-existent', 1)
      ).rejects.toThrow(DatasetNotFoundError);
    });

    it('should throw InvalidFieldError for invalid select field', async () => {
      mockStorage.loadById.mockResolvedValue(mockRow);

      await expect(
        useCase.execute('test-dataset', 1, ['nonexistent'])
      ).rejects.toThrow(InvalidFieldError);
    });

    it('should allow selecting all fields including non-visible ones', async () => {
      mockStorage.loadById.mockResolvedValue(mockRow);

      const result = await useCase.execute('test-dataset', 1, ['id', 'name', 'email']);

      expect(result.fields).toEqual(['id', 'name', 'email']);
      expect(result.rows[0]).toEqual({ id: 1, name: 'Alice', email: 'alice@example.com' });
    });

    it('should set truncated to false always', async () => {
      mockStorage.loadById.mockResolvedValue(mockRow);

      const result = await useCase.execute('test-dataset', 1);

      expect(result.truncated).toBe(false);
    });

    it('should return empty result with correct fields when not found', async () => {
      mockStorage.loadById.mockResolvedValue(undefined);

      const result = await useCase.execute('test-dataset', 1, ['id', 'name']);

      expect(result.rows).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(result.fields).toEqual(['id', 'name']);
    });
  });
});
