"""Tests that keep markdown test case documentation synchronized with fixtures."""

from __future__ import annotations

import json
import re
from pathlib import Path

from tests.test_demux_sample_info.integration_tests.case_contract import (
    extract_expected_samplesheets_from_case,
    extract_lims_sample_data_from_case,
    extract_run_setup_from_case,
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
    """Non-skipped test cases must have fixtures; all fixtures must have markdown."""
    cases = load_test_cases(_MARKDOWN_PATH)
    all_case_ids = {case["case_id"] for case in cases}
    non_skipped_case_ids = {case["case_id"] for case in cases if not case["skip"]}

    input_ids = _fixture_case_ids(_INPUT_GLOB, "_input.json")
    expected_ids = _fixture_case_ids(
        _EXPECTED_GLOB,
        "_expected_samplesheets.json",
    )

    assert input_ids == expected_ids, (
        "Input and expected fixture files don't match. "
        f"Input: {sorted(input_ids)}, Expected: {sorted(expected_ids)}"
    )

    # All fixture files must correspond to a markdown test case
    assert input_ids.issubset(all_case_ids), (
        "Fixture files found without corresponding markdown test case. "
        f"Fixtures: {sorted(input_ids)}, Markdown: {sorted(all_case_ids)}"
    )

    # All non-skipped test cases must have fixture files
    assert non_skipped_case_ids.issubset(input_ids), (
        "Non-skipped test cases missing fixture files. "
        f"Non-skipped: {sorted(non_skipped_case_ids)}, Fixtures: {sorted(input_ids)}"
    )


def test_markdown_test_cases_match_integration_test_coverage():
    """Integration test methods should cover exactly the non-skipped markdown test cases."""
    cases = load_test_cases(_MARKDOWN_PATH)
    # Only check non-skipped test cases
    markdown_case_ids = {case["case_id"] for case in cases if not case["skip"]}

    integration_test_text = _INTEGRATION_TEST_FILE.read_text()
    covered_case_ids = set(
        re.findall(
            r'_run_tc_test\(\s*"[^"]+"\s*,\s*"(tc[0-9]+)"\s*\)',
            integration_test_text,
        )
    )

    assert covered_case_ids == markdown_case_ids, (
        "Integration test coverage doesn't match non-skipped markdown test cases. "
        f"Covered: {sorted(covered_case_ids)}, Markdown: {sorted(markdown_case_ids)}"
    )


def test_each_test_case_has_lims_sample_sheet_header():
    """Each non-skipped test case must have a '### LIMS sample sheet' heading."""
    cases = load_test_cases(_MARKDOWN_PATH)
    markdown_text = _MARKDOWN_PATH.read_text()

    for case in cases:
        if case["skip"]:
            continue  # Skip validation for skipped test cases
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
        if case["skip"]:
            continue  # Skip validation for skipped test cases
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


def test_run_setup_matches_input_fixtures():
    """Run Setup (Recipe) in markdown must match metadata.run_setup in tc*_input.json."""
    cases = load_test_cases(_MARKDOWN_PATH)
    markdown_text = _MARKDOWN_PATH.read_text()

    for case in cases:
        if case["skip"]:
            continue  # Skip validation for skipped test cases
        case_id = case["case_id"]
        test_case_number = case["test_case_number"]
        input_fixture_path = _HERE / case["input_fixture"]

        markdown_run_setup = extract_run_setup_from_case(
            markdown_text, test_case_number
        )

        fixture_data = json.loads(input_fixture_path.read_text())
        fixture_run_setup = fixture_data.get("metadata", {}).get("run_setup", "")

        assert markdown_run_setup == fixture_run_setup, (
            f"{case_id}: Markdown Run Setup doesn't match {case['input_fixture']}. "
            f"Markdown: '{markdown_run_setup}', Fixture: '{fixture_run_setup}'"
        )


def test_expected_samplesheets_match_expected_fixtures():
    """Expected samplesheets in markdown '## Suggestions' must match tc*_expected_samplesheets.json.

    Compares BCLConvert_Data rows (sample information) between markdown and fixture files.
    Only compares core fields that are present in both markdown and fixture.
    """
    cases = load_test_cases(_MARKDOWN_PATH)
    markdown_text = _MARKDOWN_PATH.read_text()

    for case in cases:
        if case["skip"]:
            continue  # Skip validation for skipped test cases
        case_id = case["case_id"]
        test_case_number = case["test_case_number"]
        expected_fixture_path = _HERE / case["expected_fixture"]

        # Extract expected samplesheets from markdown
        markdown_sheets = extract_expected_samplesheets_from_case(
            markdown_text, test_case_number
        )

        # Load expected fixture JSON
        fixture_data = json.loads(expected_fixture_path.read_text())

        # Both should have the same number of samplesheets
        assert len(markdown_sheets) == len(fixture_data), (
            f"{case_id}: Expected {len(fixture_data)} samplesheets in fixture, "
            f"but found {len(markdown_sheets)} in markdown Suggestions section."
        )

        # Compare each samplesheet's BCLConvert_Data
        for i, (md_sheet, fix_sheet) in enumerate(zip(markdown_sheets, fixture_data)):
            # Determine which fields to compare based on what's in markdown
            md_data = md_sheet.get("BCLConvert_Data", [])
            fix_data = fix_sheet.get("BCLConvert_Data", [])

            # Markdown may show only first few rows as examples
            # Fixture must have AT LEAST as many rows as markdown
            assert len(fix_data) >= len(md_data), (
                f"{case_id} samplesheet {i}: Fixture has fewer rows than markdown. "
                f"Markdown has {len(md_data)} rows, fixture has {len(fix_data)} rows."
            )

            # Get all field names from markdown (these are the fields we expect)
            markdown_fields = set()
            for row in md_data:
                markdown_fields.update(row.keys())

            # Markdown rows may not be in the same order as fixture rows
            # Validate that each markdown row exists in the fixture
            for row_idx, md_row in enumerate(md_data):
                # Create a normalized representation of the markdown row for comparison
                md_row_normalized = {
                    field: str(md_row.get(field, "")).strip()
                    for field in markdown_fields
                    if str(md_row.get(field, "")).strip()  # Skip empty values
                }

                # Find matching row in fixture
                found_match = False
                for fix_row in fix_data:
                    # Check if all non-empty markdown fields match this fixture row
                    match = True
                    for field, md_value in md_row_normalized.items():
                        fix_value = str(fix_row.get(field, "")).strip()
                        if md_value != fix_value:
                            match = False
                            break

                    if match:
                        found_match = True
                        break

                assert found_match, (
                    f"{case_id} samplesheet {i}, row {row_idx}: "
                    f"Markdown row not found in fixture. Row: {md_row_normalized}"
                )
