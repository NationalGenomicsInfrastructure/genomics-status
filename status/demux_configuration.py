#!/usr/bin/env python
"""Handler for managing demux configuration versions in CouchDB."""

import json

from status.util import SafeHandler


class DemuxConfigurationHandler(SafeHandler):
    """Handler for viewing demux configuration metadata and versions."""

    def get(self):
        """Get current configuration info and list of all versions.

        Query Parameters:
            active (str): If 'true', returns only the active configuration document
        """
        database_name = "demux_configuration"

        # Check if user wants just the active configuration
        get_active_only = self.get_argument("active", "false").lower() == "true"

        # Returns all configs sorted by [active, created_at] descending
        # Active configs (true) come first, then inactive (false)
        result = self.application.cloudant.post_view(
            db=database_name,
            ddoc="summary",
            view="active_created_at",
            descending=True,
            include_docs=get_active_only,  # Include docs only if requesting active config
        ).get_result()

        if get_active_only:
            # Return just the active configuration document
            if result.get("rows") and len(result["rows"]) > 0:
                doc = result["rows"][0]["doc"]

                if not doc.get("active", False):
                    self.set_status(404)
                    self.write(json.dumps({"error": "No active configuration found"}))
                    return

                # Return the configuration section (same format as SampleClassificationConfigHandler)
                config = doc.get("configuration", {})
                self.set_status(200)
                self.write(json.dumps(config, indent=2))
                return
            else:
                self.set_status(404)
                self.write(json.dumps({"error": "No active configuration found"}))
                return

        # Original behavior: return summary of all versions
        versions = []
        active_version = None

        for row in result.get("rows", []):
            version_info = {
                "id": row["value"]["id"],
                "version": row["value"]["version"],
                "created_at": row["value"].get("created_at"),
                "created_by": row["value"].get("created_by"),
                "comment": row["value"].get("comment"),
                "active": row["value"].get("active", False),
            }

            versions.append(version_info)

            if row["value"].get("active"):
                active_version = version_info

        # Get current loaded version from application
        current_loaded = {
            "version": getattr(
                self.application, "sample_classification_config_version", "unknown"
            ),
            "id": getattr(self.application, "sample_classification_config_id", None),
        }

        response = {
            "current_loaded": current_loaded,
            "active_in_database": active_version,
            "all_versions": versions,
        }

        self.set_status(200)
        self.write(json.dumps(response, indent=2))


class DemuxConfigurationDetailHandler(SafeHandler):
    """Handler for viewing a specific configuration version."""

    def get(self, config_id):
        """Get a specific configuration version by ID."""
        database_name = "demux_configuration"

        # Get the specific document
        doc = self.application.cloudant.get_document(
            db=database_name, doc_id=config_id
        ).get_result()

        if not doc:
            self.set_status(404)
            self.write(json.dumps({"error": "Configuration version not found"}))
            return

        # Return full document including configuration
        self.set_status(200)
        self.write(json.dumps(doc, indent=2))
