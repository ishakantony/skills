# Subagent prompt template

Use this template when spawning the per-task subagent via the `Agent` tool. Fill in the `{{...}}` placeholders. Pass `subagent_type: general-purpose`.

```
You are working a single AFK issue end-to-end. Stay focused on this one task.

## The issue

File: `{{issue_path}}` (e.g. issues/003-add-rate-limit.md)

Test rigor: {{test_rigor}}  ← one of `standard`, `mutation`, `legacy`

```
{{full issue file content, verbatim}}
```

## Recent commits (for context — don't repeat work already shipped)

```
{{output of `git log --oneline -20`}}
```

## Project feedback loops (run these before committing)

- Tests: `{{test_command}}`
- Typecheck/lint: `{{typecheck_command}}` (omit if the project has no equivalent)

If either fails, fix the failure before committing. If you can't fix it, stop and report it as a blocker.

## How to implement

1. Explore the repo enough to understand the area you're changing.
2. Use the `tdd` skill: red → green → refactor in vertical slices. One test → one implementation → repeat. No horizontal slicing (do not write all tests first).
3. Build a tracer bullet first if this is a new feature — a thin slice through every layer.
4. The issue's `Behaviors Under Test` section is the source of truth for what to test. Every behavior listed there must be covered by a test. Do not invent additional tests outside that list — if the spec is wrong, fix the spec, don't paper over it with extra tests.
5. Run the feedback loops above. Fix anything they catch.

## Pre-commit gate (REQUIRED unless Test rigor: legacy)

Before `git commit`, run the gate from `tdd/gate.md`. The gate is a hard block:

- **Justification.** For each test that covers a row from `Behaviors Under Test`, write a one-line justification: `test name → behavior covered → would fail if <specific change>`. The "would fail if" must name a concrete change, not a tautology. Include the table in your report-back.
- **No internal mocks.** Tests for listed behaviors must not mock in-process collaborators. Mocks only at the process boundary (network, filesystem, third-party SDK, clock, randomness). Check the project's `CLAUDE.md` for a `## Test boundaries` section listing additional declared boundaries; treat those as external too.
- **Mutation check** (only if `Test rigor: mutation`). For each listed behavior, make one obvious mutation in the implementation (flip a comparison, return a constant, comment a guard); confirm the test fails; revert. If the test passes under mutation, fix the test before committing.

If a test cannot pass a check, either fix it (preferred) or record `gate-waived: <test name> — <one-line reason>` in the commit message. If you reach for more than one waiver in a slice, stop — the slice probably has a design problem; surface it as a blocker.

If `Test rigor: legacy` (orphan old-format issue), skip the gate but include in your report-back: "ran in legacy mode — no Behaviors Under Test to gate against."

## Commit

Make ONE commit when the task is complete (or when you've made meaningful partial progress and need to stop).

Commit message format:

```
<type>(<scope>): <subject>

Decisions:
- <key decision 1>
- <key decision 2>

Files changed:
- <path 1>
- <path 2>

Notes for next iteration:
- <blocker or follow-up, if any>

gate-waived: <test name> — <reason>   ← omit unless waivers were used
```

Use Conventional Commit types (feat, fix, refactor, test, chore, docs).

## Closing the issue

- If the acceptance criteria are met: `git mv {{issue_path}} issues/done/<same-filename>` and include that in the same commit.
- If you stopped partway: append a `## Progress note (YYYY-MM-DD)` section to `{{issue_path}}` describing what's done and what's left, and commit it (do NOT move it to done/).

## Report back

When you finish, return a short report:
- Issue: `{{issue_path}}`
- Status: done | partial | blocked
- Commit SHA: <sha>
- Test rigor used: standard | mutation | legacy
- Justification table (one row per test for a listed behavior)
- Gate waivers: <list, or "none">
- Blockers / follow-ups: <bullets, or "none">

## Rules

- Never `git push`.
- Never use `--no-verify` or skip hooks.
- Never touch other issue files.
- Don't bundle multiple issues into one commit.
- Don't write tests for behavior outside the issue's `Behaviors Under Test` list.
- Don't use a waiver to dodge fixing a test that could be fixed.
```
