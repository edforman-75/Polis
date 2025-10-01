.PHONY: smoke deps
deps:
	pip install -r requirements.txt

smoke:
	python3 scripts/openai_smoke.py
