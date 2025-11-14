"""Handlers for samplesheet editor functionality."""

import json

from status.util import SafeHandler


class SamplesheetEditorHandler(SafeHandler):
    """Serves the samplesheet editor page."""

    def get(self):
        t = self.application.loader.load("samplesheet_editor.html")
        self.write(
            t.generate(
                user=self.get_current_user(),
                gs_globals=self.application.gs_globals,
            )
        )


class SamplesheetDataHandler(SafeHandler):
    """Serves samplesheet data via API."""

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
