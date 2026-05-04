"""
Unit tests for samplesheet_settings storage and recalculation.

Tests the Stream 2 result storage functionality including:
- Calculation of samplesheet_settings during document creation
- Storage of samplesheet_settings in sample settings
- Correct application of global samplesheet_generation_rules
- Filtering of EXCLUDE and None values
"""

import unittest
from unittest.mock import MagicMock

from status.demux_sample_info import DemuxSampleInfoDataHandler
from tests.demux_sample_info.conftest import setup_mock_demux_config


class TestSamplesheetSettings(unittest.TestCase):
    """Test suite for samplesheet_settings functionality."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a handler instance with mock application
        self.handler = DemuxSampleInfoDataHandler(MagicMock(), MagicMock())
        self.handler.application = MagicMock()
        self.handler.application.cloudant = MagicMock()

        # Base timestamp for testing
        self.timestamp = "2024-01-15T10:30:00"

        # Mock cloudant to return sample classification config with samplesheet_generation_rules
        test_config = {
            "samplesheet_generation_rules": {
                "TrimUMI": [
                    {
                        "name": "exclude_for_non_umi",
                        "conditions": {
                            "all_of": [{"field": "umi_config", "operator": "is_null"}]
                        },
                        "action": "set_value",
                        "value": "EXCLUDE",
                    }
                ]
            }
        }
        setup_mock_demux_config(self.handler.application.cloudant, config=test_config)

    def test_calculate_samplesheet_settings_basic(self):
        """Test basic calculation of samplesheet_settings."""
        bcl_settings = {
            "SoftwareVersion": "4.0.3",
            "FastqCompressionFormat": "gzip",
            "TrimUMI": True,
        }
        other_details = {
            "sample_type": "standard",
            "umi_config": "umi10+umi10",
            "index_length": [8, 8],
            "named_index": "",
        }
        per_sample_fields = {
            "Sample_Project": "Project_A",
        }

        result = self.handler._calculate_samplesheet_settings(
            bcl_settings, other_details, per_sample_fields
        )

        # Should contain all non-None, non-EXCLUDE values
        self.assertEqual(result["SoftwareVersion"], "4.0.3")
        self.assertEqual(result["FastqCompressionFormat"], "gzip")
        self.assertEqual(result["TrimUMI"], True)

    def test_calculate_samplesheet_settings_with_global_rules(self):
        """Test that global samplesheet_generation_rules are applied."""
        bcl_settings = {
            "SoftwareVersion": "4.0.3",
            "TrimUMI": True,
        }
        other_details = {
            "sample_type": "standard",
            "umi_config": None,  # No UMI
            "index_length": [8, 8],
            "named_index": "",
        }
        per_sample_fields = {
            "Sample_Project": "Project_A",
        }

        result = self.handler._calculate_samplesheet_settings(
            bcl_settings, other_details, per_sample_fields
        )

        # TrimUMI should be EXCLUDED (filtered out) because umi_config is None
        self.assertNotIn("TrimUMI", result)
        self.assertEqual(result["SoftwareVersion"], "4.0.3")

    def test_calculate_samplesheet_settings_filters_none(self):
        """Test that None values are filtered out."""
        bcl_settings = {
            "SoftwareVersion": "4.0.3",
            "TrimUMI": None,  # Should be filtered
            "CreateFastqForIndexReads": True,
        }
        other_details = {
            "sample_type": "standard",
            "umi_config": "umi10+umi10",
            "index_length": [8, 8],
            "named_index": "",
        }
        per_sample_fields = {
            "Sample_Project": "Project_A",
        }

        result = self.handler._calculate_samplesheet_settings(
            bcl_settings, other_details, per_sample_fields
        )

        # TrimUMI should not be in result because it's None
        self.assertNotIn("TrimUMI", result)
        self.assertEqual(result["SoftwareVersion"], "4.0.3")
        self.assertEqual(result["CreateFastqForIndexReads"], True)

    def test_recalculate_all_samplesheet_settings(self):
        """Test recalculation of all samplesheet_settings in calculated_lanes."""
        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "sample1": {
                        "settings": {
                            self.timestamp: {
                                "raw_samplesheet_settings": {
                                    "SoftwareVersion": "4.0.3",
                                    "TrimUMI": True,
                                },
                                "other_details": {
                                    "sample_type": "standard",
                                    "umi_config": None,  # No UMI
                                    "index_length": [8, 8],
                                    "named_index": "",
                                },
                                "per_sample_fields": {
                                    "Sample_Project": "Project_A",
                                },
                            }
                        }
                    },
                    "sample2": {
                        "settings": {
                            self.timestamp: {
                                "raw_samplesheet_settings": {
                                    "SoftwareVersion": "4.0.3",
                                    "TrimUMI": True,
                                },
                                "other_details": {
                                    "sample_type": "standard",
                                    "umi_config": "umi10+umi10",  # Has UMI
                                    "index_length": [8, 8],
                                    "named_index": "",
                                },
                                "per_sample_fields": {
                                    "Sample_Project": "Project_A",
                                },
                            }
                        }
                    },
                }
            }
        }

        # Recalculate samplesheet settings
        self.handler._recalculate_all_samplesheet_settings(calculated_lanes)

        # Check sample1 (no UMI) - TrimUMI should be EXCLUDED
        sample1_settings = calculated_lanes["1"]["sample_rows"]["sample1"]["settings"][
            self.timestamp
        ]
        self.assertIn("samplesheet_settings", sample1_settings)
        self.assertNotIn("TrimUMI", sample1_settings["samplesheet_settings"])
        self.assertEqual(
            sample1_settings["samplesheet_settings"]["SoftwareVersion"], "4.0.3"
        )

        # Check sample2 (has UMI) - TrimUMI should be included
        sample2_settings = calculated_lanes["1"]["sample_rows"]["sample2"]["settings"][
            self.timestamp
        ]
        self.assertIn("samplesheet_settings", sample2_settings)
        self.assertEqual(sample2_settings["samplesheet_settings"]["TrimUMI"], True)
        self.assertEqual(
            sample2_settings["samplesheet_settings"]["SoftwareVersion"], "4.0.3"
        )

    def test_samplesheet_settings_stored_during_creation(self):
        """Test that samplesheet_settings is stored when calculated_lanes are created."""
        # This test verifies the integration with _create_calculated_lanes
        # We'll create a minimal test case

        # Set up mock config for _create_calculated_lanes
        test_config = {
            "bcl_convert_settings": {
                "raw_samplesheet_settings": {
                    "SoftwareVersion": {"default": "4.0.3"},
                }
            },
            "patterns": {},
            "samplesheet_generation_rules": {},
        }
        setup_mock_demux_config(self.handler.application.cloudant, config=test_config)

        self.handler.application.named_indices = {}

        # Mock methods
        self.handler._get_project_library_method = MagicMock(return_value=None)
        self.handler._get_project_id_by_name = MagicMock(
            return_value={"project_id": "", "doc_id": None}
        )

        lanes_with_samples = {
            "1": [
                {
                    "lane": "1",
                    "sample_id": "1",
                    "sample_name": "Sample_1",
                    "sample_project": "Project_A",
                    "index": "ATCGATCG",
                    "index2": "GCTAGCTA",
                    "control": "N",
                    "description": "",
                    "flowcell_id": "TEST123",
                    "operator": "operator1",
                    "recipe": "151-8-8-151",
                    "sample_ref": "hg38",
                }
            ]
        }

        metadata = {"run_setup": "2x151"}

        # Call _create_calculated_lanes
        calculated_lanes = self.handler._create_calculated_lanes(
            lanes_with_samples, self.timestamp, metadata
        )

        # Verify that samplesheet_settings was created
        sample_uuids = list(calculated_lanes["1"]["sample_rows"].keys())
        self.assertEqual(len(sample_uuids), 1)

        sample = calculated_lanes["1"]["sample_rows"][sample_uuids[0]]
        settings = sample["settings"][self.timestamp]

        self.assertIn("samplesheet_settings", settings)
        self.assertIsInstance(settings["samplesheet_settings"], dict)
        # Should have SoftwareVersion from raw_samplesheet_settings
        self.assertEqual(settings["samplesheet_settings"]["SoftwareVersion"], "4.0.3")


if __name__ == "__main__":
    unittest.main()
