---
name: write-an-issue
description: Generate a single issue file in issues/ directly, without a parent PRD. Use when the user wants to capture one vertical slice of work as an actionable issue — typically after a /discuss session, or standalone for a small, well-scoped task.
---

# Write an Issue

Write a single, independently-workable issue as a local markdown file. This skill produces ONE issue and does not create a parent PRD.

## When this skill is invoked

This skill has two modes:

- **From a `/discuss` session**: scope is already established. Skip the gating check and proceed to step 3.
- **Standalone**: the user invokes this directly without prior discussion. Run the gating check below before writing.

Detect the mode from conversation context. If in doubt, ask the user.

## Process

### 1. Gate (standalone mode only)

Ask the user for a 1-2 sentence description of the work, then check:

- Does it cut through all layers as one thin vertical slice (schema, API, UI, tests where applicable)?
- Is the design resolved, with no unresolved branches that need debate?

If yes, proceed. If no — multiple slices, or unresolved design questions — recommend `/write-a-prd` instead and stop.

If the user insists on a single issue anyway, proceed.

### 2. Confirm HITL/AFK + Test rigor

Ask: "Is this AFK (can be implemented autonomously) or HITL (needs human input)? And is `Test rigor: standard` enough, or does this slice need `mutation` (critical path — payments, auth, data integrity)?"

Default to AFK + standard. Pick HITL if the work obviously requires design review, an architectural call, or has ambiguous scope. Pick mutation only if the slice is on a critical path.

### 3. Mini-interview: Behaviors Under Test (required)

Because there is no parent PRD to inherit a behaviors table from, this skill has its own scaled-down behaviors interview. The default failure mode without it is a vague "Acceptance criteria" list and a subagent that improvises decorative tests. Do not skip.

Procedure:

1. From the user's description in step 1, draft a candidate Behaviors Under Test block for this single slice. Fill in:
   - **Happy path**: testable assertions for the slice's primary behavior. Phrase as observable behavior, not feature shape ("entered amount ≤ balance triggers transfer", not "amount field accepts numbers").
   - **Edge cases**: input boundaries the model can infer (empty, max, zero, negative, unicode, duplicates, concurrency). Mark `[NEEDS USER INPUT]` if domain knowledge is required.
   - **Failure modes**: how the slice must behave when a dependency fails (5xx, timeout, partial write). Mark `[NEEDS USER INPUT]` — failure-mode behavior is a product decision.
   - **Out of test scope**: what this slice will NOT test, with a one-line reason.
2. Show the draft and ask the user to correct, fill in `[NEEDS USER INPUT]` rows, and add anything missed.
3. Iterate until every cell is concrete. Push back on generic placeholders ("handles errors gracefully", "covers edge cases") — ask for specifics.
4. Only then proceed to step 4.

### 4. Determine the file name

Check `issues/` for existing files. Create the directory if it doesn't exist. Use the next available number with the pattern `issues/NNN-short-title.md` (e.g. `issues/001-add-user-auth.md`).

### 5. Write the issue

Use the template below. Do NOT use `gh issue create` or any GitHub CLI commands. Do NOT reference GitHub issue numbers. Do NOT write the file with `[NEEDS USER INPUT]` markers still present.

<issue-template>
**Type:** AFK (or HITL)

**Test rigor:** standard (or `mutation`)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Behaviors Under Test

The product of the step 3 interview.

**Happy path**
- ...

**Edge cases**
- ...

**Failure modes**
- ...

**Out of test scope**
- ...

## Tests deliberately deferred to a later slice

Behaviors that this slice's "What to build" implies but that are NOT tested here because a later issue will cover them. Each row names the behavior and the issue it's deferred to. Use "none" if every implied behavior is tested here.

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
