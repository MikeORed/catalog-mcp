# Phase 3: Hot Reload Support - Detailed Checklist

**Phase**: 3 of 6  
**Status**: ⬜ Not Started  
**Started**: -  
**Completed**: -  
**Estimated Effort**: 0.5-1 day  
**Actual Effort**: -

---

## Phase Overview

Implement configuration file watching and atomic schema reload. CSV data is already loaded on-demand without memory caching (implemented in Phase 1), so CSV content changes are immediately visible without any reload mechanism. This phase focuses on reloading in-memory schema definitions when `datasets.json` changes.

**Key Deliverables:**
- File watcher for configuration file
- Atomic schema reload mechanism
- Error handling with state preservation
- Integration tests for config hot reload

**Dependencies**: Phase 1 complete

**Important Note:** CSV data is NOT cached in memory. All CSV changes are immediately visible on the next query without requiring any reload. Only the configuration-derived schemas need hot reload support.

---

## Primary Acceptance Criteria (MUST COMPLETE)

### AC-3.1: File Watcher for Configuration File

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Choose file watching library (`chokidar` recommended)
- [ ] Install dependency: `npm install chokidar`
- [ ] Update `CsvDatasetStorageAdapter`
  - [ ] Add `FileWatcher` instance
  - [ ] Method: `setupFileWatcher()`
  - [ ] Watch config file path ONLY
  - [ ] DO NOT watch CSV files (not needed - data loaded on-demand)
- [ ] Configure watcher options
  - [ ] Ignore initial file detection
  - [ ] Handle file not found gracefully
- [ ] Add cleanup method
  - [ ] `shutdown()` or `dispose()` method
  - [ ] Stop file watcher
  - [ ] Clean up resources

**Verification:**
- [ ] Watcher detects config file changes
- [ ] No memory leaks from watcher
- [ ] Watcher can be stopped/cleaned up
- [ ] CSV file changes are NOT watched (by design)

**Blocked By**: Phase 1 AC-1.5

---

### AC-3.2: Atomic Schema Reload Mechanism

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Implement `reload()` method with atomic swap pattern
  - [ ] Load NEW configuration (don't touch current state)
  - [ ] Validate NEW configuration completely
  - [ ] Build NEW schema map
  - [ ] Build NEW dataset config map
  - [ ] ONLY IF ALL VALID: atomically swap all three (config, schemas, datasetConfigs)
  - [ ] If any error: keep old state, log error, continue serving
- [ ] Wire watcher to reload
  - [ ] On config change → trigger `reload()`
  - [ ] Debounce not strictly needed (single file, but can add 300ms if desired)
- [ ] Handle reload errors
  - [ ] Log error details with context
  - [ ] Preserve previous valid state
  - [ ] Server remains operational
  - [ ] Queries continue using old schemas

**Verification:**
- [ ] Config changes trigger reload
- [ ] Invalid config changes don't crash server
- [ ] Valid state preserved on error
- [ ] Reload completes in <1s
- [ ] Queries during reload see consistent state

**Blocked By**: AC-3.1

---

### AC-3.3: CSV Change Visibility Testing

**Status**: [ ] Not Started

**Description**: Verify that CSV changes are immediately visible without hot reload (this validates Phase 1 implementation).

**Implementation Tasks:**
- [ ] Create test: `test/integration/csv-hot-visibility.test.ts`
- [ ] Test: CSV file modified while server running
  - [ ] Start with valid config and CSV
  - [ ] Execute query, record results
  - [ ] Modify CSV file (add row, change value)
  - [ ] Execute same query again
  - [ ] Verify NEW data is returned (no reload needed)
- [ ] Test: Multiple CSV modifications
  - [ ] Rapid CSV changes
  - [ ] Each query returns current file state
- [ ] Document behavior
  - [ ] CSV changes are immediately visible
  - [ ] No reload mechanism required
  - [ ] On-demand loading ensures freshness

**Verification:**
- [ ] CSV changes visible immediately
- [ ] No reload was triggered
- [ ] Test is reliable and deterministic

**Blocked By**: Phase 1 complete

---

### AC-3.4: Config Reload Integration Tests

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Create test: `test/integration/config-hot-reload.test.ts`
- [ ] Test: Config file modified
  - [ ] Start with valid config
  - [ ] Execute queries to establish baseline
  - [ ] Modify config (add field, change limit, change visibleFields, etc.)
  - [ ] Wait for reload (or trigger manually)
  - [ ] Execute queries again
  - [ ] Verify NEW schema is active
  - [ ] Verify queries use NEW config
- [ ] Test: Add new dataset
  - [ ] Start with 1 dataset
  - [ ] Add second dataset to config
  - [ ] Verify new dataset appears in list
  - [ ] Verify new dataset is queryable
- [ ] Test: Remove dataset
  - [ ] Start with 2 datasets
  - [ ] Remove one from config
  - [ ] Verify removed dataset no longer listed
  - [ ] Verify queries to removed dataset fail appropriately

**Verification:**
- [ ] Config changes reflected after reload
- [ ] Schema updates work correctly
- [ ] Dataset additions work
- [ ] Dataset removals work
- [ ] Tests are reliable

**Blocked By**: AC-3.1, AC-3.2

---

## Secondary Acceptance Criteria (SHOULD COMPLETE)

### AC-3.5: Config Reload Error Handling

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Test: Invalid config after reload
  - [ ] Start with valid config
  - [ ] Modify config to be invalid (missing required field, bad type, etc.)
  - [ ] Trigger reload
  - [ ] Verify error logged with clear message
  - [ ] Verify previous valid state preserved
  - [ ] Verify server still operational
  - [ ] Execute query with old schema - should work
- [ ] Test: Malformed JSON
  - [ ] Modify config to have syntax errors
  - [ ] Verify error logged
  - [ ] Verify previous state preserved
- [ ] Test: Config file deleted
  - [ ] Delete config file temporarily
  - [ ] Trigger reload
  - [ ] Verify error logged
  - [ ] Verify previous state preserved

**Verification:**
- [ ] All error scenarios tested
- [ ] Server never crashes from reload errors
- [ ] Clear error messages logged
- [ ] Previous state always preserved
- [ ] Queries work with old schema during error state

**Blocked By**: AC-3.2, AC-3.4

---

### AC-3.6: Atomic State Preservation Verified

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Verify atomic swap implementation
  - [ ] Code review: no partial state updates
  - [ ] All state (config, schemas, datasetConfigs) swapped together
  - [ ] No intermediate states visible to queries
- [ ] Test state preservation under various errors
  - [ ] Validation error → old state preserved
  - [ ] File read error → old state preserved
  - [ ] Parse error → old state preserved
- [ ] Test concurrent access during reload
  - [ ] Execute query during reload
  - [ ] Verify no errors
  - [ ] Verify consistent results (either all old or all new)
  - [ ] No mixed state

**Verification:**
- [ ] Atomic swap verified
- [ ] No partial state corruption possible
- [ ] Queries always see consistent state
- [ ] Clear logging of state preservation

**Blocked By**: AC-3.5

---

### AC-3.7: Performance and Lifecycle Testing

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Test reload performance
  - [ ] Measure reload time for typical config
  - [ ] Verify <1s for MVP datasets
  - [ ] Test with larger configs (10+ datasets)
- [ ] Test watcher lifecycle
  - [ ] Start server → watcher active
  - [ ] Shutdown server → watcher stopped
  - [ ] Verify no resource leaks
  - [ ] Test restart cycle
- [ ] Test rapid config changes
  - [ ] Multiple quick edits to config
  - [ ] Verify reload stabilizes
  - [ ] Optional: verify debouncing if implemented

**Verification:**
- [ ] Performance meets requirements
- [ ] No memory leaks
- [ ] Clean shutdown
- [ ] Tests run reliably

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
- [ ] Include relevant context (config path, error details, etc.)
- [ ] Document events for consumers

**Verification:**
- [ ] Events emitted correctly
- [ ] Consumers can listen to events
- [ ] Events include useful context

**Blocked By**: AC-3.2

---

### AC-3.9: CSV Structure Validation (Optional)

**Status**: [ ] Not Started

**Description**: Optional feature to validate CSV files match their schemas during config reload.

**Implementation Tasks:**
- [ ] Add optional CSV validation on reload
  - [ ] Read first row of each CSV
  - [ ] Verify all schema fields present
  - [ ] Log warning if extra fields found
  - [ ] Log error if missing required fields
- [ ] Make validation optional (config flag?)
- [ ] Don't fail reload on CSV validation errors
  - [ ] Log warnings only
  - [ ] Schema reload proceeds
  - [ ] Queries will handle mismatches at runtime

**Verification:**
- [ ] CSV validation detects issues
- [ ] Warnings logged appropriately
- [ ] Reload not blocked by CSV issues
- [ ] Helpful error messages

**Blocked By**: AC-3.2

---

## Phase Completion Checklist

- [ ] All Primary ACs (3.1-3.4) complete
- [ ] At least 80% of Secondary ACs (3.5-3.7) complete
- [ ] Config hot reload working reliably
- [ ] Error scenarios handled gracefully
- [ ] CSV changes verified to be immediately visible
- [ ] This document updated with actual results
- [ ] Master checklist updated

---

## Implementation Notes

**Key Files Created:**
- (List will be populated during implementation)

**Decisions Made:**
- Simplified to config-only watching (CSV data already fresh)
- Atomic swap pattern for state consistency
- Fail-safe error handling (preserve old state)
- (Document additional implementation decisions)

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
- Estimated: 0.5-1 day (revised from 1-2 days due to simplified scope)
- Actual: (Fill in after completion)

---

## Architecture Notes

### Why CSV Files Don't Need Watching

CSV data is loaded on-demand from disk on every query (implemented in Phase 1's `CsvStorageAdapter.loadDataset()`). This means:

1. **No CSV data cached in memory** - each query reads fresh from disk
2. **CSV changes immediately visible** - next query sees updated data
3. **No reload mechanism needed** - on-demand loading is the "reload"
4. **Simpler architecture** - no cache invalidation complexity

### What Actually Gets Reloaded

Only the in-memory structures derived from the configuration file:

- `this.config: ProjectConfig` - the parsed configuration object
- `this.schemas: Map<string, DatasetSchema>` - derived schema definitions
- `this.datasetConfigs: Map<string, DatasetConfig>` - dataset-specific configs

These structures define HOW to read and interpret the CSVs, but don't contain the actual data.

### Atomic Swap Pattern

To ensure queries never see inconsistent state:

```typescript
async reload(): Promise<void> {
  // Build NEW state without touching current
  const newConfig = await loadConfig(this.configPath);
  const newSchemas = new Map<string, DatasetSchema>();
  const newConfigs = new Map<string, DatasetConfig>();
  
  // Validate and build completely
  for (const dataset of newConfig.datasets) {
    this.validateDatasetConfig(dataset);
    const schema = this.buildSchema(dataset);
    newSchemas.set(schema.id, schema);
    newConfigs.set(dataset.id, dataset);
  }
  
  // Atomic swap ONLY if fully valid
  this.config = newConfig;
  this.schemas = newSchemas;
  this.datasetConfigs = newConfigs;
}
```

This ensures queries always see either:
- The complete old state, OR
- The complete new state

Never a mixed state.
