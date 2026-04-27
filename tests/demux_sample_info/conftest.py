"""
Pytest configuration for demux_sample_info tests.

This module provides fixtures specific to demux_sample_info testing,
including CouchDB configuration fetching for sample classification.
"""

from pathlib import Path
from unittest.mock import MagicMock

import yaml
from ibmcloudant import CouchDbSessionAuthenticator, cloudant_v1

_SETTINGS_FILE = (
    Path(__file__).parent.parent.parent / "run_dir" / "settings" / "settings_dev.yaml"
)

_config_cache = None
_doc_cache = None


def get_classification_config():
    """Fetch the latest active sample classification config from CouchDB.

    Result is cached in memory for the duration of the test run.

    Returns:
        dict: The active sample classification configuration from CouchDB.
    """
    global _config_cache, _doc_cache
    if _config_cache is not None:
        return _config_cache

    with open(_SETTINGS_FILE) as f:
        settings = yaml.safe_load(f)

    cloudant = cloudant_v1.CloudantV1(
        authenticator=CouchDbSessionAuthenticator(
            settings["couch_username"], settings["couch_password"]
        )
    )
    cloudant.set_service_url(settings["couch_url"])

    result = cloudant.post_view(
        db="demux_configuration",
        ddoc="summary",
        view="active_created_at",
        descending=True,
        limit=1,
        include_docs=True,
    ).get_result()

    doc = result["rows"][0]["doc"]
    _config_cache = doc["configuration"]
    _doc_cache = doc
    return _config_cache


def get_classification_config_doc():
    """Fetch the full active demux configuration document from CouchDB.

    Result is cached in memory for the duration of the test run.

    Returns:
        dict: The full CouchDB document including _id, version, configuration, etc.
    """
    global _doc_cache
    if _doc_cache is not None:
        return _doc_cache

    # Trigger fetch if not already cached
    get_classification_config()
    return _doc_cache


def setup_mock_demux_config(mock_cloudant, config=None, version=None, config_id=None):
    """Configure a mock cloudant client to return demux configuration.

    This helper sets up mock responses for the demux_configuration database view
    that is queried by load_active_demux_config() in demux_sample_info.py.

    Args:
        mock_cloudant: Mock cloudant client object (e.g., MagicMock())
        config: Optional config dict to return. If None, fetches from CouchDB.
        version: Optional version string. If None, uses "test_version"
        config_id: Optional document ID. If None, uses "test_config_id"

    Returns:
        tuple: (config_dict, version_string, config_id) that will be returned by mocks
    """
    # Use real config from CouchDB if not provided
    if config is None:
        doc = get_classification_config_doc()
        config = doc["configuration"]
        version = version or doc.get("version", "test_version")
        config_id = config_id or doc.get("_id", "test_config_id")
    else:
        version = version or "test_version"
        config_id = config_id or "test_config_id"

    # Mock the post_view call for active_created_at view
    # This is what load_active_demux_config() calls
    mock_result = MagicMock()
    mock_result.get_result.return_value = {
        "rows": [
            {
                "id": config_id,
                "key": [True, "2024-01-01T00:00:00.000Z"],
                "value": version,
                "doc": {
                    "_id": config_id,
                    "_rev": "1-test",
                    "version": version,
                    "active": True,
                    "created_at": "2024-01-01T00:00:00.000Z",
                    "created_by": "test@example.com",
                    "comment": "Test configuration",
                    "configuration": config,
                },
            }
        ]
    }

    # Configure mock to return this result when querying demux_configuration
    def mock_post_view(db, ddoc, view, **kwargs):
        if db == "demux_configuration" and view == "active_created_at":
            return mock_result
        # Return empty result for other views
        empty_result = MagicMock()
        empty_result.get_result.return_value = {"rows": []}
        return empty_result

    mock_cloudant.post_view.side_effect = mock_post_view

    return config, version, config_id
