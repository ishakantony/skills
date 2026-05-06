---
name: write-a-prd
description: Generate a PRD from the client brief and write it as a local markdown file in issues/. Use when the user wants to turn a client request into a structured PRD.
---

This skill will be invoked when the user wants to create a PRD. You may skip steps if you don't consider them necessary, EXCEPT step 5 (Behaviors Under Test interview) which is required before writing the PRD file.

1. Ask the user for a long, detailed description of the problem they want to solve and any potential ideas for solutions.

2. Explore the repo to verify their assertions and understand the current state of the codebase.

3. Interview the user relentlessly about every aspect of this plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

4. Sketch out the major modules you will need to build or modify to complete the implementation. Actively look for opportunities to extract deep modules that can be tested in isolation.

A deep module (as opposed to a shallow module) is one which encapsulates a lot of functionality in a simple, testable interface which rarely changes.

Check with the user that these modules match their expectations. Check with the user which modules they want tests written for.

5. **Behaviors Under Test interview (required before writing the PRD).**

The default failure mode of an LLM-written PRD is a vague Testing Decisions section that downstream issues cannot mechanically copy. To prevent that, this step produces a populated, story-grouped table that downstream skills (`prd-to-issues`, `write-an-issue`, `tackle-issues`) inherit from verbatim.

Procedure:

1. Read the user stories you produced in step 3.
2. Draft a candidate Behaviors Under Test table from those stories. For each user story, fill in:
   - **Happy path**: the observable behavior when inputs are valid and dependencies cooperate. One sentence per behavior, phrased as a testable assertion ("user with valid creds is redirected to /dashboard"), not as a feature description.
   - **Edge cases**: input boundaries the model can infer from the user story (empty inputs, max length, unicode, zero, negative, duplicate, concurrent). Mark `[NEEDS USER INPUT]` if domain knowledge is required.
   - **Failure modes**: how the system must behave when a dependency fails (backend 5xx, network timeout, third-party rate limit, partial write). Mark `[NEEDS USER INPUT]` because failure-mode behavior is a product decision, not derivable from user stories.
   - **Out of test scope**: behaviors that will NOT be tested as part of this PRD, with a one-line reason ("third-party SDK retry logic — owned by vendor"; "framework-level routing — covered by framework's own tests"). The point of this subsection is to discipline the subagent: without explicit out-of-scope rows, downstream subagents fill the void with decorative tests.
3. Show the draft to the user. Ask them to correct, fill in `[NEEDS USER INPUT]` rows, and add anything you missed.
4. Iterate until every cell is concrete and every story has at least one out-of-scope entry (even if just "none — full behavior is in scope").
5. Only then proceed to step 6.

Do NOT skip this step. Do NOT write the PRD file with `[NEEDS USER INPUT]` markers still present. Do NOT accept generic placeholders like "covers all edge cases" or "tests handle errors gracefully" — push back and ask for specifics.

6. Once the interview is complete and the Behaviors Under Test table is approved, use the template below to write the PRD. The PRD should be written as a local markdown file at `issues/prd.md`. Create the `issues/` directory if it doesn't exist. Do NOT submit a GitHub issue or call any external service.

<prd-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

## Behaviors Under Test

The product of the step 5 interview. One subsection per user story. Each subsection has four parts:

### Story N — <short title>

**Happy path**
- Behavior phrased as a testable assertion.
- One bullet per behavior.

**Edge cases**
- Input-boundary behaviors the test must cover.

**Failure modes**
- How the system must behave when a dependency fails. Each row names the failure (e.g. "backend 500", "network timeout", "third lockout") and the required user-visible behavior.

**Out of test scope**
- Behaviors deliberately NOT tested for this story. Each row includes a one-line reason. Use "none — full behavior is in scope" if there's nothing to exclude.

A good row reads as a specification: someone could turn it into a test without asking follow-up questions. A bad row describes feature shape ("login form has a password field") instead of behavior ("password is masked by default and toggles to plaintext when the eye icon is clicked").

This section is the source of truth for downstream issues. `prd-to-issues` will copy the relevant rows into each issue verbatim.

## Out of Scope

A description of the things that are out of scope for this PRD. (Distinct from "Out of test scope" above, which is per-story testing scope.)

## Further Notes

Any further notes about the feature.

</prd-template>
