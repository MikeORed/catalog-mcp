# Generic Data Catalog MCP Server – Project Plan v1.final

**Version**: 1.final  
**Date**: 2025-11-29  
**Status**: Approved - Canonical Specification  
**Original Version**: v1.mvp-scoped  
**Supersedes**: v0.initial

---

## 1. Purpose and Scope

### 1.1 Goal

Build a **generic, hex-architected MCP server** that exposes structured, tabular datasets (initially CSV) through a small, well-defined set of MCP tools.

It should:

* Be **domain-agnostic** (usable for M&M, other TTRPG tools, and non-game projects).
* Provide **indexed, filtered lookups** over datasets.
* Control **token footprint** via projections and limits.
* Be easy to extend to new backends (CSV → SQLite → whatever) without breaking the MCP surface.
* Support **hot reloading** of datasets without maintaining full data in memory.

### 1.2 Non-Goals

* No hard-coding Mutants & Masterminds semantics into the server.
* No heavy GUI / API beyond MCP tools.
* No full SQL engine or arbitrary query language (filters are constrained and structured).
* No "smart" vector search / RAG here; this is deterministic data access plumbing.
* No automatic schema inference (explicit type definitions required).
* No array field type support in MVP (deferred to post-MVP).

### 1.3 MVP vs Post-MVP Features

**MVP Scope (this plan):**
- Simplified filter operators: `eq`, `contains`, `and` compound only
- JSON configuration format
- Explicit type definitions (no inference)
- Supported types: `string`, `number`, `boolean`, `enum`
- Basic logging (request, dataset, row/field counts)
- Hot reload of config and CSV files

**Post-MVP Features (future phases):**
- Extended filter operators: `neq`, `gt`, `gte`, `lt`, `lte`, `or` compound
- YAML configuration support
- Sort functionality
- Array field type support
- Enhanced logging and metrics

---

## 2. Functional Requirements

### 2.1 High-Level Features

The MCP server must expose these four tools:

1. **`list_datasets`**

   * Returns the list of available datasets and short metadata.

2. **`describe_dataset`**

   * Input: `datasetName`
   * Returns schema info: fields, types, lookup_keys, visible_fields, limits.

3. **`query_dataset`**

   * Inputs:

     * `datasetName`
     * `filters` (structured, MVP operators only)
     * `selectFields?` (optional projection)
     * `limit?` (optional row limit)
   * Returns:

     * `rows`: array of objects
     * `fields`: list of fields actually returned
     * `totalMatched` (optional, capped)
     * `limitApplied` (boolean)

4. **`get_by_id`**

   * Inputs:

     * `datasetName`
     * `id` (primary key)
     * `selectFields?`
   * Returns:

     * Single row or a "not found" error.
   
   **Rationale**: Despite functional overlap with `query_dataset`, this tool provides clear semantic distinction for single-row lookups with full details.

### 2.2 Filtering Model (MVP Scope)

* Filters are a **limited AST**, not arbitrary text
* **MVP operators only:**
  * `eq` - exact match
  * `contains` - substring/element match for strings
  * Compound: `and` only (no `or` in MVP)

**Example MVP filter:**

```json
{
  "op": "and",
  "filters": [
    { "field": "tags", "op": "contains", "value": "fire" },
    { "field": "power_role", "op": "eq", "value": "offense" }
  ]
}
```

**Post-MVP extensions** will add: `neq`, `gt`, `gte`, `lt`, `lte`, and `or` compound operator.

### 2.3 Token Budget Controls

Server-side controls (LLM-facing):

* **Max rows per query** (configurable per dataset, no system defaults).
* **Max fields per row** (via required `visible_fields` configuration).
* **Truncation flags** in responses when limits are applied.
* Basic logging of row/field counts per request.

---

## 3. Constraints

* **Language:** TypeScript, Node.
* **Architecture:** Hexagonal (Domain / Use Cases / Ports / Adapters).
* **Storage backend:** Local CSV files (MVP), with hot reload capability.
* **Config format:** JSON (MVP), YAML support in post-MVP.
* **Runtime:** MCP-compliant server process (Node-based).
* **Type system:** Explicit type definitions required in config.
* **Supported types (MVP):** `string`, `number`, `boolean`, `enum` only.
* **Error handling:** Fail fast on config validation errors with comprehensive logging.
* **Field validation:** Error immediately on invalid field references with helpful messages.

---

## 4. Architecture

Follow the workspace rules you already set: domain purity, ports, adapters, etc.

### 4.1 Domain Layer

Core domain types:

* `DatasetId` (string)
* `FieldName` (string)
* `FieldType` (enum: `string`, `number`, `boolean`, `enum` - no `array` or `unknown` in MVP)
* `DatasetSchema`
* `DatasetConfig`
* `FilterExpression` (AST with MVP operators only)
* `QueryRequest`
* `QueryResult`
* Domain-specific errors (`DatasetNotFoundError`, `InvalidFilterError`, `InvalidFieldError`, `ConfigError`, etc.)

*No TypeScript imports from fs, HTTP, etc.*

#### 4.1.1 Domain Model (Updated for MVP)

Pseudo-types:

```ts
type DatasetId = string;
type FieldName = string;

enum FieldType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Enum = 'enum',
  // Array and Unknown removed for MVP
}

interface DatasetField {
  name: FieldName;
  type: FieldType;
  enumValues?: string[]; // Only present if type is Enum
  isKey: boolean;
  isLookupKey: boolean;
}

interface DatasetSchema {
  id: DatasetId;
  displayName: string;
  description?: string;
  fields: DatasetField[];
  keyField: FieldName;
  lookupKeys: FieldName[];
  visibleFields: FieldName[]; // REQUIRED in config
  limits: {
    defaultLimit: number;
    maxLimit: number;
  };
}

interface DatasetConfig {
  id: DatasetId;
  path: string;
  displayName?: string;
  description?: string;
  keyField: FieldName;
  fields: {
    name: FieldName;
    type: FieldType;
    enumValues?: string[];
  }[];
  lookupKeys: FieldName[];
  visibleFields: FieldName[]; // REQUIRED - no defaults
  limits: {
    defaultLimit: number;
    maxLimit: number;
  }; // REQUIRED per dataset
}
```

Filter AST (MVP operators only):

```ts
type FilterOp = 'eq' | 'contains'; // MVP only - no neq, gt, gte, lt, lte

interface FieldFilter {
  type: 'field';
  field: FieldName;
  op: FilterOp;
  value: unknown;
}

interface CompoundFilter {
  type: 'compound';
  op: 'and'; // MVP only - no 'or'
  filters: FilterExpression[];
}

type FilterExpression = FieldFilter | CompoundFilter;
```

Query:

```ts
interface QueryRequest {
  datasetId: DatasetId;
  filter?: FilterExpression;
  selectFields?: FieldName[];
  limit?: number;
}

interface QueryResultRow {
  [fieldName: string]: unknown;
}

interface QueryResult {
  datasetId: DatasetId;
  fields: FieldName[];
  rows: QueryResultRow[];
  totalMatched?: number;
  limitApplied: boolean;
  truncated: boolean;
}
```

Domain services:

* `DatasetCatalog` – describe and list datasets.
* `DatasetQueryService` – apply filters / projections against an abstract port.
* `FieldValidator` - validate field references in queries and filters.

### 4.2 Ports (Interfaces)

#### 4.2.1 Secondary Ports (Driven)

1. **`DatasetStoragePort`**

   * Contract for "read rows from dataset"

```ts
interface DatasetStoragePort {
  loadSchema(datasetId: DatasetId): Promise<DatasetSchema>;
  listDatasetIds(): Promise<DatasetId[]>;
  queryDatasetRaw(
    datasetId: DatasetId,
    limit?: number
  ): Promise<QueryResultRow[]>;
  getRowByKey(
    datasetId: DatasetId,
    keyValue: unknown
  ): Promise<QueryResultRow | null>;
  
  // Hot reload support
  watchForChanges(callback: () => void): void;
  reload(): Promise<void>;
}
```

> `queryDatasetRaw` returns full rows; domain handles filtering and projection.
> Hot reload is implemented at the adapter level but exposed through this port.

#### 4.2.2 Primary Ports (Driving)

1. **`DatasetQueryPort`**

   * Exposed to MCP primary adapter.

```ts
interface DatasetQueryPort {
  listDatasets(): Promise<DatasetSchema[]>;
  describeDataset(datasetId: DatasetId): Promise<DatasetSchema>;
  queryDataset(request: QueryRequest): Promise<QueryResult>;
  getById(
    datasetId: DatasetId,
    id: unknown,
    selectFields?: FieldName[]
  ): Promise<QueryResult>;
}
```

The MCP adapter will implement tools by calling this port.

### 4.3 Use Case Layer

Use cases (application services):

1. `ListDatasetsUseCase`
2. `DescribeDatasetUseCase`
3. `QueryDatasetUseCase`
4. `GetByIdUseCase`

Each orchestrates:

* `DatasetStoragePort`
* Domain filtering logic (MVP operators only)
* Limits / projections
* Field validation (error immediately on invalid fields)

Example pseudocode (updated for MVP):

```ts
class QueryDatasetUseCase {
  constructor(
    private readonly storage: DatasetStoragePort,
    private readonly catalog: DatasetCatalogService,
    private readonly fieldValidator: FieldValidator
  ) {}

  async execute(request: QueryRequest): Promise<QueryResult> {
    const schema = await this.catalog.getSchema(request.datasetId);

    // Validate filter fields - error immediately if invalid
    if (request.filter) {
      this.fieldValidator.validateFilterFields(request.filter, schema);
    }

    // Validate select fields - error immediately if invalid
    if (request.selectFields && request.selectFields.length > 0) {
      this.fieldValidator.validateSelectFields(request.selectFields, schema);
    }

    const effectiveLimit = this.computeEffectiveLimit(
      schema.limits,
      request.limit
    );

    // Hot reload: query from CSV each time, don't maintain in memory
    const rawRows = await this.storage.queryDatasetRaw(
      request.datasetId,
      schema.limits.maxLimit
    );

    const filtered = this.applyFilter(rawRows, request.filter); // MVP operators only
    const projectedFields =
      request.selectFields && request.selectFields.length > 0
        ? request.selectFields // Already validated
        : schema.visibleFields;

    const limitedRows = filtered.slice(0, effectiveLimit);
    const truncated = filtered.length > effectiveLimit;

    const projectedRows = this.projectRows(limitedRows, projectedFields);

    return {
      datasetId: request.datasetId,
      fields: projectedFields,
      rows: projectedRows,
      totalMatched: filtered.length,
      limitApplied: true,
      truncated,
    };
  }

  // internal helpers: computeEffectiveLimit, applyFilter (MVP only), projectRows
}
```

### 4.4 Adapters Layer

#### 4.4.1 Secondary Adapter: CSV Dataset Storage with Hot Reload

Responsibilities:

* Load initial config (JSON).
* For each dataset:

  * Validate explicit type definitions.
  * Load CSV file on-demand (not maintained in memory).
  * Support hot reload of configuration via file watching.
* Implement `DatasetStoragePort`.

**Hot Reload Clarification:** Hot reload applies to the configuration file only. CSV data is loaded on-demand from disk on every query, so CSV content changes are immediately visible without any reload mechanism. Only the in-memory schema structures need reloading when `datasets.json` changes.

Pseudo-init:

```ts
class CsvDatasetStorageAdapter implements DatasetStoragePort {
  private schemas: Map<DatasetId, DatasetSchema>;
  private configPath: string;
  private watcher: FileWatcher;

  constructor(private readonly configPath: string) {}

  async initialize(): Promise<void> {
    await this.loadConfiguration();
    this.setupFileWatcher();
  }

  private async loadConfiguration(): Promise<void> {
    const config = await this.loadJsonConfig(this.configPath);
    
    // Validate all datasets - fail fast on any error
    for (const datasetConfig of config.datasets) {
      this.validateDatasetConfig(datasetConfig); // Comprehensive validation
      const schema = this.buildSchema(datasetConfig); // No inference
      this.schemas.set(datasetConfig.id, schema);
    }
  }

  private setupFileWatcher(): void {
    // Watch config file and all CSV files
    // On change, trigger reload callback
  }

  async reload(): Promise<void> {
    this.schemas.clear();
    await this.loadConfiguration();
  }

  watchForChanges(callback: () => void): void {
    this.watcher.on('change', callback);
  }

  async loadSchema(datasetId: DatasetId): Promise<DatasetSchema> {
    const schema = this.schemas.get(datasetId);
    if (!schema) {
      throw new DatasetNotFoundError(datasetId);
    }
    return schema;
  }

  async listDatasetIds(): Promise<DatasetId[]> {
    return Array.from(this.schemas.keys());
  }

  async queryDatasetRaw(
    datasetId: DatasetId,
    limit?: number
  ): Promise<QueryResultRow[]> {
    const schema = await this.loadSchema(datasetId);
    // Load CSV on-demand - don't maintain in memory
    const rows = await this.loadCsvFile(schema);
    return limit ? rows.slice(0, limit) : rows;
  }

  async getRowByKey(
    datasetId: DatasetId,
    keyValue: unknown
  ): Promise<QueryResultRow | null> {
    const schema = await this.loadSchema(datasetId);
    const rows = await this.loadCsvFile(schema);
    const keyField = schema.keyField;
    return rows.find(row => row[keyField] === keyValue) ?? null;
  }

  private validateDatasetConfig(config: DatasetConfig): void {
    // Validate:
    // - path exists
    // - keyField is defined in fields
    // - visibleFields is present and non-empty
    // - limits.defaultLimit and limits.maxLimit are present
    // - all field types are valid MVP types (no array/unknown)
    // - enum fields have enumValues defined
    // Log comprehensive error messages, fail fast
  }

  private buildSchema(config: DatasetConfig): DatasetSchema {
    // Build schema from explicit config - no inference
    // All types must be defined
  }

  private async loadCsvFile(schema: DatasetSchema): Promise<QueryResultRow[]> {
    // Load and parse CSV
    // Type coercion based on explicit schema types
  }
}
```

Config type (JSON):

```ts
interface ProjectConfig {
  datasets: DatasetConfig[];
}
```

Example JSON config:

```json
{
  "datasets": [
    {
      "id": "effects",
      "path": "data/effects.csv",
      "displayName": "Effects",
      "description": "Core game/system effects",
      "keyField": "effect_id",
      "fields": [
        {
          "name": "effect_id",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "power_role",
          "type": "enum",
          "enumValues": ["offense", "defense", "movement", "utility"]
        },
        {
          "name": "rank_cost",
          "type": "number"
        },
        {
          "name": "tags",
          "type": "string"
        }
      ],
      "lookupKeys": ["name", "tags", "power_role"],
      "visibleFields": ["effect_id", "name", "power_role", "tags"],
      "limits": {
        "defaultLimit": 10,
        "maxLimit": 50
      }
    }
  ]
}
```

#### 4.4.2 Primary Adapter: MCP Server

* Implements the actual MCP server process.
* Maps MCP tool calls → `DatasetQueryPort` methods.
* Converts:

  * JSON params → `QueryRequest` + `FilterExpression` (MVP operators only).
  * `QueryResult` → MCP response JSON.
  * Errors → helpful MCP error messages with field lists when applicable.

Example tool implementations (pseudocode):

```ts
class McpDatasetToolsAdapter {
  constructor(private readonly queryPort: DatasetQueryPort) {}

  async listDatasetsTool() {
    const schemas = await this.queryPort.listDatasets();
    return schemas.map(schema => ({
      id: schema.id,
      displayName: schema.displayName,
      fields: schema.fields.map(f => ({
        name: f.name,
        type: f.type,
        isKey: f.isKey,
        isLookupKey: f.isLookupKey,
      })),
      defaultLimit: schema.limits.defaultLimit,
      maxLimit: schema.limits.maxLimit,
    }));
  }

  async describeDatasetTool(params: { datasetId: DatasetId }) {
    const schema = await this.queryPort.describeDataset(params.datasetId);
    return schema;
  }

  async queryDatasetTool(params: {
    datasetId: DatasetId;
    filter?: unknown;
    selectFields?: string[];
    limit?: number;
  }) {
    try {
      const filter = this.parseFilter(params.filter); // validate MVP AST
      const request: QueryRequest = {
        datasetId: params.datasetId,
        filter,
        selectFields: params.selectFields,
        limit: params.limit,
      };
      return await this.queryPort.queryDataset(request);
    } catch (error) {
      if (error instanceof InvalidFieldError) {
        // Include valid field names in error message
        throw new McpError(
          `Invalid field: ${error.fieldName}. Valid fields are: ${error.validFields.join(', ')}`
        );
      }
      throw error;
    }
  }

  async getByIdTool(params: {
    datasetId: DatasetId;
    id: unknown;
    selectFields?: string[];
  }) {
    try {
      return await this.queryPort.getById(
        params.datasetId,
        params.id,
        params.selectFields
      );
    } catch (error) {
      if (error instanceof InvalidFieldError) {
        throw new McpError(
          `Invalid field: ${error.fieldName}. Valid fields are: ${error.validFields.join(', ')}`
        );
      }
      throw error;
    }
  }

  // parseFilter ensures shape matches MVP FilterExpression type (eq, contains, and only)
}
```

---

## 5. Configuration Design

### 5.1 Config File Format

**MVP: JSON only**. YAML support deferred to post-MVP.

Location: `config/datasets.json`

**Required fields:**
- `id`: unique dataset identifier
- `path`: path to CSV file
- `keyField`: primary key field name
- `fields`: array of field definitions with explicit types
- `visibleFields`: explicit list (no defaults, required)
- `limits.defaultLimit` and `limits.maxLimit`: required per dataset

**Optional fields:**
- `displayName`: human-readable name
- `description`: dataset description
- `lookupKeys`: fields commonly used for filtering

### 5.2 Config Loading Flow

1. On server startup:

   * Load and parse `datasets.json`.
   * **Fail fast** on any validation error:

     * Unique `id` check
     * File existence check
     * `keyField` present in fields definition
     * `visibleFields` is non-empty
     * `limits` are defined
     * All field types are valid MVP types
     * Enum fields have `enumValues` defined
   * **Comprehensive logging** of all validation errors.
   * Build `DatasetSchema` per dataset using explicit types (no inference).

2. On failure:

   * Log detailed error with dataset id + specific validation issue.
   * Terminate startup (fail fast).

3. Hot reload:

   * Watch `datasets.json` and all CSV files.
   * On change, trigger reload.
   * Re-validate entire configuration.
   * If validation fails, log error but keep previous valid state.

---

## 6. Core Use Case Logic (Pseudocode Detail)

### 6.1 Filter Application (MVP Operators Only)

Domain function:

```ts
function applyFilter(
  rows: QueryResultRow[],
  filter?: FilterExpression
): QueryResultRow[] {
  if (!filter) return rows;

  return rows.filter(row => evaluateFilterExpression(row, filter));
}

function evaluateFilterExpression(
  row: QueryResultRow,
  filter: FilterExpression
): boolean {
  if (filter.type === 'compound') {
    // MVP: only 'and' compound
    if (filter.op === 'and') {
      return filter.filters.every(f => evaluateFilterExpression(row, f));
    }
    throw new InvalidFilterError(`Unsupported compound operator: ${filter.op}. MVP supports 'and' only.`);
  }

  const value = row[filter.field];

  switch (filter.op) {
    case 'eq':
      return value === filter.value;
    case 'contains':
      return containsValue(value, filter.value);
    default:
      throw new InvalidFilterError(
        `Unsupported operator: ${filter.op}. MVP supports 'eq' and 'contains' only.`
      );
  }
}

function containsValue(fieldValue: unknown, searchValue: unknown): boolean {
  if (typeof fieldValue === 'string' && typeof searchValue === 'string') {
    return fieldValue.includes(searchValue);
  }
  // Could extend for other types if needed
  return false;
}
```

### 6.2 Field Validation

```ts
class FieldValidator {
  validateFilterFields(filter: FilterExpression, schema: DatasetSchema): void {
    const fields = this.extractFilterFields(filter);
    const validFields = schema.fields.map(f => f.name);
    
    for (const field of fields) {
      if (!validFields.includes(field)) {
        throw new InvalidFieldError(field, validFields);
      }
    }
  }

  validateSelectFields(selectFields: FieldName[], schema: DatasetSchema): void {
    const validFields = schema.fields.map(f => f.name);
    
    for (const field of selectFields) {
      if (!validFields.includes(field)) {
        throw new InvalidFieldError(field, validFields);
      }
    }
  }

  private extractFilterFields(filter: FilterExpression): FieldName[] {
    if (filter.type === 'compound') {
      return filter.filters.flatMap(f => this.extractFilterFields(f));
    }
    return [filter.field];
  }
}
```

### 6.3 Projection

```ts
function projectRows(
  rows: QueryResultRow[],
  fields: FieldName[]
): QueryResultRow[] {
  return rows.map(row => {
    const projected: QueryResultRow = {};
    for (const field of fields) {
      projected[field] = row[field];
    }
    return projected;
  });
}
```

### 6.4 Limit Computation

```ts
function computeEffectiveLimit(
  datasetLimits: { defaultLimit: number; maxLimit: number },
  requested?: number
): number {
  if (!requested || requested <= 0) return datasetLimits.defaultLimit;
  return Math.min(requested, datasetLimits.maxLimit);
}
```

---

## 7. Error Handling Strategy

### 7.1 Domain Errors

Define specific error types:

* `DatasetNotFoundError(datasetId: string)`
* `InvalidFilterError(message: string, operator?: string)`
* `InvalidFieldError(fieldName: string, validFields: string[])`
* `ConfigError(message: string, datasetId?: string)`
* `MissingRequiredConfigError(field: string, datasetId: string)`

Use them in domain and use cases.

### 7.2 Adapter Translation

MCP adapter:

* Translate domain errors into:

  * MCP error codes / structured errors.
  * Helpful messages for the LLM:

    * "Dataset `X` does not exist. Call `list_datasets` to see available datasets."
    * "Invalid field `foo`. Valid fields for dataset `X` are: bar, baz, qux."
    * "Invalid filter operator `gt`. MVP supports `eq` and `contains` only."
    * "Configuration error in dataset `X`: missing required field `visibleFields`."

### 7.3 Configuration Validation

Comprehensive logging of all validation errors:

* Missing required fields
* Invalid file paths
* Invalid field types
* Missing enum values for enum fields
* Invalid key field references
* Empty visible fields

All errors logged with context (dataset ID, field name, specific issue).

Fail fast: terminate on any config validation error.

---

## 8. Observability & Token Monitoring

### 8.1 Basic Logging (MVP)

Log per request:

* Dataset id
* Tool name (`list_datasets`, `describe_dataset`, `query_dataset`, `get_by_id`)
* Number of rows returned
* Number of fields returned

Example log format:

```
[INFO] query_dataset: dataset=effects, rows=5, fields=4
[INFO] get_by_id: dataset=modifiers, rows=1, fields=3
```

### 8.2 Error Logging

Comprehensive error logging for:

* Configuration validation errors (startup)
* Query execution errors
* Invalid field references
* Filter validation errors
* File system errors (CSV loading, hot reload)

---

## 9. Testing Strategy

### 9.1 Unit Tests

* Domain:

  * Filter evaluation (MVP operators: `eq`, `contains`, `and`)
  * Projection logic
  * Limit computation
  * Field validation
* Use Cases:

  * Use mocked `DatasetStoragePort`.
  * Validate behavior for:

    * No filter
    * Simple filter (`eq`, `contains`)
    * Compound filter (`and`)
    * Over-limit requests
    * Invalid field references (should error)
    * Invalid operators (should error)

### 9.2 Integration Tests

* CSV Adapter:

  * Load config + CSV with explicit types
  * Validate schema building (no inference)
  * Validate `getRowByKey` correctness
  * Test hot reload mechanism
  * Test fail-fast validation
  * Test error messages for invalid configs

### 9.3 E2E Tests (Future)

* Boot full MCP server
* Call tools through the standard MCP client library
* Validate end-to-end scenario:

  * `list_datasets` → choose one → `describe_dataset` → `query_dataset` with MVP filters
  * Test `get_by_id` with valid and invalid IDs
  * Test invalid field error handling

---

## 10. Implementation Milestones

### Milestone 1: Skeleton & Config

* [ ] Create project structure respecting hex rules
* [ ] Define domain types and error types (MVP scope)
* [ ] Implement JSON config parsing with comprehensive validation
* [ ] Implement CSV loader without inference (explicit types only)
* [ ] Wire `CsvDatasetStorageAdapter` with fail-fast validation
* [ ] Implement `DatasetCatalogService`
* [ ] Implement `FieldValidator`

### Milestone 2: Core Use Cases

* [ ] Implement:

  * `ListDatasetsUseCase`
  * `DescribeDatasetUseCase`
  * `QueryDatasetUseCase` with MVP filter operators
  * `GetByIdUseCase`
* [ ] Implement filter logic (MVP operators only: `eq`, `contains`, `and`)
* [ ] Implement projection logic
* [ ] Implement field validation (error on invalid fields)
* [ ] Write domain unit tests
* [ ] Write use case unit tests with mocked ports

### Milestone 3: Hot Reload Support

* [ ] Implement file watcher for config and CSV files
* [ ] Implement reload mechanism in CSV adapter
* [ ] Test hot reload with valid config changes
* [ ] Test hot reload error handling (invalid configs)
* [ ] Ensure datasets are loaded on-demand, not kept in memory

### Milestone 4: MCP Adapter

* [ ] Implement MCP server wrapper
* [ ] Implement tools:

  * `list_datasets`
  * `describe_dataset`
  * `query_dataset` with MVP filter validation
  * `get_by_id`
* [ ] Map errors → helpful MCP error responses with field lists
* [ ] Implement basic logging (request, dataset, row/field counts)

### Milestone 5: Hardening & Testing

* [ ] Enforce per-dataset limits
* [ ] Add truncation flags in responses
* [ ] Integration tests with sample datasets
* [ ] Test fail-fast validation thoroughly
* [ ] Test field validation error messages
* [ ] Test MVP filter operator constraints
* [ ] Full test coverage: domain, use cases, integration

### Milestone 6: Documentation & Examples

* [ ] Docs: `docs/dev/mcp-data-catalog.md`
* [ ] Example JSON configs
* [ ] Example CSVs (dummy data)
* [ ] Document MVP vs post-MVP feature split
* [ ] Document hot reload behavior
* [ ] Document error messages and troubleshooting

### Post-MVP: Extension Phase

* [ ] Add extended filter operators: `neq`, `gt`, `gte`, `lt`, `lte`, `or`
* [ ] Add YAML config support
* [ ] Add sort functionality
* [ ] Add array field type support
* [ ] Enhanced logging and metrics
* [ ] Performance optimizations for large datasets

---

## 11. Key Decisions & Rationale

### 11.1 Simplified Filters (MVP)

**Decision**: Only `eq`, `contains`, and `and` compound for MVP.

**Rationale**: Reduces implementation complexity while still providing core filtering capability. Most lookup scenarios can be satisfied with exact match and substring search. Extended operators can be added incrementally in post-MVP phase.

### 11.2 Keep get_by_id Tool

**Decision**: Maintain dedicated `get_by_id` tool despite functional overlap with `query_dataset`.

**Rationale**: Provides clear semantic distinction for single-row lookups. Makes intent explicit in tool calls, improving code clarity and potentially enabling different optimization paths in the future.

### 11.3 Explicit Type Definitions

**Decision**: Require explicit type definitions in config, no automatic inference.

**Rationale**: Eliminates ambiguity and potential inference errors. Makes dataset schemas explicit and self-documenting. Simpler implementation without inference logic. Better for maintainability as schema is version-controlled.

### 11.4 Fail Fast Configuration

**Decision**: Fail fast on any config validation error at startup.

**Rationale**: Catches configuration issues immediately rather than at runtime. Ensures all datasets are valid before serving requests. Simpler error handling model. Forces correct configuration from the start.

### 11.5 JSON First, YAML Later

**Decision**: MVP uses JSON config format only, YAML support deferred to post-MVP.

**Rationale**: JSON requires no additional dependencies and is standard in Node ecosystem. Reduces initial implementation scope. YAML can be added later as a pure enhancement without affecting core functionality.

### 11.6 Hot Reload Without Memory Caching

**Decision**: Implement hot reload but load CSV data on-demand for each query, not cached in memory.

**Rationale**: Keeps memory footprint low, especially important for large datasets. Enables hot reload without complex cache invalidation logic. Simpler implementation. File system reads are fast enough for MVP use cases.

### 11.7 Required visibleFields

**Decision**: Make `visibleFields` required in config with no defaults.

**Rationale**: Forces conscious decisions about token budget. Makes data exposure explicit. Prevents accidental exposure of all fields. Better security and performance profile from the start.

### 11.8 Per-Dataset Limits Only

**Decision**: No system-wide default limits, all limits configured per dataset.

**Rationale**: Different datasets have different characteristics and use patterns. Explicit configuration prevents surprises. More flexible for diverse use cases. Forces consideration of appropriate limits per dataset.

### 11.9 Immediate Field Validation Errors

**Decision**: Error immediately on invalid field references with helpful messages listing valid fields.

**Rationale**: Fails fast on user errors. Provides clear, actionable feedback. Prevents confusing behavior from silently ignoring invalid fields. Better developer experience.

### 11.10 Full Test Coverage for MVP

**Decision**: Implement full test coverage including domain, use cases, and integration tests.

**Rationale**: Ensures quality from the start. Tests serve as documentation. Enables confident refactoring. Catches regressions early. Worth the upfront investment for a foundational system.

---

## 12. Future Considerations

### 12.1 Performance Optimization

For large datasets (>10K rows), consider:
- Implementing an LRU cache for recently queried datasets
- Adding indexes for commonly filtered fields
- Migrating to SQLite backend for better query performance

### 12.2 Advanced Features

Potential future enhancements beyond post-MVP:
- Pagination support for large result sets
- Aggregate functions (count, sum, avg, etc.)
- Join operations across datasets
- Computed/derived fields
- Data validation rules
- Write operations (create, update, delete)

### 12.3 Monitoring and Metrics

Future observability enhancements:
- Query performance metrics
- Dataset access patterns
- Token usage statistics
- Cache hit rates (if caching is added)
- Error rate tracking

---

## 13. Summary

This plan defines a focused MVP for a generic data catalog MCP server with clear boundaries:

**In Scope:**
- 4 essential MCP tools
- Simplified but functional filtering (eq, contains, and)
- JSON configuration with explicit typing
- Hot reload without memory caching
- Full test coverage
- Basic observability

**Out of Scope (Post-MVP):**
- Extended filter operators
- YAML configuration
- Sort functionality
- Array types
- Advanced caching strategies
- Enhanced metrics

The MVP provides a solid foundation for data catalog functionality while keeping implementation complexity manageable. Post-MVP phases can add sophistication incrementally based on real-world usage patterns and feedback.

---

## Appendix A: Revision History

This plan underwent one major revision cycle from v0.initial to v1.final.

### Changes from v0.initial to v1.mvp-scoped/v1.final

**Scope Reductions (MVP Focus):**
- Filter operators simplified from 7 to 2 (`eq`, `contains` only)
- Compound filters limited to `and` only (no `or`)
- Array and Unknown field types removed
- Sort functionality deferred to post-MVP
- YAML config support deferred to post-MVP

**Configuration Enhancements:**
- Made `visibleFields` required (no defaults)
- Made `limits` required per dataset
- Required explicit type definitions (no inference)
- Implemented fail-fast validation
- JSON-only format for MVP

**Architectural Additions:**
- Hot reload support for config and CSV files
- On-demand CSV loading (no memory caching)
- Field validation with immediate errors
- `FieldValidator` domain service

**Quality Improvements:**
- Full test coverage requirement (domain, use cases, integration)
- Comprehensive error logging
- Helpful error messages with field lists
- Post-MVP roadmap clearly defined

### Rationale for Changes

The revision process identified that the initial plan was too ambitious for an MVP. By simplifying the filter model, requiring explicit configuration, and deferring advanced features, the plan became more focused and implementable while still delivering core value. The hot reload feature was added to improve developer experience without adding memory management complexity.

### Clarification Process

The plan was refined through 12 structured clarification questions covering:
- Filter complexity
- Tool necessity (get_by_id)
- Type inference approach
- Error handling strategy
- Configuration format
- Default behaviors
- Feature prioritization
- Test coverage expectations
- Runtime flexibility
- Field validation approach

All user decisions were documented and incorporated into this final plan.

---

## Appendix B: Implementation Notes

**This plan is now the canonical specification for implementation.**

Key reminders for implementation:
1. Follow hexagonal architecture strictly - no domain dependencies on infrastructure
2. All configuration must be explicit - no magic defaults
3. Fail fast on errors - validate early and comprehensively
4. Test as you go - full coverage is required for MVP
5. Keep it simple - defer complexity to post-MVP unless absolutely needed

**Next Steps:**
1. Set up project structure according to Milestone 1
2. Implement domain layer (types, errors, validation)
3. Build CSV adapter with hot reload
4. Implement use cases with tests
5. Add MCP adapter layer
6. Document and test thoroughly

**Important:** Any significant deviations from this plan during implementation should be documented and may require a plan revision.
