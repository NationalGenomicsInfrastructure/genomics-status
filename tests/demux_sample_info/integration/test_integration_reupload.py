"""Integration tests for reupload workflow.

Tests the full end-to-end flow of reuploading a samplesheet for an existing flowcell.
"""

import json
import unittest
from unittest.mock import MagicMock

import tornado.web
from tornado.testing import AsyncHTTPTestCase
from tornado.escape import json_encode

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
        return tornado.web.Application([
            (r"/api/v1/demux_sample_info/([^/]*)", DemuxSampleInfoDataHandler),
        ])

    def setUp(self):
        super().setUp()
        self._mock_cloudant = MagicMock()
        self._mock_cloudant.post_document.return_value.get_result.return_value = {"ok": True}
        self._mock_cloudant.get_document.return_value.get_result.return_value = None

        self._app.cloudant = self._mock_cloudant
        self._app.gs_globals = {}
        self._app.test_mode = True
        self._app.named_indices = {}
        
        # Default to reupload scenario
        self._existing_doc = _create_existing_document_with_samples()
        self._mock_cloudant.get_document.return_value.get_result.return_value = self._existing_doc

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

        def mock_post_view(db=None, ddoc=None, view=None, key=None, include_docs=False, **kwargs):
            result = MagicMock()
            if db == "demux_configuration" and view == "active_created_at":
                result.get_result.return_value = demux_config_rows
            elif db == "demux_sample_info" and view == "flowcell_id":
                if include_docs and include_existing_doc:
                    result.get_result.return_value = {
                        "rows": [{"value": [key, key], "doc": self._existing_doc_with_doc_key}]
                    }
                elif include_docs and not include_existing_doc:
                    result.get_result.return_value = {"rows": []}
                else:
                    result.get_result.return_value = {
                        "rows": [{"value": [key, key]}]
                    }
            elif db == "projects" and view == "name_to_id":
                result.get_result.return_value = {"rows": []}
            else:
                result.get_result.return_value = {"rows": []}
            return result

        return mock_post_view

    def test_reupload_dry_run(self):
        """Reupload with dry_run=true should return preview without saving."""
        self._mock_cloudant.post_view.side_effect = self._make_post_view_side_effect(include_existing_doc=True)

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
        self._mock_cloudant.post_view.side_effect = self._make_post_view_side_effect(include_existing_doc=True)

        response = self.fetch(
            "/api/v1/demux_sample_info/TEST_FC_001",
            method="POST",
            body=json_encode({
                "metadata": {
                    "num_lanes": 8,
                    "run_setup": "151-8-8-151",
                    "setup_lims_step_id": "24-123456",
                },
                "uploaded_lims_info": [],
            }),
            headers={"Content-Type": "application/json"},
        )

        self.assertNotEqual(response.code, 409, "Reupload should not return 409")

    def test_reupload_first_upload_unchanged(self):
        """When no document exists, POST should create new (current behavior)."""
        self._mock_cloudant.post_view.side_effect = self._make_post_view_side_effect(include_existing_doc=False)
        self._mock_cloudant.get_document.return_value.get_result.return_value = None

        response = self.fetch(
            "/api/v1/demux_sample_info/TEST_FC_001",
            method="POST",
            body=json_encode({
                "metadata": {
                    "num_lanes": 2,
                    "run_setup": "151-8-8-151",
                    "setup_lims_step_id": "24-123456",
                },
                "uploaded_lims_info": [],
            }),
            headers={"Content-Type": "application/json"},
        )

        self.assertNotEqual(response.code, 409)


if __name__ == "__main__":
    unittest.main()
