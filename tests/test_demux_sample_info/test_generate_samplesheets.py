"""
Unit tests for samplesheet generation function.

Tests the _generate_samplesheets method in DemuxSampleInfoDataHandler including:
- Single lane with one project
- Single lane with multiple projects (same settings)
- Single lane with multiple projects (different settings)
- Multiple lanes with different settings
- Complex BCLConvert_Settings variations
- Edge cases (empty lanes, missing fields)
"""

import unittest
from unittest.mock import MagicMock

from status.demux_sample_info import DemuxSampleInfoDataHandler


class TestGenerateSamplesheets(unittest.TestCase):
    """Test suite for samplesheet generation."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a handler instance with mock application
        self.handler = DemuxSampleInfoDataHandler(MagicMock(), MagicMock())
        self.handler.application = MagicMock()

        # Base timestamp for testing
        self.timestamp = "2024-01-15T10:30:00"

    def test_single_lane_single_project(self):
        """Test basic case with one lane and one project."""
        flowcell_id = "TEST123"
        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "sample1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S1",
                                    "Sample_Name": "Sample_1",
                                    "index": "ATCGATCG",
                                    "index2": "GCTAGCTA",
                                    "Sample_Project": "Project_A",
                                    "OverrideCycles": "Y151;I8;I8;Y151",
                                },
                                "BCLConvert_Settings": {
                                    "SoftwareVersion": "4.0.3",
                                    "FastqCompressionFormat": "gzip",
                                },
                                "other_details": {},
                            }
                        }
                    },
                    "sample2": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S2",
                                    "Sample_Name": "Sample_2",
                                    "index": "CGTAGCTA",
                                    "index2": "ATCGATCG",
                                    "Sample_Project": "Project_A",
                                    "OverrideCycles": "Y151;I8;I8;Y151",
                                },
                                "BCLConvert_Settings": {
                                    "SoftwareVersion": "4.0.3",
                                    "FastqCompressionFormat": "gzip",
                                },
                                "other_details": {},
                            }
                        }
                    },
                }
            }
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should have exactly one samplesheet
        self.assertEqual(len(result), 1)

        samplesheet = result[0]
        self.assertEqual(samplesheet["lane"], "1")
        self.assertEqual(samplesheet["projects"], ["Project_A"])
        self.assertEqual(samplesheet["sample_count"], 2)
        self.assertEqual(samplesheet["settings_index"], 0)
        self.assertEqual(samplesheet["filename"], "Lane1_Project_A_0.csv")

        # Check Header section
        self.assertEqual(samplesheet["Header"]["FileFormatVersion"], "2")
        self.assertEqual(samplesheet["Header"]["RunName"], "TEST123")
        self.assertIn("Date", samplesheet["Header"])

        # Check BCLConvert_Settings
        self.assertEqual(samplesheet["BCLConvert_Settings"]["SoftwareVersion"], "4.0.3")
        self.assertEqual(
            samplesheet["BCLConvert_Settings"]["FastqCompressionFormat"], "gzip"
        )

        # Check BCLConvert_Data
        self.assertEqual(len(samplesheet["BCLConvert_Data"]), 2)
        self.assertEqual(samplesheet["BCLConvert_Data"][0]["Sample_ID"], "S1")
        self.assertEqual(samplesheet["BCLConvert_Data"][1]["Sample_ID"], "S2")

    def test_single_lane_multiple_projects_same_settings(self):
        """Test one lane with multiple projects sharing same BCLConvert settings."""
        flowcell_id = "TEST456"
        calculated_lanes = {
            "2": {
                "sample_rows": {
                    "sample1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "2",
                                    "Sample_ID": "S1",
                                    "Sample_Name": "Sample_1",
                                    "index": "AAAAAAAA",
                                    "index2": "TTTTTTTT",
                                    "Sample_Project": "Project_X",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {
                                    "BarcodeMismatchesIndex1": "1",
                                    "BarcodeMismatchesIndex2": "1",
                                },
                                "other_details": {},
                            }
                        }
                    },
                    "sample2": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "2",
                                    "Sample_ID": "S2",
                                    "Sample_Name": "Sample_2",
                                    "index": "CCCCCCCC",
                                    "index2": "GGGGGGGG",
                                    "Sample_Project": "Project_Y",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {
                                    "BarcodeMismatchesIndex1": "1",
                                    "BarcodeMismatchesIndex2": "1",
                                },
                                "other_details": {},
                            }
                        }
                    },
                }
            }
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should have one samplesheet (same settings)
        self.assertEqual(len(result), 1)

        samplesheet = result[0]
        self.assertEqual(samplesheet["lane"], "2")
        # Projects should be sorted
        self.assertEqual(samplesheet["projects"], ["Project_X", "Project_Y"])
        self.assertEqual(samplesheet["sample_count"], 2)
        self.assertEqual(samplesheet["filename"], "Lane2_Project_X_Project_Y_0.csv")

    def test_single_lane_multiple_projects_different_settings(self):
        """Test one lane with multiple projects having different BCLConvert settings."""
        flowcell_id = "TEST789"
        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "sample1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S1",
                                    "Sample_Name": "Sample_1",
                                    "index": "AAAAAAAA",
                                    "index2": "",
                                    "Sample_Project": "Project_A",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {
                                    "BarcodeMismatchesIndex1": "0",
                                },
                                "other_details": {},
                            }
                        }
                    },
                    "sample2": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S2",
                                    "Sample_Name": "Sample_2",
                                    "index": "CCCCCCCC",
                                    "index2": "",
                                    "Sample_Project": "Project_B",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {
                                    "BarcodeMismatchesIndex1": "1",
                                },
                                "other_details": {},
                            }
                        }
                    },
                }
            }
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should have two samplesheets (different settings)
        self.assertEqual(len(result), 2)

        # Check first samplesheet
        self.assertEqual(result[0]["lane"], "1")
        self.assertEqual(result[0]["sample_count"], 1)
        self.assertEqual(result[0]["settings_index"], 0)

        # Check second samplesheet
        self.assertEqual(result[1]["lane"], "1")
        self.assertEqual(result[1]["sample_count"], 1)
        self.assertEqual(result[1]["settings_index"], 1)

        # Verify settings differ
        self.assertNotEqual(
            result[0]["BCLConvert_Settings"],
            result[1]["BCLConvert_Settings"],
        )

    def test_multiple_lanes(self):
        """Test multiple lanes with different projects and settings."""
        flowcell_id = "MULTITEST"
        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "s1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "L1_S1",
                                    "Sample_Name": "Lane1_Sample1",
                                    "index": "ATCGATCG",
                                    "index2": "",
                                    "Sample_Project": "Lane1_Project",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {"Setting": "Value1"},
                                "other_details": {},
                            }
                        }
                    }
                }
            },
            "2": {
                "sample_rows": {
                    "s2": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "2",
                                    "Sample_ID": "L2_S1",
                                    "Sample_Name": "Lane2_Sample1",
                                    "index": "GCTAGCTA",
                                    "index2": "",
                                    "Sample_Project": "Lane2_Project",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {"Setting": "Value2"},
                                "other_details": {},
                            }
                        }
                    }
                }
            },
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should have two samplesheets (one per lane)
        self.assertEqual(len(result), 2)

        # Verify they're sorted by lane
        self.assertEqual(result[0]["lane"], "1")
        self.assertEqual(result[1]["lane"], "2")

        # Each should have its own project
        self.assertEqual(result[0]["projects"], ["Lane1_Project"])
        self.assertEqual(result[1]["projects"], ["Lane2_Project"])

    def test_override_cycles_from_other_details(self):
        """Test that OverrideCycles is populated from other_details if present."""
        flowcell_id = "OVERRIDE_TEST"
        override_value = "Y151;I8U2;I8U2;Y151"
        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "sample1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S1",
                                    "Sample_Name": "Sample_1",
                                    "index": "ATCGATCG",
                                    "index2": "GCTAGCTA",
                                    "Sample_Project": "Project_UMI",
                                    "OverrideCycles": "ORIGINAL",
                                },
                                "BCLConvert_Settings": {},
                                "other_details": {
                                    "override_cycles": override_value,
                                },
                            }
                        }
                    }
                }
            }
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Check that override_cycles from other_details is used
        self.assertEqual(
            result[0]["BCLConvert_Data"][0]["OverrideCycles"], override_value
        )

    def test_missing_sample_project(self):
        """Test handling of samples without Sample_Project field."""
        flowcell_id = "MISSING_PROJECT"
        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "sample1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S1",
                                    "Sample_Name": "Sample_1",
                                    "index": "ATCGATCG",
                                    "index2": "",
                                    "Sample_Project": "",
                                },
                                "BCLConvert_Settings": {},
                                "other_details": {},
                            }
                        }
                    }
                }
            }
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should handle empty project gracefully
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["BCLConvert_Data"][0]["Sample_Project"], "")

    def test_multiple_settings_versions(self):
        """Test that only the latest settings version is used."""
        flowcell_id = "VERSION_TEST"
        old_timestamp = "2024-01-14T10:00:00"
        new_timestamp = "2024-01-15T15:00:00"

        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "sample1": {
                        "settings": {
                            old_timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S1_OLD",
                                    "Sample_Name": "Sample_1_Old",
                                    "index": "AAAAAAAA",
                                    "index2": "",
                                    "Sample_Project": "Old_Project",
                                },
                                "BCLConvert_Settings": {"Version": "Old"},
                                "other_details": {},
                            },
                            new_timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S1_NEW",
                                    "Sample_Name": "Sample_1_New",
                                    "index": "TTTTTTTT",
                                    "index2": "",
                                    "Sample_Project": "New_Project",
                                },
                                "BCLConvert_Settings": {"Version": "New"},
                                "other_details": {},
                            },
                        }
                    }
                }
            }
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should use the newer version
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["BCLConvert_Data"][0]["Sample_ID"], "S1_NEW")
        self.assertEqual(result[0]["BCLConvert_Settings"]["Version"], "New")

    def test_empty_lanes(self):
        """Test handling of empty calculated_lanes."""
        flowcell_id = "EMPTY_TEST"
        calculated_lanes = {}
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should return empty list
        self.assertEqual(len(result), 0)

    def test_sample_without_settings(self):
        """Test handling of samples with empty settings."""
        flowcell_id = "NO_SETTINGS"
        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "sample1": {"settings": {}},
                    "sample2": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S2",
                                    "Sample_Name": "Sample_2",
                                    "index": "ATCGATCG",
                                    "index2": "",
                                    "Sample_Project": "Project_A",
                                },
                                "BCLConvert_Settings": {},
                                "other_details": {},
                            }
                        }
                    },
                }
            }
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should skip sample without settings, include sample2
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["sample_count"], 1)
        self.assertEqual(result[0]["BCLConvert_Data"][0]["Sample_ID"], "S2")

    def test_complex_bcl_settings_grouping(self):
        """Test that samples with identical complex settings are grouped correctly."""
        flowcell_id = "COMPLEX_SETTINGS"
        settings_a = {
            "SoftwareVersion": "4.0.3",
            "FastqCompressionFormat": "gzip",
            "BarcodeMismatchesIndex1": "1",
            "BarcodeMismatchesIndex2": "1",
            "MinimumTrimmedReadLength": "35",
        }
        settings_b = {
            "SoftwareVersion": "4.0.3",
            "FastqCompressionFormat": "gzip",
            "BarcodeMismatchesIndex1": "1",
            "BarcodeMismatchesIndex2": "1",
            "MinimumTrimmedReadLength": "50",  # Different value
        }

        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "s1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S1",
                                    "Sample_Name": "Sample_1",
                                    "index": "AAAAAAAA",
                                    "index2": "",
                                    "Sample_Project": "Project_A",
                                },
                                "BCLConvert_Settings": settings_a,
                                "other_details": {},
                            }
                        }
                    },
                    "s2": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S2",
                                    "Sample_Name": "Sample_2",
                                    "index": "CCCCCCCC",
                                    "index2": "",
                                    "Sample_Project": "Project_B",
                                },
                                "BCLConvert_Settings": settings_a,  # Same as s1
                                "other_details": {},
                            }
                        }
                    },
                    "s3": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "S3",
                                    "Sample_Name": "Sample_3",
                                    "index": "GGGGGGGG",
                                    "index2": "",
                                    "Sample_Project": "Project_C",
                                },
                                "BCLConvert_Settings": settings_b,  # Different
                                "other_details": {},
                            }
                        }
                    },
                }
            }
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should have two samplesheets
        self.assertEqual(len(result), 2)

        # One with 2 samples (s1, s2), one with 1 sample (s3)
        sample_counts = sorted([ss["sample_count"] for ss in result])
        self.assertEqual(sample_counts, [1, 2])

        # Verify the 2-sample sheet has both projects
        two_sample_sheet = next(ss for ss in result if ss["sample_count"] == 2)
        self.assertIn("Project_A", two_sample_sheet["projects"])
        self.assertIn("Project_B", two_sample_sheet["projects"])

        # Verify the 1-sample sheet has Project_C
        one_sample_sheet = next(ss for ss in result if ss["sample_count"] == 1)
        self.assertEqual(one_sample_sheet["projects"], ["Project_C"])

    def test_sorting_by_lane_and_index(self):
        """Test that samplesheets are sorted by lane number and settings index."""
        flowcell_id = "SORT_TEST"
        calculated_lanes = {
            "3": {
                "sample_rows": {
                    "s1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "3",
                                    "Sample_ID": "L3_S1",
                                    "index": "AAAA",
                                    "index2": "",
                                    "Sample_Project": "L3_P1",
                                },
                                "BCLConvert_Settings": {"Setting": "A"},
                                "other_details": {},
                            }
                        }
                    },
                    "s2": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "3",
                                    "Sample_ID": "L3_S2",
                                    "index": "TTTT",
                                    "index2": "",
                                    "Sample_Project": "L3_P2",
                                },
                                "BCLConvert_Settings": {"Setting": "B"},
                                "other_details": {},
                            }
                        }
                    },
                }
            },
            "1": {
                "sample_rows": {
                    "s3": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "L1_S1",
                                    "index": "CCCC",
                                    "index2": "",
                                    "Sample_Project": "L1_P1",
                                },
                                "BCLConvert_Settings": {},
                                "other_details": {},
                            }
                        }
                    }
                }
            },
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should be sorted: Lane 1 first, then Lane 3 (with 2 settings groups)
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["lane"], "1")
        self.assertEqual(result[1]["lane"], "3")
        self.assertEqual(result[2]["lane"], "3")

        # Lane 3 should have settings_index 0 and 1
        lane3_sheets = [ss for ss in result if ss["lane"] == "3"]
        indices = sorted([ss["settings_index"] for ss in lane3_sheets])
        self.assertEqual(indices, [0, 1])

    def test_project_across_multiple_lanes(self):
        """Test that a project spanning multiple lanes creates separate samplesheets per lane."""
        flowcell_id = "MULTILANE_PROJECT"
        # Same project (Project_ABC) appears on lanes 1, 2, and 3 with same settings
        calculated_lanes = {
            "1": {
                "sample_rows": {
                    "s1_lane1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "Sample1_L1",
                                    "Sample_Name": "Sample_1_Lane1",
                                    "index": "AAAAAAAA",
                                    "index2": "TTTTTTTT",
                                    "Sample_Project": "Project_ABC",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {
                                    "SoftwareVersion": "4.0.3",
                                    "BarcodeMismatchesIndex1": "1",
                                },
                                "other_details": {},
                            }
                        }
                    },
                    "s2_lane1": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "1",
                                    "Sample_ID": "Sample2_L1",
                                    "Sample_Name": "Sample_2_Lane1",
                                    "index": "CCCCCCCC",
                                    "index2": "GGGGGGGG",
                                    "Sample_Project": "Project_ABC",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {
                                    "SoftwareVersion": "4.0.3",
                                    "BarcodeMismatchesIndex1": "1",
                                },
                                "other_details": {},
                            }
                        }
                    },
                }
            },
            "2": {
                "sample_rows": {
                    "s1_lane2": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "2",
                                    "Sample_ID": "Sample1_L2",
                                    "Sample_Name": "Sample_1_Lane2",
                                    "index": "AAAAAAAA",
                                    "index2": "TTTTTTTT",
                                    "Sample_Project": "Project_ABC",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {
                                    "SoftwareVersion": "4.0.3",
                                    "BarcodeMismatchesIndex1": "1",
                                },
                                "other_details": {},
                            }
                        }
                    }
                }
            },
            "3": {
                "sample_rows": {
                    "s1_lane3": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "3",
                                    "Sample_ID": "Sample1_L3",
                                    "Sample_Name": "Sample_1_Lane3",
                                    "index": "AAAAAAAA",
                                    "index2": "TTTTTTTT",
                                    "Sample_Project": "Project_ABC",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {
                                    "SoftwareVersion": "4.0.3",
                                    "BarcodeMismatchesIndex1": "1",
                                },
                                "other_details": {},
                            }
                        }
                    },
                    "s2_lane3": {
                        "settings": {
                            self.timestamp: {
                                "per_sample_fields": {
                                    "Lane": "3",
                                    "Sample_ID": "Sample2_L3",
                                    "Sample_Name": "Sample_2_Lane3",
                                    "index": "CCCCCCCC",
                                    "index2": "GGGGGGGG",
                                    "Sample_Project": "Project_ABC",
                                    "OverrideCycles": "",
                                },
                                "BCLConvert_Settings": {
                                    "SoftwareVersion": "4.0.3",
                                    "BarcodeMismatchesIndex1": "1",
                                },
                                "other_details": {},
                            }
                        }
                    },
                }
            },
        }
        metadata = {}

        result = self.handler._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

        # Should have 3 samplesheets - one per lane, even though it's the same project
        self.assertEqual(len(result), 3)

        # Verify each lane has its own samplesheet
        lanes = [ss["lane"] for ss in result]
        self.assertEqual(sorted(lanes), ["1", "2", "3"])

        # All should be for Project_ABC
        for samplesheet in result:
            self.assertEqual(samplesheet["projects"], ["Project_ABC"])

        # Lane 1 should have 2 samples, lanes 2 and 3 should have 1 and 2 samples respectively
        sample_counts_by_lane = {ss["lane"]: ss["sample_count"] for ss in result}
        self.assertEqual(sample_counts_by_lane["1"], 2)
        self.assertEqual(sample_counts_by_lane["2"], 1)
        self.assertEqual(sample_counts_by_lane["3"], 2)

        # Verify filenames are unique per lane
        filenames = [ss["filename"] for ss in result]
        self.assertEqual(len(filenames), len(set(filenames)))  # All unique
        self.assertIn("Lane1_Project_ABC_0.csv", filenames)
        self.assertIn("Lane2_Project_ABC_0.csv", filenames)
        self.assertIn("Lane3_Project_ABC_0.csv", filenames)


if __name__ == "__main__":
    unittest.main()
