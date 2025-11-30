import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ListDatasetsUseCase } from '../../../src/use-cases/list-datasets-use-case.js';
import type { DatasetStoragePort } from '../../../src/ports/secondary/dataset-storage-port.js';
import type { DatasetSchema } from '../../../src/domain/entities/dataset-schema.js';
import { FieldType } from '../../../src/domain/value-objects/field-type.js';

describe('ListDatasetsUseCase', () => {
  let useCase: ListDatasetsUseCase;
  let mockStorage: jest.Mocked<DatasetStoragePort>;

  const mockSchemas: DatasetSchema[] = [
    {
      id: 'dataset1',
      name: 'Dataset 1',
      description: 'First dataset',
      fields: [
        { name: 'id', type: FieldType.Number, isKey: true, isLookupKey: false },
      ],
      keyField: 'id',
      lookupKeys: [],
      visibleFields: ['id'],
      limits: { defaultLimit: 10, maxLimit: 100 },
    },
    {
      id: 'dataset2',
      name: 'Dataset 2',
      description: 'Second dataset',
      fields: [
        { name: 'id', type: FieldType.String, isKey: true, isLookupKey: false },
      ],
      keyField: 'id',
      lookupKeys: [],
      visibleFields: ['id'],
      limits: { defaultLimit: 20, maxLimit: 200 },
    },
  ];

  beforeEach(() => {
    mockStorage = {
      listSchemas: jest.fn(),
      loadDataset: jest.fn(),
      loadById: jest.fn(),
    } as jest.Mocked<DatasetStoragePort>;

    useCase = new ListDatasetsUseCase(mockStorage);
  });

  describe('execute', () => {
    it('should return all dataset schemas', async () => {
      mockStorage.listSchemas.mockReturnValue(mockSchemas);

      const result = await useCase.execute();

      expect(result).toEqual(mockSchemas);
      expect(result).toHaveLength(2);
      expect(mockStorage.listSchemas).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no datasets exist', async () => {
      mockStorage.listSchemas.mockReturnValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return single dataset schema', async () => {
      mockStorage.listSchemas.mockReturnValue([mockSchemas[0]]);

      const result = await useCase.execute();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('dataset1');
    });
  });
});
