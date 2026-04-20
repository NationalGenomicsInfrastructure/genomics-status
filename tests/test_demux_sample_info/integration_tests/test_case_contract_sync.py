"""Tests that keep markdown test case documentation synchronized with fixtures."""

from __future__ import annotations

import json
import re
from pathlib import Path

from tests.test_demux_sample_info.integration_tests.case_contract import (
    extract_lims_sample_data_from_case,
    load_test_cases,
    translate_lims_csv_to_fixture_format,
)

_HERE = Path(__file__).parent
_MARKDOWN_PATH = _HERE / "test_cases.md"
_INTEGRATION_TEST_FILE = _HERE / "test_integration_post.py"
_INPUT_GLOB = "tc*_input.json"
_EXPECTED_GLOB = "tc*_expected_samplesheets.json"


def _fixture_case_ids(pattern: str, suffix: str) -> set[str]:
    ids: set[str] = set()
    for path in _HERE.glob(pattern):
        case_id = path.name.removesuffix(suffix)
        if re.match(r"^tc[0-9]+$", case_id):
            ids.add(case_id)
    return ids


def test_markdown_test_cases_match_fixture_files_on_disk():
    """Test case headings must match available tc input/expected JSON files."""
    cases = load_test_cases(_MARKDOWN_PATH)
    markdown_case_ids = {case["case_id"] for case in cases}

    input_ids = _fixture_case_ids(_INPUT_GLOB, "_input.json")
    expected_ids = _fixture_case_ids(
        _EXPECTED_GLOB,
        "_expected_samplesheets.json",
    )

    assert input_ids == expected_ids, (
        "Input and expected fixture files don't match. "
        f"Input: {sorted(input_ids)}, Expected: {sorted(expected_ids)}"
    )
    assert markdown_case_ids == input_ids, (
        "Markdown test cases don't match fixture files. "
        f"Markdown: {sorted(markdown_case_ids)}, Fixtures: {sorted(input_ids)}"
    )


def test_markdown_test_cases_match_integration_test_coverage():
    """Integration test methods should cover exactly the markdown test cases."""
    cases = load_test_cases(_MARKDOWN_PATH)
    markdown_case_ids = {case["case_id"] for case in cases}

    integration_test_text = _INTEGRATION_TEST_FILE.read_text()
    covered_case_ids = set(
        re.findall(
            r'_run_tc_test\(\s*"[^"]+"\s*,\s*"(tc[0-9]+)"\s*\)',
            integration_test_text,
        )
    )

    assert covered_case_ids == markdown_case_ids, (
        "Integration test coverage doesn't match markdown test cases. "
        f"Covered: {sorted(covered_case_ids)}, Markdown: {sorted(markdown_case_ids)}"
    )


def test_each_test_case_has_lims_sample_sheet_header():
    """Each test case must have a '### LIMS sample sheet' heading."""
    cases = load_test_cases(_MARKDOWN_PATH)
    markdown_text = _MARKDOWN_PATH.read_text()

    for case in cases:
        test_case_number = case["test_case_number"]
        try:
            extract_lims_sample_data_from_case(markdown_text, test_case_number)
        except Exception as exc:
            raise AssertionError(
                f"Test case {test_case_number} LIMS section validation failed: {exc}"
            ) from exc


def test_lims_sample_data_matches_input_fixtures():
    """LIMS CSV data in markdown must match uploaded_lims_info in tc*_input.json."""
    cases = load_test_cases(_MARKDOWN_PATH)
    markdown_text = _MARKDOWN_PATH.read_text()

    for case in cases:
        case_id = case["case_id"]
        test_case_number = case["test_case_number"]
        input_fixture_path = _HERE / case["input_fixture"]

        lims_rows = extract_lims_sample_data_from_case(markdown_text, test_case_number)
        markdown_lims = translate_lims_csv_to_fixture_format(lims_rows)

        fixture_data = json.loads(input_fixture_path.read_text())
        fixture_lims = fixture_data.get("uploaded_lims_info", [])

        assert markdown_lims == fixture_lims, (
            f"{case_id}: Markdown LIMS data doesn't match {case['input_fixture']}. "
            f"Expected {len(fixture_lims)} rows, got {len(markdown_lims)} from markdown."
        )
