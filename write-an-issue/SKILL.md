---
name: write-an-issue
description: Generate a single issue file in issues/ directly, without a parent PRD. Use when the user wants to capture one vertical slice of work as an actionable issue — typically after a /discuss session, or standalone for a small, well-scoped task.
---

# Write an Issue

Write a single, independently-workable issue as a local markdown file. This skill produces ONE issue and does not create a parent PRD.

## When this skill is invoked

This skill has two modes:

- **From a `/discuss` session**: scope is already established. Skip the gating check and proceed to write the issue.
- **Standalone**: the user invokes this directly without prior discussion. Run the gating check below before writing.

Detect the mode from conversation context. If in doubt, ask the user.

## Process

### 1. Gate (standalone mode only)

Ask the user for a 1-2 sentence description of the work, then check:

- Does it cut through all layers as one thin vertical slice (schema, API, UI, tests where applicable)?
- Is the design resolved, with no unresolved branches that need debate?

If yes, proceed. If no — multiple slices, or unresolved design questions — recommend `/write-a-prd` instead and stop.

If the user insists on a single issue anyway, proceed.

### 2. Confirm HITL/AFK

Ask once: "Is this AFK (can be implemented autonomously) or HITL (needs human input)?"

Default to AFK. Pick HITL if the work obviously requires design review, an architectural call, or has ambiguous scope.

### 3. Determine the file name

Check `issues/` for existing files. Create the directory if it doesn't exist. Use the next available number with the pattern `issues/NNN-short-title.md` (e.g. `issues/001-add-user-auth.md`).

### 4. Write the issue

Use the template below. Do NOT use `gh issue create` or any GitHub CLI commands. Do NOT reference GitHub issue numbers.

<issue-template>
**Type:** AFK (or HITL)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- Blocked by `issues/NNN-title.md` (if any)

Or "None - can start immediately" if no blockers.

## User stories addressed

A list of user stories in the format:

- As an <actor>, I want <feature>, so that <benefit>

## Parent PRD

None — created directly from discussion.

(Omit this section entirely if invoked standalone with no prior discussion.)

</issue-template>
