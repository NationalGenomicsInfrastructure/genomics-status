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
        # TODO: Implement actual data fetching from database
        # For now, return dummy data as a placeholder
        self.set_header("Content-type", "application/json")
        samples = [
            {
                "FCID": "233KCWLT4",
                "Lane": "3",
                "Sample_ID": "P71234_501",
                "Sample_Name": "P71234_501",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "SI-TS-A7",
                "index2": "",
                "Description": "Y__Andersson_01_45",
                "Control": "N",
                "Recipe": "43-50",
                "Operator": "Lars_Eriksson",
                "Sample_Project": "Y__Andersson_01_45",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "3",
                "Sample_ID": "P71234_502",
                "Sample_Name": "P71234_502",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "SI-TS-B7",
                "index2": "",
                "Description": "Y__Andersson_01_45",
                "Control": "N",
                "Recipe": "43-50",
                "Operator": "Lars_Eriksson",
                "Sample_Project": "Y__Andersson_01_45",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "3",
                "Sample_ID": "P71234_503",
                "Sample_Name": "P71234_503",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "SI-TS-C7",
                "index2": "",
                "Description": "Y__Andersson_01_45",
                "Control": "N",
                "Recipe": "43-50",
                "Operator": "Lars_Eriksson",
                "Sample_Project": "Y__Andersson_01_45",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "3",
                "Sample_ID": "P71234_504",
                "Sample_Name": "P71234_504",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "SI-TS-D7",
                "index2": "",
                "Description": "Y__Andersson_01_45",
                "Control": "N",
                "Recipe": "43-50",
                "Operator": "Lars_Eriksson",
                "Sample_Project": "Y__Andersson_01_45",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "6",
                "Sample_ID": "P89101_2001",
                "Sample_Name": "P89101_2001",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "CGCCTCT",
                "index2": "CGTTCCT",
                "Description": "B__Svensson_12_34",
                "Control": "N",
                "Recipe": "151-151",
                "Operator": "Mikael_Johansson",
                "Sample_Project": "B__Svensson_12_34",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "6",
                "Sample_ID": "P89101_2002",
                "Sample_Name": "P89101_2002",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "CTTGCGG",
                "index2": "CGCCTCA",
                "Description": "B__Svensson_12_34",
                "Control": "N",
                "Recipe": "151-151",
                "Operator": "Mikael_Johansson",
                "Sample_Project": "B__Svensson_12_34",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "6",
                "Sample_ID": "P89101_2003",
                "Sample_Name": "P89101_2003",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "TGGACGT",
                "index2": "CAATCGA",
                "Description": "B__Svensson_12_34",
                "Control": "N",
                "Recipe": "151-151",
                "Operator": "Mikael_Johansson",
                "Sample_Project": "B__Svensson_12_34",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "6",
                "Sample_ID": "P89101_2004",
                "Sample_Name": "P89101_2004",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "ATACTGA",
                "index2": "CCTTCGC",
                "Description": "B__Svensson_12_34",
                "Control": "N",
                "Recipe": "151-151",
                "Operator": "Mikael_Johansson",
                "Sample_Project": "B__Svensson_12_34",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "6",
                "Sample_ID": "P89101_2005",
                "Sample_Name": "P89101_2005",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "CAGGAAG",
                "index2": "CAGGCAA",
                "Description": "B__Svensson_12_34",
                "Control": "N",
                "Recipe": "151-151",
                "Operator": "Mikael_Johansson",
                "Sample_Project": "B__Svensson_12_34",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "6",
                "Sample_ID": "P89101_2006",
                "Sample_Name": "P89101_2006",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "CAATTAC",
                "index2": "GCTCCGT",
                "Description": "B__Svensson_12_34",
                "Control": "N",
                "Recipe": "151-151",
                "Operator": "Mikael_Johansson",
                "Sample_Project": "B__Svensson_12_34",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "6",
                "Sample_ID": "P89101_2007",
                "Sample_Name": "P89101_2007",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "CATACCT",
                "index2": "AGAGACT",
                "Description": "B__Svensson_12_34",
                "Control": "N",
                "Recipe": "151-151",
                "Operator": "Mikael_Johansson",
                "Sample_Project": "B__Svensson_12_34",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "6",
                "Sample_ID": "P89101_2008",
                "Sample_Name": "P89101_2008",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "TACTTAG",
                "index2": "CTGGCCT",
                "Description": "B__Svensson_12_34",
                "Control": "N",
                "Recipe": "151-151",
                "Operator": "Mikael_Johansson",
                "Sample_Project": "B__Svensson_12_34",
            },
            {
                "FCID": "233KCWLT4",
                "Lane": "6",
                "Sample_ID": "P89101_2009",
                "Sample_Name": "P89101_2009",
                "Sample_Ref": "Human (Homo sapiens GRCh38)",
                "index": "AAGCTAA",
                "index2": "CGCAAGG",
                "Description": "B__Svensson_12_34",
                "Control": "N",
                "Recipe": "151-151",
                "Operator": "Mikael_Johansson",
                "Sample_Project": "B__Svensson_12_34",
            },
        ]

        # Extract unique projects from samples and convert to proper format
        unique_project_names = list(set(s["Sample_Project"] for s in samples))
        projects = []
        for project_name in unique_project_names:
            # Replace '__' with '.' in project name
            modified_name = project_name.replace("__", ".")
            # Look up the project ID (P-number)
            project_id = self._get_project_id_by_name(modified_name)
            if project_id:
                projects.append({"name": modified_name, "id": project_id})
            else:
                # If no P-number found, still include the project with name only
                projects.append({"name": modified_name, "id": None})

        data = {
            "flowcell_id": flowcell_id,
            "samples": samples,
            "metadata": {
                "num_samples": len(samples),
                "num_lanes": len(set(s["Lane"] for s in samples)),
                "full_name": None,  # TODO: Fetch from database
                "position": None,  # TODO: Fetch from database
                "instrument": None,  # TODO: Fetch from database
                "run_setup": "2x151",  # TODO: Fetch from database based on Recipe
                "projects": projects,
            },
        }
        self.write(json.dumps(data))

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
