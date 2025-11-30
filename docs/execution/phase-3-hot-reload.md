# Phase 3: Hot Reload Support - Detailed Checklist

**Phase**: 3 of 6  
**Status**: ⬜ Not Started  
**Started**: -  
**Completed**: -  
**Estimated Effort**: 1-2 days  
**Actual Effort**: -

---

## Phase Overview

Implement file watching and hot reload capabilities for configuration and CSV files. Ensures datasets are loaded on-demand without memory caching.

**Key Deliverables:**
- File watcher for config and CSV files
- Reload mechanism in CSV adapter
- On-demand CSV loading
- Integration tests for hot reload

**Dependencies**: Phase 1 complete

---

## Primary Acceptance Criteria (MUST COMPLETE)

### AC-3.1: File Watcher for Config and CSV Files

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Choose file watching library (`chokidar` recommended)
- [ ] Install dependency: `npm install chokidar`
- [ ] Update `CsvDatasetStorageAdapter`
  - [ ] Add `FileWatcher` instance
  - [ ] Method: `setupFileWatcher()`
  - [ ] Watch config file path
  - [ ] Watch all CSV file paths from config
- [ ] Configure watcher options
  - [ ] Ignore initial file detection
  - [ ] Debounce changes (300ms)
  - [ ] Handle file not found gracefully

**Verification:**
- [ ] Watcher detects config file changes
- [ ] Watcher detects CSV file changes
- [ ] No memory leaks from watcher
- [ ] Watcher can be stopped/cleaned up

**Blocked By**: Phase 1 AC-1.5

---

### AC-3.2: Reload Mechanism in CSV Adapter

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Implement `DatasetStoragePort.reload()` method
  - [ ] Clear existing schema cache
  - [ ] Re-load configuration
  - [ ] Re-validate all datasets
  - [ ] Re-build schema map
- [ ] Implement `DatasetStoragePort.watchForChanges(callback)`
  - [ ] Register callback for file changes
  - [ ] Trigger callback when changes detected
  - [ ] Include changed file path in callback
- [ ] Wire watcher to reload
  - [ ] On config change → full reload
  - [ ] On CSV change → reload affected dataset (or full reload for MVP)
- [ ] Handle reload errors
  - [ ] Log error details
  - [ ] Preserve previous valid state
  - [ ] Don't crash server

**Verification:**
- [ ] Config changes trigger reload
- [ ] CSV changes trigger reload
- [ ] Invalid changes don't crash server
- [ ] Valid state preserved on error
- [ ] Reload completes in <1s

**Blocked By**: AC-3.1

---

### AC-3.3: On-Demand CSV Loading (No Memory Caching)

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Implement `loadCsvFile(schema)` method
  - [ ] Read CSV file from disk
  - [ ] Parse CSV using library (e.g., `csv-parse`)
  - [ ] Type coercion based on schema
  - [ ] Return rows as array
  - [ ] Don't store in memory
- [ ] Update `queryDatasetRaw()`
  - [ ] Call `loadCsvFile()` each time
  - [ ] Apply limit if provided
  - [ ] Return results
- [ ] Update `getRowByKey()`
  - [ ] Call `loadCsvFile()`
  - [ ] Find matching row
  - [ ] Return result
- [ ] Install CSV parsing library: `npm install csv-parse`

**Verification:**
- [ ] CSV loaded on each query
- [ ] No CSV data cached in memory
- [ ] Type coercion works correctly
- [ ] Performance acceptable (<50ms for 1000 rows)
- [ ] Multiple queries work correctly

**Blocked By**: Phase 1 AC-1.5

---

### AC-3.4: Hot Reload Tested with Valid Config Changes

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Create test: `test/integration/hot-reload.test.ts`
- [ ] Test: Config file modified
  - [ ] Start with valid config
  - [ ] Modify config (add field, change limit, etc.)
  - [ ] Verify reload triggered
  - [ ] Verify new config active
  - [ ] Verify queries use new config
- [ ] Test: CSV file modified
  - [ ] Start with valid CSV
  - [ ] Modify CSV (add row, change value, etc.)
  - [ ] Verify reload triggered
  - [ ] Verify queries return new data
- [ ] Test: Multiple rapid changes
  - [ ] Verify debouncing works
  - [ ] Verify only one reload occurs

**Verification:**
- [ ] Config changes reflected immediately
- [ ] CSV changes reflected immediately
- [ ] No data corruption during reload
- [ ] Tests are reliable

**Blocked By**: AC-3.1, AC-3.2, AC-3.3

---

## Secondary Acceptance Criteria (SHOULD COMPLETE)

### AC-3.5: Hot Reload Error Handling

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Test: Invalid config after reload
  - [ ] Modify config to be invalid
  - [ ] Verify error logged
  - [ ] Verify previous valid state preserved
  - [ ] Verify server still operational
- [ ] Test: Missing CSV file
  - [ ] Delete CSV file
  - [ ] Verify error logged
  - [ ] Verify previous state preserved
- [ ] Test: Corrupted CSV file
  - [ ] Modify CSV to be malformed
  - [ ] Verify error logged
  - [ ] Verify previous state preserved

**Verification:**
- [ ] All error scenarios tested
- [ ] Server never crashes from reload errors
- [ ] Clear error messages logged
- [ ] Previous state always preserved

**Blocked By**: AC-3.2, AC-3.4

---

### AC-3.6: Reload Preserves Valid State on Error

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Implement state preservation logic
  - [ ] Save current schema map before reload
  - [ ] Attempt reload
  - [ ] If error, restore previous schema map
  - [ ] Log what was preserved
- [ ] Test state preservation
  - [ ] Query works before bad reload
  - [ ] Bad reload attempted
  - [ ] Query still works after
  - [ ] Returns pre-reload data

**Verification:**
- [ ] Queries work after failed reload
- [ ] No partial state corruption
- [ ] Clear logging of preservation

**Blocked By**: AC-3.5

---

### AC-3.7: Integration Tests for Hot Reload

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Test full reload workflow
  - [ ] Start server with config
  - [ ] Execute queries
  - [ ] Modify config
  - [ ] Wait for reload
  - [ ] Execute queries again
  - [ ] Verify new behavior
- [ ] Test performance of reload
  - [ ] Measure reload time
  - [ ] Verify <1s for MVP datasets
- [ ] Test concurrent access during reload
  - [ ] Execute query during reload
  - [ ] Verify no errors
  - [ ] Verify consistent results

**Verification:**
- [ ] Integration tests cover full workflow
- [ ] Tests run reliably
- [ ] Performance meets requirements

**Blocked By**: AC-3.4

---

## Tertiary Acceptance Criteria (NICE TO HAVE)

### AC-3.8: Reload Notification Mechanism

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Add event emitter to adapter
- [ ] Emit 'reload-start' event
- [ ] Emit 'reload-complete' event
- [ ] Emit 'reload-error' event
- [ ] Document events for consumers

**Verification:**
- [ ] Events emitted correctly
- [ ] Consumers can listen to events

**Blocked By**: AC-3.2

---

## Phase Completion Checklist

- [ ] All Primary ACs (3.1-3.4) complete
- [ ] At least 80% of Secondary ACs (3.5-3.7) complete
- [ ] Hot reload working reliably
- [ ] Error scenarios handled gracefully
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
- Estimated: 1-2 days
- Actual: (Fill in after completion)
