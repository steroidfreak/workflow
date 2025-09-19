# Repository Guidelines

## Project Structure & Module Organization
Keep executable agent logic inside `src/agents/`, shared utilities in `src/shared/`, and orchestration entry points in `src/main.py`. Configuration templates belong in `config/`, datasets or prompts in `assets/`, and documentation drafts in `docs/`. Place all automated tests under `tests/`, mirroring the `src/` structure (`tests/agents/test_task_router.py`). Use `scripts/` for repeatable maintenance tasks. A minimal layout:
```
src/
  agents/
  shared/
  main.py
config/
tests/
scripts/
assets/
```

## Build, Test, and Development Commands
Create a virtual environment with `python -m venv .venv` and activate it (`.venv\Scripts\Activate.ps1`). Install dependencies from `requirements.txt` via `pip install -r requirements.txt`. Run type checks with `mypy src`, lint with `ruff check src tests`, and format using `ruff format`. Execute automated suites with `pytest`. When a `Makefile` is available, `make qa` should run lint, type check, and tests together before you push.

## Coding Style & Naming Conventions
Use Python 3.12 syntax, 4-space indentation, and explicit imports (`from src.shared.cache import CacheClient`). Follow snake_case for functions and module names, PascalCase for classes, and UPPER_SNAKE_CASE for constants. Keep agent prompts in separate `.md` files named after the agent (`assets/prompts/researcher.md`). Run `ruff check --fix` before committing to enforce formatting and lint rules.

## Testing Guidelines
Author unit tests with `pytest` and rely on fixtures inside `tests/conftest.py`. Name files `test_<subject>.py` and include scenario-focused test names (`test_handles_rate_limit_gracefully`). Maintain >=85% line coverage, measured with `pytest --cov=src --cov-report=term-missing`. Add regression tests for every critical bug fix and integration tests for new agent workflows.

## Commit & Pull Request Guidelines
Write Conventional Commit messages (`feat: add planner agent shell`), keeping subject lines under 72 characters. Squash local WIP commits before opening a pull request. Every PR should describe the change, link related issues, note manual verification steps, and attach logs or screenshots if behaviour is user-visible. Request at least one review, wait for CI green checks, and re-run `make qa` after addressing feedback.

## Security & Configuration Tips
Never commit secrets or API keys; load them from `.env` files referenced in `config/example.env`. Document any new environment variable inside `docs/configuration.md`. When using external tools, pin versions in `requirements-lock.txt` and update hashes through `pip-compile` so agent runs stay reproducible.
