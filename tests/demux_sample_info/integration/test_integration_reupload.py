"""Integration tests for reupload workflow.

Tests the full end-to-end flow of reuploading a samplesheet for an existing flowcell.
"""

import copy
import json
import unittest
from unittest.mock import MagicMock

import tornado.web
from tornado.escape import json_encode
from tornado.testing import AsyncHTTPTestCase

from status.demux_sample_info import DemuxSampleInfoDataHandler

MATCHED_UUID = "aaaa1111-bbbb-cccc-dddd-eeeeeeeeeeee"
ORPHANED_UUID = "cccc3333-dddd-eeee-ffff-aaaaaaaaaaaa"


def _create_existing_document_with_samples():
    """Create a realistic existing document for integration testing."""
    return {
        "_id": "TEST_FC_001",
        "_rev": "5-xyz789",
        "flowcell_id": "TEST_FC_001",
        "metadata": {
            "num_lanes": 8,
            "run_setup": "151-8-8-151",
            "setup_lims_step_id": "24-123456",
            "first_generated": "2025-01-01T10:00:00.000Z",
            "full_name": "Test Run",
            "position": "A1",
            "instrument": "MiSeq",
            "run_mode": "10B",
        },
        "uploaded_lims_info": [
            {
                "flowcell_id": "TEST_FC_001",
                "lane": "1",
                "sample_id": "Sample_001",
                "sample_name": "P101",
                "sample_ref": "hg38",
                "index": "AAAA",
                "index2": "GGGG",
                "description": "Test sample 1",
                "control": "N",
                "recipe": "151-8-8-151",
                "operator": "test",
                "sample_project": "P123",
            },
            {
                "flowcell_id": "TEST_FC_001",
                "lane": "1",
                "sample_id": "Sample_003",
                "sample_name": "P103",
                "sample_ref": "mm10",
                "index": "TTTT",
                "index2": "AAAA",
                "description": "Test sample 3",
                "control": "N",
                "recipe": "151-8-8-151",
                "operator": "test",
                "sample_project": "P456",
            },
        ],
        "calculated": {
            "lanes": {
                "1": {
                    "sample_rows": {
                        MATCHED_UUID: {
                            "last_modified": "2025-01-01T10:00:00.000Z",
                            "control": "N",
                            "description": "Test sample 1",
                            "project_id": "P123",
                            "project_name": "Test_Project",
                            "library_method": "scRNA",
                            "flowcell_id": "TEST_FC_001",
                            "settings": {
                                "2025-01-01T10:00:00.000Z": {
                                    "per_sample_fields": {
                                        "Sample_ID": "Sample_001",
                                        "Sample_Name": "P101",
                                        "Sample_Project": "P123",
                                        "Lane": 1,
                                        "OverrideCycles": "R1:Y151;I1:I8;I2:N8;R2:Y151",
                                        "MaskShortReads": 0,
                                        "MinimumTrimmedReadLength": 0,
                                        "index": "AAAA",
                                        "index2": "GGGG",
                                    },
                                    "other_details": {
                                        "sample_ref": "hg38",
                                        "sample_type": "standard",
                                        "named_index": "",
                                        "recipe": "151-8-8-151",
                                        "operator": "test",
                                        "index_length": [4, 4],
                                        "umi_config": None,
                                        "config_sources": ["test_source"],
                                    },
                                    "raw_samplesheet_settings": {
                                        "MaskShortReads": 0,
                                        "MinimumTrimmedReadLength": 0,
                                    },
                                },
                            },
                        },
                        ORPHANED_UUID: {
                            "last_modified": "2025-01-01T10:00:00.000Z",
                            "control": "N",
                            "description": "Test sample 3",
                            "project_id": "P456",
                            "project_name": "Other_Project",
                            "library_method": None,
                            "flowcell_id": "TEST_FC_001",
                            "settings": {
                                "2025-01-01T10:00:00.000Z": {
                                    "per_sample_fields": {
                                        "Sample_ID": "Sample_003",
                                        "Sample_Name": "P103",
                                        "Sample_Project": "P456",
                                        "Lane": 1,
                                        "OverrideCycles": "R1:Y151;I1:I8;I2:N8;R2:Y151",
                                        "MaskShortReads": 0,
                                        "MinimumTrimmedReadLength": 0,
                                        "index": "TTTT",
                                        "index2": "AAAA",
                                    },
                                    "other_details": {
                                        "sample_ref": "mm10",
                                        "sample_type": "standard",
                                        "named_index": "",
                                        "recipe": "151-8-8-151",
                                        "operator": "test",
                                        "index_length": [4, 4],
                                        "umi_config": None,
                                        "config_sources": ["test_source"],
                                    },
                                    "raw_samplesheet_settings": {
                                        "MaskShortReads": 0,
                                        "MinimumTrimmedReadLength": 0,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "version_history": {
                "2025-01-01T10:00:00.000Z": {
                    "generated_by": "test@science.se",
                    "autogenerated": True,
                    "comment": "Uploaded from LIMS",
                    "auto_run": True,
                    "config_version": "123",
                },
            },
        },
        "samplesheets": [
            {
                "lane": "1",
                "projects": ["P123", "P456"],
                "settings_index": 0,
                "sample_count": 2,
                "filename": "Lane1_P123_P456_0.csv",
                "BCLConvert_Data": [],
            },
        ],
    }


class TestReuploadIntegration(AsyncHTTPTestCase):
    """Integration tests for reupload POST workflow."""

    def get_app(self):
        """Return the base application."""
        return tornado.web.Application(
            [
                (r"/api/v1/demux_sample_info/([^/]*)", DemuxSampleInfoDataHandler),
            ]
        )

    def setUp(self):
        super().setUp()
        self._mock_cloudant = MagicMock()
        self._mock_cloudant.post_document.return_value.get_result.return_value = {
            "ok": True
        }
        self._mock_cloudant.get_document.return_value.get_result.return_value = None

        self._app.cloudant = self._mock_cloudant
        self._app.gs_globals = {}
        self._app.test_mode = True
        self._app.named_indices = {}

        # Default to reupload scenario
        self._existing_doc = _create_existing_document_with_samples()
        self._mock_cloudant.get_document.return_value.get_result.return_value = (
            self._existing_doc
        )

    def _make_post_view_side_effect(self, include_existing_doc=True):
        """Create a side_effect mock that can be customized per test."""
        demux_config_rows = {
            "rows": [
                {
                    "id": "test_config_id",
                    "key": [True, "2024-01-01T00:00:00.000Z"],
                    "value": "test_version",
                    "doc": {
                        "_id": "test_config_id",
                        "_rev": "1-test",
                        "version": "test_version",
                        "active": True,
                        "created_at": "2024-01-01T00:00:00.000Z",
                        "created_by": "test@example.com",
                        "comment": "Test configuration",
                        "configuration": {
                            "samplesheet_generation_rules": {},
                            "control_patterns": [],
                            "library_method_mapping": {},
                            "instrument_type_mapping": {},
                        },
                    },
                }
            ]
        }

        self._existing_doc_with_doc_key = {
            "_id": "TEST_FC_001",
            "_rev": "5-xyz789",
            **self._existing_doc,
        }

        def mock_post_view(
            db=None, ddoc=None, view=None, key=None, include_docs=False, **kwargs
        ):
            result = MagicMock()
            if db == "demux_configuration" and view == "active_created_at":
                result.get_result.return_value = demux_config_rows
            elif db == "demux_sample_info" and view == "flowcell_id":
                if include_existing_doc:
                    result.get_result.return_value = {
                        "rows": [
                            {
                                "value": [key, key],
                                "doc": (
                                    self._existing_doc_with_doc_key
                                    if include_docs
                                    else None
                                ),
                            }
                        ]
                    }
                else:
                    result.get_result.return_value = {"rows": []}
            elif db == "projects" and view == "name_to_id":
                result.get_result.return_value = {"rows": []}
            else:
                result.get_result.return_value = {"rows": []}
            return result

        return mock_post_view

    def test_reupload_dry_run(self):
        """Reupload with dry_run=true should return preview without saving."""
        self._mock_cloudant.post_view.side_effect = self._make_post_view_side_effect(
            include_existing_doc=True
        )

        # POST body with all required fields
        post_data = {
            "metadata": {
                "num_lanes": 8,
                "run_setup": "151-8-8-151",
                "setup_lims_step_id": "24-123456",
                "instrument_type": "NovaSeqXPlus",
            },
            "uploaded_lims_info": [
                {
                    "flowcell_id": "TEST_FC_001",
                    "lane": "1",
                    "sample_id": "Sample_001",
                    "sample_name": "P101",
                    "sample_ref": "hg38",
                    "index": "AAAA",
                    "index2": "GGGG",
                    "description": "Test sample 1",
                    "control": "N",
                    "recipe": "151-8-8-151",
                    "operator": "test",
                    "sample_project": "P123",
                },
            ],
        }

        response = self.fetch(
            "/api/v1/demux_sample_info/TEST_FC_001?dry_run=true",
            method="POST",
            body=json_encode(post_data),
            headers={"Content-Type": "application/json"},
        )

        self.assertEqual(response.code, 200, msg=response.body.decode())
        body = json.loads(response.body)
        self.assertEqual(body["status"], "dry_run")
        self.assertIn("is_reupload", body)
        self.assertTrue(body["is_reupload"])
        self.assertIn("summary", body)
        self.assertIn("changes", body)
        self._mock_cloudant.post_document.assert_not_called()

    def test_reupload_no_409_conflict(self):
        """Verify that POST does not return 409 for existing documents."""
        self._mock_cloudant.post_view.side_effect = self._make_post_view_side_effect(
            include_existing_doc=True
        )

        response = self.fetch(
            "/api/v1/demux_sample_info/TEST_FC_001",
            method="POST",
            body=json_encode(
                {
                    "metadata": {
                        "num_lanes": 8,
                        "run_setup": "151-8-8-151",
                        "setup_lims_step_id": "24-123456",
                    },
                    "uploaded_lims_info": [],
                }
            ),
            headers={"Content-Type": "application/json"},
        )

        self.assertNotEqual(response.code, 409, "Reupload should not return 409")

    def test_reupload_first_upload_unchanged(self):
        """When no document exists, POST should create new (current behavior)."""
        self._mock_cloudant.post_view.side_effect = self._make_post_view_side_effect(
            include_existing_doc=False
        )
        self._mock_cloudant.get_document.return_value.get_result.return_value = None

        response = self.fetch(
            "/api/v1/demux_sample_info/TEST_FC_001",
            method="POST",
            body=json_encode(
                {
                    "metadata": {
                        "num_lanes": 2,
                        "run_setup": "151-8-8-151",
                        "setup_lims_step_id": "24-123456",
                    },
                    "uploaded_lims_info": [],
                }
            ),
            headers={"Content-Type": "application/json"},
        )

        self.assertNotEqual(response.code, 409)

    def test_reupload_same_csv_idempotent(self):
        """Re-uploading identical CSV should not change unmatched content.

        Only last_modified timestamps and version_history should be updated;
        matched sample rows keep the same UUIDs and content, first_generated
        is never overwritten, and no new or deleted rows should appear.
        """
        captured_docs = []

        def capture_document(db=None, document=None, **kwargs):
            capture_result = MagicMock()
            capture_result.get_result.return_value = {
                "ok": True,
                "id": document.get("_id", document.get("flowcell_id", "")),
            }
            if document:
                captured_docs.append(document)
            return capture_result

        # Use the factory document as the existing document (like dry_run test does)
        self._mock_cloudant.post_view.side_effect = (
            self._make_post_view_side_effect(include_existing_doc=True)
        )
        self._mock_cloudant.post_document.side_effect = capture_document

        post_data = {
            "metadata": {
                "num_lanes": 8,
                "run_setup": "151-8-8-151",
                "setup_lims_step_id": "24-123456",
                "instrument_type": "MiSeq",
                "run_mode": "10B",
            },
            "uploaded_lims_info": [
                {
                    "flowcell_id": "TEST_FC_001",
                    "lane": "1",
                    "sample_id": "Sample_001",
                    "sample_name": "P101",
                    "sample_ref": "hg38",
                    "index": "AAAA",
                    "index2": "GGGG",
                    "description": "Test sample 1",
                    "control": "N",
                    "recipe": "151-8-8-151",
                    "operator": "test",
                    "sample_project": "P123",
                },
                {
                    "flowcell_id": "TEST_FC_001",
                    "lane": "1",
                    "sample_id": "Sample_003",
                    "sample_name": "P103",
                    "sample_ref": "mm10",
                    "index": "TTTT",
                    "index2": "AAAA",
                    "description": "Test sample 3",
                    "control": "N",
                    "recipe": "151-8-8-151",
                    "operator": "test",
                    "sample_project": "P456",
                },
            ],
        }

        # === First reupload: existing doc from factory ===
        captured_docs.clear()
        response1 = self.fetch(
            "/api/v1/demux_sample_info/TEST_FC_001",
            method="POST",
            body=json_encode(post_data),
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(
            response1.code, 200, msg=f"First reupload failed: {response1.body.decode()}"
        )
        self.assertEqual(len(captured_docs), 1, "Expected one document saved")
        first_doc = captured_docs[0]
        initial_lanes = copy.deepcopy(
            first_doc.get("calculated", {}).get("lanes", {})
        )
        initial_sample_rows = copy.deepcopy(
            first_doc.get("calculated", {}).get("lanes", {}).get("1", {}).get(
                "sample_rows", {}
            )
        )
        initial_first_generated = first_doc["metadata"].get("first_generated")
        initial_version_keys = set(
            first_doc.get("calculated", {}).get("version_history", {}).keys()
        )
        initial_lims_count = len(first_doc.get("uploaded_lims_info", []))

        # === Second reupload: identical CSV, same POST body ===
        captured_docs.clear()
        response2 = self.fetch(
            "/api/v1/demux_sample_info/TEST_FC_001",
            method="POST",
            body=json_encode(post_data),
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(
            response2.code, 200, msg=f"Second reupload failed: {response2.body.decode()}"
        )
        self.assertEqual(len(captured_docs), 1, "Expected one document saved")
        reupload_doc = captured_docs[0]

        # === Verify idempotency ===
        reupload_lanes = reupload_doc.get("calculated", {}).get("lanes", {})
        reupload_sample_rows = reupload_lanes.get("1", {}).get("sample_rows", {})
        reupload_uuids = set(reupload_sample_rows.keys())

        # Same number of lanes
        self.assertEqual(
            len(initial_lanes),
            len(reupload_lanes),
            f"Number of lanes changed: {len(initial_lanes)} -> {len(reupload_lanes)}",
        )

        # Same number of sample rows
        self.assertEqual(
            len(initial_sample_rows),
            len(reupload_sample_rows),
            f"Sample row count changed: {len(initial_sample_rows)} -> {len(reupload_sample_rows)}",
        )

        # Same UUID keys (no new or deleted UUIDs)
        initial_uuids = set(initial_sample_rows.keys())
        self.assertEqual(
            initial_uuids,
            reupload_uuids,
            f"UUID keys changed: added={reupload_uuids - initial_uuids}, removed={initial_uuids - reupload_uuids}",
        )

        # first_generated preserved
        self.assertEqual(
            initial_first_generated,
            reupload_doc["metadata"].get("first_generated"),
            "first_generated was overwritten",
        )

        # uploaded_lims_info unchanged
        self.assertEqual(
            initial_lims_count,
            len(reupload_doc.get("uploaded_lims_info", [])),
            "uploaded_lims_info count changed",
        )

        # Exactly one new version_history entry
        reupload_version_keys = set(
            reupload_doc.get("calculated", {}).get("version_history", {}).keys()
        )
        self.assertEqual(
            len(reupload_version_keys - initial_version_keys),
            1,
            "Expected exactly 1 new version_history entry",
        )

        # Each UUID has at least as many settings timestamps
        for uuid in initial_uuids:
            initial_ts = set(initial_sample_rows[uuid].get("settings", {}).keys())
            reupload_ts = set(reupload_sample_rows[uuid].get("settings", {}).keys())
            self.assertTrue(
                initial_ts.issubset(reupload_ts),
                f"UUID {uuid} lost settings timestamps: {initial_ts - reupload_ts}",
            )


if __name__ == "__main__":
    unittest.main()
