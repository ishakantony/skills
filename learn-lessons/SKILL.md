---
name: learn-lessons
description: Looks up local lessons and expands them into actionable guidance for the current task. Use when the user asks to learn from lessons, mentions /Users/ishak/Codebase/lessons, gives a lesson hint, or wants prior lessons applied to the current coding, debugging, review, planning, or research context.
---

# Learn Lessons

## Quick Start

When invoked, inspect `/Users/ishak/Codebase/lessons` for lessons that may apply to the current user request. If the user gives a hint, keyword, file name, or topic, start there first.

## Workflow

1. Identify the current task context:
   - What the user is trying to do
   - Technologies, files, errors, or decisions involved
   - Any lesson hints the user provided

2. Search the lessons directory:
   - Prefer targeted searches using the user's hints and task keywords
   - If no hint is provided, scan lesson names and summaries before reading deeply
   - Read only lessons likely to affect the current work

3. Expand lesson knowledge:
   - Follow references inside relevant lessons when they are needed to understand or apply the lesson
   - Use web or repo research only when it materially improves the current task
   - Always use a subagent for broader lesson research or reference expansion when applicable, to preserve the main context window

4. Apply the lessons:
   - Convert lessons into concrete actions, constraints, checks, or implementation choices
   - Keep the current task primary; do not turn lesson research into an unrelated research project
   - Mention the lesson-derived guidance when it changes the approach

## Subagent Guidance

Use a subagent when lesson work requires more than a quick lookup, such as:

- Searching multiple lessons for overlapping guidance
- Following references inside lessons
- Comparing lessons against current code or design choices
- Producing a concise summary of applicable constraints

Ask the subagent to return only the relevant lesson names, key takeaways, referenced material consulted, and recommended actions for the current task.

## Output Expectations

When reporting back, keep it concise:

- State which lessons were used, if any
- Summarize only the guidance that affected the work
- If no applicable lessons were found, say so and continue with normal task execution
