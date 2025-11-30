import { describe, test, expect, beforeAll } from '@jest/globals';
import { CsvStorageAdapter } from '../../src/adapters/secondary/csv/csv-storage-adapter.js';
import { ListDatasetsTool } from '../../src/adapters/primary/mcp/tools/list-datasets-tool.js';
import { DescribeDatasetTool } from '../../src/adapters/primary/mcp/tools/describe-dataset-tool.js';
import { QueryDatasetTool } from '../../src/adapters/primary/mcp/tools/query-dataset-tool.js';
import { GetByIdTool } from '../../src/adapters/primary/mcp/tools/get-by-id-tool.js';
import { ListDatasetsUseCase } from '../../src/use-cases/list-datasets-use-case.js';
import { DescribeDatasetUseCase } from '../../src/use-cases/describe-dataset-use-case.js';
import { QueryDatasetUseCase } from '../../src/use-cases/query-dataset-use-case.js';
import { GetByIdUseCase } from '../../src/use-cases/get-by-id-use-case.js';
import { DatasetCatalogService } from '../../src/domain/services/dataset-catalog-service.js';
import { FieldValidator } from '../../src/domain/services/field-validator.js';
import path from 'path';

describe('MCP Tools Integration Tests', () => {
  let storage: CsvStorageAdapter;
  let listDatasetsTool: ListDatasetsTool;
  let describeDatasetTool: DescribeDatasetTool;
  let queryDatasetTool: QueryDatasetTool;
  let getByIdTool: GetByIdTool;

  beforeAll(async () => {
    // Initialize storage with test fixtures
    const configPath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'test-datasets.json');
    storage = new CsvStorageAdapter(configPath);
    await storage.initialize();

    // Initialize domain services
    const schemas = storage.listSchemas();
    const catalog = new DatasetCatalogService(schemas);
    const fieldValidator = new FieldValidator();

    // Initialize use cases
    const listDatasetsUseCase = new ListDatasetsUseCase(storage);
    const describeDatasetUseCase = new DescribeDatasetUseCase(catalog);
    const queryDatasetUseCase = new QueryDatasetUseCase(storage, catalog, fieldValidator);
    const getByIdUseCase = new GetByIdUseCase(storage, catalog, fieldValidator);

    // Initialize tools
    listDatasetsTool = new ListDatasetsTool(listDatasetsUseCase);
    describeDatasetTool = new DescribeDatasetTool(describeDatasetUseCase);
    queryDatasetTool = new QueryDatasetTool(queryDatasetUseCase);
    getByIdTool = new GetByIdTool(getByIdUseCase);
  });

  describe('ListDatasetsTool', () => {
    test('should return tool metadata', () => {
      const metadata = listDatasetsTool.getMetadata();
      expect(metadata.name).toBe('list_datasets');
      expect(metadata.description).toBeTruthy();
      expect(metadata.inputSchema).toBeDefined();
    });

    test('should list all datasets', async () => {
      const result = await listDatasetsTool.execute();
      
      expect(result).toHaveProperty('datasets');
      expect(Array.isArray(result.datasets)).toBe(true);
      expect(result.datasets.length).toBeGreaterThan(0);

      // Check first dataset structure
      const dataset = result.datasets[0];
      expect(dataset).toHaveProperty('id');
      expect(dataset).toHaveProperty('name');
      expect(dataset).toHaveProperty('description');
      expect(dataset).toHaveProperty('fieldCount');
      expect(dataset).toHaveProperty('keyField');
      expect(dataset).toHaveProperty('lookupKeys');
      expect(dataset).toHaveProperty('visibleFields');
      expect(dataset).toHaveProperty('limits');
    });
  });

  describe('DescribeDatasetTool', () => {
    test('should return tool metadata', () => {
      const metadata = describeDatasetTool.getMetadata();
      expect(metadata.name).toBe('describe_dataset');
      expect(metadata.description).toBeTruthy();
      expect(metadata.inputSchema.required).toContain('datasetId');
    });

    test('should describe a dataset', async () => {
      const result = await describeDatasetTool.execute({ datasetId: 'users' });
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('fields');
      expect(Array.isArray(result.fields)).toBe(true);

      // Check field structure
      const field = result.fields[0];
      expect(field).toHaveProperty('name');
      expect(field).toHaveProperty('type');
      expect(field).toHaveProperty('isKey');
      expect(field).toHaveProperty('isLookupKey');
    });

    test('should throw error for non-existent dataset', async () => {
      await expect(
        describeDatasetTool.execute({ datasetId: 'nonexistent' })
      ).rejects.toThrow();
    });

    test('should throw error when datasetId is missing', async () => {
      await expect(
        describeDatasetTool.execute({ datasetId: '' })
      ).rejects.toThrow('datasetId parameter is required');
    });
  });

  describe('QueryDatasetTool', () => {
    test('should return tool metadata', () => {
      const metadata = queryDatasetTool.getMetadata();
      expect(metadata.name).toBe('query_dataset');
      expect(metadata.description).toBeTruthy();
      expect(metadata.inputSchema.required).toContain('datasetId');
    });

    test('should query without filter', async () => {
      const result = await queryDatasetTool.execute({ datasetId: 'users' });
      
      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('truncated');
      expect(result).toHaveProperty('fields');
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.count).toBeGreaterThan(0);
    });

    test('should query with eq filter', async () => {
      const result = await queryDatasetTool.execute({
        datasetId: 'users',
        filter: { field: 'user_id', op: 'eq', value: 'user1' }
      });
      
      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('count');
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.count).toBe(1);
      expect(result.rows[0]).toHaveProperty('user_id', 'user1');
    });

    test('should query with contains filter', async () => {
      const result = await queryDatasetTool.execute({
        datasetId: 'users',
        filter: { field: 'first_name', op: 'contains', value: 'Alice' }
      });
      
      expect(result).toHaveProperty('rows');
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.count).toBeGreaterThan(0);
      result.rows.forEach((row: any) => {
        expect(row.first_name).toContain('Alice');
      });
    });

    test('should query with compound AND filter', async () => {
      const result = await queryDatasetTool.execute({
        datasetId: 'users',
        filter: {
          and: [
            { field: 'active', op: 'eq', value: true },
            { field: 'department', op: 'eq', value: 'Engineering' }
          ]
        },
        selectFields: ['user_id', 'department', 'active'] // Need to explicitly request active field
      });
      
      expect(result).toHaveProperty('rows');
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.count).toBeGreaterThan(0);
      result.rows.forEach((row: any) => {
        expect(row.active).toBe(true);
        expect(row.department).toBe('Engineering');
      });
    });

    test('should respect field projection', async () => {
      const result = await queryDatasetTool.execute({
        datasetId: 'users',
        selectFields: ['user_id', 'email']
      });
      
      expect(result.fields).toEqual(['user_id', 'email']);
      expect(result.count).toBeGreaterThan(0);
      result.rows.forEach((row: any) => {
        expect(Object.keys(row).sort()).toEqual(['email', 'user_id']);
      });
    });

    test('should respect limit', async () => {
      const result = await queryDatasetTool.execute({
        datasetId: 'users',
        limit: 2
      });
      
      expect(result.count).toBeLessThanOrEqual(2);
      expect(result.count).toBe(2);
    });

    test('should reject invalid filter operator', async () => {
      await expect(
        queryDatasetTool.execute({
          datasetId: 'users',
          filter: { field: 'id', op: 'gt', value: 5 }
        })
      ).rejects.toThrow();
    });

    test('should reject invalid field in filter', async () => {
      await expect(
        queryDatasetTool.execute({
          datasetId: 'users',
          filter: { field: 'nonexistent', op: 'eq', value: 'test' }
        })
      ).rejects.toThrow();
    });

    test('should reject invalid field in selectFields', async () => {
      await expect(
        queryDatasetTool.execute({
          datasetId: 'users',
          selectFields: ['nonexistent']
        })
      ).rejects.toThrow();
    });
  });

  describe('GetByIdTool', () => {
    test('should return tool metadata', () => {
      const metadata = getByIdTool.getMetadata();
      expect(metadata.name).toBe('get_by_id');
      expect(metadata.description).toBeTruthy();
      expect(metadata.inputSchema.required).toContain('datasetId');
      expect(metadata.inputSchema.required).toContain('id');
    });

    test('should get row by id', async () => {
      const result = await getByIdTool.execute({
        datasetId: 'users',
        id: 'user1'
      });
      
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('fields');
      expect(result.count).toBe(1);
      expect(result.rows[0]).toHaveProperty('user_id', 'user1');
    });

    test('should return empty result for non-existent id', async () => {
      const result = await getByIdTool.execute({
        datasetId: 'users',
        id: 'nonexistent_user'
      });
      
      expect(result.count).toBe(0);
      expect(result.rows).toEqual([]);
    });

    test('should respect field projection', async () => {
      const result = await getByIdTool.execute({
        datasetId: 'users',
        id: 'user1',
        selectFields: ['user_id', 'email']
      });
      
      expect(result.fields).toEqual(['user_id', 'email']);
      expect(result.count).toBe(1);
      expect(Object.keys(result.rows[0]).sort()).toEqual(['email', 'user_id']);
    });

    test('should throw error when id is missing', async () => {
      await expect(
        getByIdTool.execute({ datasetId: 'users', id: null as any })
      ).rejects.toThrow('id parameter is required');
    });
  });
});
