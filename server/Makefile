.PHONY: test-server test-backend lint

JUNIT ?= 0
JUNIT_OUT ?= .reports/pytest-junit.xml
ifeq ($(JUNIT),1)
PYTEST_JUNIT := --junitxml $(JUNIT_OUT)
endif

test-server:
	@if [ "$(JUNIT)" = "1" ]; then mkdir -p "$(dir $(JUNIT_OUT))"; fi
	uv run --extra dev python -m pytest -q $(PYTEST_JUNIT)

test-backend: test-server

lint:
	uv run --extra dev ruff check .
