import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { QueryDatasetUseCase } from '../../../src/use-cases/query-dataset-use-case.js';
import { DatasetCatalogService } from '../../../src/domain/services/dataset-catalog-service.js';
import { FieldValidator } from '../../../src/domain/services/field-validator.js';
import type { DatasetStoragePort } from '../../../src/ports/secondary/dataset-storage-port.js';
import type { DatasetSchema } from '../../../src/domain/entities/dataset-schema.js';
import type { QueryRequest } from '../../../src/domain/entities/query-request.js';
import type { QueryResultRow } from '../../../src/domain/entities/query-result.js';
import { FieldType } from '../../../src/domain/value-objects/field-type.js';
import { InvalidFieldError } from '../../../src/domain/errors/invalid-field-error.js';
import { DatasetNotFoundError } from '../../../src/domain/errors/dataset-not-found-error.js';

describe('QueryDatasetUseCase', () => {
  let useCase: QueryDatasetUseCase;
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

  const mockRows: QueryResultRow[] = [
    { id: 1, name: 'Alice', age: 30, active: true },
    { id: 2, name: 'Bob', age: 25, active: false },
    { id: 3, name: 'Charlie', age: 35, active: true },
    { id: 4, name: 'David', age: 28, active: true },
  ];

  beforeEach(() => {
    mockStorage = {
      listSchemas: jest.fn(),
      loadDataset: jest.fn(),
      loadById: jest.fn(),
    } as jest.Mocked<DatasetStoragePort>;

    catalog = new DatasetCatalogService([mockSchema]);
    fieldValidator = new FieldValidator();

    useCase = new QueryDatasetUseCase(mockStorage, catalog, fieldValidator);
  });

  describe('execute', () => {
    it('should return all rows with visible fields when no filter or select fields specified', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(4);
      expect(result.count).toBe(4);
      expect(result.truncated).toBe(false);
      expect(result.fields).toEqual(['id', 'name', 'age']);
      expect(result.rows[0]).toEqual({ id: 1, name: 'Alice', age: 30 });
    });

    it('should apply eq filter correctly', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        filter: {
          field: 'name',
          op: 'eq',
          value: 'Alice',
        },
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Alice');
    });

    it('should apply contains filter correctly', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        filter: {
          field: 'name',
          op: 'contains',
          value: 'a',
        },
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(2); // Charlie and David
    });

    it('should apply compound and filter correctly', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        filter: {
          and: [
            { field: 'active', op: 'eq', value: true },
            { field: 'age', op: 'eq', value: 30 },
          ],
        },
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Alice');
    });

    it('should project only selected fields', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        selectFields: ['id', 'name'],
      };

      const result = await useCase.execute(request);

      expect(result.fields).toEqual(['id', 'name']);
      expect(result.rows[0]).toEqual({ id: 1, name: 'Alice' });
      expect(result.rows[0]).not.toHaveProperty('age');
    });

    it('should apply default limit', async () => {
      const manyRows: QueryResultRow[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `User${i}`,
        age: 20 + i,
        active: true,
      }));
      mockStorage.loadDataset.mockResolvedValue(manyRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(10); // default limit
      expect(result.count).toBe(10);
      expect(result.truncated).toBe(true);
    });

    it('should apply requested limit', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        limit: 2,
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.truncated).toBe(true);
    });

    it('should cap limit at maxLimit', async () => {
      const manyRows: QueryResultRow[] = Array.from({ length: 150 }, (_, i) => ({
        id: i,
        name: `User${i}`,
        age: 20 + i,
        active: true,
      }));
      mockStorage.loadDataset.mockResolvedValue(manyRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        limit: 150,
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(100); // capped at maxLimit
      expect(result.truncated).toBe(true);
    });

    it('should set truncated to false when all rows fit within limit', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        limit: 10,
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(4);
      expect(result.truncated).toBe(false);
    });

    it('should combine filter, projection, and limit', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        filter: {
          field: 'active',
          op: 'eq',
          value: true,
        },
        selectFields: ['name'],
        limit: 2,
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(2);
      expect(result.fields).toEqual(['name']);
      expect(result.rows[0]).toEqual({ name: 'Alice' });
      expect(result.rows[1]).toEqual({ name: 'Charlie' });
      expect(result.truncated).toBe(true); // 3 active users, but limit is 2
    });

    it('should throw DatasetNotFoundError for non-existent dataset', async () => {
      const request: QueryRequest = {
        datasetId: 'non-existent',
      };

      await expect(useCase.execute(request)).rejects.toThrow(DatasetNotFoundError);
    });

    it('should throw InvalidFieldError for invalid filter field', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        filter: {
          field: 'nonexistent',
          op: 'eq',
          value: 'test',
        },
      };

      await expect(useCase.execute(request)).rejects.toThrow(InvalidFieldError);
    });

    it('should throw InvalidFieldError for invalid select field', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        selectFields: ['nonexistent'],
      };

      await expect(useCase.execute(request)).rejects.toThrow(InvalidFieldError);
    });

    it('should handle empty dataset', async () => {
      mockStorage.loadDataset.mockResolvedValue([]);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(result.truncated).toBe(false);
    });

    it('should handle filter that matches no rows', async () => {
      mockStorage.loadDataset.mockResolvedValue(mockRows);

      const request: QueryRequest = {
        datasetId: 'test-dataset',
        filter: {
          field: 'name',
          op: 'eq',
          value: 'NonExistent',
        },
      };

      const result = await useCase.execute(request);

      expect(result.rows).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(result.truncated).toBe(false);
    });
  });
});
