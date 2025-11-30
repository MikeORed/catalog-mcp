# MCP Data Catalog – LLM-Augmented Engineering Case Study

> **Tagline:** Designing and delivering a reusable, AI-friendly data access layer using Model Context Protocol and hexagonal architecture.

---

## Overview

The **MCP Data Catalog** is a Model Context Protocol (MCP) server that gives AI assistants **structured, predictable access** to tabular data stored in CSV files. It exposes a small, stable surface area of tools—`list_datasets`, `describe_dataset`, `query_dataset`, and `get_by_id`—and handles schema validation, filtering, limits, and hot reload under the hood.

This is **intentionally a small, sharply scoped infrastructure service**—designed as a controlled environment to validate how I design, plan, and execute LLM-augmented infrastructure work. The project illustrates my approach to:

* **Envisioning** AI-centric infrastructure components that solve real, recurring problems.
* **Planning** architecture, phases, and constraints up front.
* **Organizing and driving** implementation using hexagonal architecture, strong workspace rules, and test-driven practices.
* **Leveraging LLMs (via Cline + MCP)** as collaborators in design, scaffolding, refactoring, and documentation—without losing architectural integrity.

---

## Why This MCP Exists

### The Problem

LLM-augmented workflows for game design (Mutants & Masterminds, PF2e, etc.) and internal tooling face consistent challenges:

* LLMs are good at reasoning but struggle with:
  * Ad-hoc CSV schemas
  * Inconsistent field names and types
  * Large, noisy datasets that burn tokens needlessly

* Each dataset implementation becomes fragile:
  * Hard-wired prompts embed dataset structure
  * Assumptions about column names break easily
  * No reusable, enforceable interface exists

The need: a generic, testable way to let AI treat structured data as a catalog with schema awareness and token efficiency.

### The Goal

An MCP server that:

* Is **domain-agnostic** (works for game systems, analytics, internal business data)
* Makes **LLM consumption cheap and safe**:
  * Schema-aware
  * Token-conscious (visibleFields, limits, projections)
  * Error-explicit
* Follows **clean hexagonal architecture** for extensibility:
  * CSV storage adapter
  * Stable MCP tool surface
  * Swappable storage backends (SQLite, Postgres, etc.)

### Where This Fits

I use CSVs and other local tabular data constantly for early project design, exploration, documentation aggregation, and hobby work. They're fast, frictionless, and easy to reshape as ideas evolve. This MCP server is built for exactly that tier of work: **local, schema-aware dataset querying with strong structure and guardrails for LLMs.**

For true production workloads, you would normally point agents at a proper datasource-backed MCP server (Postgres, warehouses, services, etc.). This catalog isn't meant to replace those. It sits at the **local, design-time edge** of the ecosystem—where you want structure, validation, and predictability without standing up a full data platform.

---

## Design Foundation

Before implementation, I created **two core artifacts** that defined the project:

### 1. A Structured Project Plan

Complete specification for a **generic data catalog MCP server**:

* **Goal:** Domain-agnostic, hex-architected MCP server exposing structured tabular datasets (initially CSV) via four tools: `list_datasets`, `describe_dataset`, `query_dataset`, `get_by_id`

* **Constraints:** 
  * TypeScript + Node.js
  * Strict Hexagonal Architecture
  * CSV backing with config-driven datasets
  * Token-budget controls (row/field limits, truncation flags, payload sizing)

* **Design:**
  * Clear separation of Domain, Use Cases, Ports, and Adapters
  * Structured filter AST for composable queries
  * Per-dataset limits and visibility controls
  * Hot-reloadable configuration

* **Phases:** 6 sequential phases from skeleton → documentation, each with explicit acceptance criteria

### 2. Workspace Rules for Cline

Encoded in `.clinerules/core-rules.md`, enforcing:

* **Hexagonal architecture layering** (Domain → Use Cases → Ports → Adapters)
  * **Inward-only dependencies** - no layer can depend on outer layers
  * **Pure domain** - zero I/O, no external dependencies
  * **Ports as tech-agnostic contracts** - no implementation details
  * **Thin adapters** - only translation logic, no business rules

* **Development practices:**
  * Constructor-based dependency injection only
  * Async I/O only (no sync filesystem access)
  * Explicit error translation at layer boundaries
  * Structured test placement (unit / integration / E2E)
  * Immutable value objects, explicit entity mutations

These documents are loaded into the agent workspace and treated as hard constraints for all generation and refactoring. They enable short, directive prompts like "run Phase 2" or "refactor X per rules" rather than re-explaining system architecture.

**Why full architectural discipline for a small service?** The objective is to prove that strict, reusable baselines lower cognitive and coordination overhead on larger systems once established. This project validates the workflow, and the output is the proof.

---

## Timeline to MVP

The project was completed over **2 focused days** (November 29-30, 2025):

* **Day 1 (Nov 29): Planning & Design**
  * **~2-3 hours** late afternoon session
  * Output: Core architectural decisions documented, .clinerules established, 6-phase execution plan defined

* **Day 2 (Nov 30): Implementation to MVP**
  * **~5.5-6 hours** morning implementation session  
  * All 6 phases executed sequentially: (1) Skeleton & Config, (2) Core Use Cases, (3) Hot Reload Support, (4) MCP Adapter, (5) Hardening & Testing, (6) Documentation
  * 8 substantive commits tracking clear progress milestones, each with passing tests

**Total effort: ~7.5-9 hours over 2 days** (6 hours documented in git commits + 1.5-3 hours estimated lead-in)

Key characteristics:

* **Designed up front**, built in **discrete phases**, kept under **tight feedback** via tests + Cline
* Git history shows clear, linear progress: every commit represents a completed, tested phase

---

## Architecture & Design Choices

### Hexagonal Architecture

The server enforces strict boundaries:

* **Domain layer**:
  * Types: `DatasetSchema`, `DatasetConfig`, `FilterExpression`, `QueryRequest`, `QueryResult`
  * Rules: No I/O, no environment access, pure filter/projection/limit logic

* **Use Case layer**:
  * `ListDatasetsUseCase`, `DescribeDatasetUseCase`, `QueryDatasetUseCase`, `GetByIdUseCase`
  * Each: Consumes ports, applies domain rules, returns clean DTOs for adapters

* **Ports**:
  * Primary: `DatasetQueryPort` (what MCP tools talk to)
  * Secondary: `DatasetStoragePort` (how data is loaded)

* **Adapters**:
  * **MCP adapter**: Maps MCP tool calls to use cases, parses/validates filter JSON, translates domain errors into tool-friendly messages
  * **CSV adapter**: Loads JSON config, validates datasets & schemas, reads CSV on demand for queries

This is documented in both the README and dedicated dev guide, and encoded in `.clinerules/core-rules.md` for agent enforcement.

### LLM-Friendly Design

The design optimizes for **AI consumption**:

* **Small, stable tool surface**:
  * 4 tools, clearly documented
  * No "magic strings" in tool names or arguments

* **Filter schema that's easy to serialize from a prompt**:

  ```json
  {
    "field": "role",
    "op": "eq",
    "value": "admin"
  }
  ```

  and

  ```json
  {
    "and": [
      { "field": "role", "op": "eq", "value": "admin" },
      { "field": "name", "op": "contains", "value": "smith" }
    ]
  }
  ```

* **Token budgeting built in**:
  * `visibleFields` per dataset to limit default payload size
  * Per-dataset `maxRows` and `defaultRows` enforced by the use cases
  * Truncation flags in the response so agents know when to refine a query

* **Hot reload** for configuration:
  * Enables highly iterative "change config → test with LLM → adjust" loop without server restarts

---

## LLM-Augmented Development

This project demonstrates **LLM-augmented engineering** where human architectural control directs AI acceleration.

**Human control surfaces:**
* All architectural constraints, phase structure, and acceptance criteria authored and iterated by human designer
* Cline operates strictly inside those boundaries
* The LLM accelerates implementation and documentation but cannot introduce new architectural structure, relax constraints, or redefine scope

**LLM collaboration:**

* **Architecture refinement**
  * Iterating on hexagonal layout and dependency rules
  * Clarifying workspace policies for adapters, ports, and use cases

* **Scaffolding generation**
  * Skeletons for use case classes, port interfaces, adapter stubs
  * Repeated patterns like test file layouts and helper functions

* **Consistency enforcement**
  * Flagging places where file placement or naming drifts from rules
  * Keeping test structure mirroring `src/` structure

* **Documentation production**
  * README structure
  * Dev guide and project plan
  * Examples and config docs

---

## Results at MVP

At the **1.0.0-mvp** milestone, the project delivered:

* A **working MCP server** with:
  * `list_datasets`, `describe_dataset`, `query_dataset`, `get_by_id`
  * JSON configuration with schema validation
  * CSV storage adapter
  * On-demand CSV loading with clear performance characteristics
  * Hot reload of config via file watching

* A **clean workspace**:
  * Hexagonal boundaries enforced
  * Clear separation of concerns
  * Unit and integration tests covering core flows (domain logic, use cases, filter operations, and MCP tool integration)

* **Documentation and examples**:
  * README with full usage examples
  * Example configs and datasets
  * Dev guide and project plan documents

* A reusable **foundation** for:
  * Mutants & Masterminds datasets (effects, modifiers, measurement ranks, templates, etc.)
  * Other AI-oriented catalogs (knowledge management, internal reference data)

**Forward impact:** This serves as the reference implementation for how I expose structured reference data to LLM agents across future projects. The patterns established here—config-driven schemas, token-conscious design, and hot-reloadable adapters—provide a proven baseline for similar infrastructure services.

---

## Cost & Effort

**Engineering time:**

* **Total: ~7.5-9 hours over 2 days** (Nov 29-30, 2025)
  * **6 hours documented in commit timestamps**
  * **1.5-3 hours estimated lead-in time** (pre-first-commit planning/setup)
* **Design + documentation: ~30%** (~2-3 hours)
  * Day 1: Architecture design, workspace rules, project planning
  * Integrated throughout Day 2: README, dev guides, examples, execution checklists
* **Implementation: ~70%** (~5.5-6 hours)
  * Day 2: 6 phases executed sequentially with tests (8:09 AM - 1:05 PM)
  * Domain logic, use cases, adapters, integration
  * Steady commit cadence averaging ~35-40 minutes per phase

**LLM/tooling cost:**

*Cost is included to show how architectural planning and persistent context constrain LLM spend.*

* **API usage: $16** for Claude Sonnet 4.5 (1M context window) via Cline + AWS Bedrock
  * **Input tokens:** ~3,000 (new prompts only)
  * **Output tokens:** ~299,000 (code, tests, docs generation)
  * **Total tokens:** ~302,000
  * Token output volume reflects implementation and documentation throughput
  * The low input token count is due to **prompt caching and persistent context** - the project plan and workspace rules were cached and reused within the 1M context window, enabling short directive prompts ("run Phase 2", "refactor X per rules")
* **Additional tools: $0** (using free/existing tools: VSCode, Git, Node.js, Jest)

**Summary:** Delivered a stable, deployment-ready MVP MCP server with comprehensive documentation, solid test coverage of core flows, and clean hexagonal architecture in **under 9 hours and $16 of LLM-assisted engineering time**.

**Key insight:** Architecture and workspace rules established up front and cached in the 1M context window enable the LLM to act as a high-bandwidth assistant. A small amount of typed input (~3K tokens) controls a large volume of generated output (~299K tokens).

---

## What This Illustrates

This project illustrates how I approach infrastructure engineering:

* **Envisioning** AI-native services that solve recurring problems (structured data access for LLMs)
* **Planning** work in realistic, testable phases with clear done-definitions at each step
* **Organizing** implementation using architecture, workspace rules, and project plans that enable effective human-LLM collaboration
* **Executing** with discipline:
  * Implementing hexagonal architecture cleanly
  * Keeping domain logic pure and testable
  * Wrapping it all in documentation, examples, and guardrails
* **Leveraging LLMs as force multipliers**:
  * Retaining control of architecture and quality
  * Using agents (Cline) to stay within constraints and accelerate repetitive tasks
