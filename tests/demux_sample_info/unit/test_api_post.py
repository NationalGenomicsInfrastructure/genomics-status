"""
Unit tests for DemuxSampleInfoDataHandler POST method.

Tests the demultiplexing sample info POST endpoint including:
- Request validation
- Sample classification logic
- Library method mapping
- Document creation
"""

import json
import os
import unittest
from unittest.mock import MagicMock, patch

import tornado.web
from tornado.testing import AsyncHTTPTestCase

from status.demux_sample_info import DemuxSampleInfoDataHandler
from tests.demux_sample_info.conftest import (
    setup_mock_demux_config,
)


class TestDemuxSampleInfoPost(AsyncHTTPTestCase):
    """Test suite for DemuxSampleInfoDataHandler POST method."""

    def get_app(self):
        """Create a test application instance."""
        return tornado.web.Application(
            [
                (r"/api/v1/demux_sample_info/([\w\d-]+)", DemuxSampleInfoDataHandler),
            ]
        )

    def setUp(self):
        super().setUp()
        # Set up base mocks on self.application (the real app used by self.fetch())
        self._app.cloudant = MagicMock()
        self._app.gs_globals = {}
        self._app.test_mode = True
        setup_mock_demux_config(
            self._app.cloudant,
            config={},
            version="test_version",
            config_id="test_config_id",
        )
        self._app.named_indices = {}

        # Load test data (which is just the samples list)
        test_data_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "shared_fixtures",
            "demux_sample_info_1.json",
        )
        with open(test_data_path) as f:
            samples_list = json.load(f)

        # Wrap in proper structure expected by POST endpoint
        self.test_data = {
            "metadata": {
                "num_lanes": 2,
                "run_setup": "2x151",
                "setup_lims_step_id": "24-123456",
            },
            "uploaded_lims_info": samples_list,
        }

    def test_validate_post_data_valid(self):
        """Test validation with valid POST data."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        is_valid, error_msg, metadata, uploaded_info = handler._validate_post_data(
            self.test_data
        )

        self.assertTrue(is_valid)
        self.assertIsNone(error_msg)
        self.assertIsNotNone(metadata)
        self.assertIsNotNone(uploaded_info)
        self.assertEqual(metadata["num_lanes"], 2)
        self.assertEqual(len(uploaded_info), 13)

    def test_validate_post_data_missing_metadata(self):
        """Test validation with missing metadata field."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        invalid_data = {"uploaded_lims_info": []}
        is_valid, error_msg, metadata, uploaded_info = handler._validate_post_data(
            invalid_data
        )

        self.assertFalse(is_valid)
        self.assertIn("metadata", error_msg)

    def test_validate_post_data_missing_uploaded_lims_info(self):
        """Test validation with missing uploaded_lims_info field."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        invalid_data = {"metadata": {"num_lanes": 2}}
        is_valid, error_msg, metadata, uploaded_info = handler._validate_post_data(
            invalid_data
        )

        self.assertFalse(is_valid)
        self.assertIn("uploaded_lims_info", error_msg)

    def test_validate_post_data_invalid_metadata_fields(self):
        """Test validation with missing required metadata fields."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        invalid_data = {
            "metadata": {"num_lanes": 2},  # Missing other required fields
            "uploaded_lims_info": [],
        }
        is_valid, error_msg, metadata, uploaded_info = handler._validate_post_data(
            invalid_data
        )

        self.assertFalse(is_valid)
        self.assertIn("run_setup", error_msg)

    def test_classify_sample_type_10x_dual(self):
        """Test classification of 10X dual-index samples (SI-TS-*)."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        sample = {
            "index": "SI-TS-B7",
            "index2": "",
            "control": "N",
            "sample_name": "Test_Sample",
        }

        classification = handler._classify_sample_type(sample, library_method="")

        self.assertEqual(classification["sample_type"], "10X_DUAL")
        self.assertEqual(classification["index_length"], [8, 0])
        self.assertIsNone(classification["umi_config"])

    def test_classify_sample_type_10x_single(self):
        """Test classification of 10X single-index samples (SI-GA-*, SI-NA-*)."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        sample = {
            "index": "SI-GA-A1",
            "index2": "",
            "control": "N",
            "sample_name": "Test_Sample",
        }

        classification = handler._classify_sample_type(sample, library_method="")

        self.assertEqual(classification["sample_type"], "10X_SINGLE")
        self.assertEqual(classification["index_length"], [8, 0])

    def test_classify_sample_type_named_index_single_sequence_row(self):
        """Regression: named index rows with only i7 sequence must not raise index errors."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())
        handler.application.named_indices = {
            "Chromium_10X_indexes": {"SI-NA-A2": [["TCTTAGGC"]]}
        }

        sample = {
            "index": "SI-NA-A2",
            "index2": "",
            "control": "N",
            "sample_name": "Test_Sample",
        }

        classification = handler._classify_sample_type(sample, library_method="")

        self.assertEqual(classification["sample_type"], "10X_SINGLE")
        self.assertEqual(classification["index_length"], [8, 0])

    def test_classify_sample_type_ordinary_dual(self):
        """Test classification of ordinary dual-index samples."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        sample = {
            "index": "CGCCTCT",  # 7bp
            "index2": "CGTTCCT",  # 7bp
            "control": "N",
            "sample_name": "Test_Sample",
        }

        classification = handler._classify_sample_type(sample, library_method="")

        self.assertEqual(classification["sample_type"], "STANDARD")
        self.assertEqual(classification["index_length"], [7, 7])
        self.assertIsNone(classification["umi_config"])

    def test_classify_sample_type_noindex(self):
        """Test classification of samples with NOINDEX keyword."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        sample = {
            "index": "NOINDEX",  # Must be explicit "NOINDEX" string
            "index2": "",
            "control": "N",
            "sample_name": "Test_Sample",
        }

        classification = handler._classify_sample_type(sample, library_method="")

        self.assertEqual(classification["sample_type"], "NOINDEX")
        self.assertEqual(classification["index_length"], [0, 0])

    def test_classify_sample_type_control(self):
        """Test classification of control samples (PhiX)."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        sample = {
            "index": "CGCCTCT",
            "index2": "",
            "control": "Y",
            "sample_name": "PhiX",
        }

        classification = handler._classify_sample_type(sample, library_method="")

        self.assertEqual(classification["sample_type"], "control")

    def test_classify_sample_type_by_library_method(self):
        """Test classification using library method mapping with new format."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        sample = {
            "index": "ATCACGTT",
            "index2": "",
            "control": "N",
            "sample_name": "Test_Sample",
        }

        # Test with a real library method from config
        classification = handler._classify_sample_type(
            sample, library_method="10X Chromium: Multiome"
        )

        self.assertEqual(classification["sample_type"], "10X_SINGLE_MULTIOME")
        self.assertEqual(classification["index_length"], [8, 0])

    def test_classify_sample_type_smartseq(self):
        """Test classification of Smart-seq samples with SMARTSEQ pattern."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        sample = {
            "index": "SMARTSEQ-1A",  # Matches SMARTSEQ pattern
            "index2": "",
            "control": "N",
            "sample_name": "Test_Sample",
        }

        classification = handler._classify_sample_type(sample, library_method="")

        self.assertEqual(classification["sample_type"], "SMARTSEQ")
        self.assertEqual(classification["index_length"], [11, 0])

    def test_classify_sample_type_short_single_index(self):
        """Test classification of short single index samples."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        sample = {
            "index": "ATCACG",  # 6bp (below threshold of 8)
            "index2": "",
            "control": "N",
            "sample_name": "Test_Sample",
        }

        classification = handler._classify_sample_type(sample, library_method="")

        self.assertEqual(classification["sample_type"], "STANDARD")

    def test_group_samples_by_lane(self):
        """Test grouping of samples by lane number."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())

        samples = self.test_data["uploaded_lims_info"]
        grouped = handler._group_samples_by_lane(samples)

        self.assertIn("3", grouped)
        self.assertIn("6", grouped)
        self.assertEqual(len(grouped["3"]), 4)
        self.assertEqual(len(grouped["6"]), 9)

    def test_create_calculated_lanes(self):
        """Test creation of calculated lanes with UUIDs and classification."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())
        handler._project_library_methods = {}

        with patch.object(handler, "_get_project_info_by_name", return_value={}):
            samples = self.test_data["uploaded_lims_info"]
            grouped_samples = handler._group_samples_by_lane(samples)
            timestamp = "2024-01-15T10:30:00"
            calculated_lanes = handler._create_calculated_lanes(
                grouped_samples, timestamp, self.test_data["metadata"]
            )

        self.assertIn("3", calculated_lanes)
        self.assertIn("6", calculated_lanes)

        lane_3 = calculated_lanes["3"]["sample_rows"]
        self.assertEqual(len(lane_3), 4)

        for sample_id, sample_data in lane_3.items():
            self.assertRegex(
                sample_id,
                r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
            )
            other_details = sample_data["settings"]["2024-01-15T10:30:00"][
                "other_details"
            ]
            self.assertIn("sample_type", other_details)

        lane_6 = calculated_lanes["6"]["sample_rows"]
        self.assertEqual(len(lane_6), 9)

        for sample_id, sample_data in lane_6.items():
            self.assertRegex(
                sample_id,
                r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
            )
            other_details = sample_data["settings"]["2024-01-15T10:30:00"][
                "other_details"
            ]
            self.assertIn("sample_type", other_details)
            self.assertIn("index_length", other_details)

    @patch("status.demux_sample_info.datetime")
    def test_create_document(self, mock_datetime):
        """Test document creation with proper structure."""
        handler = DemuxSampleInfoDataHandler(self._app, MagicMock())
        handler._project_library_methods = {}

        mock_datetime.datetime.now.return_value.isoformat.return_value = (
            "2024-01-15T10:30:00"
        )

        with patch.object(handler, "_get_project_library_method", return_value=""):
            flowcell_id = "233KCWLT4"
            metadata = self.test_data["metadata"]
            uploaded_info = self.test_data["uploaded_lims_info"]
            timestamp = "2024-01-15T10:30:00"

            document = handler._create_document(
                flowcell_id, metadata, uploaded_info, timestamp
            )

        self.assertEqual(document["flowcell_id"], flowcell_id)
        self.assertEqual(document["metadata"], metadata)
        self.assertEqual(document["uploaded_lims_info"], uploaded_info)

        self.assertIn("calculated", document)
        calculated = document["calculated"]
        self.assertIn("version_history", calculated)
        self.assertIn("lanes", calculated)

        calculated_lanes = calculated["lanes"]
        self.assertIn("3", calculated_lanes)
        self.assertIn("6", calculated_lanes)

    def test_post_endpoint_success(self):
        """Test successful POST request to the endpoint."""
        # Mock Cloudant operations
        self._app.cloudant.post_view.return_value.get_result.return_value = {"rows": []}
        self._app.cloudant.post_document.return_value.get_result.return_value = {
            "ok": True,
            "_id": "test_doc_id",
            "_rev": "1-abc123",
        }

        # Make POST request
        response = self.fetch(
            "/api/v1/demux_sample_info/233KCWLT4",
            method="POST",
            body=json.dumps(self.test_data),
            headers={"Content-Type": "application/json"},
        )

        # Check response - 201 on success
        self.assertEqual(response.code, 201)
        response_data = json.loads(response.body)
        self.assertIn("message", response_data)
        self.assertIn("created successfully", response_data["message"])

    def test_post_endpoint_validation_error(self):
        """Test POST request with invalid data."""
        invalid_data = {"metadata": {}}  # Missing required fields

        response = self.fetch(
            "/api/v1/demux_sample_info/233KCWLT4",
            method="POST",
            body=json.dumps(invalid_data),
            headers={"Content-Type": "application/json"},
        )

        # Check response
        self.assertEqual(response.code, 400)
        response_data = json.loads(response.body)
        self.assertIn("error", response_data)

    def test_post_endpoint_existing_document(self):
        """Test POST request when document already exists - should NOT return 409."""
        # Mock the view query to indicate document exists
        self._app.cloudant.post_view.return_value.get_result.return_value = {
            "rows": [{"id": "existing_doc_id", "value": ["TEST_FC", "TEST_FC"]}]
        }
        # Mock document fetch for reupload
        sample_doc = {
            "_id": "TEST_FC",
            "_rev": "1-test",
            "flowcell_id": "TEST_FC",
            "metadata": {
                "num_lanes": 1,
                "run_setup": "test",
                "first_generated": "2024-01-01",
            },
            "uploaded_lims_info": [],
            "calculated": {"lanes": {}, "version_history": {}},
            "samplesheets": [],
        }
        self._app.cloudant.get_document.return_value.get_result.return_value = (
            sample_doc
        )

        response = self.fetch(
            "/api/v1/demux_sample_info/233KCWLT4",
            method="POST",
            body=json.dumps(self.test_data),
            headers={"Content-Type": "application/json"},
        )

        # Should NOT be 409 (conflict) anymore - reupload path is taken
        self.assertNotEqual(response.code, 409)


if __name__ == "__main__":
    unittest.main()
