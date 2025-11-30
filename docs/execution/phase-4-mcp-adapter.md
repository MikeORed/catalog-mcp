# Phase 4: MCP Adapter - Detailed Checklist

**Phase**: 4 of 6  
**Status**: ⬜ Not Started  
**Started**: -  
**Completed**: -  
**Estimated Effort**: 2-3 days  
**Actual Effort**: -

---

## Phase Overview

Implement the MCP server adapter that exposes the 4 tools through the MCP protocol. This connects our domain logic to the external world.

**Key Deliverables:**
- MCP server wrapper
- 4 tool implementations
- Error mapping to MCP responses
- Basic request logging

**Dependencies**: Phase 2 complete (use cases ready)

---

## Primary Acceptance Criteria (MUST COMPLETE)

### AC-4.1: MCP Server Wrapper Implemented

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Install MCP SDK: `npm install @modelcontextprotocol/sdk`
- [ ] Create `src/adapters/primary/mcp/mcp-server.ts`
  - [ ] Initialize MCP server instance
  - [ ] Configure server metadata (name, version)
  - [ ] Register all tools
  - [ ] Start server on specified transport
- [ ] Create dependency injection setup
  - [ ] Instantiate CSV storage adapter
  - [ ] Instantiate catalog service
  - [ ] Instantiate field validator
  - [ ] Instantiate all use cases
  - [ ] Pass to MCP adapter
- [ ] Create server entry point: `src/index.ts`
  - [ ] Load configuration path from env/args
  - [ ] Initialize storage adapter
  - [ ] Create and start MCP server
  - [ ] Handle startup errors

**Verification:**
- [ ] Server starts without errors
- [ ] MCP server responds to ping/health checks
- [ ] Tools are registered correctly
- [ ] Server can be stopped gracefully

**Blocked By**: Phase 2 complete

---

### AC-4.2: All 4 Tools Exposed

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Create `src/adapters/primary/mcp/tools/list-datasets-tool.ts`
  - [ ] Define tool schema (no parameters)
  - [ ] Call `ListDatasetsUseCase`
  - [ ] Format response per plan spec
  - [ ] Return dataset summaries
- [ ] Create `src/adapters/primary/mcp/tools/describe-dataset-tool.ts`
  - [ ] Define tool schema (datasetId parameter)
  - [ ] Validate datasetId provided
  - [ ] Call `DescribeDatasetUseCase`
  - [ ] Return full schema details
- [ ] Create `src/adapters/primary/mcp/tools/query-dataset-tool.ts`
  - [ ] Define tool schema (datasetId, filter?, selectFields?, limit?)
  - [ ] Parse filter JSON to FilterExpression
  - [ ] Call `QueryDatasetUseCase`
  - [ ] Return query results
- [ ] Create `src/adapters/primary/mcp/tools/get-by-id-tool.ts`
  - [ ] Define tool schema (datasetId, id, selectFields?)
  - [ ] Call `GetByIdUseCase`
  - [ ] Return single row result

**Verification:**
- [ ] All 4 tools callable via MCP
- [ ] Tools have proper JSON schemas
- [ ] Tools return correct data format
- [ ] Tools handle missing parameters gracefully

**Blocked By**: AC-4.1

---

### AC-4.3: Filter Validation for MVP Operators

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Create `src/adapters/primary/mcp/filter-parser.ts`
  - [ ] Function: `parseFilter(json: unknown): FilterExpression`
  - [ ] Validate filter structure
  - [ ] Check operators are MVP only (eq, contains, and)
  - [ ] Reject unsupported operators early
  - [ ] Throw clear error for invalid filters
- [ ] Integrate into query-dataset-tool
  - [ ] Parse filter before calling use case
  - [ ] Catch parse errors
  - [ ] Return MCP error response
- [ ] Create comprehensive validation
  - [ ] Validate field filters have field, op, value
  - [ ] Validate compound filters have op, filters array
  - [ ] Reject malformed JSON
  - [ ] Reject empty filter objects

**Verification:**
- [ ] MVP filters parse correctly
- [ ] Non-MVP operators rejected
- [ ] Malformed filters rejected
- [ ] Clear error messages returned

**Blocked By**: AC-4.2

---

### AC-4.4: Error Mapping to MCP Responses

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Create `src/adapters/primary/mcp/error-mapper.ts`
  - [ ] Function: `mapDomainErrorToMcp(error: Error): McpError`
  - [ ] Map DatasetNotFoundError → MCP not found
  - [ ] Map InvalidFilterError → MCP invalid request
  - [ ] Map InvalidFieldError → MCP invalid request (with field list)
  - [ ] Map ConfigError → MCP server error
  - [ ] Generic Error → MCP server error
- [ ] Integrate into all tool handlers
  - [ ] Wrap use case calls in try-catch
  - [ ] Map caught errors
  - [ ] Return proper MCP error responses
  - [ ] Include helpful context in messages

**Verification:**
- [ ] Domain errors mapped correctly
- [ ] MCP client receives proper error codes
- [ ] Error messages are helpful
- [ ] No stack traces leaked to client (in production)

**Blocked By**: AC-4.2

---

### AC-4.5: Basic Request Logging

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Create `src/adapters/primary/mcp/logger.ts`
  - [ ] Function: `logRequest(toolName, params, result)`
  - [ ] Log format: `[INFO] {tool}: dataset={id}, rows={count}, fields={count}`
  - [ ] Include timestamp
  - [ ] Log to console (stdout)
- [ ] Integrate logging into each tool
  - [ ] Log before calling use case
  - [ ] Log after successful response
  - [ ] Log errors separately
- [ ] Create error logging
  - [ ] Log error type and message
  - [ ] Include context (dataset, operation)
  - [ ] Don't log sensitive data

**Verification:**
- [ ] Each request logged
- [ ] Log format matches plan spec
- [ ] Logs are readable
- [ ] No performance impact from logging

**Blocked By**: AC-4.2

---

## Secondary Acceptance Criteria (SHOULD COMPLETE)

### AC-4.6: Helpful Error Messages with Field Lists

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Enhance error mapper for InvalidFieldError
  - [ ] Extract field name from error
  - [ ] Extract valid fields list from error
  - [ ] Format message: "Invalid field 'X'. Valid fields: A, B, C"
- [ ] Enhance error mapper for InvalidFilterError
  - [ ] Extract operator if present
  - [ ] Include MVP operator list in message
- [ ] Test error messages
  - [ ] Verify helpful for debugging
  - [ ] Verify no confusing jargon
  - [ ] Verify actionable guidance

**Verification:**
- [ ] Error messages guide user to fix
- [ ] Field lists always included
- [ ] Messages tested with real scenarios

**Blocked By**: AC-4.4

---

### AC-4.7: MCP Tool Schemas Defined

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Define JSON schema for list_datasets
  - [ ] No parameters
  - [ ] Document return format
- [ ] Define JSON schema for describe_dataset
  - [ ] datasetId: string (required)
  - [ ] Document return format
- [ ] Define JSON schema for query_dataset
  - [ ] datasetId: string (required)
  - [ ] filter: object (optional)
  - [ ] selectFields: string[] (optional)
  - [ ] limit: number (optional)
  - [ ] Document filter structure
  - [ ] Document return format
- [ ] Define JSON schema for get_by_id
  - [ ] datasetId: string (required)
  - [ ] id: any (required)
  - [ ] selectFields: string[] (optional)
  - [ ] Document return format

**Verification:**
- [ ] All tools have schemas
- [ ] Schemas are valid JSON Schema
- [ ] MCP validates against schemas
- [ ] Documentation clear

**Blocked By**: AC-4.2

---

### AC-4.8: Integration Tests for MCP Layer

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Create `test/integration/mcp-tools.test.ts`
- [ ] Test list_datasets tool
  - [ ] Returns all datasets
  - [ ] Correct format
- [ ] Test describe_dataset tool
  - [ ] Returns schema
  - [ ] Errors on invalid ID
- [ ] Test query_dataset tool
  - [ ] Works without filter
  - [ ] Works with eq filter
  - [ ] Works with contains filter
  - [ ] Works with and compound
  - [ ] Rejects invalid filters
  - [ ] Respects limits
- [ ] Test get_by_id tool
  - [ ] Returns row
  - [ ] Errors on not found
  - [ ] Respects projection

**Verification:**
- [ ] All tools have integration tests
- [ ] Tests use real MCP client
- [ ] Tests cover error cases
- [ ] Tests are reliable

**Blocked By**: AC-4.2, AC-4.3, AC-4.4

---

## Tertiary Acceptance Criteria (NICE TO HAVE)

### AC-4.9: Request/Response Timing Metrics

**Status**: [ ] Not Started

**Implementation Tasks:**
- [ ] Add timing to logger
  - [ ] Record start time
  - [ ] Record end time
  - [ ] Calculate duration
  - [ ] Include in log output
- [ ] Format: `[INFO] {tool}: dataset={id}, duration={ms}ms, rows={count}`

**Verification:**
- [ ] Timing logged for each request
- [ ] Accurate measurements
- [ ] Minimal overhead

**Blocked By**: AC-4.5

---

## Phase Completion Checklist

- [ ] All Primary ACs (4.1-4.5) complete
- [ ] All Secondary ACs (4.6-4.8) complete
- [ ] MCP server operational
- [ ] All 4 tools working correctly
- [ ] Error handling robust
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
