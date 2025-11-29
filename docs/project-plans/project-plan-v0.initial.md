# Generic Data Catalog MCP Server – Project Plan

## 1. Purpose and Scope

### 1.1 Goal

Build a **generic, hex-architected MCP server** that exposes structured, tabular datasets (initially CSV) through a small, well-defined set of MCP tools.

It should:

* Be **domain-agnostic** (usable for M&M, other TTRPG tools, and non-game projects).
* Provide **indexed, filtered lookups** over datasets.
* Control **token footprint** via projections and limits.
* Be easy to extend to new backends (CSV → SQLite → whatever) without breaking the MCP surface.

### 1.2 Non-Goals

* No hard-coding Mutants & Masterminds semantics into the server.
* No heavy GUI / API beyond MCP tools.
* No full SQL engine or arbitrary query language (filters are constrained and structured).
* No “smart” vector search / RAG here; this is deterministic data access plumbing.

---

## 2. Functional Requirements

### 2.1 High-Level Features

The MCP server must expose at least these tools:

1. **`list_datasets`**

   * Returns the list of available datasets and short metadata.

2. **`describe_dataset`**

   * Input: `datasetName`
   * Returns schema info: fields, types, lookup_keys, visible_fields, limits.

3. **`query_dataset`**

   * Inputs:

     * `datasetName`
     * `filters` (structured)
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

     * Single row or a “not found” error.

### 2.2 Filtering Model

* Filters are a **limited AST**, not arbitrary text:

```json
{
  "op": "and",
  "filters": [
    { "field": "tags", "op": "contains", "value": "fire" },
    { "field": "power_role", "op": "eq", "value": "offense" }
  ]
}
```

Supported operators (MVP):

* `eq`, `neq`
* `contains` (for list / string fields)
* `gt`, `gte`, `lt`, `lte` (for numeric / lex ordering)
* Logical `and` / `or`

### 2.3 Token Budget Controls

Server-side controls (LLM-facing):

* **Max rows per query** (configurable, e.g. 20).
* **Max fields per row** (via `visible_fields` default).
* **Truncation flags** in responses when limits are applied.
* Optional **approximate payload size estimate** (characters) in response for future budgeting.

---

## 3. Constraints

* **Language:** TypeScript, Node.
* **Architecture:** Hexagonal (Domain / Use Cases / Ports / Adapters).
* **Initial storage backend:** Local CSV files.
* **Config:** YAML or JSON file defining datasets.
* **Runtime:** MCP-compliant server process (Node-based).

---

## 4. Architecture

Follow the workspace rules you already set: domain purity, ports, adapters, etc.

### 4.1 Domain Layer

Core domain types:

* `DatasetId` (string)
* `FieldName` (string)
* `FieldType` (enum: `string`, `number`, `boolean`, `array`, `enum`, `unknown`)
* `DatasetSchema`
* `DatasetConfig`
* `FilterExpression` (AST)
* `QueryRequest`
* `QueryResult`
* Domain-specific errors (`DatasetNotFoundError`, `InvalidFilterError`, `ConfigError`, etc.)

*No TypeScript imports from fs, HTTP, etc.*

#### 4.1.1 Domain Model Sketch

Pseudo-types:

```ts
type DatasetId = string;
type FieldName = string;

enum FieldType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Enum = 'enum',
  Unknown = 'unknown',
}

interface DatasetField {
  name: FieldName;
  type: FieldType;
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
  visibleFields: FieldName[];
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
  lookupKeys: FieldName[];
  visibleFields: FieldName[];
  limits?: {
    defaultLimit?: number;
    maxLimit?: number;
  };
}
```

Filter AST:

```ts
type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';

interface FieldFilter {
  type: 'field';
  field: FieldName;
  op: FilterOp;
  value: unknown;
}

interface CompoundFilter {
  type: 'compound';
  op: 'and' | 'or';
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

### 4.2 Ports (Interfaces)

#### 4.2.1 Secondary Ports (Driven)

1. **`DatasetStoragePort`**

   * Contract for “read rows from dataset”

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
}
```

> `queryDatasetRaw` returns full rows; domain handles filtering and projection.

2. (Optional future) `DatasetMetadataPort` if you ever externalize config.

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
* Domain filtering logic
* Limits / projections

Example pseudocode:

```ts
class QueryDatasetUseCase {
  constructor(
    private readonly storage: DatasetStoragePort,
    private readonly catalog: DatasetCatalogService
  ) {}

  async execute(request: QueryRequest): Promise<QueryResult> {
    const schema = await this.catalog.getSchema(request.datasetId);

    const effectiveLimit = this.computeEffectiveLimit(
      schema.limits,
      request.limit
    );

    const rawRows = await this.storage.queryDatasetRaw(
      request.datasetId,
      schema.limits.maxLimit
    );

    const filtered = this.applyFilter(rawRows, request.filter);
    const projectedFields =
      request.selectFields && request.selectFields.length > 0
        ? this.validateSelectFields(schema, request.selectFields)
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

  // internal helpers: computeEffectiveLimit, applyFilter, validateSelectFields, projectRows
}
```

### 4.4 Adapters Layer

#### 4.4.1 Secondary Adapter: CSV Dataset Storage

Responsibilities:

* Load initial config (YAML/JSON).
* For each dataset:

  * Load CSV file.
  * Optionally infer basic schema (field types).
* Implement `DatasetStoragePort`.

Pseudo-init:

```ts
class CsvDatasetStorageAdapter implements DatasetStoragePort {
  private schemas: Map<DatasetId, DatasetSchema>;
  private data: Map<DatasetId, QueryResultRow[]>;

  constructor(private readonly config: ProjectConfig) {}

  async initialize(): Promise<void> {
    for (const datasetConfig of this.config.datasets) {
      const rows = await this.loadCsv(datasetConfig.path);
      const schema = this.inferSchema(datasetConfig, rows);
      this.schemas.set(datasetConfig.id, schema);
      this.data.set(datasetConfig.id, rows);
    }
  }

  async loadSchema(datasetId: DatasetId): Promise<DatasetSchema> {
    const schema = this.schemas.get(datasetId);
    if (!schema) throw new DatasetNotFoundError(datasetId);
    return schema;
  }

  async listDatasetIds(): Promise<DatasetId[]> {
    return Array.from(this.schemas.keys());
  }

  async queryDatasetRaw(
    datasetId: DatasetId,
    limit?: number
  ): Promise<QueryResultRow[]> {
    const rows = this.data.get(datasetId);
    if (!rows) throw new DatasetNotFoundError(datasetId);
    return limit ? rows.slice(0, limit) : rows;
  }

  async getRowByKey(
    datasetId: DatasetId,
    keyValue: unknown
  ): Promise<QueryResultRow | null> {
    const schema = await this.loadSchema(datasetId);
    const rows = this.data.get(datasetId) ?? [];
    const keyField = schema.keyField;
    return rows.find(row => row[keyField] === keyValue) ?? null;
  }

  // loadCsv, inferSchema helpers...
}
```

Config type:

```ts
interface ProjectConfig {
  datasets: DatasetConfig[];
}
```

#### 4.4.2 Primary Adapter: MCP Server

* Implements the actual MCP server process.
* Maps MCP tool calls → `DatasetQueryPort` methods.
* Converts:

  * JSON params → `QueryRequest` + `FilterExpression`.
  * `QueryResult` → MCP response JSON.

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
    return schema; // or a trimmed version if needed
  }

  async queryDatasetTool(params: {
    datasetId: DatasetId;
    filter?: unknown;
    selectFields?: string[];
    limit?: number;
  }) {
    const filter = this.parseFilter(params.filter); // validate AST
    const request: QueryRequest = {
      datasetId: params.datasetId,
      filter,
      selectFields: params.selectFields,
      limit: params.limit,
    };
    return this.queryPort.queryDataset(request);
  }

  async getByIdTool(params: {
    datasetId: DatasetId;
    id: unknown;
    selectFields?: string[];
  }) {
    return this.queryPort.getById(
      params.datasetId,
      params.id,
      params.selectFields
    );
  }

  // parseFilter ensures shape matches FilterExpression type
}
```

---

## 5. Configuration Design

### 5.1 Config File Format

Likely one top-level config file: `config/datasets.yaml`:

```yaml
datasets:
  - id: effects
    path: data/effects.csv
    displayName: "Effects"
    description: "Core game/system effects"
    keyField: effect_id
    lookupKeys:
      - name
      - tags
      - power_role
    visibleFields:
      - effect_id
      - name
      - power_role
      - tags
    limits:
      defaultLimit: 10
      maxLimit: 50

  - id: modifiers
    path: data/modifiers.csv
    keyField: modifier_id
    lookupKeys:
      - name
      - type
      - tags
    visibleFields:
      - modifier_id
      - name
      - type
      - tags
```

### 5.2 Config Loading Flow

1. On server startup:

   * Load and parse `datasets.yaml`.
   * Validate:

     * Unique `id`.
     * Files exist.
     * `keyField` present in header.
   * Load CSV rows.
   * Infer field types (best-effort).
   * Build `DatasetSchema` per dataset.

2. On failure:

   * Log error with dataset id + reason.
   * Either:

     * Fail fast (MVP), or
     * Skip misconfigured datasets and continue with rest.

---

## 6. Core Use Case Logic (Pseudocode Detail)

### 6.1 Filter Application

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
    if (filter.op === 'and') {
      return filter.filters.every(f => evaluateFilterExpression(row, f));
    } else {
      return filter.filters.some(f => evaluateFilterExpression(row, f));
    }
  }

  const value = row[filter.field];

  switch (filter.op) {
    case 'eq':
      return value === filter.value;
    case 'neq':
      return value !== filter.value;
    case 'gt':
      return compareValues(value, filter.value) > 0;
    case 'gte':
      return compareValues(value, filter.value) >= 0;
    case 'lt':
      return compareValues(value, filter.value) < 0;
    case 'lte':
      return compareValues(value, filter.value) <= 0;
    case 'contains':
      return containsValue(value, filter.value);
    default:
      throw new InvalidFilterError(`Unsupported operator: ${filter.op}`);
  }
}
```

### 6.2 Projection

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

### 6.3 Limit Computation

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

* `DatasetNotFoundError`
* `InvalidFilterError`
* `InvalidSelectFieldsError`
* `ConfigError`

Use them in domain and use cases.

### 7.2 Adapter Translation

MCP adapter:

* Translate domain errors into:

  * MCP error codes / structured errors.
  * Helpful short messages for the LLM:

    * “Dataset `X` does not exist. Call `list_datasets` first.”
    * “Field `foo` is not valid. Valid fields are: …”

---

## 8. Observability & Token Monitoring

MVP-level observability:

* Log per request:

  * Dataset id
  * Number of rows returned
  * Number of fields
  * Approximate payload size: `JSON.stringify(response).length`
* Keep a simple counter / histogram in-memory (optional) for debug.

Later you can export to metrics if you want.

---

## 9. Testing Strategy

### 9.1 Unit Tests

* Domain:

  * Filter evaluation (AST → row match).
  * Projection logic.
  * Limit computation.
* Use Cases:

  * Use mocked `DatasetStoragePort`.
  * Validate behavior for:

    * No filter.
    * Simple filter.
    * Compound filter.
    * Over-limit requests.

### 9.2 Integration Tests

* CSV Adapter:

  * Load config + CSV.
  * Validate schema inference.
  * Validate `getRowByKey` correctness.

* MCP Adapter:

  * Use a test harness to call tools directly.
  * Assert response shape.

### 9.3 E2E (Optional at First)

* Boot full MCP server.
* Call tools through the standard MCP client library.
* Validate end-to-end scenario:

  * `list_datasets` → choose one → `describe` → `query_dataset`.

---

## 10. Implementation Milestones

### Milestone 1: Skeleton & Config

* [ ] Create project structure respecting hex rules.
* [ ] Define domain types and error types.
* [ ] Implement config parsing (`datasets.yaml`).
* [ ] Implement CSV loader and simple schema inference.
* [ ] Wire `CsvDatasetStorageAdapter` and `DatasetCatalogService`.

### Milestone 2: Core Use Cases

* [ ] Implement:

  * `ListDatasetsUseCase`
  * `DescribeDatasetUseCase`
  * `QueryDatasetUseCase`
  * `GetByIdUseCase`
* [ ] Implement filter and projection logic.
* [ ] Write unit tests.

### Milestone 3: MCP Adapter

* [ ] Implement MCP server wrapper.
* [ ] Implement tools:

  * `list_datasets`
  * `describe_dataset`
  * `query_dataset`
  * `get_by_id`
* [ ] Map errors → MCP error responses.

### Milestone 4: Hardening & Token Controls

* [ ] Enforce per-dataset limits.
* [ ] Add truncation flags in responses.
* [ ] Add logging for approximate payload size.
* [ ] Integration tests with sample datasets.

### Milestone 5: Quality & Extensions

* [ ] Docs: `docs/dev/mcp-data-catalog.md`
* [ ] Example configs and CSVs (dummy data).
* [ ] Optional:

  * Add `sort` parameter to `query_dataset`.
  * Add simple enum type support in schema.
