# Project Structure and Architectural Rules

## Purpose

This document defines the **mandatory architectural rules, structural
conventions, and coding patterns** for this workspace. All code
generation, refactoring, and recommendations produced by Cline must
conform to these standards.

This project follows a **Hexagonal Architecture (Ports & Adapters)**
model. All reasoning, file placement, naming, and dependency flow must
respect this structure.

------------------------------------------------------------------------

## Architecture Overview

This project uses **Hexagonal Architecture** to isolate core business
logic from external systems.

### Core Principles

-   The **Domain Layer** must have **zero external dependencies**
-   The **Use Case Layer** orchestrates domain logic
-   **Ports define contracts**
-   **Adapters implement ports**
-   All dependencies must point **inward toward the core**

------------------------------------------------------------------------

### Architectural Layers

    Domain → Use Cases → Ports → Adapters

-   **Domain Layer**
    -   Entities
    -   Value Objects
-   **Use Case Layer**
    -   Application services
    -   Orchestration logic
-   **Ports**
    -   Primary (driving)
    -   Secondary (driven)
-   **Adapters**
    -   Primary (API, CLI, MCP)
    -   Secondary (DB, filesystem, external APIs)

------------------------------------------------------------------------

### Allowed Dependency Flow

✅ Adapters → Ports → Use Cases → Domain\
❌ Domain → Adapters\
❌ Domain → Use Cases\
❌ Use Cases → Adapters directly\
❌ Adapters → Domain directly

All violations are architectural errors.

------------------------------------------------------------------------

## Project Structure

All code must conform to the following structure:

    /
    ├── src/
    │   ├── domain/
    │   │   ├── entities/
    │   │   └── value-objects/
    │   ├── ports/
    │   │   ├── primary/
    │   │   └── secondary/
    │   ├── use-cases/
    │   │   └── implementations/
    │   ├── adapters/
    │   │   ├── primary/
    │   │   └── secondary/
    │   └── index.ts
    ├── test/
    │   ├── unit/
    │   ├── integration/
    │   └── e2e/
    ├── docs/
    │   ├── dev/
    │   └── guides-and-examples/
    └── scripts/

Cline must: - Never place infrastructure logic in `domain/` - Never
place business rules in `adapters/` - Never introduce circular
dependencies between layers

------------------------------------------------------------------------

## Naming Conventions

### Files & Directories

-   Use **kebab-case**
-   Names must describe purpose and role

  Type                Pattern
  ------------------- -------------------------------
  Entity              `user.ts` or `user-entity.ts`
  Value Object        `money.ts`
  Use Case            `create-table-use-case.ts`
  Port                `table-repository.ts`
  Primary Adapter     `mcp-controller.ts`
  Secondary Adapter   `csv-table-repository.ts`
  Test                `*.test.ts`

------------------------------------------------------------------------

### Classes & Interfaces

-   **PascalCase**
-   Interfaces are **not prefixed** with `I`
-   Implementations are **prefixed by technology**

Examples: - `TableRepository` - `CsvTableRepository` -
`CreateTableUseCase` - `McpController`

------------------------------------------------------------------------

### Methods & Properties

-   **camelCase**
-   Verbs for behavior: `create`, `load`, `validate`, `resolve`

------------------------------------------------------------------------

### Constants

-   **UPPER_SNAKE_CASE**
-   Example: `MAX_TABLE_ROWS`

------------------------------------------------------------------------

## Domain Rules (Strict)

-   Domain objects:
    -   Must be **pure**
    -   Must be **side-effect free**
    -   Must not import:
        -   filesystem
        -   database
        -   network
        -   environment variables
-   Domain entities **own their invariants**
-   Value objects **must be immutable**

------------------------------------------------------------------------

## Use Case Rules

-   A use case:
    -   Performs **one business action**
    -   Uses **only ports**
    -   Contains **no infrastructure logic**
-   Use cases may call:
    -   Domain entities
    -   Secondary ports
-   Use cases must not:
    -   Perform I/O directly
    -   Import adapter implementations

------------------------------------------------------------------------

## Ports Rules

-   Ports define **capabilities**, not implementations
-   No default implementations inside ports
-   Ports must be **technology-agnostic**

------------------------------------------------------------------------

## Adapter Rules

-   Primary adapters:
    -   MCP Servers
    -   APIs
    -   CLI
-   Secondary adapters:
    -   Datastores
    -   File loaders
    -   External APIs
-   Adapters:
    -   Must implement a port
    -   Must not contain business rules
    -   Must translate **external models ↔ domain models**

------------------------------------------------------------------------

## Dependency Injection

-   Constructor-based injection only
-   No service locators
-   No static injection

``` ts
export class LoadTableUseCase {
  constructor(private readonly repository: TableRepository) {}
}
```

------------------------------------------------------------------------

## Immutability

-   Value Objects → immutable
-   Entity mutation must be **explicit**
-   No shared mutable state across layers

------------------------------------------------------------------------

## Error Handling Rules

-   Domain → throws domain errors only
-   Use Cases → translate domain errors
-   Adapters → translate errors for external interfaces

Never leak raw infrastructure errors into domain logic.

------------------------------------------------------------------------

## Validation Rules

-   **All input validation happens in adapters**
-   Use schema validators (Zod preferred)
-   Use cases must assume **validated input**

------------------------------------------------------------------------

## Async Rules

-   All I/O → async
-   No sync filesystem or network access
-   Use `async/await` only

------------------------------------------------------------------------

## Testing Rules

### Unit Tests

-   Domain entities
-   Value Objects
-   Use cases with mocked ports

### Integration Tests

-   Adapter + real infrastructure
-   MCP tooling
-   CSV loading

### E2E Tests

-   Full MCP request → response path

------------------------------------------------------------------------

### Test Placement

    src/domain/entities/table.ts
    test/unit/domain/entities/table.test.ts

------------------------------------------------------------------------

## Extension Rules

### New Adapters

-   Must implement a port
-   Must not introduce new business logic
-   Must live in `adapters/`

### New Use Cases

-   One responsibility per class
-   Must expose a single `execute()` method

------------------------------------------------------------------------

## Documentation Rules

-   All new use cases → documented
-   All new ports → documented
-   All MCP tools → documented with schemas
-   Architectural changes → ADR required

------------------------------------------------------------------------

## Enforcement Summary

Cline must enforce:

-   Inward dependency only
-   Domain purity
-   Adapter thinness
-   Explicit orchestration in use cases
-   No leakage of infrastructure concerns into core logic

Violations must be surfaced and corrected, not worked around.
