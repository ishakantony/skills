---
name: tackle-issues
description: Autonomously work through AFK issues from the local issues/ directory in a loop, spawning a subagent per task. Use when user types /tackle-issues or asks to "work the backlog", "burn down issues", "tackle AFK tasks", or run an AFK issue queue. Skips HITL issues. Each task is implemented via TDD in a subagent so the main context stays clean.
---

# Tackle Issues

Loop through AFK issues in `issues/`, picking and completing one task at a time. Each task runs in a subagent.

## Quick start

1. List `issues/*.md` (skip `issues/done/`), classify HITL vs AFK.
2. **Build the queue once** — sort all AFK issues by filename and materialize them as a TODO list (one todo per issue). Each todo's content MUST be the exact issue filename, including the `.md` extension. This is the source of truth for the rest of the loop.
3. If the queue is empty → output `<promise>NO MORE TASKS</promise>` and stop.
4. Pop the next pending todo (skip blocked ones). Before spawning, run the issue-format check (see step 4 below). Spawn a subagent to complete it.
5. After the subagent returns, update that todo (done / partial / blocked) and loop to step 3.

Do **not** re-sort the queue mid-loop. Build it once; only revisit it when a subagent reports a new issue file appeared (append it to the end).

## 1. Read issues

- Read every `issues/*.md` (not recursively — skip `issues/done/`).
- For each, classify HITL vs AFK by reading the file (look for a `Type:` field, an `HITL` tag, or explicit wording).
- Drop HITL issues from the queue.

## 2. Build the queue (once)

Sort all AFK issues alphabetically by filename, then write them to a TODO list using `TaskCreate` — one todo per issue. The todo content MUST be exactly the issue file name, including the `.md` extension, with no prefix, suffix, title, status marker, or extra words.

Examples:

- Issue file `001-add-login.md` → todo content `001-add-login.md`
- Issue file `fix-flaky-tests.md` → todo content `fix-flaky-tests.md`

Do not use todo names like `Tackle 001-add-login.md`, `001-add-login.md: Add login`, or `Add login`. The filename is the stable identifier used to match subagent results back to the queue.

**Blockers.** Any issue whose `Blocked by:` field references something not yet in `issues/done/` is held back — keep it in the list but mark its todo `[blocked: waiting on <X>]` so it is skipped until its blocker is done.

Once the TODO list is written, treat it as immutable order. The only allowed mutations are:
- marking a todo done / partial / blocked after its subagent returns,
- appending newly-discovered issue files to the **end** of the list,
- unblocking a todo when its blocker moves to `issues/done/`.

## 3. Get recent context

Run `git log --oneline -20` yourself to summarize what's already been shipped. Pass this summary to the subagent so it doesn't repeat completed work.

## 4. Issue-format check + spawn a subagent

Before spawning, check the issue's format. New-format issues have a `Behaviors Under Test` section (and a `Test rigor:` field). Old-format issues do not.

**Format decision tree:**

- **New format** (has `Behaviors Under Test`) → spawn the subagent. Pass the `Test rigor:` value (default to `standard` if missing).
- **Old format with a parent PRD that has `Behaviors Under Test`** → auto-upgrade in place: read the parent PRD, copy the relevant rows for this slice's user stories into a new `Behaviors Under Test` section in the issue file, add `Test rigor: standard` if absent, commit the upgrade as `chore(issues): upgrade <file> to new test format`, then spawn the subagent normally. Do this without asking — the source of truth is the PRD and the upgrade is mechanical.
- **Old format with no parent PRD** (orphan) → spawn the subagent in **legacy mode**: pass `Test rigor: legacy` and tell the subagent the gate from `tdd/gate.md` will not run (because there's no behavior list to gate against). Surface the legacy fallback in the report so the user knows this slice ran at lower rigor. Do not auto-upgrade orphans — without a PRD, the subagent would invent the behavior list, defeating the purpose.

Use the `Agent` tool (`subagent_type: general-purpose`) so the main context stays clean. The prompt MUST be self-contained and include:

- The full content of the issue file (post-upgrade if applicable)
- The issue's filename (so the subagent can move it on completion)
- The `Test rigor:` value (`standard` | `mutation` | `legacy`)
- The recent commits summary
- These instructions:
  - Explore the repo first, including discovering the project's test and typecheck/lint commands
  - Implement using the `tdd` skill (red → green → refactor, vertical slices)
  - Before committing, run the project's tests + typecheck/lint and fix failures
  - **Run the gate from `tdd/gate.md` before commit, unless `Test rigor: legacy`.** The gate is a hard block: every test for a behavior listed in `Behaviors Under Test` must pass justification + no-internal-mocks; mutation check additionally for `mutation` rigor. Unavoidable rule violations must be recorded as `gate-waived: <test> — <reason>` in the commit message.
  - Commit with a message that includes: **key decisions made**, **files changed**, **blockers/notes for next iteration**, and any `gate-waived:` lines
  - On success: `git mv issues/<file>.md issues/done/<file>.md`
  - On partial completion: append a `## Progress note (YYYY-MM-DD)` section to the issue file describing what was done and what's left, then commit
  - Report back: which issue, status (done / partial), commit SHA, `Test rigor` actually used, any waivers, any blockers

See [SUBAGENT_PROMPT.md](SUBAGENT_PROMPT.md) for a copy-pasteable prompt template.

## 5. Update the TODO and loop

After the subagent returns, update the corresponding todo immediately — do not batch:

- **done** → mark the todo completed.
- **partial** → mark it completed with a `(partial — see progress note)` suffix; the issue file stays in `issues/` and will be picked up again on a future run, but do **not** re-run it in this loop.
- **blocked** → mark it `[blocked: <reason>]` and move on to the next pending todo.
- **hard blocker for the whole loop** (broken test infra the subagent can't fix, missing dep, etc.) → surface to the user and stop.

Then check for new issue files (a subagent may have split a task or filed a follow-up). Append any new ones to the end of the TODO list using the same sort rules — but **do not reorder existing todos**.

Loop to step 3. When all todos are done/blocked, output `<promise>NO MORE TASKS</promise>`. If only blocked todos remain and nothing can unblock them, surface the blocker chain to the user before stopping.

## Rules

- **One task per subagent.** Never bundle.
- **Never touch HITL issues** — leave them for the user.
- **Never `git push`** unless the user explicitly asks.
- **Never skip hooks** (`--no-verify`, etc.).
- If the project's tests/lint fail and the subagent can't fix them, treat it as a blocker — do not commit broken code to keep the loop moving.
- **Never re-sort the TODO list mid-loop.** Order is decided once at step 2 — filename order. This rule prevents the infinite-thinking-loop failure mode where the model spins re-weighing the queue every iteration.
- **Never bypass the gate.** `Test rigor: legacy` is reserved for orphan old-format issues; never set it to skip the gate on a new-format issue.
- **Surface waivers.** Every `gate-waived:` line in a subagent's commit message must appear in the loop's running report so the user can review them.
