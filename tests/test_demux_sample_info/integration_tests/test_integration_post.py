"""
Integration tests for DemuxSampleInfoDataHandler POST endpoint.

Each test case covers an end-to-end flow: LIMS sample data is POSTed to the
endpoint and the resulting samplesheet JSON is verified against a snapshot.

Test data lives alongside this file:
  tc1_input.json / tc1_expected_samplesheets.json
  tc2_input.json / tc2_expected_samplesheets.json

Named index data (Chromium 10X TS series) is provided as a test fixture so
that tests are self-contained and do not depend on external CSV files.
"""

import json
import re
import unittest
from pathlib import Path
from unittest.mock import MagicMock

import tornado.web
from tornado.testing import AsyncHTTPTestCase

from status.demux_sample_info import DemuxSampleInfoDataHandler
from tests.conftest import get_classification_config

_HERE = Path(__file__).parent

# Chromium 10X TS-series named index sequences used in TC2.
# Each entry maps a named index to its list of [i7, i5] sequence pairs.
_CHROMIUM_10X_NAMED_INDICES = {
    "SI-TS-A7": [["TAAACCCTAG", "TTCCTATCAG"]],
    "SI-TS-B7": [["CATGCTGCTC", "CGGTTTCCAC"]],
    "SI-TS-C7": [["GATCGCGGTA", "GACGGTTCCG"]],
    "SI-TS-D7": [["CTAGAAATTG", "CGAAAGTAAG"]],
}


def _strip_date(samplesheets):
    """Remove the dynamic Date field from every Header before comparing."""
    for sheet in samplesheets:
        sheet["Header"].pop("Date", None)
    return samplesheets


class TestDemuxSampleInfoIntegration(AsyncHTTPTestCase):
    """End-to-end POST tests that verify the generated samplesheet JSON."""

    def get_app(self):
        app = tornado.web.Application(
            [(r"/api/v1/demux_sample_info/([\w\d-]+)", DemuxSampleInfoDataHandler)]
        )
        app.gs_globals = {}
        app.test_mode = True
        app.cloudant = MagicMock()

        config = get_classification_config()

        # Compile regex patterns (mirrors status_app Application setup)
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
        app.named_indices = {"Chromium_10X_indexes": _CHROMIUM_10X_NAMED_INDICES}

        return app

    def _post_and_capture(self, flowcell_id, post_body):
        """POST to the endpoint and return the document that would be saved to CouchDB."""
        # Return no existing document for the duplicate check
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

        # Retrieve the document that was passed to post_document
        call_kwargs = self._app.cloudant.post_document.call_args.kwargs
        return call_kwargs["document"]

    def test_tc1_single_index_standard(self):
        """
        TC1: Single-index standard demux.

        Run 22GC2NLT1 — 3 samples across 2 lanes, 8 bp single index, recipe 85-215.
        Expected: one samplesheet per lane, OverrideCycles R1:Y85;I1:I8;R2:Y215.
        """
        post_body = json.loads((_HERE / "tc1_input.json").read_text())
        expected = json.loads((_HERE / "tc1_expected_samplesheets.json").read_text())

        document = self._post_and_capture("22GC2NLT1", post_body)
        actual = _strip_date(document["samplesheets"])

        self.assertEqual(actual, expected)

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
        post_body = json.loads((_HERE / "tc2_input.json").read_text())
        expected = json.loads((_HERE / "tc2_expected_samplesheets.json").read_text())

        document = self._post_and_capture("233KCWLT4", post_body)
        actual = _strip_date(document["samplesheets"])

        self.assertEqual(actual, expected)


if __name__ == "__main__":
    unittest.main()
