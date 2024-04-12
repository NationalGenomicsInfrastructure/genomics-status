

import requests
from status.util import SafeHandler

from genologics import lims
from genologics.entities import Project
from genologics.config import BASEURI, USERNAME, PASSWORD


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

    def get(self, projectid):
        
        proj_values = self.get_project_data(projectid, 'get')
        if not proj_values:
            self.set_status(404)
            self.write({"error": "Project not found"})
            return
        self.set_header("Content-type", "application/json")
        self.write(proj_values)
    
    def post(self, projectid):
        
        if not self.get_current_user().is_proj_coord:
            self.set_status(401)
            return self.write(
                "Error: You do not have the permissions for this operation!"
            )
        
        new_proj = self.get_project_data(projectid, 'post')
        if 'error' in new_proj:
            self.set_status(400)
            self.write({"error": new_proj['error']})
            return
        
        self.set_status(201)
        self.write(new_proj)
    
    def get_project_data(self, projectid, type):
        copy_udfs = {
                      "Customer project reference", "Project Comment", "Type", "Application", "Reference genome",
                      "Library construction method", "Sequencing setup", "Accredited (Data Analysis)", 
                      "Accredited (Data Processing)", "Accredited (Library Preparation)", "Accredited (Sequencing)", "Delivery type",
                      "Agreement cost", "Invoice Reference", "Customer Project Description", "Project category", "Sample type",
                      "Sample units ordered", "Library type (ready-made libraries)", "Sequence units ordered (lanes)", "Sequencing platform",
                      "Flowcell", "Custom Primer", "Low Diversity", "Best practice bioinformatics", "Funding agency", "Project coordinator",
                      "Library prep option", "Flowcell", "Organism", "PhiX spike-in (percent)", "Flowcell option", "Ethics permit number"
                      }

        lims_instance = lims.Lims(BASEURI, USERNAME, PASSWORD)
        uri = lims_instance.get_uri(f"projects/{projectid}")
        existing_project = Project(lims=lims_instance, uri=uri)
        proj_values = {}
        try:
            proj_values['name'] = existing_project.name
        except requests.exceptions.HTTPError:
            return {}
        
        proj_values["researcher_id"] = existing_project.researcher.id
        proj_values["Client"] = existing_project.researcher.name
        proj_values["Account"] = existing_project.researcher.lab.name

        udfs = {}
        for udf in copy_udfs:
            if udf in existing_project.udf:
                udfs[udf] = existing_project.udf[udf]
        proj_values['udfs'] = udfs

        if type=='get':
            return proj_values
        
        else:
            try:
                new_project = Project.create(lims_instance, udfs=proj_values['udfs'], name=existing_project.name + '_CLONE',
                                                researcher=existing_project.researcher)
            except requests.exceptions.HTTPError as e:
                return {'error': e.message}

            return {'project_id': new_project.id, 'project_name': new_project.name}
            


