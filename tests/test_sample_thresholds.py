#!/usr/bin/env python
"""
Test cases for sample cluster threshold calculations.

Tests the actual code from flowcell.py to ensure thresholds are calculated correctly
based on lane capacity, project units, and number of samples.
"""

import os
import sys
import unittest

# Add parent directory to path to import status module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from status.flowcell import (
    calculate_sample_threshold,
    format_sample_tooltip,
    reads_per_unit,
)


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

        # Expected:
        # project_target = 1 * 600M = 600M
        # required_project_yield_90 = 600M * 0.9 = 540M
        # perfect_sample_fraction_90 = 540M / 1 = 540M
        # success_threshold = 540M * 0.75 = 405M
        # threshold_red = 405M * 0.01 = 4.05M
        # 420M >= 405M -> success
        self.assertEqual(yield_class, "table-success")
        self.assertEqual(tooltip_data["type"], "universal")
        self.assertEqual(tooltip_data["success_threshold"], 405_000_000)
        self.assertEqual(tooltip_data["threshold_red"], 4_050_000)

    def test_universal_single_sample_warning_threshold(self):
        """Test Universal-* project with 1 sample that's below success threshold but above red."""
        sample_yield = 404_000_000  # 404M clusters
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

        # 404M is between 4.05M (red) and 405M (success) -> warning
        self.assertEqual(yield_class, "table-warning")

    def test_universal_single_sample_fails_threshold(self):
        """Test Universal-* project with 1 sample that fails to meet red threshold."""
        sample_yield = 3_000_000  # 3M clusters
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

        # 3M < 4.05M (red threshold) -> danger
        self.assertEqual(yield_class, "table-danger")

    def test_universal_multiple_samples_equal_distribution(self):
        """Test Universal-* project with 4 samples, all meeting threshold."""
        num_samples = 4
        units_ordered = 1.0  # 1 unit ordered
        lane_capacity_units = 5.0

        # project_target = 1 * 600M = 600M
        # required_project_yield_90 = 600M * 0.9 = 540M
        # perfect_sample_fraction_90 = 540M / 4 = 135M
        # success_threshold = 135M * 0.75 = 101.25M
        # threshold_red = 101.25M * 0.01 = 1.0125M

        sample_yields = [105_000_000, 125_000_000, 150_000_000, 180_000_000]
        expected_classes = [
            "table-success",
            "table-success",
            "table-success",
            "table-success",
        ]

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
            self.assertEqual(tooltip_data["success_threshold"], 101_250_000)

    def test_universal_multiple_samples_mixed_performance(self):
        """Test Universal-* project with 4 samples with varying yields."""
        num_samples = 4
        units_ordered = 2.0
        lane_capacity_units = 5.0

        # project_target = 2 * 600M = 1200M
        # required_project_yield_90 = 1200M * 0.9 = 1080M
        # perfect_sample_fraction_90 = 1080M / 4 = 270M
        # success_threshold = 270M * 0.75 = 202.5M
        # threshold_red = 202.5M * 0.01 = 2.025M
        test_cases = [
            (250_000_000, "table-success"),  # Exceeds success threshold
            (195_000_000, "table-warning"),  # Between red and success
            (1_000_000, "table-danger"),  # Below red threshold
            (220_000_000, "table-success"),  # Above success threshold
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
            self.assertEqual(tooltip_data["success_threshold"], 202_500_000)

    def test_universal_lane_capacity_limits_units(self):
        """Test Universal-* project where units ordered exceed lane capacity."""
        units_ordered = 3.0
        lane_capacity_units = 2.0  # Lane can only handle 2 units
        num_samples = 2
        sample_yield = 420_000_000

        # project_target = 2 * 600M = 1200M (capped at lane capacity)
        # required_project_yield_90 = 1200M * 0.9 = 1080M
        # perfect_sample_fraction_90 = 1080M / 2 = 540M
        # success_threshold = 540M * 0.75 = 405M

        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=0,
            units_ordered=units_ordered,
            lane_capacity_units=lane_capacity_units,
            is_universal=True,
        )

        self.assertEqual(tooltip_data["targeted_units"], 2.0)
        self.assertEqual(tooltip_data["success_threshold"], 405_000_000)

    # Standard (non-Universal) Project Tests

    def test_standard_single_sample_meets_threshold(self):
        """Test standard project with 1 sample that meets success threshold."""
        lane_threshold_m = 600  # 600M lane threshold
        num_samples = 1
        sample_yield = 552_000_000

        yield_class, tooltip_data = calculate_sample_threshold(
            sample_yield=sample_yield,
            num_samples_in_project=num_samples,
            threshold=lane_threshold_m,
            units_ordered=1,
            lane_capacity_units=1,
            is_universal=False,
        )

        # lane_target = 600M
        # perfect_sample_fraction = 600M / 1 = 600M
        # success_threshold = 600M * 0.75 = 450M
        # 552M >= 450M -> success
        self.assertEqual(yield_class, "table-success")
        self.assertEqual(tooltip_data["type"], "standard")
        self.assertEqual(tooltip_data["success_threshold"], 450_000_000)

    def test_standard_multiple_samples_split_threshold(self):
        """Test standard project with 4 samples splitting the lane allocation."""
        lane_threshold_m = 3000  # NovaSeqXPlus 25B threshold
        num_samples = 4

        # lane_target = 3000M
        # perfect_sample_fraction = 3000M / 4 = 750M
        # success_threshold = 750M * 0.75 = 562.5M
        # threshold_red = 562.5M * 0.01 = 5.625M

        test_cases = [
            (620_000_000, "table-success"),  # 62M >= 562.5M
            (650_000_000, "table-success"),  # 650M >= 562.5M
            (500_000_000, "table-warning"),  # 500M < 562.5M but > 5.625M
            (5_000_000, "table-danger"),  # 5M < 5.625M
        ]

        for sample_yield, expected_class in test_cases:
            yield_class, tooltip_data = calculate_sample_threshold(
                sample_yield=sample_yield,
                num_samples_in_project=num_samples,
                threshold=lane_threshold_m,
                units_ordered=5,
                lane_capacity_units=5,
                is_universal=False,
            )
            self.assertEqual(yield_class, expected_class)
            self.assertEqual(tooltip_data["success_threshold"], 562_500_000)


    def test_standard_novaseq_xplus_multiple_projects(self):
        """Test NovaSeqXPlus lane with samples from different projects."""
        lane_threshold_m = 1200  # NovaSeqXPlus 10B

        # Project A: 3 samples
        num_samples_proj_a = 3
        yield_class_a, tooltip_data_a = calculate_sample_threshold(
            sample_yield=280_000_000,
            num_samples_in_project=num_samples_proj_a,
            threshold=lane_threshold_m,
            units_ordered=2,
            lane_capacity_units=2,
            is_universal=False,
        )
        # lane_target = 1200M
        # perfect_sample_fraction = 1200M / 3 = 400M
        # success_threshold = 400M * 0.75 = 300M
        self.assertEqual(tooltip_data_a["success_threshold"], 300_000_000)
        self.assertEqual(yield_class_a, "table-warning")  # 280M < 300M but > 3M

        # Project B: 2 samples
        num_samples_proj_b = 2
        yield_class_b, tooltip_data_b = calculate_sample_threshold(
            sample_yield=420_000_000,
            num_samples_in_project=num_samples_proj_b,
            threshold=lane_threshold_m,
            units_ordered=2,
            lane_capacity_units=2,
            is_universal=False,
        )
        # lane_target = 1200M
        # perfect_sample_fraction = 1200M / 2 = 600M
        # success_threshold = 600M * 0.75 = 450M
        self.assertEqual(tooltip_data_b["success_threshold"], 450_000_000)
        self.assertEqual(yield_class_b, "table-warning")  # 420M < 450M but > 4.5M

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

        # 105M >= 101.25M -> success
        self.assertEqual(tooltip_data["success_threshold"], 101_250_000)
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

        # 85M >= 81M -> success
        self.assertEqual(tooltip_data["success_threshold"], 81_000_000)
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
        self.assertIn("Required project lane yield", tooltip)
        self.assertIn("Success threshold", tooltip)
        self.assertIn("Red flag threshold", tooltip)

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
        self.assertIn("Success threshold", tooltip)
        self.assertIn("Red flag threshold", tooltip)


if __name__ == "__main__":
    unittest.main()
