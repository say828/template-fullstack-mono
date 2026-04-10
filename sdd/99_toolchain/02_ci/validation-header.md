# Validation Header Check

This repository enforces a small "validation header" at the top of the Template admin validation guide:

- File: `.codex/skills/otro/validation/validation.md`
- Required lines near the top (first ~60 lines):
  - `Status: ...`
  - `Last updated: YYYY-MM-DD (TZ)`

A helper exists to bump the header fields (`.codex/skills/otro/scripts/bump_validation_header.py`). This check ensures the header is present (and optionally fresh) on pull requests.

## Local usage

Presence-only check (default target file):

```bash
python sdd/99_toolchain/01_automation/check_validation_header.py
```

Stricter checks:

```bash
# Require that Last updated is within 2 days and that Status ends with (Txxxxxx)
python sdd/99_toolchain/01_automation/check_validation_header.py --max-age-days 2 --require-task-token
```

Validate a different file:

```bash
python sdd/99_toolchain/01_automation/check_validation_header.py --file sdd/03_verify/10_test/my_validation.md
```

Exit codes:

- `0`: OK
- `1`: file not found
- `2`: missing `Status:` header
- `3`: missing `Last updated:` header or unparsable date
- `4`: `Last updated` is older than `--max-age-days`
- `5`: `Status:` missing `(Txxxxxx)` while `--require-task-token` is set

## GitHub Actions wiring (example)

Add a step to your PR workflow (e.g., `.github/workflows/pr-ci.yml`):

```yaml
- name: Validate Template validation header
  run: |
    python sdd/99_toolchain/01_automation/check_validation_header.py \
      --max-age-days 3 \
      --require-task-token
```

Notes:

- The bump helper workflow is available at `.github/workflows/bump_validation_header.yml` to update the header via `/bump-validation-header` comments or manual dispatch.
- The check script is lenient by default; use flags to enforce freshness or task-token policy as your branch/PR gate requires.
