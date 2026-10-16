"""
Pytest configuration for the tests directory.

Test Structure (Module-Based Organization):
- demux_sample_info/ - All demux_sample_info tests (unit, integration, fixtures, conftest)
- flowcell/ - Flowcell tests (Q30 thresholds, sample thresholds)
- pricing/ - Pricing tests (e2e UI tests)
- api/ - Cross-module API/route tests
- scripts/ - Utility scripts for manual testing
- fixtures/ - Shared test data (test_items.yaml)
- shared_fixtures/ - Shared test data files (JSON, schemas)
- test_data/ - Legacy test data directory (kept for non_git_data/)

Module-specific fixtures should go in the module's conftest.py.
This root conftest is for truly shared fixtures only.
"""
