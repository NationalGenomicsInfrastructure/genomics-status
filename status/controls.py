"""Handlers related to test for controls
"""
from __future__ import print_function
import subprocess
import tornado.web
import json
from datetime import datetime
from dateutil import parser
from collections import Counter
from status.util import SafeHandler
import re

class ControlsHandler(SafeHandler):

    def get(self):
        t = self.application.loader.load('controls.html')
        ws_data, ws_name_data = self.worksets_data()
        neg_control_data = self.find_control_data('negative control')
        pos_control_data = self.find_control_data('positive control')

        #print(neg_control_data)

        negative_control_data = self.add_workset_project(neg_control_data, ws_data, ws_name_data)
        positive_control_data = self.add_workset_project(pos_control_data, ws_data, ws_name_data)

        #print(positive_control_data)
        #print(negative_control_data)
        headers = [
            ['Project', 'project'],
            ['Sample ID', 'sample_id'],
            ['Sample Name', 'customer_name'],
            ['Workset', 'workset_name'],
            ['Workset Projects', 'workset_projects'],
            ['Flowcell(s)', 'sequenced_fc'],
        ]
        #print(headers)
        self.write( #anything in here is used to create the html. In essence, anything listed here can be accessed in /controls.html
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user(),
                negative_control_data = negative_control_data, # control_data is a dictionary with the control data, it can be called in the html with the name before the equal sign
                positive_control_data = positive_control_data, 
                headers=headers,
                ws_data = ws_data,
            )
        )

    def find_control_data(self, control_type):
        """Find control data from the database
        """
        from collections import defaultdict
        result = {}
        result = defaultdict(dict)
        controls_view = self.application.projects_db.view("project/controls")

        all_cont_proj = controls_view[[control_type,'']:[control_type,"Z"]]

        for cont_proj in all_cont_proj:
            cont_proj_details = cont_proj.value
            for cont_sample in cont_proj_details:
                if "workset_name" in cont_proj.value[cont_sample]:
                    result[cont_sample]["project"] = cont_proj.key[1]
                    result[cont_sample]["sample_id"] = cont_sample
                    result[cont_sample]["customer_name"] = cont_proj.value[cont_sample]["customer_name"]
                    result[cont_sample]["workset_name"] = cont_proj.value[cont_sample]["workset_name"]
                    if not "workset_id" in cont_proj.value[cont_sample]:
                        result[cont_sample]["workset_id"] = "NA"
                    else:
                        result[cont_sample]["workset_id"] = cont_proj.value[cont_sample]["workset_id"]
                    result[cont_sample]["sequenced_fc"] = ", ".join(cont_proj.value[cont_sample]["sequenced_fc"])
        
        return result
    
    def worksets_data(self):
        """get projects for each workset and return a dictionary:
        {workset_id, workset_name: [project1, project2, ...]}
        be aware that the workset_id and workset_name are concatenated in the key and that workset_id may not be present in the workset document
        """
        result = {}
        result_just_ws_name = {}
        ws_view = self.application.worksets_db.view("worksets/summary", descending=True)

        for ws in ws_view:
            ws_id_name = [ws.value["id"], ws.key]
            ws_projects = []
            for project in ws.value["projects"]:
                ws_projects.append(ws.value["projects"][project]["project_name"])
            
            result[", ".join(ws_id_name)] = ws_projects
            result_just_ws_name[ws.key] = ws_projects
        return result, result_just_ws_name
    
    def add_workset_project(self, control_data, workset_data, workset_name_data):
        """Add workset projects to each control in the control_data dictionary
        """
        for control in control_data:
            control_ws_id_name = ", ".join([control_data[control]["workset_id"], control_data[control]["workset_name"]])
            if control_ws_id_name in workset_data:
                control_data[control]["workset_projects"] = ", ".join(workset_data[control_ws_id_name])
            else: #if the sample doesn't have a workset_id I only use the workset name to retrieve the projects of the workset
                print(workset_name_data[control_data[control]["workset_name"]])
                control_data[control]["workset_projects"] = " ".join(["*", ", ".join(workset_name_data[control_data[control]["workset_name"]])]) # asterisk indicates that workset name only is used to retrieve workset projects
        return control_data
            

       