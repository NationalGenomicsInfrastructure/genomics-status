"""Handlers for demultiplexing sample info functionality."""

import datetime
import json
import uuid

import tornado.web

from status.util import SafeHandler


class DemuxSampleInfoEditorHandler(SafeHandler):
    """Serves the demux sample info editor page."""

    def get(self):
        t = self.application.loader.load("demux_sample_info_editor.html")
        self.write(
            t.generate(
                user=self.get_current_user(),
                gs_globals=self.application.gs_globals,
            )
        )


class DemuxSampleInfoDataHandler(SafeHandler):
    """Serves demux sample info data via API."""

    def _get_project_id_by_name(self, project_name):
        """Look up project ID (P-number) from project name."""
        if not hasattr(self, "_project_names"):
            self._project_names = {}
        if project_name not in self._project_names:
            view = self.application.cloudant.post_view(
                db="projects",
                ddoc="projects",
                view="name_to_id",
                key=project_name,
            ).get_result()["rows"]
            # should be only one row, if not - will overwrite
            for row in view:
                self._project_names[project_name] = row["value"]
        return self._project_names.get(project_name, "")

    def get(self, flowcell_id):
        """Retrieve demux sample info document for a specific flowcell."""
        self.set_header("Content-type", "application/json")

        try:
            # Fetch the document from the demux_sample_info database
            document = self.application.cloudant.get_document(
                db="demux_sample_info", doc_id=flowcell_id
            ).get_result()

            # Remove CouchDB-specific fields from the response
            if "_id" in document:
                del document["_id"]
            if "_rev" in document:
                del document["_rev"]

            # Return the complete document structure
            self.write(json.dumps(document))

        except Exception as e:
            # Check if it's a 404 (document not found)
            if hasattr(e, "status_code") and e.status_code == 404:
                self.set_status(404)
                self.write(
                    json.dumps(
                        {
                            "error": f"No demux sample info found for flowcell {flowcell_id}"
                        }
                    )
                )
            else:
                self.set_status(500)
                self.write(
                    json.dumps(
                        {"error": f"Error retrieving demux sample info: {str(e)}"}
                    )
                )

    def post(self, flowcell_id):
        """Accept POST request with metadata and uploaded_info to create/update demux sample info document."""
        try:
            # Parse the request body
            post_data = tornado.escape.json_decode(self.request.body)

            # Validate required fields
            if "metadata" not in post_data or "uploaded_info" not in post_data:
                self.set_status(400)
                self.write(
                    json.dumps(
                        {
                            "error": "Missing required fields: 'metadata' and 'uploaded_info' are required"
                        }
                    )
                )
                return

            metadata = post_data["metadata"]
            uploaded_info = post_data["uploaded_info"]

            # Validate metadata fields
            required_metadata_fields = [
                "num_lanes",
                "instrument_id",
                "run_setup",
                "setup_lims_step_id",
            ]
            missing_fields = [
                field for field in required_metadata_fields if field not in metadata
            ]
            if missing_fields:
                self.set_status(400)
                self.write(
                    json.dumps(
                        {
                            "error": f"Missing required metadata fields: {', '.join(missing_fields)}"
                        }
                    )
                )
                return

            # Validate uploaded_info is a list
            if not isinstance(uploaded_info, list):
                self.set_status(400)
                self.write(
                    json.dumps(
                        {"error": "'uploaded_info' must be an array of sample objects"}
                    )
                )
                return

            # Validate each sample in uploaded_info has required fields
            required_sample_fields = [
                "flowcell_id",
                "lane",
                "sample_id",
                "sample_name",
                "sample_ref",
                "index_1",
                "index_2",
                "description",
                "control",
                "recipe",
                "operator",
                "sample_project",
            ]
            for i, sample in enumerate(uploaded_info):
                missing_sample_fields = [
                    field for field in required_sample_fields if field not in sample
                ]
                if missing_sample_fields:
                    self.set_status(400)
                    self.write(
                        json.dumps(
                            {
                                "error": f"Sample at index {i} missing required fields: {', '.join(missing_sample_fields)}"
                            }
                        )
                    )
                    return

            # Create the document structure
            timestamp = datetime.datetime.now().isoformat(timespec="milliseconds")

            # Generate calculated section with initial settings
            calculated_lanes = {}
            lanes_with_samples = {}

            # Group samples by lane
            for sample in uploaded_info:
                lane = str(sample["lane"])
                if lane not in lanes_with_samples:
                    lanes_with_samples[lane] = []
                lanes_with_samples[lane].append(sample)

            # Create lane structure with UUID-keyed samples
            for lane, samples_in_lane in lanes_with_samples.items():
                calculated_lanes[lane] = {"samples": {}}
                for sample in samples_in_lane:
                    sample_uuid = str(uuid.uuid4())
                    calculated_lanes[lane]["samples"][sample_uuid] = {
                        "sample_id": sample["sample_id"],
                        "last_modified": timestamp,
                        "settings": {
                            timestamp: {
                                "control": sample["control"],
                                "description": sample["description"],
                                "flowcell_id": sample["flowcell_id"],
                                "index_1": sample["index_1"],
                                "index_2": sample["index_2"],
                                "lane": sample["lane"],
                                "mask_short_reads": 0,
                                "minimum_trimmed_read_length": 0,
                                "named_index": sample["index_1"],
                                "operator": sample["operator"],
                                "override_cycles": "",
                                "recipe": sample["recipe"],
                                "sample_name": sample["sample_name"],
                                "sample_project": sample["sample_project"],
                                "sample_ref": sample["sample_ref"],
                            }
                        },
                    }

            # Construct the full document
            document = {
                "flowcell_id": flowcell_id,
                "metadata": metadata,
                "uploaded_info": uploaded_info,
                "calculated": {
                    "version_history": {
                        timestamp: {
                            "generated_by": self.get_current_user().email
                            if self.get_current_user()
                            else None,
                            "autogenerated": True,
                            "comment": "Uploaded from LIMS",
                            "auto_run": True,
                        }
                    },
                    "lanes": calculated_lanes,
                },
            }

            # TODO: Store document in database
            # For now, just return success with the created document

            self.set_status(201)
            self.set_header("Content-type", "application/json")
            self.write(
                json.dumps(
                    {
                        "status": "success",
                        "message": "Demux sample info data received and processed",
                        "flowcell_id": flowcell_id,
                        "timestamp": timestamp,
                        "document": document,
                    }
                )
            )

        except json.JSONDecodeError as e:
            self.set_status(400)
            self.write(json.dumps({"error": f"Invalid JSON in request body: {str(e)}"}))
        except Exception as e:
            self.set_status(500)
            self.write(json.dumps({"error": f"Internal server error: {str(e)}"}))
