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
            # Query the view to find the document ID by flowcell_id
            view_result = self.application.cloudant.post_view(
                db="demux_sample_info",
                ddoc="info",
                view="flowcell_id",
                key=flowcell_id,
            ).get_result()

            rows = view_result.get("rows", [])

            if not rows:
                self.set_status(404)
                self.write(
                    json.dumps(
                        {
                            "error": f"No demux sample info found for flowcell {flowcell_id}"
                        }
                    )
                )
                return

            # Get the document ID from the view result
            doc_id = rows[0]["id"]
            
            # Fetch the actual document using the ID
            document = self.application.cloudant.get_document(
                db="demux_sample_info", doc_id=doc_id
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

    def _validate_post_data(self, post_data):
        """Validate the structure and required fields of POST data.

        Returns:
            tuple: (is_valid, error_message, metadata, uploaded_lims_info)
        """
        # Validate required top-level fields
        if "metadata" not in post_data or "uploaded_lims_info" not in post_data:
            return (
                False,
                "Missing required fields: 'metadata' and 'uploaded_lims_info' are required",
                None,
                None,
            )

        metadata = post_data["metadata"]
        uploaded_lims_info = post_data["uploaded_lims_info"]

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
            return (
                False,
                f"Missing required metadata fields: {', '.join(missing_fields)}",
                None,
                None,
            )

        # Validate uploaded_lims_info is a list
        if not isinstance(uploaded_lims_info, list):
            return (
                False,
                "'uploaded_lims_info' must be an array of sample objects",
                None,
                None,
            )

        # Validate each sample has required fields
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
        for i, sample in enumerate(uploaded_lims_info):
            missing_sample_fields = [
                field for field in required_sample_fields if field not in sample
            ]
            if missing_sample_fields:
                return (
                    False,
                    f"Sample at index {i} missing required fields: {', '.join(missing_sample_fields)}",
                    None,
                    None,
                )

        return (True, None, metadata, uploaded_lims_info)

    def _classify_sample_type(self, sample_in_lane):
        """Classify sample type based on sample properties.

        Args:
            sample_in_lane: Sample object from uploaded_lims_info

        Returns:
            str: Sample type classification ('standard', 'control', 'pool', 'unknown')
        """
        # Check if it's marked as a control
        if sample_in_lane.get("control", "").lower() in ["true", "yes", "y"]:
            return "control"

        # Check sample name patterns for pooled samples
        sample_name = sample_in_lane.get("sample_name", "").lower()
        if "pool" in sample_name or "pooled" in sample_name:
            return "pool"

        # Check for specific naming conventions that indicate controls
        control_patterns = ["phix", "control", "blank", "negative"]
        if any(pattern in sample_name for pattern in control_patterns):
            return "control"

        # Check sample reference for standard genomes
        sample_ref = sample_in_lane.get("sample_ref", "").lower()
        if sample_ref and sample_ref not in ["", "none", "n/a", "na"]:
            return "standard"

        # Default to standard if no special indicators found
        return "standard" if sample_name else "unknown"

    def _group_samples_by_lane(self, uploaded_lims_info):
        """Group samples by lane number.

        Args:
            uploaded_lims_info: List of sample objects

        Returns:
            dict: Dictionary mapping lane numbers (str) to lists of samples
        """
        lanes_with_samples = {}
        for sample in uploaded_lims_info:
            lane = str(sample["lane"])
            if lane not in lanes_with_samples:
                lanes_with_samples[lane] = []
            lanes_with_samples[lane].append(sample)
        return lanes_with_samples

    def _create_calculated_lanes(self, lanes_with_samples, timestamp):
        """Create the calculated lanes structure with sample rows.

        Args:
            lanes_with_samples: Dictionary mapping lane numbers to sample lists
            timestamp: ISO format timestamp string

        Returns:
            dict: Calculated lanes structure with UUID-keyed sample rows
        """
        calculated_lanes = {}

        for lane, samples_in_lane in lanes_with_samples.items():
            calculated_lanes[lane] = {"sample_rows": {}}

            for sample_in_lane in samples_in_lane:
                sample_uuid = str(uuid.uuid4())

                # Classify the sample type
                sample_type = self._classify_sample_type(sample_in_lane)

                calculated_lanes[lane]["sample_rows"][sample_uuid] = {
                    "sample_id": sample_in_lane["sample_id"],
                    "last_modified": timestamp,
                    "sample_type": sample_type,
                    "settings": {
                        timestamp: {
                            "control": sample_in_lane["control"],
                            "description": sample_in_lane["description"],
                            "flowcell_id": sample_in_lane["flowcell_id"],
                            "index_1": sample_in_lane["index_1"],
                            "index_2": sample_in_lane["index_2"],
                            "lane": sample_in_lane["lane"],
                            "mask_short_reads": 0,
                            "minimum_trimmed_read_length": 0,
                            "named_index": sample_in_lane["index_1"],
                            "operator": sample_in_lane["operator"],
                            "override_cycles": "",
                            "recipe": sample_in_lane["recipe"],
                            "sample_name": sample_in_lane["sample_name"],
                            "sample_project": sample_in_lane["sample_project"],
                            "sample_ref": sample_in_lane["sample_ref"],
                            "sample_type": sample_type,
                        }
                    },
                }

        return calculated_lanes

    def _create_document(self, flowcell_id, metadata, uploaded_lims_info, timestamp):
        """Create the complete demux sample info document structure.

        Args:
            flowcell_id: Flowcell identifier
            metadata: Metadata dictionary
            uploaded_lims_info: List of sample objects
            timestamp: ISO format timestamp string

        Returns:
            dict: Complete document structure ready for database
        """
        # Group samples by lane
        lanes_with_samples = self._group_samples_by_lane(uploaded_lims_info)

        # Create calculated lanes structure
        calculated_lanes = self._create_calculated_lanes(lanes_with_samples, timestamp)

        # Construct the full document
        document = {
            "flowcell_id": flowcell_id,
            "metadata": metadata,
            "uploaded_lims_info": uploaded_lims_info,
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

        return document

    def post(self, flowcell_id):
        """Accept POST request with metadata and uploaded_lims_info to create/update demux sample info document."""
        try:
            # Parse the request body
            post_data = tornado.escape.json_decode(self.request.body)

            # Validate input data
            is_valid, error_message, metadata, uploaded_lims_info = (
                self._validate_post_data(post_data)
            )
            if not is_valid:
                self.set_status(400)
                self.write(json.dumps({"error": error_message}))
                return

            # Create timestamp for this operation
            timestamp = datetime.datetime.now().isoformat(timespec="milliseconds")

            # Build the complete document
            document = self._create_document(
                flowcell_id, metadata, uploaded_lims_info, timestamp
            )

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
