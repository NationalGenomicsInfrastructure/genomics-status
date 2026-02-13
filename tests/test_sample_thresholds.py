#!/usr/bin/env python
"""
Test cases for sample cluster threshold calculations.

Tests the actual code from flowcell.py to ensure thresholds are calculated correctly
based on lane capacity, project units, and number of samples.
"""

import sys
import os
import unittest

# Add parent directory to path to import status module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from status.flowcell import calculate_sample_threshold, format_sample_tooltip, reads_per_unit


class TestSampleThresholds(unittest.TestCase):
    """Test sample threshold calculation logic using actual flowcell.py code."""

    def setUp(self):
        """Set up common test parameters."""
        # Standard reads per unit for Universal-* projects (from flowcell.py)
        self.reads_per_unit = reads_per_unit
        
    # Universal-* Project Tests
    
    def test_universal_single_sample_meets_threshold(self):
        """Test Universal-* project with 1 sample that meets 90% threshold."""
        sample_yield = 420_000_000  # 420M clusters
        num_samples = 1
        units_ordered = 1.0
        lane_capacity_units = 2.0
        
        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=0,
            units_ordered=units_ordered,
            lane_capacity_units=lane_capacity_units,
            is_universal=True,
        )
        
        # Expected: 1 unit * 600M * 0.75 / 1 sample = 450M
        # 90% threshold = 405M, 80% threshold = 360M
        # 420M >= 405M -> success
        self.assertEqual(yield_class, "table-success")
        self.assertEqual(tooltip_data["type"], "universal")
        self.assertEqual(tooltip_data["per_sample_allocation"], 450_000_000)
        self.assertEqual(tooltip_data["threshold_90"], 405_000_000)
        self.assertEqual(tooltip_data["threshold_80"], 360_000_000)
    
    def test_universal_single_sample_warning_threshold(self):
        """Test Universal-* project with 1 sample that meets 80% but not 90%."""
        sample_yield = 380_000_000  # 380M clusters
        num_samples = 1
        units_ordered = 1.0
        lane_capacity_units = 2.0
        
        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=0,
            units_ordered=units_ordered,
            lane_capacity_units=lane_capacity_units,
            is_universal=True,
        )
        
        # 380M is between 360M (80%) and 405M (90%) -> warning
        self.assertEqual(yield_class, "table-warning")
    
    def test_universal_single_sample_fails_threshold(self):
        """Test Universal-* project with 1 sample that fails to meet 80% threshold."""
        sample_yield = 300_000_000  # 300M clusters
        num_samples = 1
        units_ordered = 1.0
        lane_capacity_units = 2.0
        
        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=0,
            units_ordered=units_ordered,
            lane_capacity_units=lane_capacity_units,
            is_universal=True,
        )
        
        # 300M < 360M (80%) -> danger
        self.assertEqual(yield_class, "table-danger")
    
    def test_universal_multiple_samples_equal_distribution(self):
        """Test Universal-* project with 4 samples, all meeting threshold."""
        num_samples = 4
        units_ordered = 2.0  # 2 units ordered
        lane_capacity_units = 5.0
        
        # Expected: 2 units * 600M * 0.75 / 4 samples = 225M per sample
        # 90% threshold = 202.5M, 80% threshold = 180M
        
        sample_yields = [220_000_000, 225_000_000, 230_000_000, 225_000_000]
        expected_classes = ["table-success", "table-success", "table-success", "table-success"]
        
        for sample_yield, expected_class in zip(sample_yields, expected_classes):
            yield_class, tooltip_data = calculate_sample_threshold(
                sample_yield=sample_yield,
                num_samples_in_project=num_samples,
                threshold=0,
                units_ordered=units_ordered,
                lane_capacity_units=lane_capacity_units,
                is_universal=True,
            )
            self.assertEqual(yield_class, expected_class)
            self.assertEqual(tooltip_data["per_sample_allocation"], 225_000_000)
    
    def test_universal_multiple_samples_mixed_performance(self):
        """Test Universal-* project with 4 samples with varying yields."""
        num_samples = 4
        units_ordered = 2.0
        lane_capacity_units = 5.0
        
        # Expected per sample: 225M, 90% = 202.5M, 80% = 180M
        test_cases = [
            (250_000_000, "table-success"),  # Exceeds threshold
            (195_000_000, "table-warning"),  # Between 80% and 90%
            (160_000_000, "table-danger"),   # Below 80%
            (220_000_000, "table-success"),  # Above 90%
        ]
        
        for sample_yield, expected_class in test_cases:
            yield_class, tooltip_data = calculate_sample_threshold(
                sample_yield=sample_yield,
                num_samples_in_project=num_samples,
                threshold=0,
                units_ordered=units_ordered,
                lane_capacity_units=lane_capacity_units,
                is_universal=True,
            )
            self.assertEqual(yield_class, expected_class)
    
    def test_universal_lane_capacity_limits_units(self):
        """Test Universal-* project where units ordered exceed lane capacity."""
        units_ordered = 3.0
        lane_capacity_units = 2.0  # Lane can only handle 2 units
        num_samples = 2
        sample_yield = 420_000_000
        
        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=0,
            units_ordered=units_ordered,
            lane_capacity_units=lane_capacity_units,
            is_universal=True,
        )
        
        # Expected: min(3, 2) = 2 units * 600M * 0.75 / 2 samples = 450M per sample
        self.assertEqual(tooltip_data["targeted_units"], 2.0)
        self.assertEqual(tooltip_data["per_sample_allocation"], 450_000_000)
        self.assertEqual(tooltip_data["threshold_90"], 405_000_000)

    # Standard (non-Universal) Project Tests
    
    def test_standard_single_sample_meets_threshold(self):
        """Test standard project with 1 sample that meets 90% threshold."""
        lane_threshold_m = 300  # 300M lane threshold
        num_samples = 1
        sample_yield = 220_000_000
        
        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=lane_threshold_m,
            units_ordered=0,
            lane_capacity_units=0,
            is_universal=False,
        )
        
        # Expected: 300M * 0.75 / 1 = 225M per sample
        # 90% = 202.5M, 80% = 180M
        # 220M >= 202.5M -> success
        self.assertEqual(yield_class, "table-success")
        self.assertEqual(tooltip_data["type"], "standard")
        self.assertEqual(tooltip_data["per_sample_allocation"], 225_000_000)
        self.assertEqual(tooltip_data["threshold_90"], 202_500_000)
    
    def test_standard_multiple_samples_split_threshold(self):
        """Test standard project with 4 samples splitting the lane allocation."""
        lane_threshold_m = 320  # NovaSeq S4 threshold
        num_samples = 4
        
        # Expected: 320M * 0.75 / 4 = 60M per sample
        # 90% = 54M, 80% = 48M
        
        test_cases = [
            (58_000_000, "table-success"),  # 58M >= 54M
            (62_000_000, "table-success"),  # 62M >= 54M
            (50_000_000, "table-warning"),  # 48M <= 50M < 54M
            (45_000_000, "table-danger"),   # 45M < 48M
        ]
        
        for sample_yield, expected_class in test_cases:
            yield_class, tooltip_data = calculate_sample_threshold(
                sample_yield=sample_yield,
                num_samples_in_project=num_samples,
                threshold=lane_threshold_m,
                units_ordered=0,
                lane_capacity_units=0,
                is_universal=False,
            )
            self.assertEqual(yield_class, expected_class)
            self.assertEqual(tooltip_data["per_sample_allocation"], 60_000_000)
    
    def test_standard_hiseq_x_eight_samples(self):
        """Test HiSeq X lane with 8 samples."""
        lane_threshold_m = 320  # HiSeq X threshold
        num_samples = 8
        sample_yield = 28_000_000
        
        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=lane_threshold_m,
            units_ordered=0,
            lane_capacity_units=0,
            is_universal=False,
        )
        
        # Expected: 320M * 0.75 / 8 = 30M per sample
        # 90% = 27M
        # 28M >= 27M -> success
        self.assertEqual(yield_class, "table-success")
        self.assertEqual(tooltip_data["per_sample_allocation"], 30_000_000)
        self.assertEqual(tooltip_data["threshold_90"], 27_000_000)
    
    def test_standard_novaseq_xplus_multiple_projects(self):
        """Test NovaSeqXPlus lane with samples from different projects."""
        lane_threshold_m = 1200  # NovaSeqXPlus 10B
        
        # Project A: 3 samples
        num_samples_proj_a = 3
        yield_class_a, tooltip_data_a = calculate_sample_threshold(
            sample_yield=280_000_000,
            num_samples_in_project=num_samples_proj_a,
            threshold=lane_threshold_m,
            units_ordered=0,
            lane_capacity_units=0,
            is_universal=False,
        )
        # Expected: 1200M * 0.75 / 3 = 300M per sample, 90% = 270M
        self.assertEqual(tooltip_data_a["per_sample_allocation"], 300_000_000)
        self.assertEqual(tooltip_data_a["threshold_90"], 270_000_000)
        self.assertEqual(yield_class_a, "table-success")  # 280M >= 270M
        
        # Project B: 2 samples
        num_samples_proj_b = 2
        yield_class_b, tooltip_data_b = calculate_sample_threshold(
            sample_yield=420_000_000,
            num_samples_in_project=num_samples_proj_b,
            threshold=lane_threshold_m,
            units_ordered=0,
            lane_capacity_units=0,
            is_universal=False,
        )
        # Expected: 1200M * 0.75 / 2 = 450M per sample, 90% = 405M
        self.assertEqual(tooltip_data_b["per_sample_allocation"], 450_000_000)
        self.assertEqual(tooltip_data_b["threshold_90"], 405_000_000)
        self.assertEqual(yield_class_b, "table-success")  # 420M >= 405M
    
    # Edge Cases
    
    def test_edge_case_fractional_units(self):
        """Test with fractional unit orders."""
        units_ordered = 0.5  # Half a unit
        num_samples = 2
        sample_yield = 105_000_000
        
        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=0,
            units_ordered=units_ordered,
            lane_capacity_units=2.0,
            is_universal=True,
        )
        
        # Expected: 0.5 * 600M * 0.75 / 2 = 112.5M per sample
        # 90% = 101.25M
        # 105M >= 101.25M -> success
        self.assertEqual(tooltip_data["per_sample_allocation"], 112_500_000)
        self.assertEqual(tooltip_data["threshold_90"], 101_250_000)
        self.assertEqual(yield_class, "table-success")
    
    def test_edge_case_many_samples(self):
        """Test with many samples in a project."""
        units_ordered = 2.0
        num_samples = 10
        sample_yield = 85_000_000
        
        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=0,
            units_ordered=units_ordered,
            lane_capacity_units=5.0,
            is_universal=True,
        )
        
        # Expected: 2 * 600M * 0.75 / 10 = 90M per sample
        # 90% = 81M
        # 85M >= 81M -> success
        self.assertEqual(tooltip_data["per_sample_allocation"], 90_000_000)
        self.assertEqual(tooltip_data["threshold_90"], 81_000_000)
        self.assertEqual(yield_class, "table-success")
    
    # Tooltip Formatting Tests
    
    def test_tooltip_format_universal(self):
        """Test tooltip formatting for Universal-* projects."""
        _, tooltip_data = calculate_sample_threshold(
            sample_yield=420_000_000,
            num_samples_in_project=4,
            threshold=0,
            units_ordered=2.0,
            lane_capacity_units=5.0,
            is_universal=True,
        )
        
        tooltip = format_sample_tooltip(tooltip_data)
        
        # Check that key information is in the tooltip
        self.assertIn("Universal-* Sample", tooltip)
        self.assertIn("Project units ordered: 2.0", tooltip)
        self.assertIn("per sample", tooltip.lower())
        self.assertIn("90% threshold", tooltip)
        self.assertIn("80% threshold", tooltip)
    
    def test_tooltip_format_standard(self):
        """Test tooltip formatting for standard projects."""
        _, tooltip_data = calculate_sample_threshold(
            sample_yield=220_000_000,
            num_samples_in_project=3,
            threshold=300,
            units_ordered=0,
            lane_capacity_units=0,
            is_universal=False,
        )
        
        tooltip = format_sample_tooltip(tooltip_data)
        
        # Check that key information is in the tooltip
        self.assertIn("Lane threshold: 300M", tooltip)
        self.assertIn("Number of samples in project: 3", tooltip)
        self.assertIn("90% threshold", tooltip)
        self.assertIn("80% threshold", tooltip)


if __name__ == "__main__":
    unittest.main()
