# Pre-Commit Gate

The gate is the discipline that prevents tests from being decorative. Run it before every commit produced under the `tdd` skill, including from subagents in `tackle-issues`. This gate is a **hard block**: a commit may not be created until every test for a listed behavior either passes the gate or carries an explicit waiver.

## Inputs

The gate operates against the issue's **Behaviors Under Test** section (and, for tackle-issues, the issue's `Test rigor:` field). Every behavior listed in that section must have at least one test that passes the gate.

If the issue has no `Behaviors Under Test` section (legacy format), see `tackle-issues/SKILL.md` step on auto-upgrade. Do not run the gate against an unstructured acceptance-criteria list — you'll either over-block or rubber-stamp.

## The three checks

### 1. Justification (every test for a listed behavior)

For each test that covers a row from `Behaviors Under Test`, the agent records a one-line justification:

```
test name → behavior covered → "would fail if <specific change>"
```

The "would fail if" clause is the load-bearing part. It must name a concrete change in implementation that the test would catch — not a vague "if behavior breaks". Examples:

- GOOD: `test('redirects to /dashboard on valid login') → Story 3 happy path → would fail if the redirect target is changed or omitted, or if the auth check is skipped`
- BAD: `test('login works') → Story 3 → would fail if login breaks` (tautology — useless)
- BAD: `test('returns user object with id field') → Story 3 → would fail if the shape changes` (tests shape, not behavior — exactly the failure mode this gate exists to catch)

If you cannot write a non-tautological "would fail if" clause for a test, the test is decorative. Rewrite it to assert observable behavior, or delete it.

### 2. No internal mocks (every test for a listed behavior)

Mocks are allowed only at the **process boundary**:

- Network I/O (HTTP clients, RPC, message queues you don't own)
- Filesystem (reading/writing real files in a test that cares about behavior, not I/O)
- Environment / process state (env vars, signals)
- Third-party SDKs (Stripe, Twilio, OAuth providers, etc.)
- The system clock
- Randomness / UUID generation

Mocks are NOT allowed for:

- Functions, classes, or modules in the same process — regardless of file or package
- Internal repositories, services, or domain logic
- Anything you control the source of

If a slice has a legitimate in-process boundary that genuinely cannot be exercised in tests (an embedded engine with slow startup, an in-process bus, a hand-rolled DB pool with no test container), the project may declare it as an additional external boundary in the project's `CLAUDE.md` under a `## Test boundaries` section:

```
## Test boundaries
- `internal-message-bus`: cannot be spun up in-process during tests — mock at this seam.
- `embedded-search-engine`: 30s startup cost — mock at this seam.
```

The gate reads this list (if present) and treats those names as external boundaries. Without an entry, in-process mocks fail the gate.

### 3. Mutation check (only if `Test rigor: mutation`)

For slices marked `Test rigor: mutation` in the issue file, run a manual mutation pass:

For each behavior in `Behaviors Under Test`:

1. Identify the implementation lines that produce the behavior.
2. Make ONE obvious mutation: flip a comparison (`<` → `<=`), invert a boolean, replace a return value with a constant, comment out a guard.
3. Run the relevant test. It MUST fail.
4. Revert the mutation.

If the test passes under the mutation, the test is not actually verifying the behavior — fix the test before committing.

Mutation check is intentionally manual and slow; only critical paths should opt in (the issue's `Test rigor: mutation` field is the opt-in signal). For `Test rigor: standard` slices, skip this check.

## Enforcement: hard block + explicit waiver

The gate blocks the commit. If a test cannot pass a check, you have two options:

1. **Fix the test.** Rewrite to assert behavior (not shape), remove internal mocks, etc. This is the default response.
2. **Waive the test.** Some legitimate cases cannot be made to pass the rules (e.g. a third-party SDK with no DI seam, a behavior only verifiable through call-count assertions on a boundary mock). Waive by recording in the commit message:

```
gate-waived: <test name> — <one-line reason>
```

Example:

```
gate-waived: test('retries on rate limit') — Stripe SDK has no injection seam; mock-call assertion is the only way to verify retry policy.
```

A commit may carry multiple `gate-waived:` lines. The waiver is part of the commit record so reviewers see it without diffing the test file. Surface every waiver in the report-back so it doesn't get buried.

If you find yourself reaching for a waiver more than once per slice, stop. The slice probably has a design problem (poor seams, leaky boundaries) — fix the design instead of accumulating waivers.

## What the gate does NOT check

- Coverage percentage. Coverage is a count, not a quality metric — full coverage of decorative tests is worse than 60% coverage of behavior tests.
- Test count. Two strong tests beat ten weak ones.
- Style / formatting. Not the gate's job.
- Whether you tested behaviors NOT in `Behaviors Under Test`. The PRD/issue is the source of truth for what to test; if the source is wrong, fix the source, not by writing tests outside the spec.

## Order of operations in the TDD loop

The gate is a pre-commit step, not a pre-test step. Run it after all listed behaviors are GREEN, after refactoring, immediately before `git commit`:

```
RED → GREEN → RED → GREEN → ... → REFACTOR → GATE → COMMIT
```

Running the gate earlier wastes cycles (you'll fix tests then change them again during refactor). Running it later means broken tests slip into commits.
