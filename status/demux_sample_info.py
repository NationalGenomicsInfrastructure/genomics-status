"""Handlers for demultiplexing sample info functionality."""

import datetime
import json
import os
import re
import uuid

import tornado.web

from status.util import SafeHandler


def _load_sample_classification_patterns():
    """Load sample classification patterns from JSON configuration file."""
    config_path = os.path.join(
        os.path.dirname(__file__), "sample_classification_patterns.json"
    )
    with open(config_path, "r") as f:
        config = json.load(f)

    # Compile regex patterns
    patterns = {}
    for key, pattern_config in config["patterns"].items():
        patterns[key] = {"config": pattern_config}
        if "regex" in pattern_config:
            patterns[key]["pattern"] = re.compile(pattern_config["regex"])

    return patterns, config


# Load patterns from configuration file
SAMPLE_PATTERNS, CLASSIFICATION_CONFIG = _load_sample_classification_patterns()
CONTROL_PATTERNS = CLASSIFICATION_CONFIG.get("control_patterns", [])
SHORT_INDEX_THRESHOLD = CLASSIFICATION_CONFIG.get("short_single_index_threshold", 8)
LIBRARY_METHOD_MAPPING = CLASSIFICATION_CONFIG.get("library_method_mapping", {})


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

    def _get_project_library_method(self, project_name):
        """Look up library construction method for a project.

        Args:
            project_name: Project name (e.g., "P12345")

        Returns:
            str: Library construction method or empty string if not found
        """
        if not hasattr(self, "_project_library_methods"):
            self._project_library_methods = {}

        if project_name not in self._project_library_methods:
            try:
                project_id = self._get_project_id_by_name(project_name)
                if project_id:
                    # Fetch the project document
                    project_doc = self.application.cloudant.get_document(
                        db="projects", doc_id=project_id
                    ).get_result()

                    # Extract library construction method
                    library_method = project_doc.get("details", {}).get(
                        "library_construction_method", ""
                    )
                    self._project_library_methods[project_name] = library_method
                else:
                    self._project_library_methods[project_name] = ""
            except Exception as e:
                # If we can't fetch the project, log and continue
                print(
                    f"Warning: Could not fetch library method for project {project_name}: {e}"
                )
                self._project_library_methods[project_name] = ""

        return self._project_library_methods[project_name]

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

    def _calculate_umi_length_from_config(self, umi_config):
        """Calculate umi_length array [i7, i5] from umi_config structure.

        Args:
            umi_config: Dictionary with keys i7, i5, R1, R2 containing position and length

        Returns:
            list: [i7_umi_length, i5_umi_length]
        """
        i7_length = umi_config.get("i7", {}).get("length", 0)
        i5_length = umi_config.get("i5", {}).get("length", 0)

        # Handle "calculated" marker for dynamic UMI lengths
        if i7_length == "calculated":
            i7_length = 0
        if i5_length == "calculated":
            i5_length = 0

        return [i7_length, i5_length]

    def _classify_sample_type(self, sample_in_lane, library_method=None):
        """Classify sample type based on sample properties using TACA classification logic.

        Args:
            sample_in_lane: Sample object from uploaded_lims_info
            library_method: Optional library construction method from project

        Returns:
            dict: Contains sample_type, index_length, umi_length, umi_config
        """
        # Normalize index fields
        index1 = sample_in_lane.get("index_1", "")
        index2 = sample_in_lane.get("index_2", "")

        # Check for control samples (PhiX, etc.)
        sample_name = sample_in_lane.get("sample_name", "")
        if any(pattern in sample_name.lower() for pattern in CONTROL_PATTERNS):
            umi_config = {
                "i7": {"position": "end", "length": 0},
                "i5": {"position": "start", "length": 0},
                "R1": {"position": "start", "length": 0},
                "R2": {"position": "end", "length": 0},
            }
            return {
                "sample_type": "control",
                "index_length": [len(index1), len(index2)],
                "umi_length": [0, 0],
                "umi_config": umi_config,
            }

        # Check library method mapping first (if available)
        if library_method and library_method in LIBRARY_METHOD_MAPPING:
            mapped_type = LIBRARY_METHOD_MAPPING[library_method]

            # Find the pattern config for this sample type
            for pattern_key, pattern_data in SAMPLE_PATTERNS.items():
                config = pattern_data.get("config", {})
                if config.get("sample_type") == mapped_type:
                    # For IDT_UMI, still need to calculate from indices
                    if mapped_type == "IDT_UMI":
                        i7_umi_length = index1.upper().count("N")
                        i5_umi_length = index2.upper().count("N")
                        umi_config = {
                            "i7": {"position": "end", "length": i7_umi_length},
                            "i5": {"position": "end", "length": i5_umi_length},
                            "R1": {"position": "start", "length": 0},
                            "R2": {"position": "end", "length": 0},
                        }
                        return {
                            "sample_type": config["sample_type"],
                            "index_length": [
                                len(index1.replace("N", "")),
                                len(index2.replace("N", "")),
                            ],
                            "umi_length": [i7_umi_length, i5_umi_length],
                            "umi_config": umi_config,
                        }
                    else:
                        return {
                            "sample_type": config["sample_type"],
                            "index_length": config["index_length"],
                            "umi_length": self._calculate_umi_length_from_config(
                                config["umi_config"]
                            ),
                            "umi_config": config["umi_config"],
                        }

        # Classify by index patterns (order matters - most specific first)

        # 10X single-index sample (e.g., ATAC, Gene Expression)
        if SAMPLE_PATTERNS["tenx_single"]["pattern"].match(index1):
            config = SAMPLE_PATTERNS["tenx_single"]["config"]
            return {
                "sample_type": config["sample_type"],
                "index_length": config["index_length"],
                "umi_length": self._calculate_umi_length_from_config(
                    config["umi_config"]
                ),
                "umi_config": config["umi_config"],
            }

        # 10X dual-index sample (e.g., Spatial Transcriptomics)
        if SAMPLE_PATTERNS["tenx_dual"]["pattern"].match(index1):
            config = SAMPLE_PATTERNS["tenx_dual"]["config"]
            return {
                "sample_type": config["sample_type"],
                "index_length": config["index_length"],
                "umi_length": self._calculate_umi_length_from_config(
                    config["umi_config"]
                ),
                "umi_config": config["umi_config"],
            }

        # IDT UMI sample - indices contain N for UMI positions
        # Calculate actual index length by removing N's, and UMI length by counting N's
        idt_pat = SAMPLE_PATTERNS["idt_umi"]["pattern"]
        if idt_pat.match(index1) or idt_pat.match(index2):
            config = SAMPLE_PATTERNS["idt_umi"]["config"]

            # Calculate UMI lengths from N positions
            i7_umi_length = index1.upper().count("N")
            i5_umi_length = index2.upper().count("N")

            # Build umi_config with calculated values
            umi_config = {
                "i7": {"position": "end", "length": i7_umi_length},
                "i5": {"position": "end", "length": i5_umi_length},
                "R1": {"position": "start", "length": 0},
                "R2": {"position": "end", "length": 0},
            }

            return {
                "sample_type": config["sample_type"],
                "index_length": [
                    len(index1.replace("N", "")),
                    len(index2.replace("N", "")),
                ],
                "umi_length": [i7_umi_length, i5_umi_length],
                "umi_config": umi_config,
            }

        # Smart-seq sample (format: SMARTSEQ-<plate>)
        if SAMPLE_PATTERNS["smartseq"]["pattern"].match(index1):
            config = SAMPLE_PATTERNS["smartseq"]["config"]
            return {
                "sample_type": config["sample_type"],
                "index_length": config["index_length"],
                "umi_length": self._calculate_umi_length_from_config(
                    config["umi_config"]
                ),
                "umi_config": config["umi_config"],
            }

        # No-index sample
        if index1.upper() == "NOINDEX":
            config = SAMPLE_PATTERNS["noindex"]["config"]
            return {
                "sample_type": config["sample_type"],
                "index_length": config["index_length"],
                "umi_length": self._calculate_umi_length_from_config(
                    config["umi_config"]
                ),
                "umi_config": config["umi_config"],
            }

        # Default: ordinary or short single index
        # Short single index: ≤threshold bp and only one index present (i7 or i5, but not both)
        index_length = [len(index1), len(index2)]
        is_short_single = (
            index_length[0] <= SHORT_INDEX_THRESHOLD and index_length[1] == 0
        ) or (index_length[0] == 0 and index_length[1] <= SHORT_INDEX_THRESHOLD)

        umi_config = {
            "i7": {"position": "end", "length": 0},
            "i5": {"position": "start", "length": 0},
            "R1": {"position": "start", "length": 0},
            "R2": {"position": "end", "length": 0},
        }

        return {
            "sample_type": "short_single_index" if is_short_single else "ordinary",
            "index_length": index_length,
            "umi_length": [0, 0],
            "umi_config": umi_config,
        }

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

                # Get library method for the project
                project_name = sample_in_lane.get("sample_project", "")
                library_method = (
                    self._get_project_library_method(project_name)
                    if project_name
                    else None
                )

                # Classify the sample type (returns dict with sample_type, index_length, umi_length, umi_config)
                sample_classification = self._classify_sample_type(
                    sample_in_lane, library_method
                )

                calculated_lanes[lane]["sample_rows"][sample_uuid] = {
                    "sample_id": sample_in_lane["sample_id"],
                    "last_modified": timestamp,
                    "sample_type": sample_classification["sample_type"],
                    "index_length": sample_classification["index_length"],
                    "umi_length": sample_classification["umi_length"],
                    "umi_config": sample_classification["umi_config"],
                    "library_method": library_method or "",
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
                            "sample_type": sample_classification["sample_type"],
                            "index_length": sample_classification["index_length"],
                            "umi_length": sample_classification["umi_length"],
                            "umi_config": sample_classification["umi_config"],
                            "library_method": library_method or "",
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
