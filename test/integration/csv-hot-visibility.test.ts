import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { CsvStorageAdapter } from '../../src/adapters/secondary/csv/csv-storage-adapter.js';
import { QueryDatasetUseCase } from '../../src/use-cases/query-dataset-use-case.js';
import { DatasetCatalogService } from '../../src/domain/services/dataset-catalog-service.js';
import { FieldValidator } from '../../src/domain/services/field-validator.js';

/**
 * Integration test: CSV Hot Visibility
 * 
 * Validates that CSV file changes are immediately visible without reload
 * This is a key architectural feature - CSV data is loaded on-demand from disk
 */
describe('CSV Hot Visibility Integration', () => {
  const testDir = join(process.cwd(), 'test-temp-csv-visibility');
  const configPath = join(testDir, 'datasets.json');
  const csvPath = join(testDir, 'test-data.csv');
  
  let adapter: CsvStorageAdapter;
  let catalogService: DatasetCatalogService;
  let queryUseCase: QueryDatasetUseCase;

  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    if (adapter) {
      await adapter.shutdown();
    }
    
    // Clean up test files
    try {
      const { rm } = await import('fs/promises');
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test('CSV changes are immediately visible without reload', async () => {
    // Create initial config
    const config = {
      datasets: [
        {
          id: 'test-dataset',
          name: 'Test Dataset',
          description: 'Test dataset for CSV hot visibility',
          path: csvPath,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
            { name: 'name', type: 'string', description: 'Name', isKey: false, isLookupKey: false },
            { name: 'value', type: 'number', description: 'Value', isKey: false, isLookupKey: false },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id', 'name', 'value'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));

    // Create initial CSV
    const initialCsv = `id,name,value
1,Alice,100
2,Bob,200`;
    await writeFile(csvPath, initialCsv);

    // Initialize adapter and use case
    adapter = new CsvStorageAdapter(configPath);
    await adapter.initialize();
    catalogService = new DatasetCatalogService(adapter.listSchemas());
    const fieldValidator = new FieldValidator();
    queryUseCase = new QueryDatasetUseCase(adapter, catalogService, fieldValidator);

    // Query initial data
    const result1 = await queryUseCase.execute({
      datasetId: 'test-dataset',
    });

    expect(result1.rows).toHaveLength(2);
    expect(result1.rows[0]).toEqual({ id: 1, name: 'Alice', value: 100 });
    expect(result1.rows[1]).toEqual({ id: 2, name: 'Bob', value: 200 });

    // Modify CSV file - add new row and change existing value
    const modifiedCsv = `id,name,value
1,Alice,150
2,Bob,200
3,Charlie,300`;
    await writeFile(csvPath, modifiedCsv);

    // Wait a moment to ensure file is written
    await new Promise(resolve => setTimeout(resolve, 100));

    // Query again - should see NEW data immediately (no reload needed)
    const result2 = await queryUseCase.execute({
      datasetId: 'test-dataset',
    });

    expect(result2.rows).toHaveLength(3);
    expect(result2.rows[0]).toEqual({ id: 1, name: 'Alice', value: 150 }); // Updated value
    expect(result2.rows[1]).toEqual({ id: 2, name: 'Bob', value: 200 });
    expect(result2.rows[2]).toEqual({ id: 3, name: 'Charlie', value: 300 }); // New row
  });

  test('Multiple rapid CSV modifications are all visible', async () => {
    // Create initial config
    const config = {
      datasets: [
        {
          id: 'rapid-test',
          name: 'Rapid Test Dataset',
          description: 'Test for rapid CSV changes',
          path: csvPath,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
            { name: 'counter', type: 'number', description: 'Counter', isKey: false, isLookupKey: false },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id', 'counter'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));

    // Initialize fresh adapter
    if (adapter) {
      await adapter.shutdown();
    }
    adapter = new CsvStorageAdapter(configPath);
    await adapter.initialize();
    catalogService = new DatasetCatalogService(adapter.listSchemas());
    const fieldValidator = new FieldValidator();
    queryUseCase = new QueryDatasetUseCase(adapter, catalogService, fieldValidator);

    // Perform multiple rapid updates
    for (let i = 1; i <= 5; i++) {
      const csv = `id,counter\n1,${i * 10}`;
      await writeFile(csvPath, csv);
      
      // Small delay to ensure write completes
      await new Promise(resolve => setTimeout(resolve, 50));

      // Query should return current file state
      const result = await queryUseCase.execute({
        datasetId: 'rapid-test',
      });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ id: 1, counter: i * 10 });
    }
  });
});
