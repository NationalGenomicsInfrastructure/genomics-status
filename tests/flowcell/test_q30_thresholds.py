#!/usr/bin/env python
"""
Test cases for Q30 threshold calculations.

Tests the get_q30_threshold function to ensure thresholds are calculated correctly
based on platform and read length.
"""

import os
import sys
import unittest

# Add parent directory to path to import status module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from status.flowcell import get_q30_threshold


class TestQ30Thresholds(unittest.TestCase):
    """Test Q30 threshold calculation logic."""

    def test_miseq_thresholds(self):
        """Test MiSeq Q30 thresholds."""
        # 2 x 50 bp (or below) = 80%
        self.assertEqual(get_q30_threshold("MiSeq Version3", 50), 80.0)
        self.assertEqual(get_q30_threshold("MiSeq Version3", 25), 80.0)

        # 2 x 100 bp = 75%
        self.assertEqual(get_q30_threshold("MiSeq Version3", 100), 75.0)

        # 2 x 150 bp = 70%
        self.assertEqual(get_q30_threshold("MiSeq Version3", 150), 70.0)

        # 2 x 250 bp (or above) = 60%
        self.assertEqual(get_q30_threshold("MiSeq Version3", 250), 60.0)
        self.assertEqual(get_q30_threshold("MiSeq Version3", 300), 60.0)

    def test_nextseq_thresholds(self):
        """Test NextSeq Q30 thresholds."""
        # 2 x 50 bp (or below) = 80%
        self.assertEqual(get_q30_threshold("NextSeq High", 50), 80.0)
        self.assertEqual(get_q30_threshold("NextSeq High", 25), 80.0)

        # 2 x 100 bp = 80%
        self.assertEqual(get_q30_threshold("NextSeq High", 100), 80.0)

        # 2 x 150 bp = 75%
        self.assertEqual(get_q30_threshold("NextSeq High", 150), 75.0)

        # 2 x 250 bp (or above) = 75%
        self.assertEqual(get_q30_threshold("NextSeq High", 250), 75.0)
        self.assertEqual(get_q30_threshold("NextSeq High", 300), 75.0)

    def test_nextseq_2000_thresholds(self):
        """Test NextSeq 2000 Q30 thresholds."""
        # 2 x 50 bp (or below) = 80%
        self.assertEqual(get_q30_threshold("NextSeq 2000 P3", 50), 80.0)

        # 2 x 100 bp = 80%
        self.assertEqual(get_q30_threshold("NextSeq 2000 P3", 100), 80.0)

        # 2 x 150 bp = 75%
        self.assertEqual(get_q30_threshold("NextSeq 2000 P3", 150), 75.0)

        # 2 x 250 bp (or above) = 75%
        self.assertEqual(get_q30_threshold("NextSeq 2000 P3", 250), 75.0)

    def test_novaseqxplus_thresholds(self):
        """Test NovaSeqXPlus Q30 thresholds."""
        # 2 x 50 bp (or below) = 85%
        self.assertEqual(get_q30_threshold("NovaSeqXPlus 10B", 50), 85.0)
        self.assertEqual(get_q30_threshold("NovaSeqXPlus 10B", 25), 85.0)

        # 2 x 100 bp = 80%
        self.assertEqual(get_q30_threshold("NovaSeqXPlus 10B", 100), 80.0)

        # 2 x 150 bp = 75%
        self.assertEqual(get_q30_threshold("NovaSeqXPlus 10B", 150), 75.0)

        # 2 x 250 bp (or above) = 75%
        self.assertEqual(get_q30_threshold("NovaSeqXPlus 10B", 250), 75.0)
        self.assertEqual(get_q30_threshold("NovaSeqXPlus 10B", 300), 75.0)

    def test_novaseq_non_xplus_thresholds(self):
        """Test NovaSeq (non-XPlus) Q30 thresholds (should match NextSeq)."""
        # 2 x 50 bp (or below) = 80%
        self.assertEqual(get_q30_threshold("NovaSeq S4", 50), 80.0)

        # 2 x 100 bp = 80%
        self.assertEqual(get_q30_threshold("NovaSeq S4", 100), 80.0)

        # 2 x 150 bp = 75%
        self.assertEqual(get_q30_threshold("NovaSeq S4", 150), 75.0)

        # 2 x 250 bp (or above) = 75%
        self.assertEqual(get_q30_threshold("NovaSeq S4", 250), 75.0)

    def test_hiseq_x_threshold(self):
        """Test HiSeq X Q30 threshold (always 75%)."""
        self.assertEqual(get_q30_threshold("HiSeq X", 50), 75.0)
        self.assertEqual(get_q30_threshold("HiSeq X", 100), 75.0)
        self.assertEqual(get_q30_threshold("HiSeq X", 150), 75.0)
        self.assertEqual(get_q30_threshold("HiSeq X", 250), 75.0)

    def test_invalid_read_length(self):
        """Test with invalid read length values."""
        # Should handle None, empty string, non-numeric gracefully
        self.assertEqual(get_q30_threshold("MiSeq Version3", None), 80.0)
        self.assertEqual(get_q30_threshold("MiSeq Version3", ""), 80.0)
        self.assertEqual(get_q30_threshold("MiSeq Version3", "invalid"), 80.0)


if __name__ == "__main__":
    unittest.main()
