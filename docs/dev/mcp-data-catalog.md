# MCP Data Catalog - Developer Documentation

**Version**: 1.0.0-mvp  
**Last Updated**: 2025-11-30  
**Architecture**: Hexagonal (Ports & Adapters)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Domain Model](#domain-model)
4. [Use Cases](#use-cases)
5. [Ports & Adapters](#ports--adapters)
6. [Key Concepts](#key-concepts)
7. [Extension Points](#extension-points)
8. [Code Examples](#code-examples)

---

## Overview

The MCP Data Catalog is a Model Context Protocol (MCP) server that provides AI assistants with structured access to tabular datasets. It allows querying CSV files through a unified interface with filtering, projection, and pagination capabilities.

**Key Features (MVP):**
- 4 MCP tools: `list_datasets`, `describe_dataset`, `query_dataset`, `get_by_id`
- CSV file support with hot reload
- Type-safe field validation (string, number, boolean, enum)
- MVP filtering: `eq`, `contains`, `and` operators
- Field projection and row limiting
- Fail-fast validation on startup

**Technology Stack:**
- TypeScript
- MCP SDK (@modelcontextprotocol/sdk)
- Zod (schema validation)
- Chokidar (file watching)
- Jest (testing)

---

## Architecture

This project follows **Hexagonal Architecture** (also known as Ports & Adapters), which isolates business logic from external concerns.

### Architectural Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Primary Adapters                         │
│  (Drive the application - entry points)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐                                           │
│  │ MCP Server   │ ← Primary Adapter                         │
│  │ (mcp-server) │   - Exposes 4 tools                       │
│  └──────┬───────┘   - Translates MCP requests               │
│         │           - Maps errors                            │
│         ↓                                                     │
├─────────────────────────────────────────────────────────────┤
│                     Primary Ports                            │
│  (Interfaces driven by external actors)                      │
├─────────────────────────────────────────────────────────────┤
│         │                                                     │
│         ↓                                                     │
│  ┌──────────────┐                                           │
│  │  Use Cases   │ ← Application Layer                       │
│  │              │   - ListDatasetsUseCase                   │
│  │              │   - DescribeDatasetUseCase                │
│  │              │   - QueryDatasetUseCase                   │
│  │              │   - GetByIdUseCase                        │
│  └──────┬───────┘                                           │
│         │                                                     │
│         ↓                                                     │
├─────────────────────────────────────────────────────────────┤
│                     Domain Layer                             │
│  (Pure business logic - no dependencies)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Entities   │  │    Value      │  │   Services   │     │
│  │              │  │   Objects     │  │              │     │
│  │ - DatasetCfg │  │ - DatasetId   │  │ - Catalog    │     │
│  │ - Schema     │  │ - FieldName   │  │ - Validator  │     │
│  │ - QueryReq   │  │ - FieldType   │  │ - Filter     │     │
│  │ - QueryRes   │  │               │  │ - Projection │     │
│  │ - Filter     │  │               │  │ - Limit      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│  ┌──────────────────────────────────────────────────┐      │
│  │              Domain Errors                        │      │
│  │  - DatasetNotFoundError                          │      │
│  │  - InvalidFieldError                             │      │
│  │  - InvalidFilterError                            │      │
│  │  - ConfigError                                   │      │
│  └──────────────────────────────────────────────────┘      │
│         │                                                     │
│         ↓                                                     │
├─────────────────────────────────────────────────────────────┤
│                    Secondary Ports                           │
│  (Interfaces to external systems)                            │
├─────────────────────────────────────────────────────────────┤
│         │                                                     │
│         ↓                                                     │
│  ┌──────────────┐                                           │
│  │DatasetStorage│ ← Port Interface                          │
│  │Port          │   - load(datasetId): Promise<Dataset>    │
│  └──────┬───────┘                                           │
│         │                                                     │
│         ↓                                                     │
├─────────────────────────────────────────────────────────────┤
│                   Secondary Adapters                         │
│  (Driven by the application - infrastructure)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ CSV Storage  │  │Config Loader │                        │
│  │ Adapter      │  │              │                        │
│  │              │  │- Load JSON   │                        │
│  │- Load CSV    │  │- Validate    │                        │
│  │- Parse rows  │  │- Hot reload  │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Flow

The architecture enforces strict dependency rules:

✅ **Allowed:**
- Adapters → Ports
- Ports → Use Cases
- Use Cases → Domain
- Domain → (nothing - pure)

❌ **Forbidden:**
- Domain → Use Cases
- Domain → Adapters
- Use Cases → Adapters directly
- Adapters → Domain directly

This ensures the core domain remains independent and testable.

---

## Domain Model

The domain layer contains pure business logic with zero external dependencies.

### Entities

**DatasetConfig**
- Represents a configured dataset
- Properties: `id`, `schema`, `lookupKey`, `limits`
- Immutable after creation

**DatasetSchema**
- Defines dataset structure
- Properties: `fields`, `visibleFields`
- Validates field definitions

**QueryRequest**
- Encapsulates query parameters
- Properties: `datasetId`, `filters`, `fields`, `limit`
- Validated before execution

**QueryResult**
- Response wrapper
- Properties: `rows`, `fields`, `rowsReturned`, `totalRows`, `truncated`
- Includes pagination metadata

**FilterExpression**
- Represents filter conditions
- MVP operators: `eq`, `contains`, `and`
- Recursive structure for `and` operator

### Value Objects

**DatasetId**
- Strongly-typed dataset identifier
- Validates format on creation
- Immutable

**FieldName**
- Type-safe field name
- Ensures non-empty strings
- Immutable

**FieldType**
- Enum of supported types
- Values: `string`, `number`, `boolean`, `enum`
- Used for validation

### Domain Services

**DatasetCatalogService**
- Manages dataset registry
- Operations: `register`, `list`, `get`, `clear`
- In-memory catalog with atomic updates

**FieldValidator**
- Validates field values against schema
- Type checking and enum validation
- Returns detailed error messages

**FilterService**
- Evaluates filter expressions
- Implements MVP operators
- Handles nested `and` conditions

**ProjectionService**
- Projects visible fields
- Handles field selection
- Maintains field order

**LimitService**
- Applies row limits
- Tracks truncation
- Per-dataset configuration

---

## Use Cases

Use cases orchestrate domain logic without knowledge of infrastructure.

### ListDatasetsUseCase

**Purpose:** Retrieve all configured datasets

**Flow:**
1. Query `DatasetCatalogService` for all datasets
2. Map to simple list of IDs and names
3. Return to caller

**No Dependencies:** Uses only domain services

### DescribeDatasetUseCase

**Purpose:** Get schema information for a dataset

**Flow:**
1. Validate dataset exists in catalog
2. Retrieve schema definition
3. Return field list with types and constraints
4. Throw `DatasetNotFoundError` if not found

**Port Dependencies:** None (uses catalog only)

### QueryDatasetUseCase

**Purpose:** Query dataset with filters and projections

**Flow:**
1. Validate dataset exists
2. Load data via `DatasetStoragePort`
3. Apply filters using `FilterService`
4. Apply projection using `ProjectionService`
5. Apply limits using `LimitService`
6. Return `QueryResult` with metadata

**Port Dependencies:** 
- `DatasetStoragePort` (for loading data)

**Error Handling:**
- `DatasetNotFoundError` - dataset doesn't exist
- `InvalidFieldError` - field validation fails
- `InvalidFilterError` - filter parsing fails

### GetByIdUseCase

**Purpose:** Retrieve a single row by lookup key

**Flow:**
1. Validate dataset exists and has lookup key
2. Load data via `DatasetStoragePort`
3. Find matching row
4. Validate and project visible fields
5. Return row or null

**Port Dependencies:**
- `DatasetStoragePort` (for loading data)

---

## Ports & Adapters

### Secondary Port: DatasetStoragePort

**Interface:**
```typescript
export interface DatasetStoragePort {
  load(datasetId: DatasetId): Promise<Record<string, unknown>[]>;
}
```

**Responsibility:** Load raw dataset rows

**Current Implementations:**
- `CsvStorageAdapter` - Loads CSV files

### Primary Adapter: MCP Server

**Location:** `src/adapters/primary/mcp/`

**Components:**

1. **mcp-server.ts** - Main server setup and tool registration
2. **Tools:**
   - `list-datasets-tool.ts`
   - `describe-dataset-tool.ts`
   - `query-dataset-tool.ts`
   - `get-by-id-tool.ts`
3. **Utilities:**
   - `filter-parser.ts` - Parse filter JSON to domain objects
   - `error-mapper.ts` - Map domain errors to MCP responses
   - `logger.ts` - Structured logging

**Responsibilities:**
- Translate MCP requests to use case calls
- Validate input parameters
- Map domain errors to user-friendly messages
- Provide tool schemas

### Secondary Adapter: CSV Storage

**Location:** `src/adapters/secondary/csv/`

**Implementation:** `CsvStorageAdapter`

**Features:**
- On-demand CSV loading (no caching)
- Atomic hot reload support
- Proper error handling
- Type inference from schema

**Key Methods:**
- `load(datasetId)` - Load and parse CSV file
- `reload()` - Atomically swap configuration

### Secondary Adapter: Config Loader

**Location:** `src/adapters/secondary/config/`

**Components:**

1. **config-loader.ts** - Loads and watches JSON config
2. **config-schema.ts** - Zod schema for validation

**Features:**
- Fail-fast validation on startup
- Hot reload with file watching (chokidar)
- Atomic updates on valid config changes
- Preserves state on invalid config

---

## Key Concepts

### What is a Dataset?

A dataset is a tabular data source (CSV file) with:
- Unique identifier
- Defined schema (field names and types)
- Optional lookup key for get-by-id queries
- Row limits and visible fields

Example dataset config:
```json
{
  "id": "users",
  "name": "User Directory",
  "schema": {
    "fields": [
      { "name": "id", "type": "number", "required": true },
      { "name": "name", "type": "string", "required": true },
      { "name": "email", "type": "string", "required": true },
      { "name": "role", "type": "enum", "values": ["admin", "user"] }
    ],
    "visibleFields": ["id", "name", "email", "role"]
  },
  "source": {
    "type": "csv",
    "path": "./data/users.csv"
  },
  "lookupKey": "id",
  "limits": {
    "maxRows": 100,
    "defaultRows": 20
  }
}
```

### How Filtering Works (MVP)

The MVP supports three filter operators:

**1. Equal (`eq`)**
```json
{
  "field": "role",
  "operator": "eq",
  "value": "admin"
}
```
Matches rows where field exactly equals value.

**2. Contains (`contains`)**
```json
{
  "field": "name",
  "operator": "contains",
  "value": "john"
}
```
Case-insensitive substring match.

**3. And (`and`)**
```json
{
  "operator": "and",
  "conditions": [
    { "field": "role", "operator": "eq", "value": "admin" },
    { "field": "name", "operator": "contains", "value": "john" }
  ]
}
```
All conditions must be true.

**Post-MVP Operators:** `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `or`

### How Projections Work

Projections control which fields are returned:

**All visible fields (default):**
```typescript
// No fields specified = all visibleFields
{ datasetId: "users" }
// Returns: id, name, email, role
```

**Specific fields:**
```typescript
{ datasetId: "users", fields: ["name", "email"] }
// Returns: name, email
```

**Rules:**
- Can only project fields in `visibleFields`
- Invalid fields throw `InvalidFieldError`
- Order is preserved

### How Limits Work

Limits prevent excessive data transfer:

**Per-Dataset Configuration:**
```json
{
  "limits": {
    "maxRows": 100,      // Hard limit
    "defaultRows": 20    // Used when no limit specified
  }
}
```

**Request-Time Override:**
```typescript
{ datasetId: "users", limit: 50 }
// Returns up to 50 rows (≤ maxRows)
```

**Truncation Indicator:**
```json
{
  "truncated": true,
  "rowsReturned": 100,
  "totalRows": 500
}
```

### Hot Reload Behavior

**What Triggers Reload:**
- Config file (`datasets.json`) changes detected
- Validated automatically on change

**Reload Process:**
1. Detect file change (chokidar)
2. Parse and validate new config
3. If valid: atomically swap configuration
4. If invalid: preserve current config, log error

**Guarantees:**
- No downtime during reload
- Atomic updates (all-or-nothing)
- Invalid configs don't break running system
- CSV files loaded on-demand (no stale cache)

**Reload Time:** 1-3ms (measured in integration tests)

---

## Extension Points

The hexagonal architecture makes extension straightforward:

### Adding New Data Sources

1. Implement `DatasetStoragePort`
2. Add source type to config schema
3. Register in dependency injection

Example: PostgreSQL adapter
```typescript
export class PostgresStorageAdapter implements DatasetStoragePort {
  async load(datasetId: DatasetId): Promise<Record<string, unknown>[]> {
    // Query database
    // Map to domain format
  }
}
```

### Adding New Filter Operators

1. Extend `FilterExpression` entity
2. Update `FilterService` evaluation logic
3. Update filter parser in MCP adapter
4. Add validation in config schema

### Adding New Field Types

1. Add to `FieldType` enum
2. Update `FieldValidator` logic
3. Update config schema
4. Add test cases

### Adding New MCP Tools

1. Create tool file in `src/adapters/primary/mcp/tools/`
2. Implement tool handler
3. Define Zod schema
4. Register in `mcp-server.ts`
5. Add integration tests

---

## Code Examples

### Adding a New Dataset

**1. Create CSV file** (`data/books.csv`):
```csv
id,title,author,genre,year
1,1984,George Orwell,dystopian,1949
2,Brave New World,Aldous Huxley,dystopian,1932
```

**2. Update config** (`config/datasets.json`):
```json
{
  "datasets": [
    {
      "id": "books",
      "name": "Book Catalog",
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "required": true },
          { "name": "title", "type": "string", "required": true },
          { "name": "author", "type": "string", "required": true },
          { "name": "genre", "type": "enum", "values": ["dystopian", "scifi", "fantasy"] },
          { "name": "year", "type": "number" }
        ],
        "visibleFields": ["id", "title", "author", "genre", "year"]
      },
      "source": {
        "type": "csv",
        "path": "./data/books.csv"
      },
      "lookupKey": "id",
      "limits": {
        "maxRows": 50,
        "defaultRows": 10
      }
    }
  ]
}
```

**3. Hot reload automatically picks up changes!**

### Querying a Dataset

**List all datasets:**
```typescript
const result = await listDatasetsUseCase.execute();
// Returns: [{ id: "books", name: "Book Catalog" }, ...]
```

**Describe dataset:**
```typescript
const result = await describeDatasetUseCase.execute("books");
// Returns schema with field definitions
```

**Query with filter:**
```typescript
const result = await queryDatasetUseCase.execute({
  datasetId: new DatasetId("books"),
  filters: {
    field: "genre",
    operator: "eq",
    value: "dystopian"
  },
  limit: 10
});
// Returns rows matching filter
```

**Get by ID:**
```typescript
const result = await getByIdUseCase.execute({
  datasetId: new DatasetId("books"),
  id: "1"
});
// Returns single book with id=1
```

### Filter Examples

**Simple equality:**
```json
{
  "datasetId": "books",
  "filters": {
    "field": "author",
    "operator": "eq",
    "value": "George Orwell"
  }
}
```

**Contains search:**
```json
{
  "datasetId": "books",
  "filters": {
    "field": "title",
    "operator": "contains",
    "value": "world"
  }
}
```

**Multiple conditions:**
```json
{
  "datasetId": "books",
  "filters": {
    "operator": "and",
    "conditions": [
      { "field": "genre", "operator": "eq", "value": "dystopian" },
      { "field": "year", "operator": "eq", "value": 1949 }
    ]
  }
}
```

---

## Testing Strategy

### Unit Tests

**Domain Layer:**
- Pure business logic
- No mocks required
- Fast execution

**Use Cases:**
- Mock ports only
- Test orchestration logic
- Verify error handling

**Coverage:** 100% statement coverage achieved

### Integration Tests

**MCP Tools:**
- Full request/response cycle
- Real CSV files
- Validates tool schemas

**Hot Reload:**
- Config file watching
- Atomic updates
- Error scenarios

**Coverage:** All 4 tools + hot reload tested

### Test Organization

```
test/
├── unit/
│   ├── domain/
│   │   ├── services/
│   │   └── value-objects/
│   └── use-cases/
└── integration/
    ├── mcp-tools.test.ts
    ├── config-hot-reload.test.ts
    ├── csv-hot-visibility.test.ts
    └── limits-and-truncation.test.ts
```

---

## Performance Characteristics

**Config Reload:** 1-3ms  
**CSV Load:** ~5-10ms for 1000 rows  
**Query with Filter:** ~1-2ms for 1000 rows  
**Memory Usage:** O(n) where n = dataset size (no caching)

**Scalability Notes:**
- Current implementation loads entire CSV into memory
- Suitable for datasets up to ~100K rows
- For larger datasets, consider streaming or database backends

---

## Development Setup

See [README.md](../../README.md) for installation and development instructions.

**Quick Start:**
```bash
npm install
npm run build
npm test
npm run dev
```

---

## Contributing

When extending the system:

1. Follow hexagonal architecture principles
2. Keep domain layer pure (no dependencies)
3. Add tests for new functionality
4. Update documentation
5. Maintain backward compatibility

See project plan for post-MVP roadmap.

---

## References

- [Project Plan](../project-plans/project-plan-v1.final.md)
- [Phase Execution Docs](../execution/)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
