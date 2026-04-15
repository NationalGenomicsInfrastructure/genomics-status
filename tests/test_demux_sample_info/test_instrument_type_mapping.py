"""
Unit tests for instrument type and run mode mapping.

Tests the hierarchical configuration system where:
- Instrument type provides base settings
- Run mode can override instrument type settings
"""

import unittest
from unittest.mock import MagicMock

from status.demux_sample_info import DemuxSampleInfoDataHandler
from tests.conftest import get_classification_config


class TestInstrumentTypeMapping(unittest.TestCase):
    """Test suite for instrument type and run mode configuration."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a handler instance with mock application
        self.handler = DemuxSampleInfoDataHandler(MagicMock(), MagicMock())
        self.handler.application = MagicMock()

        self.handler.application.sample_classification_config = get_classification_config()

    def test_instrument_type_only(self):
        """Test configuration with instrument type but no run mode."""
        sample = {
            "index_1": "ATCGATCG",
            "index_2": "GCTAGCTA",
            "sample_name": "Test_Sample_1",
        }
        metadata = {"instrument_type": "NovaSeqXPlus"}

        result = self.handler._classify_sample_type(sample, None, metadata)

        # Should apply NovaSeqXPlus settings
        self.assertEqual(
            result["raw_samplesheet_settings"].get("BarcodeMismatchesIndex1"), 1
        )
        self.assertEqual(
            result["raw_samplesheet_settings"].get("BarcodeMismatchesIndex2"), 1
        )
        self.assertIn("instrument_type_mapping.NovaSeqXPlus", result["config_sources"])

    def test_instrument_type_with_run_mode(self):
        """Test configuration with both instrument type and run mode."""
        sample = {
            "index_1": "ATCGATCG",
            "index_2": "GCTAGCTA",
            "sample_name": "Test_Sample_1",
        }
        metadata = {"instrument_type": "NovaSeqXPlus", "run_mode": "10B"}

        result = self.handler._classify_sample_type(sample, None, metadata)

        # Run mode should override instrument type for BarcodeMismatchesIndex1
        self.assertEqual(
            result["raw_samplesheet_settings"].get("BarcodeMismatchesIndex1"), 2
        )
        # But inherit BarcodeMismatchesIndex2 from instrument type
        self.assertEqual(
            result["raw_samplesheet_settings"].get("BarcodeMismatchesIndex2"), 1
        )
        self.assertIn("instrument_type_mapping.NovaSeqXPlus", result["config_sources"])
        self.assertIn(
            "instrument_type_mapping.NovaSeqXPlus.run_modes.10B",
            result["config_sources"],
        )

    def test_run_mode_without_override(self):
        """Test run mode that doesn't override any settings."""
        sample = {
            "index_1": "ATCGATCG",
            "index_2": "GCTAGCTA",
            "sample_name": "Test_Sample_1",
        }
        metadata = {"instrument_type": "NovaSeqXPlus", "run_mode": "25B"}

        result = self.handler._classify_sample_type(sample, None, metadata)

        # Should use instrument type settings since 25B has no overrides
        self.assertEqual(
            result["raw_samplesheet_settings"].get("BarcodeMismatchesIndex1"), 1
        )
        self.assertEqual(
            result["raw_samplesheet_settings"].get("BarcodeMismatchesIndex2"), 1
        )
        self.assertIn("instrument_type_mapping.NovaSeqXPlus", result["config_sources"])
        self.assertIn(
            "instrument_type_mapping.NovaSeqXPlus.run_modes.25B",
            result["config_sources"],
        )

    def test_no_instrument_type(self):
        """Test that config works without instrument type."""
        sample = {
            "index_1": "ATCGATCG",
            "index_2": "GCTAGCTA",
            "sample_name": "Test_Sample_1",
        }
        metadata = {}

        result = self.handler._classify_sample_type(sample, None, metadata)

        # Should not have instrument type config source
        self.assertNotIn("instrument_type_mapping", str(result["config_sources"]))

    def test_priority_over_library_method(self):
        """Test that instrument type overrides library method settings."""
        sample = {
            "index_1": "ATCGATCG",
            "index_2": "GCTAGCTA",
            "sample_name": "Test_Sample_1",
        }
        library_method = "10X Chromium: Multiome"
        metadata = {"instrument_type": "NovaSeqXPlus"}

        result = self.handler._classify_sample_type(sample, library_method, metadata)

        # Should have both in config sources, with instrument type after library method
        config_sources_str = "->".join(result["config_sources"])
        self.assertIn("library_method_mapping", config_sources_str)
        self.assertIn("instrument_type_mapping", config_sources_str)

        # Instrument type settings should be present
        self.assertEqual(
            result["raw_samplesheet_settings"].get("BarcodeMismatchesIndex1"), 1
        )

    def test_control_overrides_instrument_type(self):
        """Test that control patterns override instrument type settings."""
        sample = {
            "index_1": "ATCGATCG",
            "index_2": "GCTAGCTA",
            "sample_name": "PhiX_Control",
        }
        metadata = {"instrument_type": "NovaSeqXPlus"}

        result = self.handler._classify_sample_type(sample, None, metadata)

        # Control pattern should override everything
        self.assertEqual(result["sample_type"], "control")
        self.assertIsNone(result["umi_config"])
        self.assertEqual(result["raw_samplesheet_settings"], {})
        self.assertIn("control_patterns", result["config_sources"])


if __name__ == "__main__":
    unittest.main()
