---
name: sdd
description: "Use for any software development request in a repository that treats `sdd/` as the canonical delivery system. Trigger on requests like develop, implement, build, code, work on, modify, fix, patch, refactor, test, verify, deploy, monitor, or screen/UI-driven prompts such as 화면명세서, 화면설계서, 화면 설계, 화면, 화면 스펙, UI, 디자인, 디자인 가이드, screen spec, screen design, or design guide. The workflow is always SDD-first: inspect and update `sdd/01_planning`, create or update the task plan under `sdd/02_plan`, implement the change, record execution in `sdd/03_build`, capture validation in `sdd/03_verify`, and record deployment or monitoring in `sdd/05_operate` when rollout happens."
---

# SDD Development

## Overview

Use this skill for implementation work in repositories that treat `sdd/` as the canonical delivery record.

This skill enforces one workflow:
1. inspect and fix relevant `sdd/01_planning` artifacts first,
2. create or update the task plan under `sdd/02_plan/<section>/`,
3. perform the code work,
4. record the current implementation summary in `sdd/03_build`,
5. record the current retained verification summary in `sdd/03_verify`,
6. record deployment and monitoring outcomes in `sdd/05_operate` when rollout happens.

When rollout is explicitly in scope, and the repository has separate DEV and PROD environments, this skill enforces a staged release rule: deploy to DEV first, complete the retained full-layer validation surface there, promote to PROD only after DEV passes, then rerun the same retained validation surface in PROD. If PROD validation fails, rollback is required unless the user explicitly redirects and that risk is recorded.
For persistence-affecting work, this skill also enforces schema-parity verification. Always compare migration or model intent against the real DEV and PROD schema state for the affected database objects instead of assuming deployed reality matches the code.
Unless the user explicitly forbids it, durable work is not complete at code-edit state. Finish with a coherent git commit, push the retained result to the configured remote, and if the repository ships an installable package or CLI, publish the new version and verify the registry reflects it.

Read [references/section-map.md](references/section-map.md) when you need the exact destination inside `sdd/`.
For screen-spec-driven UI work, reusable static assets from the spec must be extracted through the repo's canonical asset builder before being used in code.
For screen-spec-driven layout work, inspect the repo's canonical design guide builder first when one exists.
For local screen exactness, treat the repo's Playwright exactness runner and suite registry as the canonical automation gate when they exist.
For verification work, treat regression scope selection as a required retained artifact and carry it through `sdd/02_plan`, `sdd/03_build`, and `sdd/03_verify`.
Do not infer rollout scope from the existence of `sdd/05_operate` alone; require rollout only when the user asks for deployment or the repo's current policy/plan makes rollout part of completion.
When a repo or team treats DEV deployment from `main` as the completion bar, temporary branches or worktrees are only working space. Before calling the task deployed, land the final retained change on `main` and push `origin/main`.

## When To Use

Use this skill when:
- the repository has `sdd/01_planning`, `02_plan`, `03_build`, `03_verify`, `05_operate`,
- the user gives a development instruction such as `개발해`, `작업해`, `구현해`, `수정해`, `고쳐`, `리팩토링해`, `테스트해`, `배포해`,
- the user asks for screen/UI work with prompts such as `화면명세서`, `화면설계서`, `화면 설계`, `화면`, `화면 스펙`, `UI`, `디자인`, `디자인 가이드`, `screen spec`, `screen design`, or `design guide`,
- the user wants work to be traceable through those folders,
- the task includes both implementation and documentation/verification updates,
- the task may end in deployment or operational follow-up.

Do not use this skill for:
- casual questions with no repo changes,
- one-off local debugging where no durable SDD record is needed,
- repositories that do not use `sdd/` as their primary document system.

## Workflow

### 1. Inspect Planning First

- Identify the impacted planning area before editing code.
- Open only the relevant artifacts in `sdd/01_planning`:
  - feature
  - screen
  - architecture
  - data
  - api
  - iac
  - integration
  - nonfunctional
  - security
  - test
- If the implementation has already drifted from planning, update the planning artifact first or at least record the drift before coding.

### 2. Create Or Update The Plan

- Create or reuse a durable plan file under `sdd/02_plan/<section>/`.
- Prefer the repo's planning scaffold if available.
- The plan must include:
  - scope
  - assumptions
  - acceptance criteria
  - execution checklist
  - current notes
  - validation
- For any task that may end in deployment, acceptance criteria must explicitly include the DEV gate, the matching PROD gate, the retained full-layer test surface, and the rollback trigger/path.
- For any task that touches persistence, models, repositories, migrations, SQL, ORM mappings, or runtime failures that may involve schema drift, acceptance criteria must explicitly include DEV/PROD schema verification.
- Keep exactly one checklist item in progress.

### 3. Implement Against The Plan

- Make code changes only after the impacted planning artifact and plan are aligned enough to proceed.
- Update the plan current notes after meaningful edits or decisions.
- When document generators or capture pipelines are involved, keep those tools under `sdd/99_toolchain`.
- For local screen exactness, treat Playwright as the canonical automation gate unless the repo documents a stronger exact gate for that surface.
  - In repos created from this template, prefer `python3 sdd/99_toolchain/01_automation/run_playwright_exactness.py --suite <suite-id>` over ad-hoc `npx playwright test ...`.
  - Keep the suite registry in `sdd/99_toolchain/01_automation/playwright_exactness_manifest.py`.
  - Browser Use, manual screenshots, or semantic extraction can supplement diagnosis, but they do not replace the retained Playwright exactness gate when a suite exists.
  - If the needed suite does not exist yet, add or extend it in the same task and register it before calling the work complete.
- When the task depends on icons, logos, illustrations, or other static assets visible in a screen spec, use the repo's canonical Asset Spec Builder first.
  - In repos created from this template, this is typically `sdd/99_toolchain/01_automation/spec_asset_builder.py` or a wrapper/manifest around it.
  - Reusable asset planning records belong under `sdd/01_planning/02_screen/assets/`.
  - Build the runtime asset from the approved PDF/image source instead of hand-tracing or screenshot-cropping it.
  - Use exact verification such as `--verify-exact` when the asset is expected to match the source crop exactly.
  - Record the source, manifest, generated asset path, and any exception in `sdd/03_build` and `sdd/03_verify`.
  - Only fall back to manual recreation when the builder cannot express the asset, and explicitly document that exception in the plan/build/verify trail.
- When the task depends on spacing, layout density, typography, color rhythm, or component hierarchy derived from a screen spec, inspect the repo's canonical design guide builder first.
  - In repos created from this template, inspect `sdd/99_toolchain/01_automation/README.md` and use the actual builder, wrapper, or manifest that exists in the repo.
  - Use the generated guide as the working baseline before manual spacing or palette tweaks.
  - If the repo does not provide a design guide builder yet, document the manual interpretation source in plan/build/verify.
- Define the regression surface before calling implementation complete.
  - Start from `sdd/02_plan/10_test/regression_verification.md`.
  - Identify the direct target plus any upstream, downstream, and shared surfaces affected by the change.
  - If the change touches shared routing, shell/auth, shared state, common components, contracts, generated assets, or builder output, widen the regression scope instead of validating only the edited module.
  - Record the selected regression scope and any justified exclusions in plan/build/verify.
- When rollout is in scope, define one retained full-layer validation surface and reuse it in DEV and PROD.
  - Include the relevant app/runtime entrypoints, API/contracts, persistence/schema, jobs or workflow side effects, shared integrations, and health/monitoring checks affected by the change.
  - Do not promote to PROD with a narrower verification surface than the DEV gate unless the user explicitly approves that exception and it is recorded.

### 4. Record Build Summary

- Record what you implemented in `sdd/03_build`.
- Use:
  - `03_build/01_feature` for feature implementation summaries
  - `03_build/02_screen` for screen implementation summaries
  - `03_build/03_architecture`, `06_iac`, `10_test` for current-state cross-cutting summaries
- Keep entries factual and current-state only: implemented scope, modules, assets, contracts, and current user-visible behavior.

### 5. Record Verification

- Record retained verification status in `sdd/03_verify`.
- Use:
  - `03_verify/01_feature` for feature verification summaries
  - `03_verify/02_screen` for screen verification summaries
  - `03_verify/03_architecture`, `06_iac`, `10_test` for current retained checks and residual risk
- Never claim completion without command-level validation evidence.
- For staged DEV -> PROD rollout, verification must use the same retained full-layer validation surface in both environments.
  - Run the full-layer validation in DEV after deployment and treat it as a hard gate before PROD promotion.
  - After PROD deployment, rerun the same retained validation surface in PROD.
  - If PROD validation fails, execute rollback or the approved recovery procedure immediately and record the failure and recovery outcome.
- For persistence-affecting work, verification must include real schema evidence from both DEV and PROD when those environments exist.
  - Check migration state and actual runtime schema separately.
  - Validate the tables, columns, indexes, constraints, triggers, defaults, and any legacy compatibility objects touched by the change.
  - Record the commands or queries used, the environments checked, and the drift or parity result.
- Regression verification is mandatory.
  - Verification must cover the direct surface and the retained upstream/downstream/shared surfaces selected from the regression baseline.
  - If no automation exists for a needed regression slice yet, run the best available manual or command checks and record that gap as current residual risk.
  - When a Playwright suite exists for the surface, record the canonical runner command, suite id, screenshot/json artifact paths, and any live-vs-local split explicitly.

### 6. Record Operate Outcomes

- If deployment or runtime follow-up happens, update `sdd/05_operate`.
- Use:
  - `05_operate/01_runbooks` for durable operating procedure changes
  - `05_operate/02_delivery_status` for the current live state and monitoring baseline
- Record:
  - what was deployed
  - which live baseline is current
  - how it is monitored
  - any current residual risk
- For staged DEV -> PROD rollout, record the DEV gate, PROD gate, and any rollback outcome explicitly.
- When the DEV deployment baseline is tied to `main`, do not treat a side-branch push as sufficient. Merge, cherry-pick, or otherwise replay the final change onto `main`, push `origin/main`, then record the deployment evidence against that `main` baseline.

## Guardrails

- Do not create or repopulate a parallel `docs/` tree when `sdd/` exists.
- Do not skip planning review just because the code change looks small.
- Do not leave build, verify, or operate evidence only in chat text when it should live in `sdd/`.
- Do not stop after local edits when durable changes remain; commit and push are the default completion bar unless the user explicitly forbids them.
- Do not leave a publishable package or CLI unpublished after changing shipped behavior or instructions unless the user explicitly forbids publish.
- When PROD rollout is in scope, do not promote to PROD before the retained full-layer DEV validation surface has passed.
- When PROD rollout is in scope, do not use a weaker PROD validation surface than the one that gated DEV unless the user explicitly approves and that risk is recorded.
- When PROD rollout is in scope, do not stop at "PROD deployment succeeded"; post-deploy PROD validation is mandatory.
- When PROD rollout is in scope, do not leave a failed PROD deployment unreconciled; rollback or the approved recovery procedure must be executed and recorded.
- Do not assume local tests, migration heads, or current model code prove deployed schema parity.
- Do not skip DEV/PROD schema inspection for persistence-affecting work when schema drift could influence behavior.
- Do not manually redraw screen-spec static assets when a canonical Asset Spec Builder exists for the repo; extract them first and use the generated asset.
- Do not skip a relevant screen automation builder just because the requested UI change looks like a small manual tweak.
- Do not stop verification at the edited file, route, or screen when the change can affect shared or adjacent behavior.
- Do not omit regression scope selection from the retained SDD trail.
- Do not update `05_operate` for tasks that never reached deployment; explicitly note that rollout did not happen instead.
- Do not call a DEV rollout complete from a temporary branch when the repo or team baseline expects the deployed change to be on `origin/main`.

## Output Standard

By the end of an implementation task, the expected trail is:
- planning artifact reviewed or corrected,
- plan file updated,
- build summary written,
- verification summary written, including selected regression scope and residual risk,
- operate status updated if rollout occurred,
- coherent git commit created and pushed,
- publishable package/CLI인 경우 registry publish and latest verification completed unless the user explicitly forbade it.

When PROD rollout is in scope, the retained completion state also requires:
- DEV deployment happened first and the retained full-layer DEV validation surface passed,
- the same retained full-layer validation surface was executed again in PROD,
- DEV/PROD schema state was checked and recorded when schema could influence behavior,
- any PROD validation failure produced rollback or recovery evidence in verify/operate.
