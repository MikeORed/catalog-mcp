# Project Plan Revision Process

## Overview

This document defines the iterative process for refining project plans through feedback cycles. The goal is to maintain clear documentation of how the plan evolves from initial draft to approved specification.

---

## Document System

### 1. Project Plans
**Location**: `docs/project-plans/`  
**Naming**: `project-plan-v{N}.{descriptor}.md`

- **v0.initial.md** - The baseline/starting plan
- **v1.filters-refined.md** - Major revision 1 with descriptor
- **v2.domain-updated.md** - Major revision 2 with descriptor
- etc.

Each plan is a complete, standalone specification that can be understood without reading previous versions.

### 2. Clarifications Documents
**Location**: `docs/project-plans/`  
**Naming**: `clarifications-v{N}.md`

Created when questions arise about a specific plan version. Structure:

```markdown
# Clarifications for Project Plan v{N}

## Questions

### Q1: [Topic/Area]
**Question**: [Detailed question from Cline]

**Response**: [User's inline response]

**Resolution**: [How this affects the plan]

---

### Q2: [Topic/Area]
**Question**: [Next question]

**Response**: [User's inline response]

**Resolution**: [Impact on plan]
```

### 3. Plan Changelog
**Location**: `docs/project-plans/plan-changelog.md`  
**Purpose**: Track all revisions across versions until finalization

Structure:

```markdown
# Project Plan Changelog

## v1.{descriptor} (YYYY-MM-DD)

### Changes from v0.initial
- [Added] New feature X
- [Modified] Section Y revised based on feedback
- [Removed] Deprecated approach Z
- [Clarified] Ambiguity in domain model

### Rationale
Brief explanation of why these changes were made.

### Source
- Clarifications: clarifications-v0.md
- User feedback: [brief summary]

---

## v2.{descriptor} (YYYY-MM-DD)
...
```

---

## Revision Workflow

### Proactive Clarification Flow (Preferred)

After a plan version is created, Cline proactively identifies areas needing clarification:

```
Current Plan (v{N})
    ↓
Cline reviews plan
    ↓
Cline identifies ambiguities/decisions needing validation
    ↓
Create clarifications-v{N}.md with questions
    ↓
User responds inline to questions
    ↓
Generate project-plan-v{N+1}.md incorporating responses
    ↓
Update plan-changelog.md
    ↓
Done with this cycle
(repeat until plan is finalized)
```

**When to use this flow:**
- Default approach for iterative plan refinement
- After initial plan creation (v0 → v1)
- When moving between major revisions
- To validate architectural decisions before implementation

**What Cline should identify:**
- Ambiguous requirements or specifications
- Design choices that need user preference/validation
- Areas lacking sufficient detail for implementation
- Trade-offs requiring user decision
- Scope boundaries that need clarification
- Technical constraints needing confirmation

### Reactive Clarification Flow (Alternative)

User provides feedback first, then Cline responds:

```
Current Plan (v{N})
    ↓
User provides feedback/revisions
    ↓
Decision Point
    ↓
┌───────────────────────┬────────────────────────┐
│                       │                        │
Need clarification?    Feedback is clear?       │
│                       │                        │
↓                       ↓                        │
Create                  Generate                 │
clarifications-v{N}.md  project-plan-v{N+1}.md  │
    ↓                       ↓                    │
User responds inline        Update               │
    ↓                   plan-changelog.md        │
Generate                    ↓                    │
project-plan-v{N+1}.md  Done with this cycle    │
    ↓                                            │
Update plan-changelog.md                         │
    ↓                                            │
└──────────────────────────────────────────────┘
```

**When to use this flow:**
- User has specific changes/feedback to provide
- Mid-implementation course corrections
- Quick adjustments to existing plan

### Decision Logic

**Create Clarifications Document When:**
- Feedback introduces ambiguity
- Multiple valid interpretations exist
- Need to confirm architectural choices
- Scope boundaries are unclear
- Technical constraints need validation

**Generate New Plan Directly When:**
- Feedback is explicit and unambiguous
- Changes are straightforward refinements
- User provides clear directive (e.g., "add feature X", "remove section Y")
- Corrections to obvious errors/omissions

---

## Revision Types

### Scope Changes
- Features added or removed
- Non-goals revised
- Functional requirements expanded/contracted

### Architectural Refinements
- Layer boundaries adjusted
- Port contracts modified
- Adapter responsibilities clarified
- Domain model changes

### Constraint Modifications
- Technology choices revised
- Performance requirements updated
- Compatibility constraints changed

### Implementation Details
- Pseudocode corrections
- Type definitions refined
- Error handling strategy adjusted
- Configuration format changes

### Milestone Adjustments
- Tasks reordered
- New milestones added
- Milestone scope refined

---

## Best Practices

### Version Descriptors
Use clear, meaningful descriptors:
- ✅ `v1.filters-simplified` - Describes what changed
- ✅ `v2.domain-model-refined` - Clear focus area
- ❌ `v1.updates` - Too vague
- ❌ `v2.changes` - Not descriptive

### Clarification Questions
Structure questions to be:
- **Specific**: Reference exact section/line if possible
- **Contextual**: Include relevant background
- **Actionable**: User can respond with clear decision

### Changelog Entries
Each entry should:
- **Be atomic**: One logical change per bullet
- **State impact**: Why this matters
- **Reference source**: Link to clarifications or feedback

### Response Integration
When user provides inline responses in clarifications:
- Extract all responses
- Map to plan sections
- Update relevant areas
- Note any cascading impacts

---

## Finalization Process

### When to Finalize

A plan is ready for finalization when:
- All major architectural decisions are settled
- No outstanding clarifications remain
- User explicitly approves the plan
- Implementation can proceed without major uncertainties

### Finalization Steps

1. **Create Final Version**
   - Generate `project-plan-v{N}.final.md`
   - Include complete specification

2. **Merge Changelog**
   - Integrate `plan-changelog.md` into final plan
   - Add "Revision History" section
   - Document evolution of key decisions

3. **Archive Artifacts**
   - Keep all clarifications documents
   - Preserve intermediate plan versions
   - Maintain for future reference

4. **Mark as Canonical**
   - Update README to reference final plan
   - Lock final plan (communicate changes go through formal process)

---

## Example Scenarios

### Scenario 1: Clear Feedback
**User**: "Remove the `get_by_id` tool, we don't need it."

**Action**: 
- Generate `project-plan-v1.tools-reduced.md` directly
- Update `plan-changelog.md`:
  ```markdown
  ## v1.tools-reduced (2025-11-29)
  - [Removed] get_by_id tool and GetByIdUseCase
  - [Modified] Section 2.1 to reflect 3 tools instead of 4
  - [Modified] Section 4.2.2 to remove getById from primary port
  ```

### Scenario 2: Needs Clarification
**User**: "The filter model seems too complex."

**Action**:
- Create `clarifications-v0.md`:
  ```markdown
  ### Q1: Filter Complexity
  **Question**: You mentioned the filter model seems too complex. 
  Could you clarify:
  1. Should we remove compound filters (and/or)?
  2. Should we limit to exact match only?
  3. Or simplify the operator set?
  
  Current operators: eq, neq, gt, gte, lt, lte, contains
  Current compound: and, or
  
  **Response**: [User fills in]
  ```

### Scenario 3: Multiple Issues
**User**: "I have several changes: remove get_by_id, simplify filters to eq/contains only, and add a notes field to schema."

**Action**:
- Generate `project-plan-v1.simplified.md` directly
- Update changelog with all three changes
- Ensure all impacted sections are updated

---

## Metadata Tracking

Each plan version should include a header:

```markdown
# Project Plan v{N}.{descriptor}

**Version**: {N}.{descriptor}  
**Date**: YYYY-MM-DD  
**Status**: Draft | Under Review | Approved | Superseded  
**Supersedes**: v{N-1}.{previous-descriptor}  
**Clarifications**: clarifications-v{N}.md (if exists)
```

---

## Questions & Edge Cases

### What if user wants to revert a change?
- Create new version reverting to earlier state
- Document in changelog why reverting
- Reference the version being reverted to

### What if clarifications spawn more clarifications?
- Continue numbering in same document: Q1, Q2, Q3...
- When user responds, generate the next plan version
- All Q&A stays in one clarifications file per plan version

### What if feedback contradicts earlier decisions?
- Flag the contradiction in clarifications
- Ask user to confirm the change
- Document the decision reversal explicitly

---

## Integration with Development

Once a plan is approved:
1. It becomes the source of truth for implementation
2. Deviations during implementation should be documented
3. Significant deviations may require a new plan version
4. Implementation learnings feed back into plan refinements

The plan is a living document until finalized, then becomes reference documentation.
