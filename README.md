# MCP Data Catalog

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-156%20passing-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25%20stmt-brightgreen.svg)]()

A Model Context Protocol (MCP) server that provides AI assistants with structured access to tabular datasets from CSV files. Query, filter, and retrieve data through a clean, type-safe interface.

## Features (MVP)

✅ **4 MCP Tools**
- `list_datasets` - List all available datasets
- `describe_dataset` - Get schema and field information
- `query_dataset` - Query with filters, projections, and limits
- `get_by_id` - Retrieve specific row by lookup key

✅ **Type-Safe Schema**
- String, number, boolean, and enum field types
- Field validation and type checking
- Required field enforcement

✅ **Filtering (MVP)**
- `eq` (equals)
- `contains` (case-insensitive substring)
- `and` (multiple conditions)

✅ **Smart Limits**
- Per-dataset row limits
- Truncation indicators
- Configurable defaults

✅ **Hot Reload**
- Config changes apply automatically (1-3ms)
- No server restart needed
- Invalid configs are rejected safely

✅ **Stable MVP**
- Hexagonal architecture
- Comprehensive test coverage
- Type-safe implementation
- Production-quality error handling

---

## Quick Start

### 1. Install

```bash
npm install
npm run build
```

### 2. Configure

Copy an example configuration:

```bash
cp examples/config/typical.json config/datasets.json
```

Or create your own:

```json
{
  "datasets": [
    {
      "id": "users",
      "name": "User Directory",
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "required": true },
          { "name": "name", "type": "string", "required": true },
          { "name": "email", "type": "string", "required": true },
          { "name": "role", "type": "enum", "values": ["admin", "user", "guest"] }
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
  ]
}
```

### 3. Run

```bash
npm run dev
```

The server starts on stdio and exposes 4 MCP tools.

---

## Usage

### MCP Client Configuration

Add to your MCP client config (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "catalog": {
      "command": "node",
      "args": ["/path/to/catalog-mcp/dist/index.js"],
      "env": {
        "CONFIG_PATH": "/path/to/config/datasets.json"
      }
    }
  }
}
```

> **Note:** Replace `/path/to/...` with your actual local file paths. The MCP server runs as a Node.js process and reads the `CONFIG_PATH` environment variable at startup.

### Available Tools

#### 1. list_datasets

List all configured datasets.

**Request:**
```json
{
  "tool": "list_datasets"
}
```

**Response:**
```json
{
  "datasets": [
    {
      "id": "users",
      "name": "User Directory"
    },
    {
      "id": "products",
      "name": "Product Catalog"
    }
  ]
}
```

#### 2. describe_dataset

Get detailed schema information for a dataset.

**Request:**
```json
{
  "tool": "describe_dataset",
  "arguments": {
    "datasetId": "users"
  }
}
```

**Response:**
```json
{
  "id": "users",
  "name": "User Directory",
  "fields": [
    {
      "name": "id",
      "type": "number",
      "required": true
    },
    {
      "name": "name",
      "type": "string",
      "required": true
    },
    {
      "name": "role",
      "type": "enum",
      "values": ["admin", "user", "guest"]
    }
  ],
  "lookupKey": "id",
  "limits": {
    "maxRows": 100,
    "defaultRows": 20
  }
}
```

#### 3. query_dataset

Query a dataset with optional filters, field projection, and limits.

**Simple Query:**
```json
{
  "tool": "query_dataset",
  "arguments": {
    "datasetId": "users",
    "limit": 10
  }
}
```

**With Filter:**
```json
{
  "tool": "query_dataset",
  "arguments": {
    "datasetId": "users",
    "filters": {
      "field": "role",
      "operator": "eq",
      "value": "admin"
    },
    "limit": 10
  }
}
```

**With Multiple Filters:**
```json
{
  "tool": "query_dataset",
  "arguments": {
    "datasetId": "users",
    "filters": {
      "operator": "and",
      "conditions": [
        { "field": "role", "operator": "eq", "value": "admin" },
        { "field": "name", "operator": "contains", "value": "smith" }
      ]
    }
  }
}
```

**With Field Projection:**
```json
{
  "tool": "query_dataset",
  "arguments": {
    "datasetId": "users",
    "fields": ["id", "name"],
    "limit": 10
  }
}
```

**Response:**
```json
{
  "rows": [
    { "id": 1, "name": "Alice Smith", "email": "alice@example.com", "role": "admin" },
    { "id": 6, "name": "Frank Miller", "email": "frank@example.com", "role": "admin" }
  ],
  "fields": ["id", "name", "email", "role"],
  "rowsReturned": 2,
  "totalRows": 2,
  "truncated": false
}
```

#### 4. get_by_id

Retrieve a single row by its lookup key.

**Request:**
```json
{
  "tool": "get_by_id",
  "arguments": {
    "datasetId": "users",
    "id": "1"
  }
}
```

**Response:**
```json
{
  "row": {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "role": "admin"
  }
}
```

If not found:
```json
{
  "row": null
}
```

---

## Filter Operators

The MVP supports three operators:

### eq (equals)
Exact match (case-sensitive for strings).

```json
{
  "field": "role",
  "operator": "eq",
  "value": "admin"
}
```

### contains (substring)
Case-insensitive substring search.

```json
{
  "field": "name",
  "operator": "contains",
  "value": "smith"
}
```

### and (conjunction)
All conditions must be true.

```json
{
  "operator": "and",
  "conditions": [
    { "field": "role", "operator": "eq", "value": "admin" },
    { "field": "active", "operator": "eq", "value": true }
  ]
}
```

### Filter Schema

All filter expressions follow this canonical JSON structure:

**Simple filter:**
```json
{
  "field": "fieldName",
  "operator": "eq" | "contains",
  "value": any
}
```

**Compound filter (and):**
```json
{
  "operator": "and",
  "conditions": [
    { "field": "...", "operator": "...", "value": ... },
    { "field": "...", "operator": "...", "value": ... }
  ]
}
```

**Post-MVP:** Additional operators coming (`ne`, `gt`, `gte`, `lt`, `lte`, `in`, `or`) using the same structure.

---

## Configuration

### Dataset Structure

```json
{
  "datasets": [
    {
      "id": "string",              // Unique identifier
      "name": "string",            // Display name
      "schema": {
        "fields": [                // Field definitions
          {
            "name": "string",      // Field name (matches CSV header)
            "type": "string",      // string | number | boolean | enum
            "required": boolean,   // Optional, default: false
            "values": ["..."]      // Required for enum type
          }
        ],
        "visibleFields": ["..."]   // Fields accessible in queries
      },
      "source": {
        "type": "csv",             // Only CSV in MVP
        "path": "string"           // Relative path to CSV file
      },
      "lookupKey": "string",       // Optional, field name for get_by_id
      "limits": {
        "maxRows": number,         // Hard limit
        "defaultRows": number      // Default when not specified
      }
    }
  ]
}
```

### Field Types

| Type | Description | Example Values |
|------|-------------|----------------|
| `string` | Text data | `"Alice"`, `"alice@example.com"` |
| `number` | Numeric data | `42`, `99.99`, `-5` |
| `boolean` | True/false | `true`, `false` |
| `enum` | Predefined values | `"admin"` (must be in `values` array) |

### Configuration Format

Configuration uses **JSON** format. This is the primary and recommended format for the MVP.

> **Note:** YAML support may be added in future versions, but JSON remains the canonical format.

### Configuration Validation

The server validates configuration on startup and rejects invalid configs:

✅ Checks performed:
- All required fields present
- Field types are valid
- Enum fields have non-empty `values` arrays
- `visibleFields` reference existing fields
- `lookupKey` references an existing field
- Dataset IDs are unique
- Limits are valid (positive, maxRows ≥ defaultRows)
- CSV files exist and are readable

**Fail-Fast:** Invalid configuration prevents server startup with clear error messages.

---

## CSV File Format

### Requirements

1. **Header row** with column names (first row)
2. **Column names** must match field definitions (case-sensitive)
3. **Data types** must match field types
4. **UTF-8 encoding**
5. **Standard CSV format** (comma-delimited)

### Example

```csv
id,name,email,role,active
1,Alice Smith,alice@example.com,admin,true
2,Bob Johnson,bob@example.com,user,true
3,Charlie Brown,charlie@example.com,guest,false
```

### Type Formatting

**Boolean:** Must be `true` or `false` (lowercase)
```csv
active
true
false
```

**Number:** Integers or decimals
```csv
price,quantity
99.99,5
149.99,10
```

**Enum:** Must match one of the configured values
```csv
role
admin
user
guest
```

---

## Hot Reload

Configuration changes are detected automatically:

1. Edit `config/datasets.json`
2. Save the file
3. Changes apply in 1-3ms (catalog swap only)
4. Invalid changes are rejected (keeps current config)

**Watch the logs:**
```
[INFO] Config reloaded successfully in 2ms
```

**How it works:**
- Config file is watched for changes
- On change: validates new config
- If valid: atomically swaps to new catalog
- If invalid: preserves current state, logs error

No server restart needed!

---

## AI Usage Guidelines

This MCP server is designed for AI assistants querying structured data. When designing datasets:

### Dataset Design for AI

**Keep datasets focused:**
- Small, single-purpose tables work better than large multi-purpose sheets
- Separate reference data (IDs, names, codes) from descriptive content
- Break complex domains into multiple related datasets

**Optimize for token efficiency:**
- Use `visibleFields` to expose only necessary columns
- Keep field names short but meaningful
- Prefer IDs and codes over long text fields for filtering

**Design for stable querying:**
- Use consistent, stable identifiers (numeric IDs, SKUs, codes)
- Avoid relying on free-text names as lookup keys
- Normalize categorical data (use enums, not free text)

**Structure for filtering:**
- Tag-based fields enable flexible queries (`status`, `category`, `type`)
- Use enums for controlled vocabularies
- Boolean flags for common filters (`active`, `published`, `available`)

**Example patterns:**
- **Index dataset:** IDs, names, tags, status (small, frequently queried)
- **Detail dataset:** Full records with all fields (queried by ID)
- **Reference dataset:** Lookup tables, enums, measurement scales (small, stable)

---

## Architecture

This project follows **Hexagonal Architecture** for clean separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│              Primary Adapters (MCP)                 │
│                       ↓                             │
│              Primary Ports (Tools)                  │
│                       ↓                             │
│              Use Cases (Business Logic)             │
│                       ↓                             │
│              Domain Layer (Pure Logic)              │
│                       ↓                             │
│              Secondary Ports (Storage)              │
│                       ↓                             │
│         Secondary Adapters (CSV, Config)            │
└─────────────────────────────────────────────────────┘
```

**Key Principles:**
- Domain layer has zero external dependencies
- Dependencies point inward (adapters → domain)
- Business logic is isolated and testable
- Easy to extend with new adapters

See [docs/dev/mcp-data-catalog.md](docs/dev/mcp-data-catalog.md) for detailed architecture documentation.

---

## Examples

The `examples/` directory contains:

### Configurations
- `minimal.json` - Single dataset, basic features
- `typical.json` - Multiple datasets, common patterns
- `advanced.json` - Complex scenarios with many features

### Datasets
- `minimal.csv` - 5 rows, 2 columns
- `sample-users.csv` - 10 users with roles
- `sample-products.csv` - 15 products with categories
- `employees.csv` - 15 employees with departments
- `inventory.csv` - 20 inventory items
- `orders.csv` - 20 customer orders

**Try them:**
```bash
cp examples/config/typical.json config/datasets.json
npm run dev
```

See [examples/README.md](examples/README.md) for detailed documentation.

---

## Development

### Setup

```bash
npm install
npm run build
```

### Run in Development Mode

```bash
npm run dev
```

### Run Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

---

## Testing

**Test Coverage:**
- Comprehensive test suite with high coverage
- Unit tests for domain logic and use cases
- Integration tests for MCP tools and hot reload
- Both statement and branch coverage tracked

**Test Structure:**
```
test/
├── unit/
│   ├── domain/           # Domain services and value objects
│   └── use-cases/        # Use case orchestration
└── integration/
    ├── mcp-tools.test.ts           # All 4 MCP tools
    ├── config-hot-reload.test.ts   # Hot reload behavior
    ├── csv-hot-visibility.test.ts  # Visible fields
    └── limits-and-truncation.test.ts # Row limits
```

---

## Performance

**Characteristics:**
- Config reload: 1-3ms (catalog swap only)
- CSV load: 5-10ms per file (varies with size)
- Query execution: 1-2ms for in-memory operations
- Memory: O(n) where n = dataset size

**CSV Loading Behavior:**
- CSV files are read **on-demand** for each query
- No in-memory caching of CSV data
- This keeps memory usage low but includes file I/O in query latency
- Config catalog is cached; only CSV data is loaded per-query

**Scalability:**
- Suitable for datasets up to ~100K rows
- Query latency includes file read time (~5-10ms per CSV)
- For high-performance or large datasets, use database backends (post-MVP)
- Consider dataset design: multiple small CSVs better than one large CSV

---

## Roadmap

### ✅ MVP Complete (Phases 1-5)

- [x] Hexagonal architecture
- [x] 4 MCP tools (list, describe, query, get_by_id)
- [x] MVP filter operators (eq, contains, and)
- [x] Type validation (string, number, boolean, enum)
- [x] Hot reload support
- [x] Comprehensive test coverage
- [x] Error handling and logging

### 🚀 Post-MVP Features

- [ ] Additional filter operators (ne, gt, gte, lt, lte, in, or)
- [ ] Sorting (ORDER BY)
- [ ] Complex types (arrays, nested objects)
- [ ] Multiple data sources (PostgreSQL, SQLite, JSON)
- [ ] Aggregations (COUNT, SUM, AVG, etc.)
- [ ] Full-text search
- [ ] Caching layer for performance
- [ ] GraphQL-style query language

See [docs/project-plans/project-plan-v1.final.md](docs/project-plans/project-plan-v1.final.md) for details.

---

## Documentation

- **[Developer Guide](docs/dev/mcp-data-catalog.md)** - Architecture and internals
- **[Configuration Reference](examples/config/README.md)** - Complete config documentation
- **[Examples](examples/README.md)** - Sample datasets and configs
- **[Project Plan](docs/project-plans/project-plan-v1.final.md)** - MVP scope and roadmap
- **[Phase Execution](docs/execution/)** - Implementation tracking

---

## Contributing

Contributions welcome! This project follows:

1. **Hexagonal architecture** - Keep domain pure
2. **Test-driven development** - Write tests first
3. **Type safety** - Leverage TypeScript
4. **Clean code** - Follow existing patterns

See `.clinerules/core-rules.md` for architectural guidelines.

---

## Troubleshooting

### Server won't start

**Check configuration:**
```bash
node dist/index.js
# Look for validation errors in output
```

**Common issues:**
- CSV file path incorrect
- Field type mismatch
- Missing required fields
- Duplicate dataset IDs

### Queries return no results

**Verify dataset:**
```json
{
  "tool": "describe_dataset",
  "arguments": { "datasetId": "your-dataset" }
}
```

**Check:**
- Dataset ID is correct
- CSV file has data
- Filters match field types
- Field names are in `visibleFields`

### Hot reload not working

**Verify file watching:**
- Config file path is correct
- File system permissions allow reading
- Check server logs for reload confirmation

---

## License

MIT

---

## Credits

Built with:
- [TypeScript](https://www.typescriptlang.org/)
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- [Zod](https://zod.dev/) - Schema validation
- [Chokidar](https://github.com/paulmillr/chokidar) - File watching
- [Jest](https://jestjs.io/) - Testing

---

## Project Status

**Version:** 1.0.0-mvp  
**Status:** Stable MVP  
**Last Updated:** 2025-11-30

> **Note:** Test and performance numbers in badges reflect the state at release. Designed for production-style workloads, but validate performance and fit for your specific environment.

All 6 phases complete:
- ✅ Phase 1: Skeleton & Config
- ✅ Phase 2: Core Use Cases
- ✅ Phase 3: Hot Reload
- ✅ Phase 4: MCP Adapter
- ✅ Phase 5: Hardening & Testing
- ✅ Phase 6: Documentation

See [docs/execution/master-checklist.md](docs/execution/master-checklist.md) for detailed progress.
