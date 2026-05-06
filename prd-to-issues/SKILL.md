---
name: prd-to-issues
description: Break a PRD into independently-workable issues and write each as a local markdown file in issues/. Use when the user wants to turn a PRD into a list of concrete tasks.
---

# PRD to Issues

Break a PRD into independently-grabbable issues using vertical slices (tracer bullets), written as local markdown files.

## Process

### 1. Locate the PRD

Ask the user for the PRD file path (e.g. `issues/prd.md`).

If the PRD is not already in your context window, read it from the file.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

### 3. Draft vertical slices

Break the PRD into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories from the PRD this addresses
- **Test rigor**: standard / mutation (default standard; pick mutation for critical paths — payments, auth, data integrity)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?
- Are the right slices marked `Test rigor: mutation`?

Iterate until the user approves the breakdown.

### 5. Create the issue files

For each approved slice, write a markdown file in `issues/` using the naming pattern `issues/NNN-short-title.md` (e.g. `issues/001-add-user-auth.md`).

Number issues starting from the next available number (check what files already exist in `issues/`).

Create files in dependency order (blockers first) so you can reference real filenames in the "Blocked by" field.

Do NOT use `gh issue create` or any GitHub CLI commands. Do NOT reference GitHub issue numbers. Use local filenames for all cross-references.

When populating the **Behaviors Under Test** sections, copy the relevant rows from the parent PRD's `Behaviors Under Test` section verbatim — do NOT rewrite, summarize, or invent new rows. The PRD is the source of truth. If a row needs slice-specific framing, add it to the **Slice-specific seam tests** subsection instead.

<issue-template>
**Type:** AFK (or HITL)

**Test rigor:** standard (or `mutation`)

## Parent PRD

`issues/prd.md` (or whichever PRD file was used)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation. Reference specific sections of the parent PRD rather than duplicating content.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Behaviors Under Test

The behaviors this slice must lock in with tests. Copy verbatim from the parent PRD's `Behaviors Under Test` section, including only the stories this slice covers. Do NOT add, remove, or rephrase rows.

### Story N — <title>

**Happy path**
- ...

**Edge cases**
- ...

**Failure modes**
- ...

**Out of test scope**
- ...

(repeat per story this slice covers)

## Slice-specific seam tests

Tests that only make sense at the slice level, not the PRD level. Typically: integration tests at the boundary between this slice and a previously-shipped slice; tests for behavior that emerges from how layers compose. Use "none" if there are no seams.

## Tests deliberately deferred to a later slice

Behaviors from the PRD that this slice's "What to build" implies but that are NOT tested here because they belong to a later issue. Each row names the behavior and the issue it's deferred to (e.g. "Concurrent-edit conflict resolution → deferred to `issues/007-add-conflict-merge.md`"). Use "none" if every behavior the slice implies is fully tested here.

The purpose of this section is symmetric to the PRD's "Out of test scope": it tells the subagent exactly which behaviors NOT to test in this slice, so it doesn't over-scope or invent decorative tests for behavior that another slice will cover.

## Blocked by

- Blocked by `issues/NNN-title.md` (if any)

Or "None - can start immediately" if no blockers.

## User stories addressed

Reference by number from the parent PRD:

- User story 3
- User story 7

</issue-template>

Do NOT close or modify the parent PRD file.
