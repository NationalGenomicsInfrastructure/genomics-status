# Tests

This directory contains all automated tests for the genomics-status application.

## Directory Structure

Tests are organized by application module (module-based organization). Each module contains its own unit tests, integration tests, test data, and fixtures.

```
tests/
├── conftest.py                  # Root pytest configuration
├── fixtures/                    # Shared test data
│   └── test_items.yaml          # Test items for API route tests
├── shared_fixtures/             # Shared test data files (JSON, schemas)
│   ├── demux_sample_info_1.json
│   ├── samplesheet_schema.json
│   └── ...
├── demux_sample_info/           # All demux_sample_info tests
│   ├── README.md                # Module-specific documentation
│   ├── conftest.py              # Module-specific fixtures (CouchDB config)
│   ├── unit/                    # Unit tests (fast, isolated)
│   │   ├── test_api_post.py
│   │   ├── test_generate_samplesheets.py
│   │   ├── test_instrument_type_mapping.py
│   │   ├── test_override_cycles.py
│   │   └── test_samplesheet_settings.py
│   ├── integration/             # Integration tests (DB, multiple components)
│   │   ├── conftest.py
│   │   ├── test_integration_post.py
│   │   ├── test_case_contract_sync.py
│   │   └── case_contract.py
│   └── fixtures/                # Module-specific test data
│       ├── tc*_input.json
│       ├── tc*_expected_samplesheets.json
│       └── test_cases.md
├── flowcell/                    # Flowcell tests
│   ├── test_q30_thresholds.py
│   └── test_sample_thresholds.py
├── pricing/                     # Pricing tests
│   └── e2e/                     # End-to-end UI tests
│       └── test_pricing_ui.py
├── api/                         # Cross-module API route tests
│   └── test_routes.py
├── scripts/                     # Utility scripts for manual testing
│   └── post_demux_sample_info.py
└── test_data/                   # Legacy test data (kept for non_git_data/)
    └── non_git_data/            # Gitignored real flowcell data
```

## Running Tests

All commands should be run from the repository root (`/workspaces/status/`).

### Run All Tests

```bash
pytest tests/
```

### Run Tests by Module

Run all tests for a specific module:

```bash
pytest tests/demux_sample_info/
pytest tests/flowcell/
pytest tests/pricing/
pytest tests/api/
```

### Run Tests by Type

Run specific test types within a module:

```bash
# Unit tests only (fast, no external dependencies)
pytest tests/demux_sample_info/unit/

# Integration tests only (may require database)
pytest tests/demux_sample_info/integration/
```

### Run Specific Test Files

```bash
pytest tests/flowcell/test_q30_thresholds.py
pytest tests/demux_sample_info/unit/test_generate_samplesheets.py
```

### Run Specific Test Cases

```bash
pytest tests/flowcell/test_q30_thresholds.py::TestQ30Thresholds::test_miseq_thresholds
pytest tests/demux_sample_info/unit/test_api_post.py::TestDemuxSampleInfoPost::test_classify_sample_type_10x_dual
```

### Run with Verbose Output

```bash
pytest tests/ -v
pytest tests/demux_sample_info/ -vv
```

### Run with Coverage

Use Python's built-in `coverage` module to measure test coverage:

```bash
# Run tests with coverage
python -m coverage run -m pytest tests/demux_sample_info/
python -m coverage report --include=status/demux_sample_info.py

# Show which lines are not covered
python -m coverage report --include=status/demux_sample_info.py --show-missing

# Generate HTML coverage report
python -m coverage run -m pytest tests/
python -m coverage html
# Open htmlcov/index.html in a browser

# Coverage for all tests
python -m coverage run -m pytest tests/
python -m coverage report
```

**Optional:** You can also use `pytest-cov` plugin if installed (`pip install pytest-cov`):

```bash
pytest tests/ --cov=status --cov-report=html
```

### Run Tests in Parallel

```bash
# Install pytest-xdist if needed: pip install pytest-xdist
pytest tests/ -n auto
```

## Prerequisites

### Required Configuration

Some tests require a valid CouchDB configuration in `run_dir/settings/settings_dev.yaml`:

```yaml
couch_url: http://your-couchdb:5984
couch_username: your_username
couch_password: your_password
```

Tests that require this configuration:
- All `demux_sample_info` tests (fetches sample classification config from CouchDB)

### Optional Dependencies

- **Selenium tests**: `pricing/e2e/test_pricing_ui.py` requires Chrome/ChromeDriver
- **API route tests**: `api/test_routes.py` requires a running server at `localhost:9761`

## Adding New Tests

### Where to Put New Tests

1. **Testing a specific module** (e.g., `status/flowcell.py`):
   - Create or add to `tests/flowcell/test_*.py`
   - Use `tests/flowcell/fixtures/` for test data if needed

2. **Testing demux_sample_info functionality**:
   - **Unit tests**: `tests/demux_sample_info/unit/`
   - **Integration tests**: `tests/demux_sample_info/integration/`
   - **Test data**: `tests/demux_sample_info/fixtures/`

3. **Testing cross-module API routes**:
   - Add to `tests/api/test_routes.py`

4. **New module** (e.g., `status/new_feature.py`):
   - Create `tests/new_feature/`
   - Add module-specific `conftest.py` if needed
   - Organize with `unit/` and `integration/` subdirectories if the module grows

### Fixture Organization

- **Shared across all tests**: `tests/fixtures/` or `tests/shared_fixtures/`
- **Module-specific**: `tests/module_name/fixtures/`
- **Module-specific fixtures/functions**: `tests/module_name/conftest.py`

### Naming Conventions

- **Test files**: `test_*.py` or `*_test.py`
- **Test classes**: `Test<FeatureName>` (e.g., `TestQ30Thresholds`)
- **Test functions**: `test_<description>` (e.g., `test_miseq_thresholds`)
- **Fixture files**: Descriptive names, preferably with context (e.g., `tc1_input.json`, not `input1.json`)

## Test Philosophy

### Module-Based Organization

Tests mirror the source code structure:
- `status/demux_sample_info.py` → `tests/demux_sample_info/`
- `status/flowcell.py` → `tests/flowcell/`

Benefits:
- **Intuitive navigation**: Easy to find tests for a specific module
- **Module independence**: Each module is self-contained
- **Clear ownership**: Module maintainers own both code and tests

### Test Types

1. **Unit tests** (`unit/`):
   - Fast, isolated, no external dependencies
   - Mock external services (databases, APIs)
   - Test individual functions/methods

2. **Integration tests** (`integration/`):
   - Test multiple components together
   - May use real databases or external services
   - Verify component interactions

3. **End-to-end tests** (`e2e/`):
   - Test complete user workflows
   - Use browser automation (Selenium)
   - Slower, more brittle, fewer in number

### Best Practices

1. **Keep tests close to code**: Test organization mirrors source structure
2. **Isolate test data**: Use fixtures and avoid hardcoded data in tests
3. **Fast by default**: Unit tests should run in milliseconds
4. **Clear test names**: Test name should describe what is being tested
5. **One assertion per test**: Each test should verify one behavior (when practical)
6. **Use fixtures**: Leverage pytest fixtures for setup/teardown
7. **Document complex tests**: Add docstrings explaining test purpose

## Troubleshooting

### Tests not discovered

If pytest doesn't find your tests:
1. Ensure file names start with `test_` or end with `_test.py`
2. Ensure test functions start with `test_`
3. Check that directories have `__init__.py` files if needed
4. Run `pytest --collect-only` to see what pytest discovers

### Import errors

If you see import errors:
1. Run pytest from the repository root
2. Ensure the module path is correct (e.g., `from status.module import ...`)
3. Check that your test file location matches the import structure

### CouchDB connection errors

If demux_sample_info tests fail with connection errors:
1. Verify `run_dir/settings/settings_dev.yaml` exists and has valid credentials
2. Ensure CouchDB is accessible from your environment
3. Check that the `demux_configuration` database exists with the required views

### Server connection errors

If API route tests fail:
1. Start the server: `python status_app.py`
2. Verify it's running on `localhost:9761`
3. Or skip these tests with: `pytest tests/ --ignore=tests/api/`

## CI/CD Integration

### Running in CI

```bash
# Run all tests except those requiring a running server
pytest tests/ --ignore=tests/api/ --ignore=tests/pricing/e2e/

# Run only fast unit tests
pytest tests/*/unit/

# Run with JUnit XML output for CI
pytest tests/ --junit-xml=test-results.xml
```

### Parallel Execution

For faster CI builds, run tests in parallel:

```bash
pytest tests/ -n auto --dist loadgroup
```

## Additional Resources

- **Module-specific documentation**: See `tests/demux_sample_info/README.md` for detailed demux testing info
- **pytest documentation**: https://docs.pytest.org/
- **Migration plan**: See `tests/plan.md` for details on the test reorganization

## Questions?

For questions about test organization or to propose changes to the test structure, please open an issue or contact the development team.
