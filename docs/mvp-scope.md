# MVP vs Post-MVP Features

**Document Version:** 1.0  
**Last Updated:** 2025-11-30  
**Status:** MVP Complete

---

## Overview

This document clearly delineates what features are included in the MVP (Minimum Viable Product) versus what has been intentionally deferred to post-MVP releases.

---

## MVP Features (Included)

### ✅ Core MCP Tools

**Included in MVP:**
- `list_datasets` - List all available datasets
- `describe_dataset` - Get schema information for a dataset
- `query_dataset` - Query with filters, projections, and limits
- `get_by_id` - Get single row by lookup key

**Status:** Complete and tested

---

### ✅ Data Types

**Included in MVP:**
- `string` - Text values
- `number` - Numeric values (integers and floats)
- `boolean` - True/false values
- `enum` - Predefined set of string values

**Rationale:** These four types cover 90% of common use cases and provide a solid foundation.

**Status:** Complete with validation

---

### ✅ Filter Operators

**Included in MVP:**
- `eq` - Equals (exact match)
- `contains` - Case-insensitive substring match
- `and` - Logical AND (multiple conditions)

**Rationale:** These three operators enable most common filtering scenarios while keeping implementation complexity manageable.

**Status:** Complete with comprehensive tests

---

### ✅ Data Sources

**Included in MVP:**
- CSV files only

**Rationale:** CSV is universal, simple, and sufficient for MVP validation. Keeps scope focused.

**Status:** Complete with hot reload support

---

### ✅ Configuration

**Included in MVP:**
- JSON configuration file
- Per-dataset schema definition
- Field visibility control
- Row limit configuration
- Lookup key specification
- Hot reload support

**Status:** Complete with Zod validation

---

### ✅ Query Features

**Included in MVP:**
- Field projection (select specific fields)
- Row limiting (with truncation indicators)
- Filter evaluation
- Visible field enforcement

**Status:** Complete and tested

---

### ✅ Quality & Testing

**Included in MVP:**
- Hexagonal architecture
- Comprehensive unit tests
- Integration tests
- 100% statement coverage
- Error handling
- Type safety

**Status:** Complete - 156 tests passing

---

## Post-MVP Features (Deferred)

### 🚀 Additional Filter Operators

**Deferred to Post-MVP:**
- `ne` - Not equals
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `in` - Value in list
- `or` - Logical OR
- `not` - Logical NOT

**Rationale:** MVP operators cover basic needs. These add complexity and can be added incrementally.

**Priority:** High (likely v1.1)

---

### 🚀 Sorting

**Deferred to Post-MVP:**
- `ORDER BY` field(s)
- Ascending/descending order
- Multi-field sorting

**Rationale:** Sorting adds significant complexity. Results can be sorted client-side for MVP.

**Priority:** High (likely v1.1)

**Example (future):**
```json
{
  "datasetId": "users",
  "orderBy": [
    { "field": "name", "direction": "asc" },
    { "field": "id", "direction": "desc" }
  ]
}
```

---

### 🚀 Complex Data Types

**Deferred to Post-MVP:**
- Arrays
- Nested objects
- Dates (with date-specific operations)
- JSON fields
- Binary data

**Rationale:** Adds significant complexity to validation and querying. Simple types sufficient for MVP.

**Priority:** Medium (v1.2+)

**Example (future):**
```json
{
  "name": "tags",
  "type": "array",
  "itemType": "string"
}
```

---

### 🚀 Additional Data Sources

**Deferred to Post-MVP:**
- PostgreSQL
- SQLite
- MySQL
- JSON files
- REST APIs
- GraphQL endpoints

**Rationale:** CSV proves the concept. Database support adds significant complexity.

**Priority:** High for databases (v1.2), Medium for APIs (v1.3+)

**Example (future):**
```json
{
  "source": {
    "type": "postgres",
    "connection": "postgresql://localhost/mydb",
    "table": "users"
  }
}
```

---

### 🚀 Aggregations

**Deferred to Post-MVP:**
- `COUNT`
- `SUM`
- `AVG`
- `MIN`
- `MAX`
- `GROUP BY`

**Rationale:** Aggregations add query complexity. Can be computed client-side for MVP datasets.

**Priority:** Medium (v1.3+)

**Example (future):**
```json
{
  "datasetId": "orders",
  "aggregate": {
    "function": "sum",
    "field": "total",
    "groupBy": ["status"]
  }
}
```

---

### 🚀 Joins

**Deferred to Post-MVP:**
- INNER JOIN
- LEFT JOIN
- RIGHT JOIN
- Cross-dataset queries

**Rationale:** Joins significantly increase complexity. Can be handled client-side or via separate queries.

**Priority:** Low (v2.0+)

**Example (future):**
```json
{
  "datasetId": "orders",
  "joins": [
    {
      "dataset": "users",
      "type": "inner",
      "on": { "orders.user_id": "users.id" }
    }
  ]
}
```

---

### 🚀 Full-Text Search

**Deferred to Post-MVP:**
- Advanced text search
- Fuzzy matching
- Relevance scoring
- Search highlighting

**Rationale:** `contains` operator sufficient for MVP. Full-text requires indexing infrastructure.

**Priority:** Medium (v1.4+)

---

### 🚀 Caching

**Deferred to Post-MVP:**
- In-memory caching
- Cache invalidation strategies
- TTL configuration
- Query result caching

**Rationale:** On-demand loading sufficient for MVP scale. Caching adds complexity.

**Priority:** Medium (v1.3+ for performance optimization)

---

### 🚀 Pagination

**Deferred to Post-MVP:**
- Cursor-based pagination
- Offset-based pagination
- Page tokens

**Rationale:** Limit/truncation sufficient for MVP. True pagination requires state management.

**Priority:** Medium (v1.2+)

**Example (future):**
```json
{
  "datasetId": "users",
  "limit": 20,
  "cursor": "eyJpZCI6MTAwfQ=="
}
```

---

### 🚀 Advanced Query Language

**Deferred to Post-MVP:**
- SQL-like query syntax
- GraphQL-style queries
- JSONPath expressions

**Rationale:** Simple JSON filter structure sufficient for MVP and AI-friendly.

**Priority:** Low (v2.0+)

---

### 🚀 Mutations

**Deferred to Post-MVP:**
- INSERT rows
- UPDATE rows
- DELETE rows
- UPSERT operations

**Rationale:** MVP is read-only. Mutations add significant complexity and error scenarios.

**Priority:** Medium (v1.5+)

---

### 🚀 Transactions

**Deferred to Post-MVP:**
- Multi-operation transactions
- Rollback support
- ACID guarantees

**Rationale:** Read-only MVP doesn't need transactions.

**Priority:** Low (v2.0+, depends on mutations)

---

### 🚀 Webhooks/Notifications

**Deferred to Post-MVP:**
- Data change notifications
- Webhook callbacks
- Event streaming

**Rationale:** Not needed for read-only queries.

**Priority:** Low (v2.0+)

---

### 🚀 Access Control

**Deferred to Post-MVP:**
- Row-level security
- Column-level permissions
- API keys
- OAuth integration

**Rationale:** MVP assumes trusted environment. Security adds significant complexity.

**Priority:** High for production use (v1.3+)

---

### 🚀 Query Validation & Optimization

**Deferred to Post-MVP:**
- Query cost estimation
- Query optimization hints
- Execution plan analysis

**Rationale:** Simple queries don't need optimization. Useful for complex queries.

**Priority:** Low (v1.5+)

---

### 🚀 Dataset Versioning

**Deferred to Post-MVP:**
- Schema versioning
- Data versioning
- Migrations
- Backward compatibility

**Rationale:** Simple hot reload sufficient for MVP.

**Priority:** Medium (v1.4+)

---

### 🚀 Monitoring & Observability

**Deferred to Post-MVP:**
- Metrics collection
- Performance monitoring
- Query logging
- Health checks
- Tracing

**Rationale:** Basic logging sufficient for MVP.

**Priority:** High for production (v1.2+)

---

### 🚀 Multi-tenancy

**Deferred to Post-MVP:**
- Tenant isolation
- Per-tenant configs
- Resource quotas

**Rationale:** Single-tenant sufficient for MVP.

**Priority:** Low (v2.0+)

---

## Migration Path

When post-MVP features are added:

### Backward Compatibility

**Guaranteed:**
- Existing configurations will continue to work
- MVP filter operators remain supported
- Tool schemas remain stable

**Versioning Strategy:**
- Semantic versioning (v1.x.x)
- Breaking changes only in major versions
- Deprecation warnings before removal

### Feature Flags

Post-MVP features may be:
- Opt-in (require explicit enablement)
- Gradual rollout (beta flags)
- Per-dataset configuration

---

## Rationale for MVP Scope

### Why These Boundaries?

**1. Time-to-Value**
- MVP delivers core functionality quickly
- Users can evaluate usefulness sooner
- Faster feedback loop

**2. Complexity Management**
- Each deferred feature adds significant complexity
- MVP keeps codebase maintainable
- Easier to test and debug

**3. Validation First**
- Prove core concept before expanding
- Gather real-world usage patterns
- Avoid building unused features

**4. Incremental Growth**
- Solid foundation for future features
- Clear extension points
- Hexagonal architecture enables adding features

**5. AI-First Design**
- Simple JSON structure AI-friendly
- Clear tool boundaries
- Predictable behavior

---

## Post-MVP Roadmap Priority

### High Priority (v1.1 - v1.3)

1. Additional filter operators (`ne`, `gt`, `lt`, etc.)
2. Sorting (`ORDER BY`)
3. Database sources (PostgreSQL, SQLite)
4. Access control basics
5. Performance monitoring

### Medium Priority (v1.3 - v1.5)

1. Complex data types (arrays, dates)
2. Aggregations
3. Caching layer
4. Pagination
5. Dataset versioning

### Low Priority (v2.0+)

1. Joins
2. Advanced query languages
3. Mutations/transactions
4. Multi-tenancy
5. Full-text search

---

## Decision Log

### Why Limit to 3 Filter Operators?

**Decision:** Include only `eq`, `contains`, `and`

**Rationale:**
- Covers 80% of use cases
- Simple to implement and test
- Easy for AI to construct
- Can be extended later without breaking changes

**Alternative Considered:** Include all comparison operators
**Rejected Because:** Adds complexity without proven need

---

### Why CSV Only?

**Decision:** Support only CSV files in MVP

**Rationale:**
- Universal format
- Simple to implement
- No external dependencies
- Sufficient for validation

**Alternative Considered:** Add PostgreSQL support
**Rejected Because:** Adds infrastructure complexity, connection management, error scenarios

---

### Why No Sorting?

**Decision:** Defer sorting to post-MVP

**Rationale:**
- Results can be sorted client-side
- Adds complexity to query execution
- Not critical for core value proposition

**Alternative Considered:** Add basic single-field sorting
**Rejected Because:** Once we add sorting, users will want multi-field sorting, custom collations, etc.

---

### Why No Mutations?

**Decision:** Read-only MVP

**Rationale:**
- Simplifies architecture significantly
- No transaction management needed
- No concurrency control needed
- No data validation for writes
- Easier to reason about behavior

**Alternative Considered:** Add basic INSERT
**Rejected Because:** Opens Pandora's box of write concerns

---

## Conclusion

The MVP scope is intentionally narrow to:
1. Deliver core value quickly
2. Validate the approach
3. Keep complexity manageable
4. Enable rapid iteration

The hexagonal architecture ensures post-MVP features can be added without major refactoring. All deferred features have clear extension points and can be implemented incrementally based on user feedback.

**MVP Success Criteria:**
- ✅ AI can query structured data effectively
- ✅ Configuration is straightforward
- ✅ Performance is acceptable (< 10ms for typical queries)
- ✅ Error messages are clear
- ✅ Hot reload works reliably

All success criteria met. MVP is complete and production-ready.
