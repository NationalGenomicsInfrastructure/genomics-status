"""Tests for the reupload matching logic in _build_reupload_index and _reupload_match_samples."""

import copy
import unittest
from unittest.mock import MagicMock, Mock

import tornado.web

from status.demux_sample_info import DemuxSampleInfoDataHandler

SAMPLE_UUID_A = "aaaa1111-bbbb-cccc-dddd-eeeeeeeeeeee"
SAMPLE_UUID_B = "bbbb2222-cccc-dddd-eeee-ffffffffffff"
SAMPLE_UUID_C = "cccc3333-dddd-eeee-ffff-aaaaaaaaaaaa"
SAMPLE_UUID_D = "dddd4444-eeee-ffff-aaaa-bbbbbbbbbbbb"
DELETED_UUID = "eeee5555-ffff-aaaa-bbbb-cccccccccccc"


def _make_document():
    """Create a minimal sample document for testing _build_reupload_index."""
    return {
        "flowcell_id": "TEST_FC_001",
        "metadata": {},
        "calculated": {
            "lanes": {
                "1": {
                    "sample_rows": {
                        SAMPLE_UUID_A: {
                            "settings": {
                                "2025-01-01T10:00:00.000Z": {
                                    "per_sample_fields": {
                                        "Sample_ID": "Sample_P101",
                                        "Lane": 1,
                                        "index": "AAAA",
                                        "index2": "GGGG",
                                    },
                                },
                            },
                            "deleted": False,
                        },
                        SAMPLE_UUID_B: {
                            "settings": {
                                "2025-01-01T10:00:00.000Z": {
                                    "per_sample_fields": {
                                        "Sample_ID": "Sample_P102",
                                        "Lane": 1,
                                        "index": "CCCC",
                                        "index2": "",
                                    },
                                },
                            },
                            "deleted": False,
                        },
                        SAMPLE_UUID_C: {
                            "settings": {
                                "2025-01-01T10:00:00.000Z": {
                                    "per_sample_fields": {
                                        "Sample_ID": "Sample_P103",
                                        "Lane": 2,
                                        "index": "TTTT",
                                        "index2": "AAAA",
                                    },
                                },
                            },
                            "deleted": False,
                        },
                        DELETED_UUID: {
                            "settings": {
                                "2025-01-01T10:00:00.000Z": {
                                    "per_sample_fields": {
                                        "Sample_ID": "Sample_P104",
                                        "Lane": 1,
                                        "index": "GGGG",
                                        "index2": "CCCC",
                                    },
                                },
                            },
                            "deleted": True,
                            "deleted_at": "2025-01-02T08:00:00.000Z",
                        },
                    },
                },
            },
        },
    }


class TestBuildReuploadIndex(unittest.TestCase):
    """Tests for _build_reupload_index."""

    def _make_handler(self):
        """Create a minimal handler for testing, with Tornado-required args."""
        app = tornado.web.Application([])
        request = Mock()
        handler = DemuxSampleInfoDataHandler(app, request)
        handler._get_sample_classification_config = lambda: None
        return handler

    def test_build_index_includes_deleted(self):
        """Deleted samples are included in the index."""
        handler = self._make_handler()
        document = copy.deepcopy(_make_document())
        index = handler._build_reupload_index(document)
        key = ("1", "P104", "GGGG", "CCCC")
        self.assertIn(key, index)
        self.assertIn(DELETED_UUID, index[key])

    def test_build_index_excludes_no_deleted_filter_yet(self):
        """All non-empty settings samples are indexed, including deleted ones."""
        handler = self._make_handler()
        document = copy.deepcopy(_make_document())
        index = handler._build_reupload_index(document)
        first_uuids = [index[k][0] for k in index]
        self.assertIn(SAMPLE_UUID_A, first_uuids)
        self.assertIn(SAMPLE_UUID_B, first_uuids)
        self.assertIn(SAMPLE_UUID_C, first_uuids)

    def test_build_index_key_structure(self):
        """Index keys are tuples of (lane, sample_id, index, index2)."""
        handler = self._make_handler()
        document = copy.deepcopy(_make_document())
        index = handler._build_reupload_index(document)
        for key in index.keys():
            self.assertIsInstance(key, tuple)
            self.assertEqual(len(key), 4)


class TestReuploadMatchSamples(unittest.TestCase):
    """Tests for _reupload_match_samples matching algorithm."""

    def _make_handler(self):
        """Create a minimal handler for testing, with Tornado-required args."""
        app = tornado.web.Application([])
        request = Mock()
        handler = DemuxSampleInfoDataHandler(app, request)
        handler._get_sample_classification_config = lambda: None
        return handler

    def test__exact_match_yields_one_entry(self):
        """A CSV row matching one DB entry is marked as matched."""
        handler = self._make_handler()
        db_index = {
            ("1", "P101", "AAAA", "GGGG"): [SAMPLE_UUID_A],
            ("1", "P102", "CCCC", ""): [SAMPLE_UUID_B],
        }
        csv_samples = [
            {
                "_reupload_key": ("1", "P101", "AAAA", "GGGG"),
            },
        ]
        matched, created, orphaned_uuids = handler._reupload_match_samples(
            csv_samples, db_index
        )
        self.assertIn(SAMPLE_UUID_A, matched)
        self.assertNotIn(SAMPLE_UUID_A, orphaned_uuids)
        self.assertEqual(len(created), 0)
        # SAMPLE_UUID_B is orphaned because nothing in CSV matches it
        self.assertIn(SAMPLE_UUID_B, orphaned_uuids)
        self.assertEqual(len(orphaned_uuids), 1)

    def test__no_match_creates_new(self):
        """A CSV row not matching any DB entry goes to created."""
        handler = self._make_handler()
        db_index = {
            ("1", "P101", "XXXX", "YYYY"): [SAMPLE_UUID_A],
        }
        csv_samples = [
            {
                "_reupload_key": ("1", "P999", "ZZZZ", "WWWWW"),  # no match
            },
        ]
        matched, created, orphaned_uuids = handler._reupload_match_samples(
            csv_samples, db_index
        )
        self.assertEqual(matched, {})
        self.assertEqual(len(created), 1)
        # DB entry becomes orphaned (nothing matched it)
        self.assertIn(SAMPLE_UUID_A, orphaned_uuids)

    def test__ambiguous_match_no_match_for_csv(self):
        """Multiple DB entries sharing the same key means no CSV match."""
        handler = self._make_handler()
        db_index = {
            ("1", "P101", "AAAA", "GGGG"): [SAMPLE_UUID_A, SAMPLE_UUID_B],
        }
        csv_samples = [
            {
                "_reupload_key": ("1", "P101", "AAAA", "GGGG"),
            },
        ]
        matched, created, orphaned_uuids = handler._reupload_match_samples(
            csv_samples, db_index
        )
        self.assertEqual(matched, {})  # ambiguous
        self.assertEqual(len(created), 1)  # created as new sample
        # Both UUIDs become orphans
        self.assertIn(SAMPLE_UUID_A, orphaned_uuids)
        self.assertIn(SAMPLE_UUID_B, orphaned_uuids)

    def test__multiple_csv_rows_match_multiple_uuids(self):
        """Multiple CSV rows matching distinct UUIDs works correctly."""
        handler = self._make_handler()
        db_index = {
            ("1", "P101", "AAAA", "GGGG"): [SAMPLE_UUID_A],
            ("2", "P103", "TTTT", "AAAA"): [SAMPLE_UUID_C],
            ("1", "P102", "CCCC", ""): [SAMPLE_UUID_B],
        }
        csv_samples = [
            {"_reupload_key": ("2", "P103", "TTTT", "AAAA")},
            {"_reupload_key": ("1", "P101", "AAAA", "GGGG")},
        ]
        matched, created, orphaned_uuids = handler._reupload_match_samples(
            csv_samples, db_index
        )
        self.assertIn(SAMPLE_UUID_A, matched)
        self.assertIn(SAMPLE_UUID_C, matched)
        self.assertIn(SAMPLE_UUID_B, orphaned_uuids)  # unmatched DB entry

    def test__empty_csv_creates_orphans(self):
        """An empty CSV marks all DB entries as orphaned."""
        handler = self._make_handler()
        db_index = {
            ("1", "P101", "AAAA", "GGGG"): [SAMPLE_UUID_A],
        }
        matched, created, orphaned_uuids = handler._reupload_match_samples([], db_index)
        self.assertEqual(matched, {})
        self.assertEqual(created, [])
        self.assertIn(SAMPLE_UUID_A, orphaned_uuids)

    def test__duplicate_uuids_in_db_only_are_all_orphaned(self):
        """When DB has duplicates, all are orphaned if nothing matches."""
        handler = self._make_handler()
        db_index = {
            ("1", "P101", "AAAA", "GGGG"): [
                SAMPLE_UUID_A,
                SAMPLE_UUID_B,
                SAMPLE_UUID_C,
            ],
        }
        csv_samples = [
            {"_reupload_key": ("1", "P999", "XXXX", "YYYY")},  # no match
        ]
        matched, created, orphaned_uuids = handler._reupload_match_samples(
            csv_samples, db_index
        )
        self.assertIn(SAMPLE_UUID_A, orphaned_uuids)
        self.assertIn(SAMPLE_UUID_B, orphaned_uuids)
        self.assertIn(SAMPLE_UUID_C, orphaned_uuids)

    def test__csv_row_consumes_db_entry(self):
        """Once a key is matched, it is consumed and not returned again."""
        handler = self._make_handler()
        db_index = {
            ("1", "P101", "XXXX", "YYYY"): [SAMPLE_UUID_A],
        }
        csv_samples = [
            {"_reupload_key": ("1", "P101", "XXXX", "YYYY")},
        ]
        matched, created, orphaned_uuids = handler._reupload_match_samples(
            csv_samples, db_index
        )
        self.assertEqual(len(orphaned_uuids), 0)  # nothing left to orphan
        self.assertIs(matched[SAMPLE_UUID_A], csv_samples[0])


if __name__ == "__main__":
    unittest.main()
