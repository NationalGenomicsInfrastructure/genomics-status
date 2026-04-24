# Tests for `demux_sample_info`

Tests for `status/demux_sample_info.py`, the handler that classifies samples and generates BCLConvert samplesheets.

## Directory Structure

```
tests/demux_sample_info/
├── conftest.py            # Module-specific fixtures (CouchDB config)
├── unit/                  # Unit tests
│   ├── test_api_post.py
│   ├── test_generate_samplesheets.py
│   ├── test_instrument_type_mapping.py
│   ├── test_override_cycles.py
│   └── test_samplesheet_settings.py
├── integration/           # Integration tests
│   ├── conftest.py
│   ├── test_integration_post.py
│   ├── test_case_contract_sync.py
│   └── case_contract.py
└── fixtures/              # Test data files
    ├── tc*_input.json
    ├── tc*_expected_samplesheets.json
    └── test_cases.md
```

## Prerequisites

Tests fetch the active sample classification configuration directly from CouchDB at runtime. A valid `run_dir/settings/settings_dev.yaml` (relative to the repo root) with CouchDB credentials is required:

```yaml
couch_url: http://your-couchdb:5984
couch_username: your_username
couch_password: your_password
```

The config is cached in memory after the first fetch, so only one network call is made per test run.

## Running the tests

All commands should be run from the repo root.

**Run all demux_sample_info tests:**

```bash
python -m pytest tests/demux_sample_info/
```

**Run only unit tests:**

```bash
python -m pytest tests/demux_sample_info/unit/
```

**Run only the integration tests:**

```bash
python -m pytest tests/demux_sample_info/integration/
```

**Run a single test file:**

```bash
python -m pytest tests/demux_sample_info/unit/test_generate_samplesheets.py
```

## Running with a coverage report

**Generate coverage and print a summary:**

```bash
python -m coverage run --source=status.demux_sample_info -m pytest tests/demux_sample_info/
python -m coverage report --include=status/demux_sample_info.py
```

**Show which lines are not covered:**

```bash
python -m coverage report --include=status/demux_sample_info.py --show-missing
```

**Generate a browsable HTML report:**

```bash
python -m coverage html --include=status/demux_sample_info.py
open htmlcov/index.html   # macOS; use xdg-open on Linux
```

## Test modules

| File | What it tests |
|------|---------------|
| `test_demux_sample_info_post.py` | POST endpoint: request validation, sample classification, document creation, HTTP responses |
| `test_generate_samplesheets.py` | Samplesheet generation logic: `OverrideCycles`, grouping, BCLConvert data formatting |
| `test_override_cycles.py` | `_calculate_override_cycles` for all sample types and run setups |
| `test_samplesheet_settings.py` | Per-sample samplesheet settings derived from classification config |
| `test_instrument_type_mapping.py` | Instrument type and run mode config hierarchy (e.g. NovaSeqXPlus + 10B) |
| `test_demux_sample_info_api.py` | API-level smoke tests |
| `integration_tests/test_integration_post.py` | End-to-end POST tests comparing full samplesheet output against expected JSON snapshots |

### Integration test cases

The integration tests POST a complete request and compare the resulting samplesheets against expected output stored as JSON files next to the test:

| Test case | Input | Expected output |
|-----------|-------|-----------------|
| TC1 — single-index standard | `tc1_input.json` | `tc1_expected_samplesheets.json` |
| TC2 — dual-index, mixed lanes (10X + standard) | `tc2_input.json` | `tc2_expected_samplesheets.json` |
| TC3 — no-index (unindexed library, MiSeq) | `tc3_input.json` | `tc3_expected_samplesheets.json` |
| TC4 — mixed single-index and dual-index on one lane | `tc4_input.json` | `tc4_expected_samplesheets.json` |
| TC5 — single-index, zero barcode mismatches | `tc5_input.json` | `tc5_expected_samplesheets.json` |
| TC7 — standard dual-index (index length = run cycles) | `tc7_input.json` | `tc7_expected_samplesheets.json` |
| TC11 — SI-NA named indices with UMI in I2 channel | `tc11_input.json` | `tc11_expected_samplesheets.json` |

TC6 (special 10X index replacement) has no independent example data and is covered by TC11.
TC8–TC10 are not yet documented in `test_cases.md`.

To add a new test case, add `tcN_input.json` and `tcN_expected_samplesheets.json` alongside the existing files and add a test method in `test_integration_post.py` following the same pattern.
