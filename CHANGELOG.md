# Changelog

All notable changes to the Polis project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Pipeline framework with modular stage architecture
- Automatic stage discovery and registration system
- CLI interface for pipeline management (`apps/backend/cli.py`)
- Example pipeline stages (parse, label, write)
- Template for custom stages (`my_real_stage.py`)
- TOML-based pipeline configuration (`pipelines/default.toml`)
- Artifact output system (`artifacts/pipeline_output.json`)
- Smoke test suite for pipeline validation
- GitHub Actions CI workflow
- CI status badge in README
- Comprehensive `.gitignore` for Python projects
- This CHANGELOG

### Changed
- Repository structure reorganized with `apps/backend/pipeline/` hierarchy
- Makefile enhanced with `test`, `run`, and `clean` targets
- README updated with CI badge and setup instructions

### Fixed
- Python `__pycache__` files now properly ignored
- Branch cleanup (merged and deleted `fix/housekeeping-batch2-smoke-e2e`)

## [0.1.0] - 2025-01-06

### Added
- Initial project structure
- Basic pipeline orchestration framework
- Stage-based processing architecture
- Test harness with pytest
- Development environment setup

---

## Development Notes

### Branch Strategy
- `main` - Production-ready baseline
- Feature branches: `feature/*` or `fix/*`
- All features merged via PR with CI validation

### Release Process
1. Update version in relevant files
2. Update CHANGELOG.md with release date
3. Create git tag: `git tag -a v0.x.0 -m "Release v0.x.0"`
4. Push tag: `git push origin v0.x.0`

### Version History
- **v0.1.0** - Initial pipeline framework
- Current: In active development
