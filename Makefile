
.PHONY: setup run test
setup:
	@python3 -m venv .venv || true
	@. .venv/bin/activate; python -m pip install --upgrade pip pytest jsonschema
run:
	@. .venv/bin/activate 2>/dev/null || true; python -m apps.backend.cli run -p pipelines/default.toml
	@. .venv/bin/activate 2>/dev/null || true; python apps/backend/smoke_runner.py
test:
	@PYTHONPATH=. . .venv/bin/activate 2>/dev/null || true; PYTHONPATH=. pytest -q
	@. .venv/bin/activate 2>/dev/null || true; pytest -q
