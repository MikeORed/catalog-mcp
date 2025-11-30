# Catalog MCP Server

A Model Context Protocol (MCP) server for managing and querying datasets from CSV files. Built with hexagonal architecture for clean separation of concerns.

## Project Status

**Current Phase**: Phase 1 Complete - Skeleton & Configuration
- ✅ Hexagonal architecture established
- ✅ Domain layer implemented (types, entities, errors, services)
- ✅ Configuration system with validation
- ✅ Fail-fast startup validation

**Next Phase**: Phase 2 - Core Use Cases (List, Describe, Query, GetById)

See `docs/execution/master-checklist.md` for detailed progress tracking.

## Architecture

This project follows **Hexagonal Architecture (Ports & Adapters)**:

```
src/
├── domain/              # Core business logic (no external dependencies)
│   ├── entities/        # Domain entities
│   ├── value-objects/   # Domain value types
│   ├── errors/          # Domain-specific errors
│   └── services/        # Domain services
├── ports/               # Contracts for external interactions
│   ├── primary/         # Driving ports (APIs, CLI, MCP)
│   └── secondary/       # Driven ports (storage, external services)
├── use-cases/           # Application orchestration
├── adapters/            # External system implementations
│   ├── primary/         # MCP server adapter
│   └── secondary/       # Config & CSV adapters
└── index.ts             # Entry point
```

## Setup

```bash
npm install
npm run build
```

## Configuration

Create a configuration file (see `config/datasets.example.json`):

```json
{
  "datasets": [
    {
      "id": "users",
      "name": "User Directory",
      "description": "Company user directory",
      "path": "./data/users.csv",
      "fields": [
        {
          "name": "user_id",
          "type": "string",
          "isKey": true,
          "isLookupKey": true
        }
      ],
      "keyField": "user_id",
      "lookupKeys": ["user_id"],
      "visibleFields": ["user_id", "email", "name"],
      "limits": {
        "defaultLimit": 50,
        "maxLimit": 200
      }
    }
  ]
}
```

### MVP Field Types

The MVP supports these field types:
- `string` - Text values
- `number` - Numeric values
- `boolean` - True/false values
- `enum` - Predefined set of string values (requires `enumValues` array)

### Configuration Validation

The server performs comprehensive validation on startup:
- ✅ All required fields present
- ✅ Field types are valid MVP types
- ✅ Enum fields have non-empty `enumValues`
- ✅ `keyField` exists in fields array
- ✅ All `lookupKeys` exist in fields array
- ✅ All `visibleFields` exist in fields array
- ✅ No duplicate field names within a dataset
- ✅ Dataset IDs are unique
- ✅ Limits are valid (positive, maxLimit ≥ defaultLimit)

**Fail-Fast**: Any validation error prevents server startup with a clear error message.

## Development

Watch mode for development:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Project Structure

- `/src` - Source code
- `/dist` - Compiled JavaScript (generated)
- `/config` - Configuration files
- `/test` - Test files (upcoming in Phase 2)
- `/docs` - Documentation
  - `/docs/execution` - Phase execution tracking
  - `/docs/project-plans` - Project planning documents

## Development Guidelines

This project strictly follows hexagonal architecture:

1. **Domain Layer**: No external dependencies allowed
2. **Dependency Direction**: Always inward (Adapters → Ports → Use Cases → Domain)
3. **Naming Conventions**: kebab-case for files, PascalCase for classes
4. **Error Handling**: Domain-specific errors with clear messages
5. **Validation**: Comprehensive input validation at boundaries

See `.clinerules/core-rules.md` for detailed architectural rules.

## Roadmap

### Phase 1: Skeleton & Config ✅ Complete
- Project structure
- Domain types and errors
- Configuration system
- Fail-fast validation

### Phase 2: Core Use Cases (In Progress)
- List datasets
- Describe dataset
- Query dataset (with filtering and projection)
- Get by ID

### Phase 3: Hot Reload Support
- File watching
- Dynamic configuration reload
- On-demand CSV loading

### Phase 4: MCP Adapter
- MCP server wrapper
- Tool exposure
- Error mapping

### Phase 5: Hardening & Testing
- Comprehensive test coverage
- Integration tests
- Performance validation

### Phase 6: Documentation
- Developer documentation
- Usage examples
- API reference

## License

MIT
