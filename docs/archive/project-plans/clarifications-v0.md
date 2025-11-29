# Clarifications for Project Plan v0.initial

**Date**: 2025-11-29  
**Plan Version**: v0.initial  
**Status**: Responses received

---

## Questions

### Q1: Filter Model Complexity

**Question**: The current plan includes a comprehensive filter model with 7 operators (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`) plus compound filters (`and`, `or`). 

For an MVP, should we:
1. **Keep the full set** as specified (all 7 operators + compound filters)
2. **Simplify to essential operators only** (e.g., `eq`, `contains`, and `and` compound)
3. **Start with exact match only** (`eq`) and add more operators in later phases

**Context**: More operators = more powerful queries but also more complexity in implementation and testing. The use cases you have in mind (M&M effects/modifiers lookup) might work fine with just `eq` and `contains`.

**Response**: 
Answer #2 for mvp, note with this new mvp vs total consideration, we will possibly need a new phase or so for feature 'extention'

**Resolution**: Simplify filter operators to essential set: `eq`, `contains`, and `and` compound for MVP. Remove `neq`, `gt`, `gte`, `lt`, `lte`, and `or` operators. Plan for post-MVP phase to add extended operators.

---

### Q2: get_by_id Tool Necessity

**Question**: The plan includes a dedicated `get_by_id` tool (section 2.1.4) that retrieves a single row by primary key. However, the same functionality could be achieved using `query_dataset` with an `eq` filter on the key field.

Should we:
1. **Keep get_by_id** as a separate tool for convenience
2. **Remove get_by_id** and use `query_dataset` for all lookups (simpler tool surface)

**Context**: Having fewer tools simplifies the MCP interface and reduces code to maintain. However, `get_by_id` provides a clearer, more explicit semantic for single-row lookups.

**Response**: 
1. same functionality, but having a distinct conceptual zone for a lookup with full details will behoove us, even if the underlying code is mostly identical

**Resolution**: Keep `get_by_id` tool for clear semantic distinction between single-row lookups and general queries.

---

### Q3: Schema Type Inference Depth

**Question**: The plan mentions "infer basic schema (field types)" for CSV loading. How sophisticated should this inference be?

Options:
1. **Basic inference**: Only distinguish between `string`, `number`, and `boolean` based on content
2. **Enhanced inference**: Additionally detect `array` (comma-separated values) and `enum` (limited distinct values)
3. **Explicit only**: No inference - require all types to be declared in config file

**Context**: Type inference adds robustness but also complexity. If your datasets are well-structured CSVs, explicit typing in config might be clearer and more reliable.

**Response**: 
I think the config in the actual mcp config should describe both the field names and types, let's skip arrays though for now

**Resolution**: Require explicit type definitions in config. No automatic inference. Skip array type support for MVP (only `string`, `number`, `boolean`, `enum` supported).

---

### Q4: Configuration Error Handling

**Question**: When loading datasets from config, what should happen if one dataset has errors (missing file, invalid key field, etc.)?

Options:
1. **Fail fast**: Stop server startup if any dataset fails validation
2. **Skip and warn**: Log error, skip that dataset, continue with valid ones
3. **Partial load**: Load what's valid, return error info in `list_datasets` for failed ones

**Context**: Fail fast is safer for development but less resilient. Skip and warn allows partial functionality if one dataset is misconfigured.

**Response**: 
Go with 1. Thou we need to log everything

**Resolution**: Fail fast on any config validation errors during startup. Ensure comprehensive logging of all errors and validation issues.

---

### Q5: Configuration File Format

**Question**: The plan suggests "YAML or JSON" for the config file. Which do you prefer?

Options:
1. **YAML** - More human-readable, better for comments, requires parser dependency
2. **JSON** - Standard, no extra dependencies, less readable for larger configs
3. **Support both** - Add complexity but maximum flexibility

**Context**: For this project with relatively simple config, either works fine. YAML is nicer to edit by hand.

**Response**: 
2. we'll do both, but start with json since it's semi-standard (so mvp to json)

**Resolution**: Use JSON for MVP config format. Add YAML support in post-MVP phase.

---

### Q6: Visible Fields Default Behavior

**Question**: The plan includes `visibleFields` in the config and schema. What should happen if `visibleFields` is not specified for a dataset?

Options:
1. **Default to all fields** - Return everything if not specified
2. **Require explicit configuration** - Error if `visibleFields` not provided
3. **Smart default** - Include all fields except those matching certain patterns (e.g., internal IDs)

**Context**: This affects token budget control. Requiring explicit `visibleFields` forces conscious decisions about what gets exposed.

**Response**:
do 2. but include in the response reasonable defaults

**Resolution**: Require explicit `visibleFields` configuration. On error, provide helpful message with all available field names as reasonable defaults.

---

### Q7: Limit Configuration Defaults

**Question**: The plan specifies `defaultLimit` and `maxLimit` per dataset. What should the global defaults be if not specified in config?

Current plan shows examples like:
- defaultLimit: 10
- maxLimit: 50

Should these be:
1. **Hard-coded in the system** with these values (10/50)
2. **Configurable at project level** (in addition to per-dataset)
3. **Required in config** (no defaults, must be explicit)

**Response**:
configurable by dataset sent along at mcp server initialization

**Resolution**: Make `defaultLimit` and `maxLimit` configurable per dataset in the MCP server initialization config. No system-wide hard-coded defaults.

---

### Q8: Sort Functionality Priority

**Question**: Section 10 Milestone 5 lists "Add `sort` parameter to `query_dataset`" as optional. Should sorting be:

1. **MVP inclusion** - Include in initial implementation
2. **Post-MVP** - Defer to phase 2 after core functionality is stable
3. **Skip entirely** - Not needed for this use case

**Context**: Sorting adds moderate complexity. For your M&M lookups, results are often filtered to small sets where order may not matter much.

**Response**: 
2. post mvp

**Resolution**: Defer sort functionality to post-MVP phase.

---

### Q9: Observability Requirements

**Question**: Section 8 describes "MVP-level observability" with per-request logging. How detailed should this be?

Options:
1. **Minimal** - Just log errors
2. **Basic** - Log each request with dataset, row count, field count
3. **Detailed** - Include approximate payload size, execution time, filter complexity
4. **Structured** - JSON-formatted logs suitable for ingestion by log aggregators

**Context**: More logging helps debugging but adds overhead. For local development, basic is often sufficient.

**Response**:
go with 2.

**Resolution**: Implement basic logging: log each request with dataset name, row count, field count.

---

### Q10: Test Coverage Expectations

**Question**: Section 9 outlines testing strategy. What level of test coverage is expected for MVP?

Options:
1. **Domain only** - Unit tests for filter/projection logic
2. **Domain + Use Cases** - Add use case tests with mocked ports
3. **Full coverage** - Domain, Use Cases, Integration tests for CSV adapter
4. **E2E included** - All of the above plus end-to-end MCP tool tests

**Context**: More tests = more confidence but longer initial implementation. We can always add tests incrementally.

**Response**:
3. full coverage

**Resolution**: Implement full test coverage: Domain unit tests, Use Case tests with mocked ports, and Integration tests for CSV adapter.

---

### Q11: Dataset Definition Flexibility

**Question**: The current plan assumes CSV files are pre-created and configured. Should the system support:

1. **Static only** - Datasets are defined in config at startup, no runtime changes
2. **Hot reload** - Watch config file and CSV files, reload on changes (dev-friendly)
3. **Dynamic registration** - API/tools to register new datasets at runtime

**Context**: Static is simplest and fine for production. Hot reload helps during development but adds complexity.

**Response**:
2. hot reload, since we don't want to maintain the entire dataset in memory

**Resolution**: Implement hot reload capability - watch config and CSV files, reload on changes. Don't maintain full datasets in memory.

---

### Q12: Field Validation in Queries

**Question**: When a user specifies `selectFields` or filter fields that don't exist in the dataset, should we:

1. **Error immediately** - Return error listing valid fields
2. **Silently ignore** - Filter/project using only valid fields
3. **Warn and continue** - Include warning in response but still return data

**Context**: Erroring is clearer but might be annoying if field names change. Ignoring is more forgiving but might hide typos.

**Response**:
1. error immediately

**Resolution**: Error immediately when invalid field names are specified in `selectFields` or filters. Return error message listing valid field names.

---

## Summary

Once you've responded to these questions inline above, I'll generate project-plan-v1 incorporating all your decisions and preferences.
