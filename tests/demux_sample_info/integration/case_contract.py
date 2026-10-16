"""Helpers for parsing test case documentation from test_cases.md."""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Any

_TC_HEADING_RE = re.compile(r"^# Test case (\d+)\b.*$", re.MULTILINE)
_TC_SKIP_RE = re.compile(r"\[SKIP\]", re.IGNORECASE)
_LIMS_HEADING_RE = re.compile(r"^### LIMS sample sheet\s*$", re.MULTILINE)
_SUGGESTIONS_HEADING_RE = re.compile(r"^## Suggestions\s*$", re.MULTILINE)
_SAMPLESHEET_HEADING_RE = re.compile(
    r"^### ((?:SampleSheet|Sample sheet)[^\n]*)\s*$", re.MULTILINE
)
_CSV_BLOCK_RE = re.compile(r"```csv\n(.*?)\n```", re.DOTALL)
_BASH_BLOCK_RE = re.compile(r"```bash\n(.*?)\n```", re.DOTALL)
_RUN_SETUP_RE = re.compile(r"^\*\*Run Setup \(Recipe\):\*\*\s+(.+)$", re.MULTILINE)


class ContractError(ValueError):
    """Raised when test case documentation is missing or malformed."""


def discover_test_cases_from_markdown(markdown_text: str) -> list[dict[str, Any]]:
    """Discover test cases by scanning for '# Test case N' headings.

    Test cases can be marked with [SKIP] in the heading to skip certain validations.

    Returns a list of case dicts with:
        - case_id: "tcN"
        - test_case_number: N (int)
        - input_fixture: "tcN_input.json"
        - expected_fixture: "tcN_expected_samplesheets.json"
        - skip: True if [SKIP] marker present, False otherwise
    """
    matches = _TC_HEADING_RE.finditer(markdown_text)
    cases = []

    for match in matches:
        number = int(match.group(1))
        case_id = f"tc{number}"
        heading_line = match.group(0)
        skip = bool(_TC_SKIP_RE.search(heading_line))
        cases.append(
            {
                "case_id": case_id,
                "test_case_number": number,
                "input_fixture": f"{case_id}_input.json",
                "expected_fixture": f"{case_id}_expected_samplesheets.json",
                "skip": skip,
            }
        )

    if not cases:
        raise ContractError("No test case headings found in markdown")

    # Sort by test case number
    cases.sort(key=lambda c: c["test_case_number"])

    # Check for duplicates
    numbers = [c["test_case_number"] for c in cases]
    if len(numbers) != len(set(numbers)):
        raise ContractError("Duplicate test case numbers found in markdown")

    return cases


def load_test_cases(markdown_path: Path) -> list[dict[str, Any]]:
    """Load and discover test cases from a markdown file."""
    return discover_test_cases_from_markdown(markdown_path.read_text())


def _extract_test_case_section(markdown_text: str, test_case_number: int) -> str:
    """Extract the full section for a given test case number."""
    heading_pattern = f"# Test case {test_case_number}\\b"
    match = re.search(heading_pattern, markdown_text)
    if not match:
        raise ContractError(f"Test case {test_case_number} heading not found")

    section_start = match.start()
    next_tc_match = re.search(
        r"\n# Test case \d+\b", markdown_text[section_start + 1 :]
    )
    if next_tc_match:
        section_end = section_start + 1 + next_tc_match.start()
        return markdown_text[section_start:section_end]
    return markdown_text[section_start:]


def _parse_lims_csv(csv_text: str) -> list[dict[str, str]]:
    """Parse CSV text from LIMS sample sheet into list of dicts.

    - For MiSeq format (has [Header], [Reads], [Settings], [Data] sections),
      only parse rows after the [Data] section header.
    - Skips lines starting with '[' (section headers) and '...' (ellipsis).
    - Removes markdown bold markers (**) from values.
    """
    lines = csv_text.strip().split("\n")

    data_section_index = None
    for i, line in enumerate(lines):
        if line.strip() == "[Data]":
            data_section_index = i
            break

    if data_section_index is not None:
        lines = lines[data_section_index + 1 :]

    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("[") or stripped.startswith("..."):
            continue
        cleaned_line = line.replace("**", "")
        cleaned_lines.append(cleaned_line)

    if not cleaned_lines:
        raise ContractError("LIMS CSV has no data rows after filtering")

    reader = csv.DictReader(cleaned_lines)
    rows = list(reader)
    if not rows:
        raise ContractError("LIMS CSV has no data rows")

    return rows


def extract_lims_sample_data_from_case(
    markdown_text: str, test_case_number: int
) -> list[dict[str, str]]:
    """Extract and parse LIMS sample sheet CSV from a test case section."""
    section = _extract_test_case_section(markdown_text, test_case_number)

    lims_match = _LIMS_HEADING_RE.search(section)
    if not lims_match:
        raise ContractError(
            f"Test case {test_case_number} has no '### LIMS sample sheet' heading"
        )

    csv_match = _CSV_BLOCK_RE.search(section, lims_match.end())
    if not csv_match:
        raise ContractError(
            f"Test case {test_case_number} LIMS section has no ```csv block"
        )

    csv_text = csv_match.group(1)
    return _parse_lims_csv(csv_text)


def extract_run_setup_from_case(markdown_text: str, test_case_number: int) -> str:
    """Extract run setup value from '**Run Setup (Recipe):**' line in a test case.

    Returns the run setup string (e.g., '85-8-0-215' or '151-10-10-151').
    """
    section = _extract_test_case_section(markdown_text, test_case_number)

    run_setup_match = _RUN_SETUP_RE.search(section)
    if not run_setup_match:
        raise ContractError(
            f"Test case {test_case_number} has no '**Run Setup (Recipe):**' line"
        )

    return run_setup_match.group(1).strip()


def translate_lims_csv_to_fixture_format(
    lims_rows: list[dict[str, str]],
) -> list[dict[str, Any]]:
    """Translate LIMS CSV rows into the format used in tc*_input.json fixtures.

    Maps CSV column names to fixture field names (lowercase with underscores).
    Handles both standard LIMS format and MiSeq format (missing some columns).
    """
    FIELD_MAPPING = {
        "FCID": "flowcell_id",
        "Lane": "lane",
        "Sample_ID": "sample_id",
        "Sample_Name": "sample_name",
        "Sample_Ref": "sample_ref",
        "index": "index",
        "index2": "index2",
        "Description": "description",
        "Control": "control",
        "Recipe": "recipe",
        "Operator": "operator",
        "Sample_Project": "sample_project",
    }

    translated = []
    for row in lims_rows:
        fixture_row = {}
        for csv_key, fixture_key in FIELD_MAPPING.items():
            fixture_row[fixture_key] = row.get(csv_key, "")
        translated.append(fixture_row)

    return translated


def _parse_ini_samplesheet(ini_text: str) -> dict[str, Any]:
    """Parse BCLConvert INI-format samplesheet into structured dict.

    Extracts [Header], [BCLConvert_Settings], and [BCLConvert_Data] sections.
    Removes markdown bold markers (**) from values.
    """
    lines = ini_text.strip().split("\n")
    result: dict[str, Any] = {
        "Header": {},
        "BCLConvert_Settings": {},
        "BCLConvert_Data": [],
    }

    current_section = None
    data_header = None

    for line in lines:
        line = line.strip().replace("**", "")  # Remove markdown bold
        if not line:
            continue

        if line.startswith("[") and line.endswith("]"):
            section_name = line[1:-1]
            if section_name == "Header":
                current_section = "Header"
            elif section_name == "BCLConvert_Settings":
                current_section = "BCLConvert_Settings"
            elif section_name == "BCLConvert_Data":
                current_section = "BCLConvert_Data"
                data_header = None
            else:
                current_section = None
            continue

        if current_section in ("Header", "BCLConvert_Settings"):
            if "," in line:
                key, value = line.split(",", 1)
                result[current_section][key.strip()] = value.strip()
        elif current_section == "BCLConvert_Data":
            parts = line.split(",")
            if data_header is None:
                data_header = [p.strip() for p in parts]
            else:
                if len(parts) == len(data_header):
                    row = {}
                    for key, value in zip(data_header, parts):
                        row[key] = value.strip()
                    result["BCLConvert_Data"].append(row)

    return result


def extract_expected_samplesheets_from_case(
    markdown_text: str, test_case_number: int
) -> list[dict[str, Any]]:
    """Extract and parse expected samplesheets from '## Suggestions' section.

    Returns a list of parsed samplesheet dicts, one per ### SampleSheet_*.csv found.
    Each dict contains Header, BCLConvert_Settings, and BCLConvert_Data sections.
    """
    section = _extract_test_case_section(markdown_text, test_case_number)

    suggestions_match = _SUGGESTIONS_HEADING_RE.search(section)
    if not suggestions_match:
        raise ContractError(
            f"Test case {test_case_number} has no '## Suggestions' section"
        )

    suggestions_text = section[suggestions_match.end() :]

    samplesheets = []
    for sheet_match in _SAMPLESHEET_HEADING_RE.finditer(suggestions_text):
        sheet_name = sheet_match.group(1)
        sheet_start = sheet_match.end()

        # Find the bash block containing the INI format
        bash_match = _BASH_BLOCK_RE.search(suggestions_text, sheet_start)
        if not bash_match:
            continue

        # Check if this bash block is before the next samplesheet heading
        next_sheet_match = _SAMPLESHEET_HEADING_RE.search(
            suggestions_text, sheet_match.end()
        )
        if next_sheet_match and bash_match.start() > next_sheet_match.start():
            continue

        ini_text = bash_match.group(1)
        parsed = _parse_ini_samplesheet(ini_text)
        parsed["samplesheet_name"] = sheet_name
        samplesheets.append(parsed)

    if not samplesheets:
        raise ContractError(
            f"Test case {test_case_number} Suggestions section has no samplesheets"
        )

    return samplesheets


def _main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract test case information from test_cases.md"
    )
    parser.add_argument(
        "markdown_path",
        nargs="?",
        default=str(Path(__file__).parent / ".." / "fixtures" / "test_cases.md"),
        help="Path to markdown file containing test cases",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Optional output path for JSON. Prints to stdout if omitted.",
    )
    args = parser.parse_args()

    cases = load_test_cases(Path(args.markdown_path))
    payload = json.dumps(cases, indent=2, sort_keys=True)

    if args.output:
        Path(args.output).write_text(f"{payload}\n")
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
