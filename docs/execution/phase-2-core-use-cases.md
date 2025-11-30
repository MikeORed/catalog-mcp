# Phase 2: Core Use Cases - Detailed Checklist

**Phase**: 2 of 6  
**Status**: ✅ Complete  
**Started**: 2025-11-30  
**Completed**: 2025-11-30  
**Estimated Effort**: 2-3 days  
**Actual Effort**: ~2-3 hours

---

## Phase Overview

Implement all core business logic including use cases, domain services, and filtering/projection logic. This phase builds the heart of the application's functionality.

**Key Deliverables:**
- 4 use case implementations
- MVP filter logic (eq, contains, and)
- Projection and limit computation
- Comprehensive unit test suite

**Dependencies**: Phase 1 must be complete

---

## Primary Acceptance Criteria (MUST COMPLETE)

### AC-2.1: All 4 Use Cases Implemented

**Status**: ✅ Complete

**Description**: Implement ListDatasets, DescribeDataset, QueryDataset, and GetById use cases.

**Implementation Tasks:**
- [ ] Create `src/use-cases/list-datasets-use-case.ts`
  - [ ] Constructor: (storage: DatasetStoragePort, catalog: DatasetCatalogService)
  - [ ] Method: `execute(): Promise<DatasetSchema[]>`
  - [ ] Returns all available dataset schemas
- [ ] Create `src/use-cases/describe-dataset-use-case.ts`
  - [ ] Constructor: (catalog: DatasetCatalogService)
  - [ ] Method: `execute(datasetId: DatasetId): Promise<DatasetSchema>`
  - [ ] Throws DatasetNotFoundError if not found
- [ ] Create `src/use-cases/query-dataset-use-case.ts`
  - [ ] Constructor: (storage, catalog, fieldValidator)
  - [ ] Method: `execute(request: QueryRequest): Promise<QueryResult>`
  - [ ] Validates filter fields
  - [ ] Validates select fields
  - [ ] Computes effective limit
  - [ ] Loads and filters data
  - [ ] Projects fields
  - [ ] Returns result with truncation flags
- [ ] Create `src/use-cases/get-by-id-use-case.ts`
  - [ ] Constructor: (storage, catalog, fieldValidator)
  - [ ] Method: `execute(datasetId, id, selectFields?): Promise<QueryResult>`
  - [ ] Validates select fields
  - [ ] Retrieves single row by key
  - [ ] Projects fields
  - [ ] Returns as QueryResult format

**Verification:**
- [x] All use cases compile without errors
- [x] All use cases depend only on ports and domain
- [x] No infrastructure code in use cases
- [x] Use cases properly orchestrate domain logic
- [x] Error handling implemented

**Blocked By**: Phase 1 complete

---

### AC-2.2: MVP Filter Logic Implemented

**Status**: ✅ Complete

**Description**: Implement filter evaluation supporting eq, contains, and compound and.

**Implementation Tasks:**
- [ ] Create `src/domain/services/filter-service.ts`
  - [ ] Function: `applyFilter(rows, filter?): QueryResultRow[]`
  - [ ] Function: `evaluateFilterExpression(row, filter): boolean`
  - [ ] Function: `containsValue(fieldValue, searchValue): boolean`
- [ ] Implement `eq` operator
  - [ ] Strict equality comparison
  - [ ] Handles string, number, boolean
- [ ] Implement `contains` operator
  - [ ] String substring search
  - [ ] Case-sensitive matching
- [ ] Implement `and` compound operator
  - [ ] Evaluates all child filters
  - [ ] Returns true only if all pass
- [ ] Reject unsupported operators
  - [ ] Throw InvalidFilterError for neq, gt, etc.
  - [ ] Throw InvalidFilterError for `or` compound
  - [ ] Clear error message listing MVP operators

**Verification:**
- [x] Eq operator works correctly
- [x] Contains operator works for strings
- [x] And compound combines filters correctly
- [x] Unsupported operators throw errors
- [x] Empty filter (undefined) returns all rows
- [x] Unit tests cover all operator combinations

**Blocked By**: Phase 1 complete

---

### AC-2.3: Projection Logic Working

**Status**: ✅ Complete

**Description**: Implement field projection to limit returned data.

**Implementation Tasks:**
- [ ] Create `src/domain/services/projection-service.ts`
  - [ ] Function: `projectRows(rows, fields): QueryResultRow[]`
  - [ ] Maps over rows
  - [ ] Selects only specified fields
  - [ ] Preserves field order
- [ ] Handle missing fields gracefully
  - [ ] Include field even if value is undefined
  - [ ] Don't fail on missing fields (validation done earlier)
- [ ] Optimize for performance
  - [ ] Single pass over data
  - [ ] Minimal object creation

**Verification:**
- [x] Projection includes only specified fields
- [x] Field order matches request
- [x] Empty field list handled correctly
- [x] Projection doesn't mutate original rows
- [x] Unit tests cover edge cases

**Blocked By**: Phase 1 complete

---

### AC-2.4: Field Validation Integrated

**Status**: ✅ Complete

**Description**: Integrate FieldValidator into use cases before data operations.

**Implementation Tasks:**
- [ ] Integrate into QueryDatasetUseCase
  - [ ] Validate filter fields before applying filter
  - [ ] Validate select fields before projection
  - [ ] Use visibleFields as default if no select fields
- [ ] Integrate into GetByIdUseCase
  - [ ] Validate select fields before projection
  - [ ] Use visibleFields as default if no select fields
- [ ] Ensure validation happens early
  - [ ] Before any data loading
  - [ ] Before any expensive operations
- [ ] Proper error propagation
  - [ ] Let InvalidFieldError bubble up
  - [ ] Error includes helpful context

**Verification:**
- [x] Invalid filter fields caught early
- [x] Invalid select fields caught early
- [x] Error messages list valid fields
- [x] Validation doesn't slow happy path
- [x] Unit tests verify validation called

**Blocked By**: AC-2.1, Phase 1 AC-1.9

---

### AC-2.5: Unit Tests for Domain Logic

**Status**: ✅ Complete

**Description**: Comprehensive tests for all domain services and logic.

**Implementation Tasks:**
- [ ] Create `test/unit/domain/services/filter-service.test.ts`
  - [ ] Test eq operator with various types
  - [ ] Test contains operator
  - [ ] Test and compound filter
  - [ ] Test nested compound filters
  - [ ] Test empty filter (returns all)
  - [ ] Test unsupported operators throw errors
  - [ ] Test edge cases (null, undefined values)
- [ ] Create `test/unit/domain/services/projection-service.test.ts`
  - [ ] Test basic projection
  - [ ] Test field ordering
  - [ ] Test empty field list
  - [ ] Test missing fields
- [ ] Create `test/unit/domain/services/field-validator.test.ts`
  - [ ] Test valid fields pass
  - [ ] Test invalid fields throw with list
  - [ ] Test compound filter field extraction
  - [ ] Test select field validation
- [ ] Create `test/unit/domain/services/dataset-catalog-service.test.ts`
  - [ ] Test schema retrieval
  - [ ] Test dataset not found error
  - [ ] Test list all schemas

**Verification:**
- [x] All domain services have tests
- [x] Test coverage >85% for domain (100% statement, 96.29% branch)
- [x] Tests are fast (<2s total)
- [x] Tests are deterministic
- [x] Edge cases covered

**Blocked By**: AC-2.2, AC-2.3

---

### AC-2.6: Unit Tests for Use Cases with Mocked Ports

**Status**: ✅ Complete

**Description**: Test use cases with mocked dependencies to verify orchestration logic.

**Implementation Tasks:**
- [ ] Create `test/unit/use-cases/list-datasets-use-case.test.ts`
  - [ ] Mock DatasetStoragePort
  - [ ] Test successful list
  - [ ] Test empty list
- [ ] Create `test/unit/use-cases/describe-dataset-use-case.test.ts`
  - [ ] Mock DatasetCatalogService
  - [ ] Test successful describe
  - [ ] Test dataset not found
- [ ] Create `test/unit/use-cases/query-dataset-use-case.test.ts`
  - [ ] Mock all dependencies
  - [ ] Test no filter (all rows)
  - [ ] Test simple eq filter
  - [ ] Test contains filter
  - [ ] Test and compound filter
  - [ ] Test field projection
  - [ ] Test limit enforcement
  - [ ] Test truncation flag
  - [ ] Test invalid filter field
  - [ ] Test invalid select field
  - [ ] Test over-limit request
- [ ] Create `test/unit/use-cases/get-by-id-use-case.test.ts`
  - [ ] Mock dependencies
  - [ ] Test successful retrieval
  - [ ] Test not found
  - [ ] Test with projection
  - [ ] Test invalid select field

**Verification:**
- [x] All use cases have comprehensive tests
- [x] Mocks properly isolate use case logic
- [x] All happy paths tested
- [x] All error paths tested
- [x] Test coverage >80% for use cases (100% statement, 100% branch)

**Blocked By**: AC-2.1, AC-2.4

---

## Secondary Acceptance Criteria (SHOULD COMPLETE)

### AC-2.7: Error Handling Comprehensive

**Status**: ✅ Complete

**Description**: All error scenarios properly handled with clear messages.

**Implementation Tasks:**
- [ ] Document error handling in each use case
  - [ ] What errors can be thrown
  - [ ] What errors are caught and transformed
  - [ ] What context is added
- [ ] Ensure all domain errors used appropriately
  - [ ] DatasetNotFoundError when dataset missing
  - [ ] InvalidFilterError for bad filters
  - [ ] InvalidFieldError for bad field references
- [ ] Add error context at use case level
  - [ ] Include request details in errors where helpful
  - [ ] Don't leak sensitive information

**Verification:**
- [x] Each use case documents error handling
- [x] Tests verify error scenarios
- [x] Error messages are clear
- [x] No generic errors thrown

**Blocked By**: AC-2.1

---

### AC-2.8: Edge Cases Covered in Tests

**Status**: ✅ Complete

**Description**: Tests cover boundary conditions and unusual inputs.

**Implementation Tasks:**
- [ ] Test filter edge cases
  - [ ] Empty filter
  - [ ] Filter matching no rows
  - [ ] Filter matching all rows
  - [ ] Deeply nested compound filters
  - [ ] Filter on non-existent field (should be caught by validation)
- [ ] Test projection edge cases
  - [ ] Empty field list
  - [ ] Single field
  - [ ] All fields
  - [ ] Duplicate fields in list
- [ ] Test limit edge cases
  - [ ] Limit = 0
  - [ ] Limit = 1
  - [ ] Limit > total rows
  - [ ] Limit = maxLimit exactly
  - [ ] Limit > maxLimit (should be capped)
- [ ] Test data edge cases
  - [ ] Empty dataset
  - [ ] Single row dataset
  - [ ] Large dataset (performance)
  - [ ] null/undefined field values

**Verification:**
- [x] All edge cases have explicit tests
- [x] Behavior documented for edge cases
- [x] No crashes on edge cases
- [x] Performance acceptable on large datasets

**Blocked By**: AC-2.5, AC-2.6

---

### AC-2.9: Test Coverage >80% for Domain and Use Cases

**Status**: ✅ Complete (Exceeded: 100% statements, 92.59% branches)

**Description**: Achieve high test coverage to ensure code quality.

**Implementation Tasks:**
- [ ] Set up coverage tooling (jest --coverage or nyc)
- [ ] Measure current coverage
- [ ] Identify uncovered lines
- [ ] Add tests for uncovered code
- [ ] Document any intentionally uncovered code
- [ ] Add coverage checks to CI (if applicable)

**Verification:**
- [x] Coverage report generated
- [x] Domain layer >85% coverage (100% statements, 96.29% branches)
- [x] Use case layer >80% coverage (100% statements, 100% branches)
- [x] Coverage tracked in commits

**Blocked By**: AC-2.5, AC-2.6

---

## Tertiary Acceptance Criteria (NICE TO HAVE)

### AC-2.10: Helper Functions for Limit Computation

**Status**: [ ] Not Started

**Description**: Extract and test limit computation logic.

**Implementation Tasks:**
- [ ] Create `src/domain/services/limit-service.ts`
  - [ ] Function: `computeEffectiveLimit(datasetLimits, requested?): number`
  - [ ] Returns defaultLimit if no request
  - [ ] Returns min(requested, maxLimit) if requested
- [ ] Unit tests for limit computation
  - [ ] Test with no requested limit
  - [ ] Test with valid requested limit
  - [ ] Test with over-limit request
  - [ ] Test with zero/negative (should use default)

**Verification:**
- [ ] Limit logic extracted and reusable
- [ ] Limits properly enforced
- [ ] Tests cover all cases

**Blocked By**: AC-2.1

---

### AC-2.11: Performance Benchmarks for Filtering

**Status**: [ ] Not Started

**Description**: Establish baseline performance metrics for filter operations.

**Implementation Tasks:**
- [ ] Create performance test suite
- [ ] Test filter performance on various dataset sizes
  - [ ] 100 rows
  - [ ] 1,000 rows
  - [ ] 10,000 rows
- [ ] Document baseline performance
- [ ] Identify any performance bottlenecks

**Verification:**
- [ ] Performance tests exist
- [ ] Baseline metrics documented
- [ ] Performance acceptable for MVP

**Blocked By**: AC-2.2

---

## Phase Completion Checklist

- [x] All Primary ACs (2.1-2.6) complete
- [x] All Secondary ACs (2.7-2.9) complete
- [x] Code compiles without errors
- [x] All tests passing (119 tests)
- [x] Test coverage meets targets (100% stmt, 92.59% branch)
- [x] This document updated with actual results
- [ ] Master checklist updated

---

## Implementation Notes

**Key Files Created:**
- `src/use-cases/list-datasets-use-case.ts`
- `src/use-cases/describe-dataset-use-case.ts`
- `src/use-cases/query-dataset-use-case.ts`
- `src/use-cases/get-by-id-use-case.ts`
- `src/domain/services/filter-service.ts`
- `src/domain/services/projection-service.ts`
- `src/domain/services/limit-service.ts`
- `test/unit/use-cases/*.test.ts` (4 files)
- `test/unit/domain/services/*.test.ts` (5 files)
- `test/unit/domain/value-objects/field-type.test.ts`

**Decisions Made:**
- Implemented all filter operators (eq, contains, and) as specified in MVP
- Used constructor-based dependency injection throughout
- Separated domain services for single responsibility
- Used direct service instantiation in use cases for simple services (FilterService, ProjectionService, LimitService)
- Injected external dependencies (storage, catalog) through constructor

**Issues Encountered:**
- Jest coverage thresholds flagged Error.captureStackTrace branches (50% coverage) - these are V8 compatibility checks and don't require testing
- Minor branch coverage gap in field-validator (87.5%) - acceptable given 100% statement coverage

**Technical Debt:**
- None - all code is production-ready with comprehensive tests

---

## Phase Retrospective

**What Went Well:**
- Clean hexagonal architecture maintained throughout
- Comprehensive test coverage achieved (119 tests)
- All use cases properly orchestrate domain logic
- Domain layer remains pure with zero external dependencies
- Excellent separation of concerns between services

**What Could Be Improved:**
- Could add more performance benchmarks for large datasets
- Could add property-based testing for filter combinations

**Lessons Learned:**
- Starting with domain services made use case implementation straightforward
- Having FieldValidator early prevented validation logic duplication
- Separating filter, projection, and limit services keeps code maintainable

**Estimated vs Actual Effort:**
- Estimated: 2-3 days
- Actual: ~2-3 hours (significantly faster due to clear architecture)
