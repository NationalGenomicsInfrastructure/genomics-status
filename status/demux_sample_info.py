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


class DemuxSampleInfoListHandler(SafeHandler):
    """API handler to list recent flowcells."""

    def get(self):
        """Get the latest 50 flowcells, merged from demux_sample_info and y_flowcells databases."""
        self.set_header("Content-type", "application/json")

        try:
            # Query demux_sample_info database
            demux_view_result = self.application.cloudant.post_view(
                db="demux_sample_info",
                ddoc="info",
                view="flowcell_id",
                include_docs=False,
            ).get_result()

            demux_rows = demux_view_result.get("rows", [])

            # Get unique flowcells from demux_sample_info
            flowcells_dict = {}

            for row in demux_rows:
                flowcell_id = row.get("key")
                if flowcell_id:
                    flowcells_dict[flowcell_id] = {
                        "flowcell_id": flowcell_id,
                        "doc_id": row.get("id"),
                        "has_demux_info": True,
                    }

            # Query y_flowcells database for event status
            try:
                y_flowcells_view_result = self.application.cloudant.post_view(
                    db="y_flowcells",
                    ddoc="summary",
                    view="flowcell_id",
                    include_docs=False,
                ).get_result()

                y_flowcells_rows = y_flowcells_view_result.get("rows", [])

                # Merge event data from y_flowcells
                for row in y_flowcells_rows:
                    flowcell_id = row.get("key")
                    if flowcell_id:
                        events_data = row.get("value", {})

                        # Extract the events we're interested in
                        event_info = {
                            "sequencing_started": events_data.get(
                                "sequencing_started", False
                            ),
                            "sequencing_started_timestamp": events_data.get(
                                "sequencing_started_timestamp"
                            ),
                            "sequencing_finished": events_data.get(
                                "sequencing_finished", False
                            ),
                            "sequencing_finished_timestamp": events_data.get(
                                "sequencing_finished_timestamp"
                            ),
                            "transferred_to_hpc": events_data.get(
                                "transferred_to_hpc", False
                            ),
                            "transferred_to_hpc_timestamp": events_data.get(
                                "transferred_to_hpc_timestamp"
                            ),
                        }

                        if flowcell_id in flowcells_dict:
                            # Merge with existing entry
                            flowcells_dict[flowcell_id].update(event_info)
                        else:
                            # Add new entry from y_flowcells
                            flowcells_dict[flowcell_id] = {
                                "flowcell_id": flowcell_id,
                                "has_demux_info": False,
                                **event_info,
                            }
            except Exception as e:
                # Log but don't fail if y_flowcells query fails
                logging.warning(f"Failed to fetch data from y_flowcells: {str(e)}")

            # Convert dict to list
            flowcells = list(flowcells_dict.values())

            # Sort by flowcell_id descending (most recent first, assuming naming convention)
            flowcells.sort(key=lambda x: x["flowcell_id"], reverse=True)

            # Limit to 50 most recent
            flowcells = flowcells[:50]

            self.write(json.dumps({"flowcells": flowcells}))

        except Exception as e:
            self.set_status(500)
            self.write(
                json.dumps({"error": f"Error retrieving flowcell list: {str(e)}"})
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

    def _generate_override_cycles(
        self, run_setup, recipe, index_lengths, umi_config=None
    ):
        """Generate OverrideCycles string for BCLConvert based on run setup, recipe, UMI config, and index lengths.

        Args:
            run_setup: String in format "R1-I1-I2-R2" (e.g., "151-10-24-151")
            recipe: String in format "R1-I1-I2-R2" (e.g., "151-X-X-151"), X means use full run cycles
                    Or shorthand format "R1-R2" (e.g., "151-151") which is equivalent to "R1-X-X-R2"
            index_lengths: List of [index1_length, index2_length] - actual index sequence lengths from sample
            umi_config: Optional dict with UMI configuration for R1, R2, i7, i5

        Returns:
            str: OverrideCycles string (e.g., "R1:U7N1Y143;R2:U7N1Y143;I1:I8;I2:I8")
                 or empty string if no override needed
        """
        if not run_setup or not recipe:
            return ""

        # Parse run_setup and recipe
        run_parts = run_setup.split("-")
        recipe_parts = recipe.split("-")
        
        # Allow 2-part recipe format (Y-Z) as shorthand for Y-X-X-Z
        if len(recipe_parts) == 2:
            recipe_parts = [recipe_parts[0], "X", "X", recipe_parts[1]]

        if len(run_parts) != 4 or len(recipe_parts) != 4:
            # Invalid format
            return ""

        # Extract cycle counts from run_setup
        try:
            run_r1, run_i1, run_i2, run_r2 = [int(x) for x in run_parts]
        except ValueError:
            return ""

        # Extract expected cycles from recipe (X means use full run cycles)
        recipe_r1 = int(recipe_parts[0]) if recipe_parts[0] != "X" else run_r1
        recipe_i1 = int(recipe_parts[1]) if recipe_parts[1] != "X" else run_i1
        recipe_i2 = int(recipe_parts[2]) if recipe_parts[2] != "X" else run_i2
        recipe_r2 = int(recipe_parts[3]) if recipe_parts[3] != "X" else run_r2

        # Use the actual index sequence lengths from the parameter
        # These represent the true index sequence length (after any UMI is accounted for)
        index1_length = index_lengths[0]
        index2_length = index_lengths[1]

        # Validate that recipe cycles don't exceed run setup
        if (
            recipe_r1 > run_r1
            or recipe_i1 > run_i1
            or recipe_i2 > run_i2
            or recipe_r2 > run_r2
        ):
            # Recipe requires more cycles than available in run - this is an error
            logging.warning(
                f"Recipe requirements exceed run setup: recipe={recipe}, "
                f"run_setup={run_setup}"
            )
            return ""

        override_parts = []

        # Generate R1 override
        r1_override = self._generate_read_override(
            "R1", run_r1, recipe_r1, umi_config, "R1" if umi_config else None
        )
        if r1_override:
            override_parts.append(r1_override)

        # Generate I1 (i7) override
        i1_override = self._generate_index_override(
            "I1",
            run_i1,
            recipe_i1,
            index1_length,
            umi_config,
            "i7" if umi_config else None,
        )
        if i1_override:
            override_parts.append(i1_override)

        # Generate I2 (i5) override
        i2_override = self._generate_index_override(
            "I2",
            run_i2,
            recipe_i2,
            index2_length,
            umi_config,
            "i5" if umi_config else None,
        )
        if i2_override:
            override_parts.append(i2_override)

        # Generate R2 override
        r2_override = self._generate_read_override(
            "R2", run_r2, recipe_r2, umi_config, "R2" if umi_config else None
        )
        if r2_override:
            override_parts.append(r2_override)

        return ";".join(override_parts) if override_parts else ""

    def _generate_read_override(
        self, read_name, run_cycles, recipe_cycles, umi_config, umi_key
    ):
        """Generate override string for a read (R1 or R2).

        Args:
            read_name: "R1" or "R2"
            run_cycles: Number of cycles in the run
            recipe_cycles: Number of expected cycles from recipe (includes UMI)
            umi_config: UMI configuration dict
            umi_key: Key to look up in umi_config ("R1" or "R2")

        Returns:
            str: Override string (e.g., "R1:U5Y138N8") or empty if no override needed
        """
        if run_cycles == 0:
            return ""

        parts = []
        remaining_cycles_from_recipe = recipe_cycles

        # Check for UMI at start
        if umi_config and umi_key and umi_key in umi_config:
            umi_info = umi_config[umi_key]
            umi_length = umi_info.get("length", 0)
            umi_position = umi_info.get("position", "")

            if umi_length > 0 and umi_position == "start":
                parts.append(f"U{umi_length}")
                remaining_cycles_from_recipe -= umi_length

        # Check for UMI at end
        umi_at_end = 0
        if umi_config and umi_key and umi_key in umi_config:
            umi_info = umi_config[umi_key]
            umi_length = umi_info.get("length", 0)
            umi_position = umi_info.get("position", "")

            if umi_length > 0 and umi_position == "end":
                remaining_cycles_from_recipe -= umi_length
                umi_at_end = umi_length

        # Add valid sequence bases (what's left in recipe after UMIs)
        if remaining_cycles_from_recipe > 0:
            parts.append(f"Y{remaining_cycles_from_recipe}")

        # Add UMI at end if present
        if umi_at_end > 0:
            parts.append(f"U{umi_at_end}")

        # Add ignored bases if recipe uses fewer cycles than available in run
        ignored_cycles = run_cycles - recipe_cycles
        if ignored_cycles > 0:
            parts.append(f"N{ignored_cycles}")

        return f"{read_name}:{''.join(parts)}" if parts else ""

    def _generate_index_override(
        self, index_name, run_cycles, recipe_cycles, index_length, umi_config, umi_key
    ):
        """Generate override string for an index (I1 or I2).

        Args:
            index_name: "I1" or "I2"
            run_cycles: Total cycles available in run_setup
            recipe_cycles: Number of cycles to use for this index (from recipe)
            index_length: Actual index sequence length (not including UMI)
            umi_config: UMI configuration dict
            umi_key: Key to look up in umi_config ("i7" or "i5")

        Returns:
            str: Override string (e.g., "I1:I8N2") or empty if no override needed
        """
        if recipe_cycles == 0:
            return ""

        parts = []
        remaining_cycles = recipe_cycles

        # Check for UMI at start
        if umi_config and umi_key and umi_key in umi_config:
            umi_info = umi_config[umi_key]
            umi_length = umi_info.get("length", 0)
            umi_position = umi_info.get("position", "")

            if umi_length > 0 and umi_position == "start":
                parts.append(f"U{umi_length}")
                remaining_cycles -= umi_length

        # Add index bases only if index_length > 0
        if index_length > 0:
            parts.append(f"I{index_length}")
            remaining_cycles -= index_length

        # Check for UMI at end
        if umi_config and umi_key and umi_key in umi_config:
            umi_info = umi_config[umi_key]
            umi_length = umi_info.get("length", 0)
            umi_position = umi_info.get("position", "")

            if umi_length > 0 and umi_position == "end":
                parts.append(f"U{umi_length}")
                remaining_cycles -= umi_length

        # Calculate total ignored bases:
        # 1. Remaining cycles within recipe (after UMI and index)
        # 2. Extra cycles from run_cycles that recipe doesn't use
        total_ignored = remaining_cycles + (run_cycles - recipe_cycles)
        if total_ignored > 0:
            parts.append(f"N{total_ignored}")

        return f"{index_name}:{''.join(parts)}" if parts else ""

    def _classify_sample_type(self, sample_in_lane, library_method=None, metadata=None):
        """Classify sample type based on sample properties using TACA classification logic.

        Applies configurations from least specific to most specific, where more specific
        configs override less specific ones.

        Order of application:
        1. Default BCLConvert_Settings
        2. Regex-based patterns (patterns)
        3. Other general sample types (other_general_sample_types)
        4. Library method mapping (library_method_mapping)
        5. Instrument type and run mode mapping (instrument_type_mapping)
        6. Control patterns (highest priority)

        Args:
            sample_in_lane: Sample object from uploaded_lims_info
            library_method: Optional library construction method from project
            metadata: Optional metadata dict containing instrument_type and run_mode

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
                    # index_length stays as initialized (actual index sequence lengths)
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
                result["index_length"] = [0, 0]  # No index for NOINDEX samples
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

            # index_length stays as actual index sequence lengths from sample
            # UMI config from library method mapping will be used in OverrideCycles generation
            if mapped_config.get("umi_config") is not None:
                result["umi_config"] = mapped_config["umi_config"]

            if mapped_config.get("named_indices"):
                result["named_indices"] = mapped_config["named_indices"]

            if mapped_config.get("BCLConvert_Settings"):
                result["BCLConvert_Settings"].update(
                    mapped_config["BCLConvert_Settings"]
                )

            config_sources.append(f"library_method_mapping.{library_method}")

        # STEP 5: Apply instrument type and run mode mapping (overrides previous configurations)
        if metadata:
            instrument_type = metadata.get("instrument_type")
            run_mode = metadata.get("run_mode")
            instrument_type_mapping = config.get("instrument_type_mapping", {})

            if instrument_type and instrument_type in instrument_type_mapping:
                instrument_config = instrument_type_mapping[instrument_type]

                # Apply instrument-level settings first
                if instrument_config.get("sample_type"):
                    result["sample_type"] = instrument_config["sample_type"]

                if instrument_config.get("umi_config") is not None:
                    result["umi_config"] = instrument_config["umi_config"]

                if instrument_config.get("named_indices"):
                    result["named_indices"] = instrument_config["named_indices"]

                if instrument_config.get("BCLConvert_Settings"):
                    result["BCLConvert_Settings"].update(
                        instrument_config["BCLConvert_Settings"]
                    )

                config_sources.append(f"instrument_type_mapping.{instrument_type}")

                # Apply run mode-specific settings (overrides instrument-level)
                if run_mode and "run_modes" in instrument_config:
                    run_modes = instrument_config["run_modes"]
                    if run_mode in run_modes:
                        run_mode_config = run_modes[run_mode]

                        if run_mode_config.get("sample_type"):
                            result["sample_type"] = run_mode_config["sample_type"]

                        if run_mode_config.get("umi_config") is not None:
                            result["umi_config"] = run_mode_config["umi_config"]

                        if run_mode_config.get("named_indices"):
                            result["named_indices"] = run_mode_config["named_indices"]

                        if run_mode_config.get("BCLConvert_Settings"):
                            result["BCLConvert_Settings"].update(
                                run_mode_config["BCLConvert_Settings"]
                            )

                        config_sources.append(
                            f"instrument_type_mapping.{instrument_type}.run_modes.{run_mode}"
                        )

        # STEP 6: Check for control samples (highest priority override)
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

    def _create_calculated_lanes(self, lanes_with_samples, timestamp, metadata):
        """Create the calculated lanes structure with sample rows.

        Args:
            lanes_with_samples: Dictionary mapping lane numbers to sample lists
            timestamp: ISO format timestamp string
            metadata: Metadata dictionary containing run_setup and other run information

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

                # STEP 2-6: Classify the sample type (applies patterns, other_general_sample_types, library_method_mapping, instrument_type_mapping)
                sample_classification = self._classify_sample_type(
                    sample_in_lane, library_method, metadata
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

                    # Generate OverrideCycles if not already set in BCLConvert_Settings
                    override_cycles = ""
                    if (
                        "OverrideCycles" not in bcl_convert_settings
                        or not bcl_convert_settings["OverrideCycles"]
                    ):
                        run_setup = metadata.get("run_setup", "")
                        recipe = sample_in_lane.get("recipe", "")
                        index_lengths = sample_classification["index_length"]
                        umi_config = sample_classification.get("umi_config")
                        override_cycles = self._generate_override_cycles(
                            run_setup, recipe, index_lengths, umi_config
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
                                    "OverrideCycles": override_cycles,
                                    "Sample_Name": sample_in_lane["sample_name"],
                                    "Sample_Project": sample_in_lane["sample_project"],
                                },
                                "BCLConvert_Settings": bcl_convert_settings,
                            }
                        },
                    }

        return calculated_lanes

    def _generate_samplesheets(self, flowcell_id, calculated_lanes, metadata):
        """Generate Illumina v2 samplesheets grouped by lane and BCLConvert settings.

        Args:
            flowcell_id: Flowcell identifier
            calculated_lanes: Dictionary of calculated lanes with sample data
            metadata: Metadata dictionary with run information

        Returns:
            list: List of samplesheet dictionaries as structured JSON
        """
        samplesheets = []

        # Process each lane
        for lane, lane_data in calculated_lanes.items():
            # Group samples by their BCLConvert_Settings
            settings_groups = {}

            for sample_uuid, sample in lane_data["sample_rows"].items():
                # Get the latest settings version
                settings_versions = sorted(sample["settings"].keys(), reverse=True)
                if not settings_versions:
                    continue

                latest_settings = sample["settings"][settings_versions[0]]

                # Get BCLConvert_Settings for this sample
                bcl_settings = latest_settings.get("BCLConvert_Settings", {})
                settings_key = json.dumps(bcl_settings, sort_keys=True)

                if settings_key not in settings_groups:
                    settings_groups[settings_key] = {
                        "bcl_settings": bcl_settings,
                        "samples": [],
                    }

                # Build sample data for samplesheet
                fields = latest_settings.get("per_sample_fields", {})
                other_details = latest_settings.get("other_details", {})

                sample_data = {
                    "Lane": lane,
                    "Sample_ID": fields.get("Sample_ID", ""),
                    "Sample_Name": fields.get(
                        "Sample_Name", fields.get("Sample_ID", "")
                    ),
                    "index": fields.get("index", ""),
                    "index2": fields.get("index2", ""),
                    "Sample_Project": fields.get("Sample_Project", ""),
                    "OverrideCycles": other_details.get(
                        "override_cycles", fields.get("OverrideCycles", "")
                    ),
                }

                settings_groups[settings_key]["samples"].append(sample_data)

            # Create one samplesheet per settings group
            for settings_idx, (settings_key, group) in enumerate(
                settings_groups.items()
            ):
                # Get unique projects for this group
                projects = sorted(
                    set(
                        sample["Sample_Project"] or "Unknown"
                        for sample in group["samples"]
                    )
                )

                # Build structured samplesheet
                samplesheet = {
                    "lane": lane,
                    "projects": projects,
                    "settings_index": settings_idx,
                    "sample_count": len(group["samples"]),
                    "filename": f"Lane{lane}_{'_'.join(projects)}_{settings_idx}.csv",
                    "Header": {
                        "FileFormatVersion": "2",
                        "RunName": flowcell_id,
                    },
                    "BCLConvert_Settings": group["bcl_settings"],
                    "BCLConvert_Data": group["samples"],
                }

                samplesheets.append(samplesheet)

        # Sort by lane and settings index
        samplesheets.sort(key=lambda x: (int(x["lane"]), x["settings_index"]))

        return samplesheets

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
        calculated_lanes = self._create_calculated_lanes(
            lanes_with_samples, timestamp, metadata
        )

        # Generate samplesheets
        samplesheets = self._generate_samplesheets(
            flowcell_id, calculated_lanes, metadata
        )

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
            "samplesheets": samplesheets,
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
            user_comment = put_data.get("comment", "").strip()

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

            # Track which samples were changed
            modified_samples = set()

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
                            sample_row[actual_key] = new_value

                            # Track the sample ID
                            sample_id = new_settings["per_sample_fields"].get(
                                "Sample_ID", sample_uuid
                            )
                            modified_samples.add(sample_id)
                        # Handle settings level fields
                        elif section in new_settings:
                            new_settings[section][actual_key] = new_value

                            # Track the sample ID
                            sample_id = new_settings["per_sample_fields"].get(
                                "Sample_ID", sample_uuid
                            )
                            modified_samples.add(sample_id)

                    # Recalculate OverrideCycles if recipe or indices were changed
                    # Check if any relevant fields were edited
                    relevant_fields = {"recipe", "index_1", "index_2", "umi_config"}
                    if relevant_fields.intersection(edited_fields.keys()):
                        run_setup = document.get("metadata", {}).get("run_setup", "")
                        recipe = new_settings["other_details"].get("recipe", "")
                        index_1 = new_settings["per_sample_fields"].get("index", "")
                        index_2 = new_settings["per_sample_fields"].get("index2", "")
                        umi_config = new_settings["other_details"].get("umi_config")

                        # Calculate index lengths from actual index sequences
                        index_lengths = [len(index_1), len(index_2)]

                        # Generate new OverrideCycles
                        override_cycles = self._generate_override_cycles(
                            run_setup, recipe, index_lengths, umi_config
                        )

                        # Update the OverrideCycles field
                        new_settings["per_sample_fields"]["OverrideCycles"] = (
                            override_cycles
                        )

                    # Add the new settings version with the current timestamp
                    sample_row["settings"][timestamp] = new_settings

                    # Update last_modified
                    sample_row["last_modified"] = timestamp

            # Update version_history
            if "version_history" not in document["calculated"]:
                document["calculated"]["version_history"] = {}

            # Use user-provided comment if available, otherwise generate automatic summary
            if user_comment:
                comment = user_comment
            else:
                # Generate automatic comment listing modified samples
                sample_list = ", ".join(sorted(modified_samples)[:10])
                if len(modified_samples) > 10:
                    comment = f"Manual edit: Modified {len(modified_samples)} samples: {sample_list}..."
                else:
                    comment = f"Manual edit: Modified samples: {sample_list}"

            document["calculated"]["version_history"][timestamp] = {
                "generated_by": self.get_current_user().email
                if self.get_current_user()
                else None,
                "autogenerated": False,
                "comment": comment,
                "auto_run": False,
            }

            # Regenerate samplesheets after updates
            calculated_lanes = document.get("calculated", {}).get("lanes", {})
            metadata = document.get("metadata", {})
            samplesheets = self._generate_samplesheets(
                flowcell_id, calculated_lanes, metadata
            )
            document["samplesheets"] = samplesheets

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

            # Also include instrument type mappings
            instrument_types = {}
            for instrument, instrument_config in config.get(
                "instrument_type_mapping", {}
            ).items():
                instrument_types[instrument] = {
                    "name": instrument,
                    "description": instrument_config.get("description", ""),
                    "sample_type": instrument_config.get("sample_type"),
                    "umi_config": instrument_config.get("umi_config"),
                    "named_indices": instrument_config.get("named_indices"),
                    "BCLConvert_Settings": instrument_config.get("BCLConvert_Settings"),
                }

                # Include run modes if present
                if "run_modes" in instrument_config:
                    run_modes = {}
                    for mode, mode_config in instrument_config["run_modes"].items():
                        run_modes[mode] = {
                            "name": mode,
                            "description": mode_config.get("description", ""),
                            "sample_type": mode_config.get("sample_type"),
                            "umi_config": mode_config.get("umi_config"),
                            "named_indices": mode_config.get("named_indices"),
                            "BCLConvert_Settings": mode_config.get(
                                "BCLConvert_Settings"
                            ),
                        }
                    instrument_types[instrument]["run_modes"] = run_modes

            self.set_header("Content-type", "application/json")
            self.write(
                json.dumps(
                    {
                        "patterns": patterns,
                        "library_methods": library_methods,
                        "instrument_types": instrument_types,
                    }
                )
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
                "instrument_type_mapping": config.get("instrument_type_mapping", {}),
                "short_single_index_threshold": config.get(
                    "short_single_index_threshold", 8
                ),
            }

            self.set_header("Content-type", "application/json")
            self.write(json.dumps(response))

        except Exception as e:
            self.set_status(500)
            self.write(json.dumps({"error": f"Failed to load configuration: {str(e)}"}))
