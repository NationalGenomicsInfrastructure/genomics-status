"""
Integration tests for DemuxSampleInfoDataHandler POST endpoint.

Each test case covers an end-to-end flow: LIMS sample data is POSTed to the
endpoint and the resulting samplesheet JSON is verified against a snapshot.

Test data lives alongside this file:
  tc1_input.json / tc1_expected_samplesheets.json
  tc2_input.json / tc2_expected_samplesheets.json
  tc3_input.json / tc3_expected_samplesheets.json
  tc4_input.json / tc4_expected_samplesheets.json
  tc5_input.json / tc5_expected_samplesheets.json
  tc7_input.json / tc7_expected_samplesheets.json
  tc11_input.json / tc11_expected_samplesheets.json

Named index data (Chromium 10X TS and NA series) is provided as a test fixture
so that tests are self-contained and do not depend on external CSV files.

Updating expected snapshots
---------------------------
When a test fails and you need to update the expected file, re-run with
``--save-actual``::

    pytest tests/test_demux_sample_info/integration_tests/ --save-actual

This writes ``tcN_actual_samplesheets.json`` next to the expected file for
each failing test.  Inspect the diff, then overwrite the expected file if
the new output is correct.

Note: tc3–tc5, tc7, and tc11 expected samplesheets were derived from code
analysis and should be verified against actual DB output on first run, then
updated if needed.

For tc11 in particular: the named_indices key used by the DB classification
config for SI-NA-* indices may differ from the key assumed in the fixture.
If tc11 fails because named indices are not expanded, look up the correct key
from the active demux_configuration document and update _ALL_NAMED_INDICES
usage in get_app() accordingly.
"""

import json
import re
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock

import tornado.web
from tornado.testing import AsyncHTTPTestCase

from status.demux_sample_info import DemuxSampleInfoDataHandler
from tests.conftest import get_classification_config

_HERE = Path(__file__).parent
_SAVE_ACTUAL = "--save-actual" in sys.argv

# All named index sequences used across integration tests.
# SI-TS-* (Chromium 10X TS-series) used in TC2; each maps to [i7, i5] pairs.
# SI-NA-* (NA-series with UMI in I2) used in TC11; I2 is not an index channel.
_ALL_NAMED_INDICES = {
    "SI-TS-A7": [["TAAACCCTAG", "TTCCTATCAG"]],
    "SI-TS-B7": [["CATGCTGCTC", "CGGTTTCCAC"]],
    "SI-TS-C7": [["GATCGCGGTA", "GACGGTTCCG"]],
    "SI-TS-D7": [["CTAGAAATTG", "CGAAAGTAAG"]],
    "SI-NA-A2": [["TCTTAGGC", ""], ["AGCCCTTT", ""], ["CAAGTCCA", ""], ["GTGAGAAG", ""]],
    "SI-NA-B2": [["TTAGATTG", ""], ["AAGTTGAT", ""], ["CCCACCCA", ""], ["GGTCGAGC", ""]],
    "SI-NA-C2": [["TGCTCTGT", ""], ["AATCACTA", ""], ["CCGAGAAC", ""], ["GTAGTGCG", ""]],
    "SI-NA-D2": [["TGTGATGC", ""], ["ACATTCCG", ""], ["CTGCGGTA", ""], ["GACACAAT", ""]],
    "SI-NA-E2": [["TCATCAAG", ""], ["AGGCTGGT", ""], ["CACAACTA", ""], ["GTTGGTCC", ""]],
}


def _strip_date(samplesheets):
    """Return a copy of samplesheets with the dynamic Date field removed."""
    return [
        {**sheet, "Header": {k: v for k, v in sheet["Header"].items() if k != "Date"}}
        for sheet in samplesheets
    ]


class TestDemuxSampleInfoIntegration(AsyncHTTPTestCase):
    """End-to-end POST tests that verify the generated samplesheet JSON."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Remove leftover actual dirs from previous runs, then create a fresh one.
        for old in _HERE.glob("actual_*"):
            if old.is_dir():
                for f in old.iterdir():
                    f.unlink()
                old.rmdir()
        cls._actual_dir = Path(tempfile.mkdtemp(prefix="actual_", dir=_HERE))

    def get_app(self):
        app = tornado.web.Application(
            [(r"/api/v1/demux_sample_info/([\w\d-]+)", DemuxSampleInfoDataHandler)]
        )
        app.gs_globals = {}
        app.test_mode = True
        app.cloudant = MagicMock()

        config = get_classification_config()

        patterns = {}
        for key, pattern_config in config["patterns"].items():
            patterns[key] = {"config": pattern_config}
            if "regex" in pattern_config:
                patterns[key]["pattern"] = re.compile(pattern_config["regex"])

        app.sample_classification_config = config
        app.classification_config = config
        app.sample_patterns = patterns
        app.control_patterns = config.get("control_patterns", [])
        app.short_index_threshold = config.get("short_single_index_threshold", 8)
        app.library_method_mapping = config.get("library_method_mapping", {})
        app.named_indices = {"Chromium_10X_indexes": _ALL_NAMED_INDICES}

        return app

    def _post_and_capture(self, flowcell_id, post_body):
        """POST to the endpoint and return the document that would be saved to CouchDB."""
        self._app.cloudant.post_view.return_value.get_result.return_value = {"rows": []}
        self._app.cloudant.post_document.return_value.get_result.return_value = {
            "ok": True,
            "id": "test_id",
            "rev": "1-abc",
        }

        response = self.fetch(
            f"/api/v1/demux_sample_info/{flowcell_id}",
            method="POST",
            body=json.dumps(post_body),
            headers={"Content-Type": "application/json"},
        )

        self.assertEqual(response.code, 201, msg=response.body.decode())

        call_kwargs = self._app.cloudant.post_document.call_args.kwargs
        return call_kwargs["document"]

    def _assert_samplesheets(self, actual, expected, tc_name):
        """Compare actual vs expected, saving actual to disk when --save-actual is set."""
        try:
            self.assertEqual(actual, expected)
        except AssertionError:
            if _SAVE_ACTUAL:
                path = self._actual_dir / f"{tc_name}_actual_samplesheets.json"
                path.write_text(json.dumps(actual, indent=2))
                raise AssertionError(f"Mismatch. Actual saved to {path}") from None
            raise

    def _run_tc_test(self, flowcell_id, tc_name):
        post_body = json.loads((_HERE / f"{tc_name}_input.json").read_text())
        expected = json.loads((_HERE / f"{tc_name}_expected_samplesheets.json").read_text())
        document = self._post_and_capture(flowcell_id, post_body)
        actual = _strip_date(document["samplesheets"])
        self._assert_samplesheets(actual, expected, tc_name)

    def test_tc1_single_index_standard(self):
        """
        TC1: Single-index standard demux.

        Run 22GC2NLT1 — 3 samples across 2 lanes, 8 bp single index, recipe 85-215.
        Expected: one samplesheet per lane, OverrideCycles R1:Y85;I1:I8;R2:Y215.
        """
        self._run_tc_test("22GC2NLT1", "tc1")

    def test_tc2_dual_index_mixed_lanes(self):
        """
        TC2: Dual-index with shorter reads/indices than the sequencing setup.

        Run 233KCWLT4 — lane 3: 4 × 10X samples (SI-TS-* named indices, recipe 43-50),
        lane 6: 9 × standard dual-index samples (recipe 151-151), run setup 151-10-10-151.
        Expected:
          Lane 3 — named indices expanded to 10 bp sequences,
                   OverrideCycles R1:Y43N108;I1:I8N2;I2:N10;R2:Y50N101,
                   TrimUMI enabled from 10X classification.
          Lane 6 — 7 bp dual indices, OverrideCycles R1:Y151;I1:I7N3;I2:I7N3;R2:Y151.
        """
        self._run_tc_test("233KCWLT4", "tc2")

    def test_tc3_no_index(self):
        """
        TC3: No-index demux (unindexed library).

        Run GV85B (MiSeq) — 1 sample, lane 1, no index cycles (run setup 164-0-0-164).
        Expected: one samplesheet, OverrideCycles R1:Y164;R2:Y164 (index cycles absent).
        """
        self._run_tc_test("GV85B", "tc3")

    def test_tc4_mixed_single_and_dual_index(self):
        """
        TC4: Mixed single-index and dual-index samples on one lane.

        Run 233JTGLT4 (NovaSeqXPlus) — lane 1 contains three projects:
          A__Berggren_25_01: 2 samples, 8 bp dual index,
                             OverrideCycles R1:Y151;I1:I8N2;I2:I8N2;R2:Y151
          B__Bergman_25_01:  12 samples, 10 bp dual index,
                             OverrideCycles R1:Y151;I1:I10;I2:I10;R2:Y151
          C__Bergkvist_25_01: 7 samples, 8 bp single index (no index2),
                             OverrideCycles R1:Y151;I1:I8N2;I2:N10;R2:Y151
        """
        self._run_tc_test("233JTGLT4", "tc4")

    def test_tc5_single_index_no_mismatches(self):
        """
        TC5: Single-index samples where zero barcode mismatches are required.

        Run 233JTGLT4 — lane 7: 30 samples, 8 bp single index, run setup 151-10-10-151.
        Expected: BarcodeMismatchesIndex1=0 in samplesheet settings,
                  OverrideCycles R1:Y151;I1:I8N2;I2:N10;R2:Y151.
        """
        self._run_tc_test("233JTGLT4", "tc5")

    def test_tc7_standard_dual_index(self):
        """
        TC7: Standard dual-index demux where index length equals the sequencing setup.

        Run 23FNTJLT3 — lane 4: 8 samples, 10 bp dual index, run setup 151-10-10-151.
        Expected: OverrideCycles R1:Y151;I1:I10;I2:I10;R2:Y151 (no masked cycles).
        """
        self._run_tc_test("23FNTJLT3", "tc7")

    def test_tc11_umi_named_indices(self):
        """
        TC11: Named indices (SI-NA-*) with UMI in the I2 channel.

        Run 235WFLLT3 — lane 4: 5 samples with SI-NA-* named indices, each
        expanded to 4 i7-only sequences (20 rows total).
        run_setup 50-8-24-49: I2 carries 24 UMI cycles, not a standard index.
        Expected: CreateFastqForIndexReads=true, TrimUMI=false,
                  OverrideCycles R1:Y50;I1:I8;I2:U24;R2:Y49.
        """
        self._run_tc_test("235WFLLT3", "tc11")


if __name__ == "__main__":
    unittest.main()
