# AGENTS.md

## What this repo is

A collection of AI agent skills (prompt/instruction files). Each skill is a directory containing at minimum a `SKILL.md`. No build system, no tests, no CI, no `package.json`.

## Repo structure

- Top-level directories (`commit/`, `discuss/`, `tdd/`, etc.) are the **source-of-truth skill definitions**
- `.agents/skills/` and `.claude/skills/` contain installed copies — **gitignored**, do not edit directly
- `skills-lock.json` — gitignored, tracks installed skill hashes
- `UPDATE_README.md` — meta-instruction: when skills are added/removed/updated, sync `README.md`

## Skill structure convention

```
skill-name/
├── SKILL.md           # Required. Frontmatter: name + description. Main instructions.
├── REFERENCE.md       # Optional. Detailed docs linked from SKILL.md.
├── scripts/           # Optional. Deterministic helper scripts.
└── SUBAGENT_PROMPT.md # Optional. Prompt template for subagents.
```

Some skills have additional files: `qa-fe-web/executor-prompt.md`, `tackle-issues/SUBAGENT_PROMPT.md`, `tdd/*.md` sub-pages, `web-inspect/scripts/` and `web-inspect/web-inspect.config.json`.

## Key conventions

- SKILL.md frontmatter must have `name` and `description` (max 1024 chars). The description is all the agent sees when choosing which skill to load — it must include trigger keywords ("Use when...").
- SKILL.md should stay under 100 lines; split into separate files if longer.
- No code comments in skills unless explicitly requested (follows the opencode code-style rule).

## Workflow

- Adding a skill: create `<skill-name>/SKILL.md` following the template in `write-a-skill/SKILL.md`. Then update `README.md` (see `UPDATE_README.md`).
- Installing skills into a project: `npx skills@latest add ishakantony/skills/<skill-name>`
- The remote is `ishakantony/skills` on GitHub.
