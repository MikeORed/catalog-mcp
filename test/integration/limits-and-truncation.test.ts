import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CsvStorageAdapter } from '../../src/adapters/secondary/csv/csv-storage-adapter.js';
import { DatasetCatalogService } from '../../src/domain/services/dataset-catalog-service.js';
import { FieldValidator } from '../../src/domain/services/field-validator.js';
import { QueryDatasetUseCase } from '../../src/use-cases/query-dataset-use-case.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Limits and Truncation Integration Tests', () => {
  let storage: CsvStorageAdapter;
  let catalog: DatasetCatalogService;
  let fieldValidator: FieldValidator;
  let queryUseCase: QueryDatasetUseCase;

  beforeAll(async () => {
    const configPath = path.join(__dirname, '../fixtures/config/test-datasets.json');
    storage = new CsvStorageAdapter(configPath);
    await storage.initialize();

    const schemas = await storage.listSchemas();
    catalog = new DatasetCatalogService(schemas);
    fieldValidator = new FieldValidator();
    queryUseCase = new QueryDatasetUseCase(storage, catalog, fieldValidator);
  });

  afterAll(async () => {
    await storage.shutdown();
  });

  describe('AC-5.1: Per-Dataset Limits Enforced', () => {
    it('should use defaultLimit when no limit specified', async () => {
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: undefined,
        selectFields: undefined,
        limit: undefined,
      });

      // Users dataset has defaultLimit: 100, maxLimit: 500
      expect(result.limitApplied).toBe(true);
      expect(result.count).toBeLessThanOrEqual(100);
      expect(result.totalMatched).toBeGreaterThanOrEqual(result.count);
    });

    it('should use requested limit when less than maxLimit', async () => {
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: undefined,
        selectFields: undefined,
        limit: 5,
      });

      expect(result.limitApplied).toBe(true);
      expect(result.count).toBeLessThanOrEqual(5);
      expect(result.totalMatched).toBeGreaterThanOrEqual(result.count);
    });

    it('should cap limit at maxLimit when requested limit exceeds it', async () => {
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: undefined,
        selectFields: undefined,
        limit: 1000, // Exceeds maxLimit of 500
      });

      expect(result.limitApplied).toBe(true);
      // Should be capped at maxLimit (500)
      expect(result.count).toBeLessThanOrEqual(500);
      expect(result.totalMatched).toBeGreaterThanOrEqual(result.count);
    });

    it('should use defaultLimit when limit is 0', async () => {
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: undefined,
        selectFields: undefined,
        limit: 0,
      });

      expect(result.limitApplied).toBe(true);
      expect(result.count).toBeLessThanOrEqual(100); // defaultLimit
      expect(result.totalMatched).toBeGreaterThanOrEqual(result.count);
    });

    it('should respect different limits for different datasets', async () => {
      // Products dataset has different limits than users
      const productsResult = await queryUseCase.execute({
        datasetId: 'products',
        filter: undefined,
        selectFields: undefined,
        limit: undefined,
      });

      expect(productsResult.limitApplied).toBe(true);
      // Products has defaultLimit: 50, maxLimit: 200
      expect(productsResult.count).toBeLessThanOrEqual(50);
    });
  });

  describe('AC-5.2: Truncation Flags in Responses', () => {
    it('should set truncated=false when results less than limit', async () => {
      // Apply filter that returns fewer results than limit
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: {
          field: 'department',
          op: 'eq',
          value: 'Engineering',
        },
        selectFields: undefined,
        limit: 100, // More than expected results
      });

      expect(result.limitApplied).toBe(true);
      expect(result.truncated).toBe(false);
      expect(result.count).toEqual(result.totalMatched);
    });

    it('should set truncated=true when results exceed limit', async () => {
      // Use small limit to ensure truncation
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: undefined,
        selectFields: undefined,
        limit: 2, // Very small limit
      });

      expect(result.limitApplied).toBe(true);
      expect(result.count).toBe(2);
      
      // If there are more than 2 users, it should be truncated
      if (result.totalMatched > 2) {
        expect(result.truncated).toBe(true);
        expect(result.totalMatched).toBeGreaterThan(result.count);
      }
    });

    it('should provide accurate totalMatched count', async () => {
      // Query with filter
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: {
          field: 'active',
          op: 'eq',
          value: true,
        },
        selectFields: undefined,
        limit: 3,
      });

      expect(result.limitApplied).toBe(true);
      expect(result.totalMatched).toBeGreaterThanOrEqual(result.count);
      
      // totalMatched should reflect all matching rows before limit
      if (result.truncated) {
        expect(result.totalMatched).toBeGreaterThan(result.count);
      } else {
        expect(result.totalMatched).toBe(result.count);
      }
    });

    it('should handle truncation with filters', async () => {
      // Filter that reduces results, then apply limit
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: {
          field: 'email',
          op: 'contains',
          value: '@',
        },
        selectFields: undefined,
        limit: 1,
      });

      expect(result.limitApplied).toBe(true);
      expect(result.count).toBeLessThanOrEqual(1);
      expect(result.totalMatched).toBeGreaterThanOrEqual(1);
      
      if (result.totalMatched > 1) {
        expect(result.truncated).toBe(true);
      }
    });

    it('should always set limitApplied=true for queries', async () => {
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: undefined,
        selectFields: undefined,
        limit: undefined,
      });

      // A limit is always applied (either default or explicit)
      expect(result.limitApplied).toBe(true);
    });
  });

  describe('AC-5.1 & AC-5.2: Combined Scenarios', () => {
    it('should correctly handle limit exactly equal to result count', async () => {
      // First, get the total count
      const fullResult = await queryUseCase.execute({
        datasetId: 'users',
        filter: {
          field: 'department',
          op: 'eq',
          value: 'Engineering',
        },
        selectFields: undefined,
        limit: 100,
      });

      const totalEngineering = fullResult.count;

      // Now query with limit exactly equal to count
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: {
          field: 'department',
          op: 'eq',
          value: 'Engineering',
        },
        selectFields: undefined,
        limit: totalEngineering,
      });

      expect(result.limitApplied).toBe(true);
      expect(result.count).toBe(totalEngineering);
      expect(result.truncated).toBe(false);
      expect(result.totalMatched).toBe(totalEngineering);
    });

    it('should handle compound filters with limits', async () => {
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: {
          and: [
            { field: 'active', op: 'eq', value: true },
            { field: 'department', op: 'eq', value: 'Engineering' },
          ],
        },
        selectFields: undefined,
        limit: 5,
      });

      expect(result.limitApplied).toBe(true);
      expect(result.count).toBeLessThanOrEqual(5);
      expect(result.totalMatched).toBeGreaterThanOrEqual(result.count);
      expect(result.fields).toBeDefined();
    });

    it('should respect limits with field projection', async () => {
      const result = await queryUseCase.execute({
        datasetId: 'users',
        filter: undefined,
        selectFields: ['user_id', 'email'],
        limit: 3,
      });

      expect(result.limitApplied).toBe(true);
      expect(result.count).toBeLessThanOrEqual(3);
      expect(result.fields).toEqual(['user_id', 'email']);
      
      // Verify each row only has selected fields
      result.rows.forEach(row => {
        expect(Object.keys(row).sort()).toEqual(['email', 'user_id']);
      });
    });
  });
});
