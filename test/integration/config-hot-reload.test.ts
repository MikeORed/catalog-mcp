import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { CsvStorageAdapter } from '../../src/adapters/secondary/csv/csv-storage-adapter.js';
import { ListDatasetsUseCase } from '../../src/use-cases/list-datasets-use-case.js';
import { QueryDatasetUseCase } from '../../src/use-cases/query-dataset-use-case.js';
import { DatasetCatalogService } from '../../src/domain/services/dataset-catalog-service.js';
import { FieldValidator } from '../../src/domain/services/field-validator.js';

/**
 * Integration test: Config Hot Reload
 * 
 * Validates that configuration file changes trigger automatic schema reload
 * Tests the atomic swap pattern and error handling
 */
describe('Config Hot Reload Integration', () => {
  const testDir = join(process.cwd(), 'test-temp-config-reload');
  const configPath = join(testDir, 'datasets.json');
  const csvPath1 = join(testDir, 'dataset1.csv');
  const csvPath2 = join(testDir, 'dataset2.csv');
  
  let adapter: CsvStorageAdapter;

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

  test('Config file modification triggers schema reload', async () => {
    // Create initial config with one dataset
    const initialConfig = {
      datasets: [
        {
          id: 'dataset1',
          name: 'Dataset One',
          description: 'First dataset',
          path: csvPath1,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
            { name: 'name', type: 'string', description: 'Name', isKey: false, isLookupKey: false },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id', 'name'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(initialConfig, null, 2));

    // Create CSV
    await writeFile(csvPath1, 'id,name\n1,Alice\n2,Bob');

    // Initialize adapter
    adapter = new CsvStorageAdapter(configPath);
    await adapter.initialize();

    // Verify initial state
    let schemas = adapter.listSchemas();
    expect(schemas).toHaveLength(1);
    expect(schemas[0].id).toBe('dataset1');
    expect(schemas[0].limits.defaultLimit).toBe(10);

    // Modify config: change defaultLimit and add field
    const modifiedConfig = {
      datasets: [
        {
          id: 'dataset1',
          name: 'Dataset One Updated',
          description: 'First dataset with changes',
          path: csvPath1,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
            { name: 'name', type: 'string', description: 'Name', isKey: false, isLookupKey: false },
            { name: 'status', type: 'string', description: 'Status', isKey: false, isLookupKey: false },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id', 'name', 'status'],
          limits: {
            defaultLimit: 20,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(modifiedConfig, null, 2));

    // Wait for file watcher to trigger reload
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify schemas were reloaded
    schemas = adapter.listSchemas();
    expect(schemas).toHaveLength(1);
    expect(schemas[0].name).toBe('Dataset One Updated');
    expect(schemas[0].limits.defaultLimit).toBe(20);
    expect(schemas[0].fields).toHaveLength(3);
    expect(schemas[0].fields[2].name).toBe('status');
  });

  test('Adding new dataset is detected', async () => {
    // Create initial config with one dataset
    const initialConfig = {
      datasets: [
        {
          id: 'dataset1',
          name: 'Dataset One',
          description: 'First dataset',
          path: csvPath1,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
            { name: 'name', type: 'string', description: 'Name', isKey: false, isLookupKey: false },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id', 'name'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(initialConfig, null, 2));
    await writeFile(csvPath1, 'id,name\n1,Alice');
    await writeFile(csvPath2, 'id,value\n1,100');

    // Initialize fresh adapter
    if (adapter) {
      await adapter.shutdown();
    }
    adapter = new CsvStorageAdapter(configPath);
    await adapter.initialize();

    // Create use case for listing
    let listUseCase = new ListDatasetsUseCase(adapter);

    // Verify initial state
    let result = await listUseCase.execute();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('dataset1');

    // Add second dataset
    const extendedConfig = {
      datasets: [
        {
          id: 'dataset1',
          name: 'Dataset One',
          description: 'First dataset',
          path: csvPath1,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
            { name: 'name', type: 'string', description: 'Name', isKey: false, isLookupKey: false },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id', 'name'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
        {
          id: 'dataset2',
          name: 'Dataset Two',
          description: 'Second dataset',
          path: csvPath2,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
            { name: 'value', type: 'number', description: 'Value', isKey: false, isLookupKey: false },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id', 'value'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(extendedConfig, null, 2));

    // Wait for reload
    await new Promise(resolve => setTimeout(resolve, 500));

    // Re-create use case with adapter (which now has new schemas)
    listUseCase = new ListDatasetsUseCase(adapter);

    // Verify new dataset appears
    result = await listUseCase.execute();
    expect(result).toHaveLength(2);
    expect(result.map(d => d.id).sort()).toEqual(['dataset1', 'dataset2']);
  });

  test('Removing dataset is detected', async () => {
    // Create config with two datasets
    const initialConfig = {
      datasets: [
        {
          id: 'dataset1',
          name: 'Dataset One',
          description: 'First dataset',
          path: csvPath1,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
        {
          id: 'dataset2',
          name: 'Dataset Two',
          description: 'Second dataset',
          path: csvPath2,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(initialConfig, null, 2));
    await writeFile(csvPath1, 'id\n1');
    await writeFile(csvPath2, 'id\n2');

    // Initialize fresh adapter
    if (adapter) {
      await adapter.shutdown();
    }
    adapter = new CsvStorageAdapter(configPath);
    await adapter.initialize();

    // Verify both datasets exist
    let schemas = adapter.listSchemas();
    expect(schemas).toHaveLength(2);

    // Remove one dataset
    const reducedConfig = {
      datasets: [
        {
          id: 'dataset1',
          name: 'Dataset One',
          description: 'First dataset',
          path: csvPath1,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(reducedConfig, null, 2));

    // Wait for reload
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify dataset was removed
    schemas = adapter.listSchemas();
    expect(schemas).toHaveLength(1);
    expect(schemas[0].id).toBe('dataset1');
  });

  test('Invalid config does not crash server - old state preserved', async () => {
    // Create valid initial config
    const validConfig = {
      datasets: [
        {
          id: 'dataset1',
          name: 'Dataset One',
          description: 'First dataset',
          path: csvPath1,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
            { name: 'name', type: 'string', description: 'Name', isKey: false, isLookupKey: false },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id', 'name'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(validConfig, null, 2));
    await writeFile(csvPath1, 'id,name\n1,Alice');

    // Initialize fresh adapter
    if (adapter) {
      await adapter.shutdown();
    }
    adapter = new CsvStorageAdapter(configPath);
    await adapter.initialize();

    // Verify initial state
    let schemas = adapter.listSchemas();
    expect(schemas).toHaveLength(1);
    expect(schemas[0].id).toBe('dataset1');

    // Write INVALID config (missing required field)
    const invalidConfig = {
      datasets: [
        {
          id: 'dataset1',
          name: 'Dataset One',
          description: 'First dataset',
          path: csvPath1,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
          ],
          keyField: 'nonexistent', // Invalid - doesn't exist in fields
          lookupKeys: ['id'],
          visibleFields: ['id'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(invalidConfig, null, 2));

    // Wait for reload attempt
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify old state preserved (no crash)
    schemas = adapter.listSchemas();
    expect(schemas).toHaveLength(1);
    expect(schemas[0].id).toBe('dataset1');
    expect(schemas[0].fields).toHaveLength(2); // Still has original 2 fields
    expect(schemas[0].keyField).toBe('id'); // Still has valid keyField

    // Verify adapter still functional with old schema
    const catalogService = new DatasetCatalogService(adapter.listSchemas());
    const fieldValidator = new FieldValidator();
    const queryUseCase = new QueryDatasetUseCase(adapter, catalogService, fieldValidator);

    const result = await queryUseCase.execute({
      datasetId: 'dataset1',
    });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ id: 1, name: 'Alice' });
  });

  test('Malformed JSON does not crash server', async () => {
    // Create valid initial config
    const validConfig = {
      datasets: [
        {
          id: 'dataset1',
          name: 'Dataset One',
          description: 'Test',
          path: csvPath1,
          fields: [
            { name: 'id', type: 'number', description: 'ID', isKey: true, isLookupKey: true },
          ],
          keyField: 'id',
          lookupKeys: ['id'],
          visibleFields: ['id'],
          limits: {
            defaultLimit: 10,
            maxLimit: 100,
          },
        },
      ],
    };
    await writeFile(configPath, JSON.stringify(validConfig, null, 2));
    await writeFile(csvPath1, 'id\n1');

    // Initialize fresh adapter
    if (adapter) {
      await adapter.shutdown();
    }
    adapter = new CsvStorageAdapter(configPath);
    await adapter.initialize();

    // Verify initial state
    const initialSchemas = adapter.listSchemas();
    expect(initialSchemas).toHaveLength(1);

    // Write malformed JSON
    await writeFile(configPath, '{ invalid json here }}');

    // Wait for reload attempt
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify old state preserved
    const schemas = adapter.listSchemas();
    expect(schemas).toHaveLength(1);
    expect(schemas[0].id).toBe('dataset1');
  });
});
