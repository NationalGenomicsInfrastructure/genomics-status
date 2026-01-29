"""
Unit tests for OverrideCycles generation function.

Tests the _generate_override_cycles method in DemuxSampleInfoDataHandler including:
- Basic runs without UMI
- UMI on R1/R2 reads
- UMI on indices (i7/i5)
- Recipe shorter than run setup
- Complex cases with multiple UMI locations
"""

import unittest
from unittest.mock import MagicMock

from status.demux_sample_info import DemuxSampleInfoDataHandler


class TestOverrideCycles(unittest.TestCase):
    """Test suite for OverrideCycles generation."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a handler instance with mock application
        self.handler = DemuxSampleInfoDataHandler(MagicMock(), MagicMock())
        self.handler.application = MagicMock()

    def test_basic_no_umi(self):
        """Test basic run without UMI."""
        run_setup = "151-10-24-151"
        recipe = "151-X-X-151"
        index_lengths = [10, 24]
        
        result = self.handler._generate_override_cycles(
            run_setup, recipe, index_lengths, None
        )
        
        self.assertEqual(result, "R1:Y151;I1:I10;I2:I24;R2:Y151")

    def test_with_umi_r1_r2(self):
        """Test with UMI on R1 (start) and R2 (end)."""
        run_setup = "151-10-24-151"
        recipe = "151-X-X-151"
        index_lengths = [10, 24]
        umi_config = {
            "R1": {"position": "start", "length": 7},
            "R2": {"position": "end", "length": 7},
            "i7": {"position": "end", "length": 0},
            "i5": {"position": "end", "length": 0},
        }
        
        result = self.handler._generate_override_cycles(
            run_setup, recipe, index_lengths, umi_config
        )
        
        self.assertEqual(result, "R1:U7Y144;I1:I10;I2:I24;R2:Y144U7")

    def test_with_umi_indices(self):
        """Test with UMI on indices."""
        run_setup = "151-10-24-151"
        recipe = "151-X-X-151"
        index_lengths = [8, 8]  # After removing UMI
        umi_config = {
            "R1": {"position": "start", "length": 0},
            "R2": {"position": "end", "length": 0},
            "i7": {"position": "end", "length": 2},
            "i5": {"position": "end", "length": 2},
        }
        
        result = self.handler._generate_override_cycles(
            run_setup, recipe, index_lengths, umi_config
        )
        
        self.assertEqual(result, "R1:Y151;I1:I8U2;I2:I8U2N14;R2:Y151")



    def test_with_umi_full_index(self):
        """Test where one index is just UMI"""
        run_setup = "151-10-24-151"
        recipe = "151-10-24-151"
        index_lengths = [8, 0]  # After removing UMI
        umi_config = {
            "i5": {"position": "start", "length": 24},
        }
        
        result = self.handler._generate_override_cycles(
            run_setup, recipe, index_lengths, umi_config
        )
        
        self.assertEqual(result, "R1:Y151;I1:I8N2;I2:U24;R2:Y151")

    def test_shorter_recipe(self):
        """Test with recipe shorter than run setup."""
        run_setup = "151-10-24-151"
        recipe = "143-X-X-143"
        index_lengths = [10, 24]
        
        result = self.handler._generate_override_cycles(
            run_setup, recipe, index_lengths, None
        )
        
        self.assertEqual(result, "R1:Y143N8;I1:I10;I2:I24;R2:Y143N8")

    def test_complex_umi(self):
        """Test complex case with UMIs on multiple locations."""
        run_setup = "151-10-24-151"
        recipe = "151-X-X-151"
        index_lengths = [8, 8]
        umi_config = {
            "R1": {"position": "start", "length": 7},
            "R2": {"position": "end", "length": 7},
            "i7": {"position": "end", "length": 2},
            "i5": {"position": "end", "length": 2},
        }
        
        result = self.handler._generate_override_cycles(
            run_setup, recipe, index_lengths, umi_config
        )
        
        self.assertEqual(result, "R1:U7Y144;I1:I8U2;I2:I8U2N14;R2:Y144U7")

    def test_invalid_run_setup(self):
        """Test with invalid run setup format."""
        run_setup = "151-10"  # Not enough parts
        recipe = "151-X-X-151"
        index_lengths = [10, 24]
        
        result = self.handler._generate_override_cycles(
            run_setup, recipe, index_lengths, None
        )
        
        self.assertEqual(result, "")

    def test_empty_run_setup(self):
        """Test with empty run setup."""
        run_setup = ""
        recipe = "151-X-X-151"
        index_lengths = [10, 24]
        
        result = self.handler._generate_override_cycles(
            run_setup, recipe, index_lengths, None
        )
        
        self.assertEqual(result, "")

    def test_empty_recipe(self):
        """Test with empty recipe."""
        run_setup = "151-10-24-151"
        recipe = ""
        index_lengths = [10, 24]
        
        result = self.handler._generate_override_cycles(
            run_setup, recipe, index_lengths, None
        )
        
        self.assertEqual(result, "")


if __name__ == "__main__":
    unittest.main()
