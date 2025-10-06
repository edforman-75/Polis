.PHONY: setup run test
setup:
	@python3 -m venv .venv || true
	@. .venv/bin/activate; python -m pip install --upgrade pip pytest jsonschema
run:
	@. .venv/bin/activate 2>/dev/null || true; python apps/backend/smoke_runner.py
test:
	@. .venv/bin/activate 2>/dev/null || true; pytest -q
