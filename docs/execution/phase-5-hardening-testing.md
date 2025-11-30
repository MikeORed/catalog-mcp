# Phase 5: Hardening & Testing - Detailed Checklist

**Phase**: 5 of 6  
**Status**: ⬜ Not Started  
**Started**: -  
**Completed**: -  
**Estimated Effort**: 2-3 days  
**Actual Effort**: -

---

## Phase Overview

Comprehensive testing, enforcement of limits, and overall system hardening. Ensure the system is production-ready with full test coverage.

**Key Deliverables:**
- Per-dataset limit enforcement
- Truncation flags in responses
- Integration tests with real datasets
- Full test coverage (≥85%)

**Dependencies**: Phases 2, 3, 4 complete

---

## Primary Acceptance Criteria (MUST COMPLETE)

### AC-5.1: Per-Dataset Limits Enforced

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Verify limit enforcement in QueryDatasetUseCase
  - [ ] defaultLimit used when no limit specified
  - [ ] maxLimit caps any requested limit
  - [ ] Limit applied before projection
- [ ] Test limit enforcement
  - [ ] Test no limit → uses defaultLimit
  - [ ] Test limit < maxLimit → uses requested
  - [ ] Test limit > maxLimit → capped to maxLimit
  - [ ] Test limit = 0 → uses defaultLimit
  - [ ] Test with different dataset limits
- [ ] Verify limits in GetByIdUseCase
  - [ ] Single row always returned (or error)
  - [ ] No limit parameter needed

**Verification:**
- [ ] Limits enforced correctly in all cases
- [ ] Tests cover all limit scenarios
- [ ] Different datasets can have different limits

**Blocked By**: Phase 2 complete

---

### AC-5.2: Truncation Flags in Responses

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Verify QueryResult includes truncation info
  - [ ] `limitApplied` boolean always set
  - [ ] `truncated` boolean indicates more data exists
  - [ ] `totalMatched` shows pre-limit count
- [ ] Test truncation scenarios
  - [ ] Results < limit → not truncated
  - [ ] Results = limit → might be truncated (check total)
  - [ ] Results > limit → truncated
  - [ ] Test with filters that reduce results
- [ ] Verify flags through MCP layer
  - [ ] Flags included in tool responses
  - [ ] Flags are accurate

**Verification:**
- [ ] Truncation flags always accurate
- [ ] Client can detect when more data exists
- [ ] Tests cover all truncation scenarios

**Blocked By**: Phase 2, Phase 4 complete

---

### AC-5.3: Integration Tests with Sample Datasets

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Create sample datasets in `test/fixtures/`
  - [ ] `test/fixtures/config/test-datasets.json`
  - [ ] `test/fixtures/data/small-dataset.csv` (10 rows)
  - [ ] `test/fixtures/data/medium-dataset.csv` (100 rows)
  - [ ] `test/fixtures/data/types-dataset.csv` (various types)
- [ ] Create `test/integration/end-to-end.test.ts`
  - [ ] Test full workflow: start → config → query → results
  - [ ] Test all 4 tools with real data
  - [ ] Test filters on real data
  - [ ] Test projections on real data
  - [ ] Test limits on real data
- [ ] Test error scenarios with real setup
  - [ ] Invalid dataset ID
  - [ ] Invalid field names
  - [ ] Invalid filter operators
  - [ ] File not found

**Verification:**
- [ ] Integration tests use realistic data
- [ ] Tests cover happy paths
- [ ] Tests cover error paths
- [ ] Tests are repeatable and reliable

**Blocked By**: Phase 2, Phase 3, Phase 4 complete

---

### AC-5.4: Full Test Coverage Achieved

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Measure current test coverage
  - [ ] Run: `npm test -- --coverage`
  - [ ] Review coverage report
- [ ] Identify coverage gaps
  - [ ] Uncovered lines in domain
  - [ ] Uncovered lines in use cases
  - [ ] Uncovered lines in adapters
- [ ] Add tests to close gaps
  - [ ] Focus on domain first (target >90%)
  - [ ] Use cases next (target >85%)
  - [ ] Adapters last (target >80%)
- [ ] Document intentionally uncovered code
  - [ ] Error handling for impossible cases
  - [ ] Defensive code that shouldn't execute
- [ ] Configure coverage thresholds
  - [ ] Add to package.json or jest.config.js
  - [ ] Fail build if coverage drops

**Verification:**
- [ ] Domain coverage ≥90%
- [ ] Use case coverage ≥85%
- [ ] Adapter coverage ≥80%
- [ ] Overall coverage ≥85%
- [ ] Coverage enforced in CI/build

**Blocked By**: All previous test ACs

---

## Secondary Acceptance Criteria (SHOULD COMPLETE)

### AC-5.5: Fail-Fast Validation Tested Thoroughly

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Test all config validation scenarios
  - [ ] Missing required fields
  - [ ] Invalid field types
  - [ ] Duplicate dataset IDs
  - [ ] Invalid file paths
  - [ ] Empty visibleFields
  - [ ] Invalid limits (0, negative, maxLimit < defaultLimit)
  - [ ] Missing enum values for enum types
- [ ] Verify server fails on each invalid config
- [ ] Verify error messages are clear
- [ ] Test config examples are all valid

**Verification:**
- [ ] All validation scenarios tested
- [ ] Server always fails fast on invalid config
- [ ] Error messages help fix issues

**Blocked By**: Phase 1 tests

---

### AC-5.6: Field Validation Error Messages Tested

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Test invalid filter fields
  - [ ] Verify error includes field name
  - [ ] Verify error lists valid fields
  - [ ] Test with nested filters
- [ ] Test invalid select fields
  - [ ] Verify error includes field name
  - [ ] Verify error lists valid fields
- [ ] Test error messages through MCP
  - [ ] Verify MCP client receives helpful message
  - [ ] Verify format is user-friendly

**Verification:**
- [ ] All field validation errors tested
- [ ] Error messages consistently helpful
- [ ] Valid field lists always included

**Blocked By**: Phase 2, Phase 4 tests

---

### AC-5.7: MVP Filter Operator Constraints Verified

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Test that only MVP operators work
  - [ ] eq works
  - [ ] contains works
  - [ ] and works
  - [ ] neq rejected
  - [ ] gt, gte, lt, lte rejected
  - [ ] or rejected
- [ ] Test rejection at multiple layers
  - [ ] MCP filter parser rejects
  - [ ] Domain filter service rejects if it gets through
- [ ] Verify error messages mention MVP constraints

**Verification:**
- [ ] Only MVP operators accepted
- [ ] Non-MVP operators consistently rejected
- [ ] Error messages educate about MVP limits

**Blocked By**: Phase 2, Phase 4 tests

---

### AC-5.8: Performance Baseline Established

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Create performance test suite
  - [ ] Test query on 100 rows: <10ms
  - [ ] Test query on 1000 rows: <50ms
  - [ ] Test query on 10000 rows: <500ms
- [ ] Test filter performance
  - [ ] Simple filter vs no filter
  - [ ] Compound filter performance
- [ ] Test hot reload performance
  - [ ] Reload time <1s for typical config
- [ ] Document baseline metrics
  - [ ] Add to docs/dev/performance.md

**Verification:**
- [ ] Performance tests exist
- [ ] Baseline metrics documented
- [ ] Performance acceptable for MVP

**Blocked By**: AC-5.3

---

## Tertiary Acceptance Criteria (NICE TO HAVE)

### AC-5.9: Stress Testing

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Test with very large datasets (100K+ rows)
- [ ] Test with many concurrent queries
- [ ] Test rapid filter changes
- [ ] Identify any memory leaks
- [ ] Document limitations found

**Verification:**
- [ ] System stable under load
- [ ] Limitations documented
- [ ] Graceful degradation

**Blocked By**: AC-5.3

---

## Phase Completion Checklist

- [ ] All Primary ACs (5.1-5.4) complete
- [ ] All Secondary ACs (5.5-5.8) complete
- [ ] Test coverage ≥85%
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] This document updated with actual results
- [ ] Master checklist updated

---

## Implementation Notes

**Key Files Created:**
- (List will be populated during implementation)

**Decisions Made:**
- (Document any implementation decisions)

**Issues Encountered:**
- (Track blockers or challenges)

**Technical Debt:**
- (Note any shortcuts)

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
