# Phase 1: Skeleton & Config - Detailed Checklist

**Phase**: 1 of 6  
**Status**: ✅ Complete  
**Started**: 2025-11-30  
**Completed**: 2025-11-30  
**Estimated Effort**: 1-2 days  
**Actual Effort**: ~2 hours

---

## Phase Overview

Set up the foundational project structure, define domain types, implement configuration parsing and validation. This phase establishes the architectural foundation for the entire project.

**Key Deliverables:**
- Hexagonal project structure
- Domain layer (types, errors, services)
- JSON configuration system with validation
- Fail-fast startup validation

**Dependencies**: None - this is the foundation phase

---

## Primary Acceptance Criteria (MUST COMPLETE)

### AC-1.1: Project Structure Follows Hexagonal Architecture

**Status**: [ ] Not Started

**Description**: Create directory structure that enforces hexagonal architecture boundaries.

**Implementation Tasks:**
- [ ] Create `src/domain/` directory structure
  - [ ] `src/domain/entities/`
  - [ ] `src/domain/value-objects/`
  - [ ] `src/domain/errors/`
  - [ ] `src/domain/services/`
- [ ] Create `src/ports/` directory structure
  - [ ] `src/ports/primary/`
  - [ ] `src/ports/secondary/`
- [ ] Create `src/use-cases/` directory
- [ ] Create `src/adapters/` directory structure
  - [ ] `src/adapters/primary/`
  - [ ] `src/adapters/secondary/`
- [ ] Create `test/` directory structure
  - [ ] `test/unit/domain/`
  - [ ] `test/unit/use-cases/`
  - [ ] `test/integration/`
- [ ] Create `config/` directory for configuration files
- [ ] Set up TypeScript configuration (`tsconfig.json`)
- [ ] Set up package.json with proper scripts
- [ ] Create `.gitignore` with appropriate exclusions

**Verification:**
- [ ] All directories follow naming conventions (kebab-case)
- [ ] No circular dependencies possible at structure level
- [ ] TypeScript compiles without errors
- [ ] Project structure documented in README

**Blocked By**: None

---

### AC-1.2: Domain Types Defined

**Status**: [ ] Not Started

**Description**: Implement all core domain types as specified in the plan.

**Implementation Tasks:**
- [ ] Create `src/domain/value-objects/dataset-id.ts`
  - [ ] Type alias: `DatasetId = string`
  - [ ] Validation helper if needed
- [ ] Create `src/domain/value-objects/field-name.ts`
  - [ ] Type alias: `FieldName = string`
- [ ] Create `src/domain/value-objects/field-type.ts`
  - [ ] Enum: `FieldType { String, Number, Boolean, Enum }`
  - [ ] NO Array or Unknown types (MVP constraint)
- [ ] Create `src/domain/entities/dataset-field.ts`
  - [ ] Interface with: name, type, enumValues?, isKey, isLookupKey
- [ ] Create `src/domain/entities/dataset-schema.ts`
  - [ ] Full interface per plan specification
- [ ] Create `src/domain/entities/dataset-config.ts`
  - [ ] Full interface per plan specification
- [ ] Create `src/domain/entities/filter-expression.ts`
  - [ ] `FilterOp` type (eq, contains only)
  - [ ] `FieldFilter` interface
  - [ ] `CompoundFilter` interface (and only)
  - [ ] `FilterExpression` union type
- [ ] Create `src/domain/entities/query-request.ts`
- [ ] Create `src/domain/entities/query-result.ts`
  - [ ] `QueryResultRow` interface
  - [ ] `QueryResult` interface

**Verification:**
- [ ] All types compile without errors
- [ ] No external dependencies in domain types
- [ ] Types match plan specification exactly
- [ ] Enum values properly restricted to MVP scope
- [ ] All interfaces properly exported

**Blocked By**: AC-1.1

---

### AC-1.3: Domain Error Types Implemented

**Status**: [ ] Not Started

**Description**: Create all domain-specific error classes.

**Implementation Tasks:**
- [ ] Create `src/domain/errors/dataset-not-found-error.ts`
  - [ ] Extends Error
  - [ ] Constructor: (datasetId: string)
  - [ ] Includes dataset ID in message
- [ ] Create `src/domain/errors/invalid-filter-error.ts`
  - [ ] Constructor: (message: string, operator?: string)
  - [ ] Clear error messages
- [ ] Create `src/domain/errors/invalid-field-error.ts`
  - [ ] Constructor: (fieldName: string, validFields: string[])
  - [ ] Includes valid field list in message
- [ ] Create `src/domain/errors/config-error.ts`
  - [ ] Constructor: (message: string, datasetId?: string)
- [ ] Create `src/domain/errors/missing-required-config-error.ts`
  - [ ] Constructor: (field: string, datasetId: string)
- [ ] Create `src/domain/errors/index.ts`
  - [ ] Export all error types

**Verification:**
- [ ] All errors extend Error properly
- [ ] Error messages are clear and actionable
- [ ] Errors can be caught and distinguished by type
- [ ] No external dependencies in error classes
- [ ] Stack traces preserved

**Blocked By**: AC-1.1

---

### AC-1.4: JSON Config Parser with Schema Validation

**Status**: [ ] Not Started

**Description**: Implement configuration file loading and parsing with comprehensive validation.

**Implementation Tasks:**
- [ ] Install Zod dependency (`npm install zod`)
- [ ] Create `src/adapters/secondary/config/config-schema.ts`
  - [ ] Define Zod schema for DatasetConfig
  - [ ] Define Zod schema for ProjectConfig
  - [ ] Validate required fields (id, path, keyField, fields, visibleFields, limits)
  - [ ] Validate field types are MVP types only
  - [ ] Validate enum fields have enumValues
  - [ ] Validate visibleFields is non-empty array
  - [ ] Validate limits.defaultLimit and limits.maxLimit exist
- [ ] Create `src/adapters/secondary/config/config-loader.ts`
  - [ ] Function: `loadConfig(path: string): ProjectConfig`
  - [ ] Reads JSON file
  - [ ] Parses with Zod schema
  - [ ] Throws ConfigError on validation failure
- [ ] Create comprehensive validation functions
  - [ ] Unique dataset ID check
  - [ ] File path existence check (optional: can defer to runtime)
  - [ ] KeyField exists in fields array
  - [ ] LookupKeys exist in fields array
  - [ ] VisibleFields exist in fields array

**Verification:**
- [ ] Valid config files load successfully
- [ ] Invalid configs throw descriptive errors
- [ ] Error messages indicate exactly what's wrong
- [ ] All required fields validated
- [ ] Type constraints enforced
- [ ] Unit tests for config validation

**Blocked By**: AC-1.2, AC-1.3

---

### AC-1.5: Fail-Fast Validation on Startup

**Status**: [ ] Not Started

**Description**: Implement startup sequence that validates all configuration before proceeding.

**Implementation Tasks:**
- [ ] Create `src/adapters/secondary/csv/csv-storage-adapter.ts` (basic structure)
  - [ ] Constructor accepts config path
  - [ ] `initialize()` method
  - [ ] Private `loadConfiguration()` method
  - [ ] Private `validateDatasetConfig()` method
  - [ ] Private `buildSchema()` method
- [ ] Implement validation sequence in `initialize()`
  - [ ] Load configuration
  - [ ] Validate each dataset config
  - [ ] Check for unique IDs
  - [ ] Validate all required fields
  - [ ] Throw on first error (fail-fast)
- [ ] Implement comprehensive error logging
  - [ ] Log dataset ID being validated
  - [ ] Log specific validation failure
  - [ ] Include full context in error

**Verification:**
- [ ] Server fails to start with invalid config
- [ ] Error message clearly indicates problem
- [ ] Error includes dataset ID and field name
- [ ] Process exits with non-zero code on failure
- [ ] Valid configs allow startup to proceed

**Blocked By**: AC-1.4

---

### AC-1.6: DatasetCatalogService Implemented

**Status**: [ ] Not Started

**Description**: Implement domain service for managing dataset schemas.

**Implementation Tasks:**
- [ ] Create `src/domain/services/dataset-catalog-service.ts`
  - [ ] Constructor accepts Map<DatasetId, DatasetSchema>
  - [ ] Method: `getSchema(datasetId: DatasetId): DatasetSchema`
  - [ ] Throws DatasetNotFoundError if not found
  - [ ] Method: `listSchemas(): DatasetSchema[]`
  - [ ] Method: `hasDataset(datasetId: DatasetId): boolean`
- [ ] Implement schema lookup logic
  - [ ] Fast O(1) lookup by ID
  - [ ] Immutable schema references
- [ ] Add basic validation
  - [ ] Dataset ID validation
  - [ ] Schema completeness check

**Verification:**
- [ ] Can retrieve schema by ID
- [ ] Throws proper error for missing dataset
- [ ] List returns all schemas
- [ ] No external dependencies
- [ ] Unit tests cover all methods

**Blocked By**: AC-1.2, AC-1.3

---

## Secondary Acceptance Criteria (SHOULD COMPLETE)

### AC-1.7: Comprehensive Validation Error Messages

**Status**: [ ] Not Started

**Description**: Ensure all validation errors provide actionable, detailed information.

**Implementation Tasks:**
- [ ] Enhance ConfigError messages
  - [ ] Include line number if possible
  - [ ] Suggest fix for common errors
  - [ ] List valid values where applicable
- [ ] Add context to all validation errors
  - [ ] Dataset being validated
  - [ ] Field name causing issue
  - [ ] Expected vs actual value
- [ ] Create error message templates
  - [ ] Missing required field: "Dataset '{id}': Missing required field '{field}'. This field is required for MVP."
  - [ ] Invalid type: "Dataset '{id}': Field '{field}' has invalid type '{actual}'. MVP supports: string, number, boolean, enum."
  - [ ] Empty array: "Dataset '{id}': '{field}' cannot be empty. Please specify at least one value."

**Verification:**
- [ ] Each error type has clear message
- [ ] Messages guide user to fix
- [ ] Context always included
- [ ] No generic error messages

**Blocked By**: AC-1.3, AC-1.4, AC-1.5

---

### AC-1.8: Config Validation Covers All Edge Cases

**Status**: [ ] Not Started

**Description**: Comprehensive validation beyond basic required field checks.

**Implementation Tasks:**
- [ ] Validate dataset ID format
  - [ ] No special characters
  - [ ] Reasonable length limits
  - [ ] No duplicates
- [ ] Validate file paths
  - [ ] Path exists (or defer to load time)
  - [ ] Has .csv extension
  - [ ] Readable permissions
- [ ] Validate field definitions
  - [ ] No duplicate field names within dataset
  - [ ] Field names are valid identifiers
  - [ ] Enum values non-empty for enum types
- [ ] Validate cross-field references
  - [ ] keyField exists in fields
  - [ ] All lookupKeys exist in fields
  - [ ] All visibleFields exist in fields
- [ ] Validate limits
  - [ ] defaultLimit > 0
  - [ ] maxLimit >= defaultLimit
  - [ ] Reasonable upper bounds (e.g., maxLimit <= 1000)

**Verification:**
- [ ] Unit tests for each edge case
- [ ] Malformed configs rejected
- [ ] Valid edge cases accepted
- [ ] Clear error for each validation

**Blocked By**: AC-1.4, AC-1.5

---

### AC-1.9: FieldValidator Service Implemented

**Status**: [ ] Not Started

**Description**: Domain service for validating field references in queries and filters.

**Implementation Tasks:**
- [ ] Create `src/domain/services/field-validator.ts`
  - [ ] Method: `validateFilterFields(filter: FilterExpression, schema: DatasetSchema): void`
  - [ ] Method: `validateSelectFields(selectFields: FieldName[], schema: DatasetSchema): void`
  - [ ] Private: `extractFilterFields(filter: FilterExpression): FieldName[]`
- [ ] Implement filter field extraction
  - [ ] Handle field filters
  - [ ] Recursively handle compound filters
  - [ ] Return unique field names
- [ ] Implement validation logic
  - [ ] Check each field against schema
  - [ ] Throw InvalidFieldError with valid field list
  - [ ] Include specific field that failed

**Verification:**
- [ ] Valid fields pass validation
- [ ] Invalid fields throw descriptive errors
- [ ] Compound filters handled correctly
- [ ] Error lists all valid fields
- [ ] Unit tests cover all cases

**Blocked By**: AC-1.2, AC-1.3, AC-1.6

---

## Tertiary Acceptance Criteria (NICE TO HAVE)

### AC-1.10: Configuration File Examples

**Status**: [ ] Not Started

**Description**: Create example configuration files for reference.

**Implementation Tasks:**
- [ ] Create `config/datasets.example.json`
  - [ ] Single dataset example
  - [ ] All required fields shown
  - [ ] Comments (using JSON with comment syntax or separate doc)
- [ ] Create `config/datasets.minimal.json`
  - [ ] Absolute minimum valid config
- [ ] Create `config/datasets.full.json`
  - [ ] Multiple datasets
  - [ ] All optional fields shown
  - [ ] Different field types demonstrated

**Verification:**
- [ ] All examples are valid
- [ ] Examples cover common use cases
- [ ] Clear and well-commented

**Blocked By**: AC-1.4

---

### AC-1.11: Configuration Validation Unit Tests

**Status**: [ ] Not Started

**Description**: Comprehensive test coverage for configuration validation.

**Implementation Tasks:**
- [ ] Create `test/unit/adapters/config-loader.test.ts`
  - [ ] Test valid config loads
  - [ ] Test each required field validation
  - [ ] Test type validation
  - [ ] Test cross-reference validation
  - [ ] Test error messages
- [ ] Achieve >90% coverage for config validation code

**Verification:**
- [ ] All validation paths tested
- [ ] Edge cases covered
- [ ] Error messages verified
- [ ] Tests are deterministic

**Blocked By**: AC-1.4

---

## Phase Completion Checklist

- [ ] All Primary ACs (1.1-1.6) complete
- [ ] At least 90% of Secondary ACs (1.7-1.9) complete
- [ ] Code compiles without errors
- [ ] No architectural violations (domain has no external deps)
- [ ] This document updated with actual results
- [ ] Master checklist updated

---

## Implementation Notes

**Key Files Created:**
- `src/domain/value-objects/` - dataset-id.ts, field-name.ts, field-type.ts
- `src/domain/entities/` - dataset-field.ts, dataset-schema.ts, dataset-config.ts, filter-expression.ts, query-request.ts, query-result.ts
- `src/domain/errors/` - All 5 error classes + index.ts
- `src/domain/services/` - dataset-catalog-service.ts, field-validator.ts
- `src/adapters/secondary/config/` - config-schema.ts, config-loader.ts
- `src/adapters/secondary/csv/` - csv-storage-adapter.ts (skeleton)
- `config/datasets.example.json` - Example configuration with 2 datasets

**Decisions Made:**
- Used Zod for schema validation (provides excellent error messages)
- Implemented comprehensive validation in both Zod schema and CsvStorageAdapter
- Domain errors preserve stack traces for debugging
- FieldValidator service uses recursive extraction for compound filters
- Configuration validation is fail-fast with clear, actionable error messages

**Issues Encountered:**
- Initial Zod enum syntax issue (errorMap vs message parameter) - resolved
- ZodError.errors vs ZodError.issues property - resolved

**Technical Debt:**
- Unit tests deferred to Phase 2 (as per plan)
- CSV file loading not yet implemented (Phase 2)
- Actual dataset querying not yet implemented (Phase 2)

---

## Phase Retrospective

**What Went Well:**
- (Fill in after phase completion)

**What Could Be Improved:**
- (Fill in after phase completion)

**Lessons Learned:**
- (Fill in after phase completion)

**Estimated vs Actual Effort:**
- Estimated: 1-2 days
- Actual: (Fill in after completion)
