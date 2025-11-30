# Phase 2: Core Use Cases - Detailed Checklist

**Phase**: 2 of 6  
**Status**: 🔄 In Progress  
**Started**: 2025-11-30  
**Completed**: -  
**Estimated Effort**: 2-3 days  
**Actual Effort**: ~2 hours (in progress)

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

**Status**: [ ] Not Started

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
- [ ] All use cases compile without errors
- [ ] All use cases depend only on ports and domain
- [ ] No infrastructure code in use cases
- [ ] Use cases properly orchestrate domain logic
- [ ] Error handling implemented

**Blocked By**: Phase 1 complete

---

### AC-2.2: MVP Filter Logic Implemented

**Status**: [ ] Not Started

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
- [ ] Eq operator works correctly
- [ ] Contains operator works for strings
- [ ] And compound combines filters correctly
- [ ] Unsupported operators throw errors
- [ ] Empty filter (undefined) returns all rows
- [ ] Unit tests cover all operator combinations

**Blocked By**: Phase 1 complete

---

### AC-2.3: Projection Logic Working

**Status**: [ ] Not Started

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
- [ ] Projection includes only specified fields
- [ ] Field order matches request
- [ ] Empty field list handled correctly
- [ ] Projection doesn't mutate original rows
- [ ] Unit tests cover edge cases

**Blocked By**: Phase 1 complete

---

### AC-2.4: Field Validation Integrated

**Status**: [ ] Not Started

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
- [ ] Invalid filter fields caught early
- [ ] Invalid select fields caught early
- [ ] Error messages list valid fields
- [ ] Validation doesn't slow happy path
- [ ] Unit tests verify validation called

**Blocked By**: AC-2.1, Phase 1 AC-1.9

---

### AC-2.5: Unit Tests for Domain Logic

**Status**: [ ] Not Started

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
- [ ] All domain services have tests
- [ ] Test coverage >85% for domain
- [ ] Tests are fast (<100ms total)
- [ ] Tests are deterministic
- [ ] Edge cases covered

**Blocked By**: AC-2.2, AC-2.3

---

### AC-2.6: Unit Tests for Use Cases with Mocked Ports

**Status**: [ ] Not Started

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
- [ ] All use cases have comprehensive tests
- [ ] Mocks properly isolate use case logic
- [ ] All happy paths tested
- [ ] All error paths tested
- [ ] Test coverage >80% for use cases

**Blocked By**: AC-2.1, AC-2.4

---

## Secondary Acceptance Criteria (SHOULD COMPLETE)

### AC-2.7: Error Handling Comprehensive

**Status**: [ ] Not Started

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
- [ ] Each use case documents error handling
- [ ] Tests verify error scenarios
- [ ] Error messages are clear
- [ ] No generic errors thrown

**Blocked By**: AC-2.1

---

### AC-2.8: Edge Cases Covered in Tests

**Status**: [ ] Not Started

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
- [ ] All edge cases have explicit tests
- [ ] Behavior documented for edge cases
- [ ] No crashes on edge cases
- [ ] Performance acceptable on large datasets

**Blocked By**: AC-2.5, AC-2.6

---

### AC-2.9: Test Coverage >80% for Domain and Use Cases

**Status**: [ ] Not Started

**Description**: Achieve high test coverage to ensure code quality.

**Implementation Tasks:**
- [ ] Set up coverage tooling (jest --coverage or nyc)
- [ ] Measure current coverage
- [ ] Identify uncovered lines
- [ ] Add tests for uncovered code
- [ ] Document any intentionally uncovered code
- [ ] Add coverage checks to CI (if applicable)

**Verification:**
- [ ] Coverage report generated
- [ ] Domain layer >85% coverage
- [ ] Use case layer >80% coverage
- [ ] Coverage tracked in commits

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

- [ ] All Primary ACs (2.1-2.6) complete
- [ ] All Secondary ACs (2.7-2.9) complete
- [ ] Code compiles without errors
- [ ] All tests passing
- [ ] Test coverage meets targets
- [ ] This document updated with actual results
- [ ] Master checklist updated

---

## Implementation Notes

**Key Files Created:**
- (List will be populated during implementation)

**Decisions Made:**
- (Document any implementation decisions made during this phase)

**Issues Encountered:**
- (Track any blockers or challenges)

**Technical Debt:**
- (Note any shortcuts or TODOs for future)

---

## Phase Retrospective

**What Went Well:**
- (Fill in after phase completion)

**What Could Be Improved:**
- (Fill in after phase completion)

**Lessons Learned:**
- (Fill in after phase completion)

**Estimated vs Actual Effort:**
- Estimated: 2-3 days
- Actual: (Fill in after completion)
