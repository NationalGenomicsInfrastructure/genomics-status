"""Handlers for demultiplexing sample info functionality."""

import datetime
import json
import logging
import re
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
                self._project_names[project_name] = {
                    "doc_id": row["id"],
                    "project_id": row["value"],
                }
        return self._project_names.get(project_name, {}).get(
            "project_id"
        ), self._project_names.get(project_name, {}).get("doc_id")

    def _get_project_library_method(self, project_name):
        """Look up library construction method for a project.

        Args:
            project_name: Project name (e.g., "A.Usersson_23_01")

        Returns:
            str: Library construction method or empty string if not found
        """
        if not hasattr(self, "_project_library_methods"):
            self._project_library_methods = {}

        if project_name not in self._project_library_methods:
            project_id, doc_id = self._get_project_id_by_name(project_name)
            if project_id and doc_id:
                try:
                    # Fetch the project document
                    project_doc = self.application.cloudant.get_document(
                        db="projects", doc_id=doc_id
                    ).get_result()

                    # Extract library construction method
                    library_method = project_doc.get("details", {}).get(
                        "library_construction_method", ""
                    )
                    self._project_library_methods[project_name] = library_method
                except Exception as e:
                    # If we can't fetch the project, log and continue
                    logging.warning(
                        "Could not fetch library method for project %s: %s",
                        project_name,
                        e,
                    )
                    self._project_library_methods[project_name] = ""
            else:
                # Project not found in database
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

    def _get_sample_patterns(self):
        """Get compiled sample patterns with caching."""
        if not hasattr(self, "_compiled_patterns"):
            config = self.application.sample_classification_config
            patterns = {}
            # Load regex-based patterns
            for key, pattern_config in config["patterns"].items():
                patterns[key] = {"config": pattern_config}
                if "regex" in pattern_config:
                    patterns[key]["pattern"] = re.compile(pattern_config["regex"])
            # Load general sample types (no regex)
            for key, pattern_config in config.get(
                "other_general_sample_types", {}
            ).items():
                patterns[key] = {"config": pattern_config}
            self._compiled_patterns = patterns
        return self._compiled_patterns

    def _classify_sample_type(self, sample_in_lane, library_method=None):
        """Classify sample type based on sample properties using TACA classification logic.

        Applies configurations from least specific to most specific, where more specific
        configs override less specific ones.

        Order of application:
        1. Default BCLConvert_Settings
        2. Regex-based patterns (patterns)
        3. Other general sample types (other_general_sample_types)
        4. Library method mapping (library_method_mapping)
        5. Control patterns (highest priority)

        Args:
            sample_in_lane: Sample object from uploaded_lims_info
            library_method: Optional library construction method from project

        Returns:
            dict: Contains sample_type, index_length, umi_config, config_sources, named_indices, BCLConvert_Settings
        """
        # Get configuration from application
        config = self.application.sample_classification_config
        sample_patterns = self._get_sample_patterns()
        control_patterns = config.get("control_patterns", [])
        library_method_mapping = config.get("library_method_mapping", {})

        # Normalize index fields
        index1 = sample_in_lane.get("index_1", "")
        index2 = sample_in_lane.get("index_2", "")
        sample_name = sample_in_lane.get("sample_name", "")

        # Track which configs were applied
        config_sources = []

        # STEP 1: Start with minimal base configuration
        index_length = [len(index1), len(index2)]
        result = {
            "sample_type": None,
            "index_length": index_length,
            "umi_config": None,
            "named_indices": None,
            "BCLConvert_Settings": {},
        }

        # STEP 2: Apply regex-based pattern configurations
        pattern_matched = False

        # Define patterns to check in order
        patterns_to_check = [
            (
                "tenx_single",
                lambda: sample_patterns["tenx_single"]["pattern"].match(index1),
            ),
            (
                "tenx_dual",
                lambda: sample_patterns["tenx_dual"]["pattern"].match(index1),
            ),
            (
                "idt_umi",
                lambda: sample_patterns["idt_umi"]["pattern"].match(index1)
                or sample_patterns["idt_umi"]["pattern"].match(index2),
            ),
            ("smartseq", lambda: sample_patterns["smartseq"]["pattern"].match(index1)),
        ]

        for pattern_name, match_func in patterns_to_check:
            if not pattern_matched and match_func():
                pattern_config = sample_patterns[pattern_name]["config"]
                result["sample_type"] = pattern_config.get("sample_type")

                # Special handling for idt_umi - calculate UMI lengths from N positions
                if pattern_name == "idt_umi":
                    i7_umi_length = index1.upper().count("N")
                    i5_umi_length = index2.upper().count("N")
                    result["index_length"] = [
                        len(index1.replace("N", "")),
                        len(index2.replace("N", "")),
                    ]
                    result["umi_config"] = {
                        "i7": {"position": "end", "length": i7_umi_length},
                        "i5": {"position": "end", "length": i5_umi_length},
                        "R1": {"position": "start", "length": 0},
                        "R2": {"position": "end", "length": 0},
                    }
                else:
                    result["index_length"] = pattern_config.get(
                        "index_length", index_length
                    )
                    if pattern_config.get("umi_config") is not None:
                        result["umi_config"] = pattern_config["umi_config"]

                if pattern_config.get("named_indices"):
                    result["named_indices"] = pattern_config["named_indices"]
                if pattern_config.get("BCLConvert_Settings"):
                    result["BCLConvert_Settings"].update(
                        pattern_config["BCLConvert_Settings"]
                    )

                config_sources.append(f"patterns.{pattern_name}")
                pattern_matched = True

        # STEP 3: Apply other general sample type configurations (if no pattern matched)
        if not pattern_matched:
            # Check noindex
            if index1.upper() == "NOINDEX":
                noindex_config = sample_patterns["noindex"]["config"]
                result["sample_type"] = noindex_config.get("sample_type")
                result["index_length"] = noindex_config.get(
                    "index_length", index_length
                )
                if noindex_config.get("umi_config") is not None:
                    result["umi_config"] = noindex_config["umi_config"]
                if noindex_config.get("named_indices"):
                    result["named_indices"] = noindex_config["named_indices"]
                if noindex_config.get("BCLConvert_Settings"):
                    result["BCLConvert_Settings"].update(
                        noindex_config["BCLConvert_Settings"]
                    )
                config_sources.append("other_general_sample_types.noindex")
            else:
                # Use standard as default
                standard_config = sample_patterns["standard"]["config"]
                result["sample_type"] = standard_config.get("sample_type", "STANDARD")
                if standard_config.get("BCLConvert_Settings"):
                    result["BCLConvert_Settings"].update(
                        standard_config["BCLConvert_Settings"]
                    )
                config_sources.append("other_general_sample_types.standard")

        # STEP 4: Apply library method mapping (overrides previous configurations)
        if library_method and library_method in library_method_mapping:
            mapped_config = library_method_mapping[library_method]

            if mapped_config.get("sample_type"):
                result["sample_type"] = mapped_config["sample_type"]

            if "index_length" in mapped_config:
                result["index_length"] = mapped_config["index_length"].copy()
                # Handle "calculated" index lengths
                if result["index_length"][0] == "calculated":
                    result["index_length"][0] = len(index1)
                if result["index_length"][1] == "calculated":
                    result["index_length"][1] = len(index2)

            if mapped_config.get("umi_config") is not None:
                result["umi_config"] = mapped_config["umi_config"]

            if mapped_config.get("named_indices"):
                result["named_indices"] = mapped_config["named_indices"]

            if mapped_config.get("BCLConvert_Settings"):
                result["BCLConvert_Settings"].update(
                    mapped_config["BCLConvert_Settings"]
                )

            config_sources.append(f"library_method_mapping.{library_method}")

        # STEP 5: Check for control samples (highest priority override)
        if any(pattern in sample_name.lower() for pattern in control_patterns):
            result["sample_type"] = "control"
            result["umi_config"] = None
            result["named_indices"] = None
            result["BCLConvert_Settings"] = {}
            config_sources.append("control_patterns")

        result["config_sources"] = config_sources
        return result

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
                # Get library method and project_id for the project
                # Convert sample_project format (replace __ with .)
                sample_project = sample_in_lane.get("sample_project", "")
                project_name = (
                    sample_project.replace("__", ".", 1) if sample_project else ""
                )
                if project_name:
                    library_method = self._get_project_library_method(project_name)
                    project_id, _ = self._get_project_id_by_name(project_name)
                else:
                    library_method = None
                    project_id = ""

                # Build BCLConvert_Settings from defaults first
                config = self.application.sample_classification_config
                bcl_settings_defaults = config.get("bcl_convert_settings", {}).get(
                    "BCLConvert_Settings", {}
                )
                bcl_convert_settings = {}

                # Track config sources - start with defaults
                config_sources = []

                # STEP 1: Apply default BCLConvert_Settings
                if bcl_settings_defaults:
                    for setting_name, setting_config in bcl_settings_defaults.items():
                        default_value = setting_config.get("default")
                        bcl_convert_settings[setting_name] = default_value
                    config_sources.append("bcl_convert_settings.BCLConvert_Settings")

                # STEP 2-5: Classify the sample type (applies patterns, other_general_sample_types, library_method_mapping)
                sample_classification = self._classify_sample_type(
                    sample_in_lane, library_method
                )

                # Add classification config sources
                config_sources.extend(sample_classification.get("config_sources", []))

                # Apply overrides from the matched pattern, general types, or library method
                classification_overrides = sample_classification.get(
                    "BCLConvert_Settings", {}
                )
                if classification_overrides:
                    bcl_convert_settings.update(classification_overrides)

                # Check if we need to expand named indices
                index_1_value = sample_in_lane["index_1"]
                named_indices_file = sample_classification.get("named_indices")
                sequences_to_create = []
                named_index = ""  # Only set if found in named indices lookup

                # Check if this sample should use named indices expansion
                if named_indices_file:
                    named_indices_dict = self.application.named_indices.get(
                        named_indices_file, {}
                    )

                    if index_1_value in named_indices_dict:
                        # Named index found - use the sequences from the dictionary
                        named_index = index_1_value
                        sequences_to_create = named_indices_dict[named_index]
                    else:
                        # Named index not found - treat as standard sample with single entry
                        sequences_to_create = [
                            [index_1_value, sample_in_lane.get("index_2", "")]
                        ]
                else:
                    # No named indices file specified - use original indices
                    sequences_to_create = [
                        [index_1_value, sample_in_lane.get("index_2", "")]
                    ]

                # Create a sample row for each sequence entry
                for sequences in sequences_to_create:
                    sample_uuid = str(uuid.uuid4())

                    # Unpack sequences (can be 1 or 2 elements)
                    index_1 = sequences[0] if len(sequences) > 0 else index_1_value
                    index_2 = (
                        sequences[1]
                        if len(sequences) > 1
                        else sample_in_lane.get("index_2", "")
                    )

                    # project_name and project_id were already retrieved earlier in the function
                    calculated_lanes[lane]["sample_rows"][sample_uuid] = {
                        "last_modified": timestamp,
                        "library_method": library_method or "",
                        "project_id": project_id or "",
                        "project_name": project_name,
                        "control": sample_in_lane["control"],
                        "description": sample_in_lane["description"],
                        "flowcell_id": sample_in_lane["flowcell_id"],
                        "settings": {
                            timestamp: {
                                "other_details": {
                                    "named_index": named_index,
                                    "operator": sample_in_lane["operator"],
                                    "recipe": sample_in_lane["recipe"],
                                    "sample_ref": sample_in_lane["sample_ref"],
                                    "sample_type": sample_classification["sample_type"],
                                    "index_length": sample_classification[
                                        "index_length"
                                    ],
                                    "umi_config": sample_classification["umi_config"],
                                    "config_sources": config_sources,
                                    "library_method": library_method or "",
                                    "project_id": project_id or "",
                                },
                                "per_sample_fields": {
                                    "Lane": sample_in_lane["lane"],
                                    "Sample_ID": sample_in_lane["sample_id"],
                                    "index": index_1,
                                    "index2": index_2,
                                    "MaskShortReads": 0,
                                    "MinimumTrimmedReadLength": 0,
                                    "OverrideCycles": "",
                                    "Sample_Name": sample_in_lane["sample_name"],
                                    "Sample_Project": sample_in_lane["sample_project"],
                                },
                                "BCLConvert_Settings": bcl_convert_settings,
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

            # Check for dry-run mode
            dry_run = self.get_argument("dry_run", "false").lower() == "true"

            # Validate input data
            is_valid, error_message, metadata, uploaded_lims_info = (
                self._validate_post_data(post_data)
            )
            if not is_valid:
                self.set_status(400)
                self.write(json.dumps({"error": error_message}))
                return

            # Create timestamp for this operation (UTC)
            timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat(
                timespec="milliseconds"
            )

            # Build the complete document
            document = self._create_document(
                flowcell_id, metadata, uploaded_lims_info, timestamp
            )

            # If dry-run, return the document without saving
            if dry_run:
                self.set_status(200)
                self.set_header("Content-type", "application/json")
                self.write(
                    json.dumps(
                        {
                            "status": "dry_run",
                            "message": "Dry run - document not saved to database",
                            "flowcell_id": flowcell_id,
                            "timestamp": timestamp,
                            "document": document,
                        }
                    )
                )
                return

            # Check if document already exists for this flowcell
            try:
                view_result = self.application.cloudant.post_view(
                    db="demux_sample_info",
                    ddoc="info",
                    view="flowcell_id",
                    key=flowcell_id,
                ).get_result()

                existing_rows = view_result.get("rows", [])

                if existing_rows:
                    # Document already exists - return error
                    self.set_status(409)  # Conflict
                    self.write(
                        json.dumps(
                            {
                                "error": f"Demux sample info already exists for flowcell {flowcell_id}",
                                "flowcell_id": flowcell_id,
                            }
                        )
                    )
                    return

                # Document doesn't exist - create new one
                response = self.application.cloudant.post_document(
                    db="demux_sample_info", document=document
                ).get_result()

                if not response.get("ok"):
                    self.set_status(500)
                    self.write(
                        json.dumps(
                            {
                                "error": "Failed to save document to database",
                                "response": response,
                            }
                        )
                    )
                    return

                self.set_status(201)
                self.set_header("Content-type", "application/json")
                self.write(
                    json.dumps(
                        {
                            "status": "success",
                            "message": "Demux sample info created successfully",
                            "flowcell_id": flowcell_id,
                            "timestamp": timestamp,
                        }
                    )
                )

            except Exception as db_error:
                self.set_status(500)
                self.write(json.dumps({"error": f"Database error: {str(db_error)}"}))
                return

        except json.JSONDecodeError as e:
            self.set_status(400)
            self.write(json.dumps({"error": f"Invalid JSON in request body: {str(e)}"}))
        except Exception as e:
            self.set_status(500)
            self.write(json.dumps({"error": f"Internal server error: {str(e)}"}))

    def put(self, flowcell_id):
        """Accept PUT request to update calculated sample settings.

        Expected payload:
        {
            "flowcell_id": "...",
            "edited_settings": {
                "lane_1": {
                    "uuid123": {
                        "sample_id": "new_value",
                        "index_1": "ATCG",
                        ...
                    }
                }
            }
        }
        """
        try:
            # Parse the request body
            put_data = tornado.escape.json_decode(self.request.body)

            if "edited_settings" not in put_data:
                self.set_status(400)
                self.write(
                    json.dumps({"error": "Missing required field: 'edited_settings'"})
                )
                return
            
            edited_settings = put_data["edited_settings"]

            # Define which fields are allowed to be edited
            # Fields are mapped to their location in the settings structure
            # Format: "field_key": ("section", "actual_key") or ("sample_row", "field_name") for top-level fields
            allowed_fields = {
                # per_sample_fields
                "sample_id": ("per_sample_fields", "Sample_ID"),
                "sample_name": ("per_sample_fields", "Sample_Name"),
                "sample_project": ("per_sample_fields", "Sample_Project"),
                "index_1": ("per_sample_fields", "index"),
                "index_2": ("per_sample_fields", "index2"),
                "mask_short_reads": ("per_sample_fields", "MaskShortReads"),
                "minimum_trimmed_read_length": (
                    "per_sample_fields",
                    "MinimumTrimmedReadLength",
                ),
                "override_cycles": ("per_sample_fields", "OverrideCycles"),
                # other_details
                "sample_ref": ("other_details", "sample_ref"),
                "sample_type": ("other_details", "sample_type"),
                "named_index": ("other_details", "named_index"),
                "recipe": ("other_details", "recipe"),
                "operator": ("other_details", "operator"),
                "index_length": ("other_details", "index_length"),
                "umi_config": ("other_details", "umi_config"),
                "library_method": ("other_details", "library_method"),
                # sample_row level (top level of sample, not in settings)
                "control": ("sample_row", "control"),
                "description": ("sample_row", "description"),
            }

            # Fetch the existing document
            try:
                view_result = self.application.cloudant.post_view(
                    db="demux_sample_info",
                    ddoc="info",
                    view="flowcell_id",
                    key=flowcell_id,
                ).get_result()

                existing_rows = view_result.get("rows", [])

                if not existing_rows:
                    self.set_status(404)
                    self.write(
                        json.dumps(
                            {
                                "error": f"No demux sample info found for flowcell {flowcell_id}"
                            }
                        )
                    )
                    return

                # Get the document
                doc_id = existing_rows[0]["id"]
                document = self.application.cloudant.get_document(
                    db="demux_sample_info", doc_id=doc_id
                ).get_result()

            except Exception as db_error:
                self.set_status(500)
                self.write(
                    json.dumps(
                        {"error": f"Database error fetching document: {str(db_error)}"}
                    )
                )
                return

            # Create timestamp for this update
            timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat(
                timespec="milliseconds"
            )

            # Track changes for version history comment
            changes_summary = []

            # Process edited settings
            for lane, samples in edited_settings.items():
                # Convert lane to string to match database structure
                lane_key = str(lane)

                if lane_key not in document["calculated"]["lanes"]:
                    raise ValueError(f"Lane {lane_key} does not exist in the document")

                for sample_uuid, edited_fields in samples.items():
                    if (
                        sample_uuid
                        not in document["calculated"]["lanes"][lane_key]["sample_rows"]
                    ):
                        raise ValueError(
                            f"Sample UUID {sample_uuid} does not exist in lane {lane_key}"
                        )

                    sample_row = document["calculated"]["lanes"][lane_key][
                        "sample_rows"
                    ][sample_uuid]

                    # Get the latest settings version
                    settings_versions = sorted(
                        sample_row["settings"].keys(), reverse=True
                    )
                    latest_version = settings_versions[0]
                    latest_settings = sample_row["settings"][latest_version]

                    # Create a deep copy of the latest settings for the new version
                    new_settings = {
                        "per_sample_fields": latest_settings.get(
                            "per_sample_fields", {}
                        ).copy(),
                        "other_details": latest_settings.get(
                            "other_details", {}
                        ).copy(),
                        "BCLConvert_Settings": latest_settings.get(
                            "BCLConvert_Settings", {}
                        ).copy(),
                    }

                    # Apply edits to the appropriate sections
                    for field_key, new_value in edited_fields.items():
                        if field_key not in allowed_fields:
                            # Skip fields that aren't in the allowed list
                            continue

                        section, actual_key = allowed_fields[field_key]

                        # Handle sample_row level fields (not in settings)
                        if section == "sample_row":
                            old_value = sample_row.get(actual_key)
                            sample_row[actual_key] = new_value

                            # Track the change
                            sample_id = new_settings["per_sample_fields"].get(
                                "Sample_ID", sample_uuid
                            )
                            changes_summary.append(
                                f"{sample_id}: {field_key} changed from '{old_value}' to '{new_value}'"
                            )
                        # Handle settings level fields
                        elif section in new_settings:
                            old_value = new_settings[section].get(actual_key)
                            new_settings[section][actual_key] = new_value

                            # Track the change
                            sample_id = new_settings["per_sample_fields"].get(
                                "Sample_ID", sample_uuid
                            )
                            changes_summary.append(
                                f"{sample_id}: {field_key} changed from '{old_value}' to '{new_value}'"
                            )

                    # Add the new settings version with the current timestamp
                    sample_row["settings"][timestamp] = new_settings

                    # Update last_modified
                    sample_row["last_modified"] = timestamp

            # Update version_history
            if "version_history" not in document["calculated"]:
                document["calculated"]["version_history"] = {}

            document["calculated"]["version_history"][timestamp] = {
                "generated_by": self.get_current_user().email
                if self.get_current_user()
                else None,
                "autogenerated": False,
                "comment": f"Manual edit: {'; '.join(changes_summary[:5])}"
                + ("..." if len(changes_summary) > 5 else ""),
                "auto_run": False,
            }

            # Save the updated document back to the database
            try:
                response = self.application.cloudant.post_document(
                    db="demux_sample_info", document=document
                ).get_result()

                if not response.get("ok"):
                    self.set_status(500)
                    self.write(
                        json.dumps(
                            {
                                "error": "Failed to update document in database",
                                "response": response,
                            }
                        )
                    )
                    return

                # Fetch the updated document to return to the client
                updated_doc = self.application.cloudant.get_document(
                    db="demux_sample_info", doc_id=doc_id
                ).get_result()

                self.set_status(200)
                self.set_header("Content-type", "application/json")
                self.write(json.dumps(updated_doc))

            except Exception as db_error:
                self.set_status(500)
                self.write(
                    json.dumps(
                        {"error": f"Database error saving document: {str(db_error)}"}
                    )
                )
                return

        except json.JSONDecodeError as e:
            self.set_status(400)
            self.write(json.dumps({"error": f"Invalid JSON in request body: {str(e)}"}))
        except Exception as e:
            self.set_status(500)
            self.write(json.dumps({"error": f"Internal server error: {str(e)}"}))


class SampleClassificationPresetsHandler(SafeHandler):
    """Serves sample classification presets for the UI."""

    def get(self):
        """Return sample classification patterns as presets."""
        try:
            config = self.application.sample_classification_config
            patterns = {}

            # Extract relevant information from patterns
            for key, pattern_config in config.get("patterns", {}).items():
                # Skip recipe pattern as it's not a sample type preset
                if key == "recipe":
                    continue

                patterns[key] = {
                    "name": key,
                    "description": pattern_config.get("description", ""),
                    "sample_type": pattern_config.get("sample_type"),
                    "index_length": pattern_config.get("index_length"),
                    "umi_config": pattern_config.get("umi_config"),
                    "named_indices": pattern_config.get("named_indices"),
                }

            # Also include library method mappings
            library_methods = {}
            for method, method_config in config.get(
                "library_method_mapping", {}
            ).items():
                library_methods[method] = {
                    "name": method,
                    "description": method_config.get("description", ""),
                    "sample_type": method_config.get("sample_type"),
                    "index_length": method_config.get("index_length"),
                    "umi_config": method_config.get("umi_config"),
                    "named_indices": method_config.get("named_indices"),
                }

            self.set_header("Content-type", "application/json")
            self.write(
                json.dumps({"patterns": patterns, "library_methods": library_methods})
            )

        except Exception as e:
            self.set_status(500)
            self.write(json.dumps({"error": f"Failed to load presets: {str(e)}"}))


class SampleClassificationConfigHandler(SafeHandler):
    """Serves the full sample classification configuration for the UI."""

    def get(self):
        """Return the complete sample classification configuration."""
        try:
            config = self.application.sample_classification_config

            # Return the full config with all details
            response = {
                "patterns": config.get("patterns", {}),
                "other_general_sample_types": config.get(
                    "other_general_sample_types", {}
                ),
                "library_method_mapping": config.get("library_method_mapping", {}),
                "bcl_convert_settings": config.get("bcl_convert_settings", {}),
                "control_patterns": config.get("control_patterns", []),
                "short_single_index_threshold": config.get(
                    "short_single_index_threshold", 8
                ),
            }

            self.set_header("Content-type", "application/json")
            self.write(json.dumps(response))

        except Exception as e:
            self.set_status(500)
            self.write(json.dumps({"error": f"Failed to load configuration: {str(e)}"}))