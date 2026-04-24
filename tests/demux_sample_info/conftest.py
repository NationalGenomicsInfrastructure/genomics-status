"""
Pytest configuration for demux_sample_info tests.

This module provides fixtures specific to demux_sample_info testing,
including CouchDB configuration fetching for sample classification.
"""

from pathlib import Path

import yaml
from ibmcloudant import CouchDbSessionAuthenticator, cloudant_v1

_SETTINGS_FILE = (
    Path(__file__).parent.parent.parent / "run_dir" / "settings" / "settings_dev.yaml"
)

_config_cache = None


def get_classification_config():
    """Fetch the latest active sample classification config from CouchDB.

    Result is cached in memory for the duration of the test run.

    Returns:
        dict: The active sample classification configuration from CouchDB.
    """
    global _config_cache
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
    return _config_cache
