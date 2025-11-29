# Project Plan Changelog

This document tracks all revisions made to the project plan from the initial version through finalization.

---

## How to Use This Document

- Each plan version gets an entry with changes, rationale, and sources
- Entries are listed in chronological order (newest first)
- This file will be merged into the final plan once approved
- All intermediate versions remain for historical reference

---

## Change Log

### v1.mvp-scoped (2025-11-29)

**Status**: Draft

**Changes from v0.initial**:
- [Modified] Filter operators simplified to MVP scope: `eq`, `contains`, `and` only (removed `neq`, `gt`, `gte`, `lt`, `lte`, `or`)
- [Clarified] Retained `get_by_id` tool for semantic distinction despite functional overlap
- [Modified] Schema type inference removed - explicit type definitions required in config
- [Removed] Array and Unknown field types from MVP (only `string`, `number`, `boolean`, `enum` supported)
- [Modified] Configuration format: JSON only for MVP (YAML deferred to post-MVP)
- [Added] Fail-fast configuration validation with comprehensive logging
- [Modified] `visibleFields` now required in config (no defaults)
- [Modified] `limits` (defaultLimit/maxLimit) required per dataset (no system defaults)
- [Added] Hot reload support for config and CSV files
- [Modified] CSV data loaded on-demand, not cached in memory
- [Modified] Field validation: error immediately on invalid field references with helpful messages
- [Clarified] Sort functionality deferred to post-MVP
- [Modified] Observability: basic logging only (dataset, rows, fields per request)
- [Modified] Test coverage: full coverage required (domain, use cases, integration)
- [Added] Post-MVP extension phase section for future features
- [Added] Key Decisions & Rationale section (section 11) documenting 10 major design choices
- [Added] Future Considerations section (section 12) for performance, features, monitoring
- [Added] Clear MVP vs Post-MVP feature split throughout document

### Rationale

These changes scope the project to a focused, implementable MVP while maintaining architectural quality and establishing clear paths for future enhancement. The simplified filter model reduces implementation complexity without sacrificing core functionality. Explicit configuration requirements (types, visible fields, limits) eliminate ambiguity and improve maintainability. Hot reload without memory caching keeps the system lightweight and flexible.

### Source
- **Clarifications**: clarifications-v0.md (12 questions with user responses)
- **User decisions**: 
  - Simplify filters to essential operators for MVP
  - Keep get_by_id for semantic clarity
  - Explicit types only, no inference
  - Fail fast on config errors
  - JSON first, YAML later
  - Required visibleFields and limits
  - Hot reload without caching
  - Full test coverage

---

### v0.initial (2025-11-29)

**Status**: Superseded by v1.mvp-scoped

**Changes**: Initial project plan created

**Source**: Direct conversation and architectural requirements

**Notes**: 
- Established hexagonal architecture approach
- Defined 4 core MCP tools
- Set up CSV-based storage adapter
- Created milestone-based implementation roadmap

---

<!-- Future revisions will be added above this line -->
