
.PHONY: setup run test clean

setup:
	@python3 -m venv .venv || true
	@. .venv/bin/activate; python -m pip install --upgrade pip pytest jsonschema

run:
	@. .venv/bin/activate 2>/dev/null || true; python -m apps.backend.cli run -p pipelines/default.toml
	@. .venv/bin/activate 2>/dev/null || true; python apps/backend/smoke_runner.py

test:
	@PYTHONPATH=. . .venv/bin/activate 2>/dev/null || true; PYTHONPATH=. pytest -q
	@. .venv/bin/activate 2>/dev/null || true; pytest -q

clean:
	@echo "Cleaning build artifacts and cache..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@rm -rf artifacts/ 2>/dev/null || true
	@echo "Clean complete."
