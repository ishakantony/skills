---
name: execute-plan-using-subagent
description: Executes an existing implementation plan by delegating the work to an Implementer subagent, then validates the result with a Reviewer subagent. Use when the current conversation already contains a concrete plan, the user asks to execute a plan, or the user wants implementation and review handled in subagents to keep the main context small.
---

# Execute Plan Using Subagent

Run an existing plan from the current context without bloating the main context: first spawn an Implementer subagent, then spawn a Reviewer subagent to check the implementation against the plan and project practices.

## Quick start

1. Extract the current plan from the conversation and restate only the actionable requirements.
2. Spawn the Implementer subagent using [IMPLEMENTER_PROMPT.md](IMPLEMENTER_PROMPT.md).
3. After the Implementer returns, spawn the Reviewer subagent using [REVIEWER_PROMPT.md](REVIEWER_PROMPT.md).
4. If the Reviewer finds blocking issues, ask the Implementer to fix them or fix them directly if small.
5. Report the implementation status, review result, changed files, and verification commands.

## Workflow

### 1. Confirm there is a plan

- Use the plan already present in the current conversation as the source of truth.
- If no concrete plan exists, stop and ask the user for the plan or ask whether to draft one first.
- Do not invent missing requirements. If a decision blocks execution, ask one focused question.

### 2. Prepare implementation context

Collect only the context needed by the Implementer:

- The plan, acceptance criteria, and explicit non-goals.
- Relevant constraints from the user, repo instructions, and loaded skills.
- Known files, commands, or project areas if already discovered.
- Any user instruction about commits, tests, or forbidden changes.

Do not pass unnecessary conversation history.

### 3. Spawn Implementer

Use the subagent tool with a general-purpose coding agent. Name the role `Implementer` in the prompt.

The Implementer must:

- Explore the repo before editing.
- Implement the plan with the smallest correct change.
- Preserve unrelated user changes.
- Run appropriate verification commands when feasible.
- Return changed files, tests run, unresolved blockers, and a concise implementation summary.

See [IMPLEMENTER_PROMPT.md](IMPLEMENTER_PROMPT.md) for the prompt template.

### 4. Spawn Reviewer

After implementation, spawn a fresh subagent as `Reviewer`. Pass the original plan plus the Implementer's report.

The Reviewer must:

- Review the implementation against the plan and acceptance criteria.
- Check project conventions, tests, edge cases, and maintainability.
- Prioritize bugs, regressions, missing requirements, and missing tests.
- Return findings with severity and file references, or explicitly say no findings.

See [REVIEWER_PROMPT.md](REVIEWER_PROMPT.md) for the prompt template.

### 5. Resolve review outcome

- If there are no blocking findings, summarize completion to the user.
- If findings are small and safe, fix them directly or send them back to the Implementer.
- If findings require product decisions or conflict with the plan, ask the user before continuing.
- Do not commit unless the user explicitly requested a commit.

## Rules

- Keep the main context clean: do implementation and review in subagents whenever possible.
- Never skip the Reviewer step after an Implementer completes.
- Never push, force-push, reset, or discard changes unless explicitly requested.
