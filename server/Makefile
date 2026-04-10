.PHONY: test-server test-backend typecheck

# Optional JUnit XML output
# - Enable with `JUNIT=1`
# - Override path with `JUNIT_OUT=/path/to/report.xml`
JUNIT ?= 0
JUNIT_OUT ?= .reports/pytest-junit.xml
ifeq ($(JUNIT),1)
PYTEST_JUNIT := --junitxml $(JUNIT_OUT)
endif

# Run server tests using uv with dev extras (pytest -q).
# Relies on [tool.pytest.ini_options] pythonpath = ["."] in pyproject.toml.
test-server:
	@if [ "$(JUNIT)" = "1" ]; then mkdir -p "$(dir $(JUNIT_OUT))"; fi
	uv run --extra dev python -m pytest -q $(PYTEST_JUNIT)

# Backward-compatible alias for older automation.
test-backend: test-server

# Static type checking using mypy with server config.
# Runs mypy with the server's pyproject.toml to avoid duplicate-module
# discovery when invoking from different working directories.
typecheck:
	uv run --extra dev python -m mypy --config-file pyproject.toml
