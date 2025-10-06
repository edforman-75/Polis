# Developer Handoff: Polis Pipeline Framework

**Date:** January 2025
**Status:** Production-Ready Baseline
**Repository:** https://github.com/edforman-75/Polis
**Branch:** `main`

---

## Executive Summary

The Polis project has completed Batch 2–3 of housekeeping, establishing a working end-to-end parser pipeline with CI integration and comprehensive test coverage. The system is now ready for integration with real data adapters and production use.

---

## Current Architecture

### Project Structure

```
Polis/
├── apps/
│   └── backend/
│       ├── cli.py                    # Unified entry point
│       └── pipeline/
│           ├── base.py               # Stage base class
│           ├── orchestrator.py       # Pipeline runner
│           └── stages/
│               ├── example_parse.py  # Parser example
│               ├── example_label.py  # Labeler example
│               ├── example_write.py  # Writer example
│               └── my_real_stage.py  # Custom stage template
├── pipelines/
│   └── default.toml                  # Pipeline configuration
├── artifacts/
│   └── pipeline_output.json          # Output artifacts
├── tests/
│   ├── conftest.py                   # Test fixtures
│   ├── test_e2e_parser.py           # End-to-end tests
│   └── test_pipeline_smoke.py        # Smoke tests
├── packages/
│   └── schema/                       # Data schemas
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI
├── Makefile                          # Development commands
├── requirements.txt                  # Python dependencies
├── CHANGELOG.md                      # Version history
└── README.md                         # Project documentation
```

### Key Components

#### 1. Pipeline Orchestrator
**File:** `apps/backend/pipeline/orchestrator.py`

- Loads TOML configuration
- Auto-discovers and registers stages
- Executes stages in order
- Handles data flow between stages

#### 2. Stage Base Class
**File:** `apps/backend/pipeline/base.py`

- Abstract base for all pipeline stages
- Enforces `execute()` method implementation
- Provides parameter passing infrastructure

#### 3. CLI Interface
**File:** `apps/backend/cli.py`

**Commands:**
```bash
python -m apps.backend.cli stages     # List available stages
python -m apps.backend.cli run -p pipelines/default.toml  # Run pipeline
```

#### 4. Configuration
**File:** `pipelines/default.toml`

Defines pipeline execution order:
```toml
[[stage]]
name = "example_parse"
[stage.params]
source = "input.txt"

[[stage]]
name = "example_label"

[[stage]]
name = "example_write"
[stage.params]
output = "artifacts/pipeline_output.json"
```

---

## Development Workflow

### Setup

```bash
cd ~/Polis
python3 -m venv .venv
source .venv/bin/activate  # or `. .venv/bin/activate`
pip install -r requirements.txt
```

### Running Tests

```bash
make test                  # Run all tests
pytest -v                  # Verbose test output
pytest tests/test_pipeline_smoke.py  # Specific test
```

### Running Pipeline

```bash
make run                   # Run default pipeline
python -m apps.backend.cli run -p pipelines/default.toml  # Explicit
```

### Development Commands

```bash
make test                  # Run pytest
make run                   # Execute pipeline
make clean                 # Remove artifacts and cache
```

---

## Creating a New Stage

### Step 1: Create Stage File

Create `apps/backend/pipeline/stages/my_stage.py`:

```python
from apps.backend.pipeline.base import Stage

class MyStage(Stage):
    """Brief description of what this stage does."""

    def execute(self, data: dict, params: dict) -> dict:
        """
        Process data with custom logic.

        Args:
            data: Input data from previous stage
            params: Configuration from TOML

        Returns:
            Modified data dictionary
        """
        # Your logic here
        result = do_something(data, params)
        return {"my_output": result, **data}
```

### Step 2: Add to Pipeline Config

Edit `pipelines/default.toml`:

```toml
[[stage]]
name = "my_stage"
[stage.params]
param1 = "value1"
param2 = 42
```

### Step 3: Test

```bash
make test
```

The stage is **automatically discovered** - no registration required!

---

## Testing Guidelines

### Test Structure

- **Unit tests:** Test individual stages in isolation
- **Smoke tests:** Validate end-to-end pipeline execution
- **Integration tests:** Test stage interactions

### Example Test

```python
def test_my_stage():
    from apps.backend.pipeline.stages.my_stage import MyStage

    stage = MyStage()
    data = {"input": "test"}
    params = {"param1": "value"}

    result = stage.execute(data, params)

    assert "my_output" in result
    assert result["my_output"] == expected_value
```

---

## Continuous Integration

### GitHub Actions

**File:** `.github/workflows/ci.yml`

**Triggers:**
- Every push to any branch
- Every pull request

**Jobs:**
1. Checkout code
2. Set up Python 3.13
3. Install dependencies
4. Run pytest

**Status:** [![CI](https://github.com/edforman-75/Polis/actions/workflows/ci.yml/badge.svg)](https://github.com/edforman-75/Polis/actions)

---

## Common Tasks

### Add a New Dependency

```bash
pip install package-name
pip freeze > requirements.txt
```

### Update CHANGELOG

Edit `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

### Clean Build Artifacts

```bash
make clean
# or manually:
rm -rf artifacts/ __pycache__/ .pytest_cache/
```

---

## Known Issues & Limitations

1. **Stage Discovery:** Currently limited to `apps/backend/pipeline/stages/` directory
2. **Error Handling:** Pipeline stops on first error (no retry/fallback yet)
3. **Logging:** Basic print statements (consider structured logging)
4. **Concurrency:** Sequential execution only (no parallel stages)

---

## Next Steps & Roadmap

### Immediate Priorities

1. **Real Data Adapters:** Replace example stages with production parsers
2. **Error Handling:** Add retry logic and graceful degradation
3. **Logging:** Implement structured logging (JSON logs)
4. **Monitoring:** Add metrics and health checks

### Future Enhancements

1. **Parallel Execution:** Support concurrent stage execution
2. **Stage Dependencies:** Define explicit stage dependencies
3. **Data Validation:** Schema validation between stages
4. **Performance:** Add caching and optimization
5. **Documentation:** API docs with Sphinx
6. **Deployment:** Docker containerization

---

## Contact & Support

**Repository:** https://github.com/edforman-75/Polis
**Issues:** https://github.com/edforman-75/Polis/issues
**CI Status:** https://github.com/edforman-75/Polis/actions

---

## Handoff Checklist

- [x] Code merged to `main`
- [x] All tests passing
- [x] CI workflow configured
- [x] `.gitignore` updated
- [x] CHANGELOG created
- [x] Developer handoff document created
- [x] README updated with CI badge
- [ ] Production data adapters implemented
- [ ] Structured logging added
- [ ] Error handling enhanced
- [ ] Docker deployment configured

---

## Quick Reference

### Most Common Commands

```bash
# Setup
cd ~/Polis && . .venv/bin/activate

# Development
make test                              # Run tests
make run                               # Run pipeline
python -m apps.backend.cli stages      # List stages

# Git Workflow
git checkout -b feature/my-feature
# ... make changes ...
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
# ... create PR on GitHub ...

# CI Check
# Visit: https://github.com/edforman-75/Polis/actions
```

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Next Review:** As needed for major changes
