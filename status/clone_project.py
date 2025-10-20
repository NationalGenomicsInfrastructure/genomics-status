import re

import requests
from genologics import lims
from genologics.config import BASEURI, PASSWORD, USERNAME
from genologics.entities import Project

from status.util import SafeHandler


class CloneProjectHandler(SafeHandler):
    """Serves a page with to clone projects in LIMS
    URL: /clone_project
    """

    def get(self):
        t = self.application.loader.load("clone_project.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class LIMSProjectCloningHandler(SafeHandler):
    """Gets and posts the project data from LIMS for cloning it
    URL: /api/v1/lims_project_data/([^/]*)$
    """

    def get(self, project_identifier):
        projectid = self.get_project_id(project_identifier)
        if not projectid:
            self.set_status(404)
            return self.write({"error": "Project not found"})

        proj_values = self.get_project_data_from_lims(projectid, "get")
        if not proj_values:
            self.set_status(404)
            self.write({"error": "Project not found"})
            return

        self.set_header("Content-type", "application/json")
        self.write(proj_values)

    def post(self, project_identifier):
        if not (
            self.get_current_user().is_proj_coord
            or self.get_current_user().is_any_admin
        ):
            self.set_status(401)
            return self.write(
                "Error: You do not have the permissions for this operation!"
            )

        projectid = self.get_project_id(project_identifier)
        if not projectid:
            self.set_status(404)
            return self.write({"error": "Project not found"})

        new_proj = self.get_project_data_from_lims(projectid, "post")
        if "error" in new_proj:
            self.set_status(400)
            self.write({"error": new_proj["error"]})
            return

        self.set_status(201)
        self.write(new_proj)

    def get_project_data_from_lims(self, projectid, req_type):
        copy_udfs = {
            "Customer project reference",
            "Project Comment",
            "Type",
            "Application",
            "Reference genome",
            "Library construction method",
            "Sequencing setup",
            "Accredited (Data Analysis)",
            "Accredited (Data Processing)",
            "Accredited (Library Preparation)",
            "Accredited (Sequencing)",
            "Delivery type",
            "Agreement cost",
            "Invoice Reference",
            "Customer Project Description",
            "Project category",
            "Sample type",
            "Sample units ordered",
            "Library type (ready-made libraries)",
            "Sequence units ordered (lanes)",
            "Sequencing platform",
            "Flowcell",
            "Custom Primer",
            "Low Diversity",
            "Best practice bioinformatics",
            "Funding agency",
            "Project coordinator",
            "Library prep option",
            "Flowcell",
            "Organism",
            "PhiX spike-in (percent)",
            "Flowcell option",
            "Ethics permit number",
        }

        lims_instance = lims.Lims(BASEURI, USERNAME, PASSWORD)
        uri = lims_instance.get_uri(f"projects/{projectid}")
        existing_project = Project(lims=lims_instance, uri=uri)
        proj_values = {}
        try:
            proj_values["name"] = existing_project.name
        except requests.exceptions.HTTPError:
            return {}

        proj_values["researcher_id"] = existing_project.researcher.id
        proj_values["Client"] = existing_project.researcher.name
        proj_values["Account"] = existing_project.researcher.lab.name

        udfs = {}
        for udf in copy_udfs:
            if udf in existing_project.udf:
                udfs[udf] = existing_project.udf[udf]
        proj_values["udfs"] = udfs

        if req_type == "get":
            return proj_values

        else:
            new_name = existing_project.name + "_CLONE"
            check_if_new_name_exists = lims_instance.get_projects(name=new_name)

            if check_if_new_name_exists:
                return {"error": f"A project with the name {new_name} already exists"}

            proj_values["name"] = new_name
            proj_values["researcher"] = existing_project.researcher

            return self.create_project_in_lims(proj_values)

    def get_project_id(self, project_identifier):
        """Return projectid for the provided identifier"""
        # Check if the project_identifier matches a project id.
        # If not, assuming it's a project name, try to get the project id from the project name,
        # since the LIMS API only accepts project ids
        projectid = None
        if re.match("^(P[0-9]{3,7})", project_identifier):
            projectid = project_identifier
        else:
            try:
                projectid = self.application.cloudant.post_view(
                    db="projects",
                    ddoc="name_to_id",
                    view="name_to_id",
                    key=project_identifier,
                ).get_result()["rows"][0]["value"]
            except IndexError:
                pass
        return projectid

    @staticmethod
    def create_project_in_lims(proj_values):
        """Create a new project in LIMS and return the project id and name"""
        lims_instance = lims.Lims(BASEURI, USERNAME, PASSWORD)

        try:
            new_project = Project.create(
                lims_instance,
                udfs=proj_values["udfs"],
                name=proj_values["name"],
                researcher=proj_values["researcher"],
            )
        except requests.exceptions.HTTPError as e:
            return {"error": e.message}

        return {"project_id": new_project.id, "project_name": new_project.name}
