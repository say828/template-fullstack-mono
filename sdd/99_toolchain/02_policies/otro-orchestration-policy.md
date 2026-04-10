# OTRO Orchestration Policy

## Purpose

This repository treats OTRO (Overlap-Tolerant Residual Orchestration) as a reusable toolchain runtime for repository-wide artifact-grounded development.

## Canonical Terms

- `loop`: the top-level OTRO control cycle
- `step`: the execution slice grouped inside a plan for one loop frontier
- `loop_done`: the current plan backlog is exhausted
- `run_done`: a fresh repository-wide rescan after `loop_done` yields no materially new tasks
- `scope_done`: `run_done` plus scope-level deployment and verification gates pass
- task IDs: `T{step}{ordinal}` canonical numbering, rewritten per step before a plan is persisted

Obsolete alternate field names must not appear in runtime contracts, prompts, plans, or docs. Use `step`, `steps`, and `scope_done` only.

## Runtime Rules

- OTRO plans must keep run-local state under `.codex/skills/otro/runs/<run-name>/`.
- The canonical plan schema is `.codex/skills/otro/schemas/step_plan.schema.json`.
- OTRO runtime must resolve the target repository from run-local configuration or run ancestry, not from a skill directory hard-binding.
- New OTRO plans must emit `step` on tasks and `steps` on grouped frontier entries.
- No compatibility adapter is allowed for obsolete field names. Existing historical evidence may stay as history, but the live runtime must not read or write those fields.

## Template Ownership

- The canonical OTRO skill assets for downstream repositories live under `.codex/skills/otro/`.
- Downstream repositories should copy or vendor the OTRO skill from this template surface instead of inventing repo-local variants.
- When OTRO terminology or contracts change, update this policy and the template skill together.
