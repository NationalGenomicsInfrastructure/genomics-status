#!/usr/bin/env python
"""Handler for managing demux configuration versions in CouchDB."""

import json
import logging

from status.util import SafeHandler


class DemuxConfigurationHandler(SafeHandler):
    """Handler for viewing demux configuration metadata and versions."""

    def get(self):
        """Get current configuration info and list of all versions."""
        try:
            database_name = "demux_configuration"

            # Get all configuration documents using view
            result = self.application.cloudant.post_view(
                db=database_name,
                ddoc="config_views",
                view="all_versions",
                include_docs=False,
            ).get_result()

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
                "id": getattr(
                    self.application, "sample_classification_config_id", None
                ),
            }

            response = {
                "current_loaded": current_loaded,
                "active_in_database": active_version,
                "all_versions": versions,
            }

            self.set_status(200)
            self.write(json.dumps(response, indent=2))

        except Exception as e:
            logging.error(f"Error fetching configuration versions: {e}")
            self.set_status(500)
            self.write(json.dumps({"error": str(e)}))


class DemuxConfigurationDetailHandler(SafeHandler):
    """Handler for viewing a specific configuration version."""

    def get(self, config_id):
        """Get a specific configuration version by ID."""
        try:
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

        except Exception as e:
            logging.error(f"Error fetching configuration {config_id}: {e}")
            self.set_status(500)
            self.write(json.dumps({"error": str(e)}))
