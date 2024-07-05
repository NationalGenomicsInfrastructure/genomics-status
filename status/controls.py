"""Handlers related to test for controls
"""
from status.util import SafeHandler

class ControlsHandler(SafeHandler):

    def get(self):
        t = self.application.loader.load('controls.html')
        ws_data, ws_name_data = self.worksets_data()
        neg_control_data = self.find_control_data('negative control')
        pos_control_data = self.find_control_data('positive control')

        negative_control_data = self.add_workset_project(neg_control_data, ws_data, ws_name_data)
        positive_control_data = self.add_workset_project(pos_control_data, ws_data, ws_name_data)
        #print(negative_control_data)
        headers = [
            ['Project', 'project'],
            ['Sample ID', 'sample_id'],
            ['Sample Name', 'customer_name'],
            ['Sample Status', 'status_manual'],
            ['Workset', 'workset_name'],
            ['Workset Projects', 'workset_projects'],
            ['Library Prep Status', 'prep_status'],
            ['Flowcell(s)', 'sequenced_fc'],
        ]

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
        """Find control data from the couchDB from project/controls view
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
                    if "status_manual" in cont_proj.value[cont_sample]:
                        result[cont_sample]["status_manual"] = cont_proj.value[cont_sample]["status_manual"]
                    else:
                        result[cont_sample]["status_manual"] = "* In Progress" # asterisk indicates that the status in LIMS is not set, the sample has a workset and so MUST be at least "In Progress"
                    result[cont_sample]["customer_name"] = cont_proj.value[cont_sample]["customer_name"]
                    result[cont_sample]["workset_name"] = cont_proj.value[cont_sample]["workset_name"]
                    if not "workset_id" in cont_proj.value[cont_sample]:
                        result[cont_sample]["workset_id"] = "NA"
                    else:
                        result[cont_sample]["workset_id"] = cont_proj.value[cont_sample]["workset_id"]
                    if "prep_status" in cont_proj.value[cont_sample]:
                        result[cont_sample]["prep_status"] = cont_proj.value[cont_sample]["prep_status"]
                    else:
                        result[cont_sample]["prep_status"] = "" 
                    result[cont_sample]["sequenced_fc"] = cont_proj.value[cont_sample]["sequenced_fc"]
        return result
    
    def worksets_data(self):
        """get projects for each workset and return a dictionary:
        {workset_id, workset_name: [project1, project2, ...]}
        be aware that the workset_id and workset_name are concatenated in the key and that workset_id may not be present in the workset document

        and additional dictionary with only the workset name as key is also returned and can be used in cases were no workset_id is present in the control data:
        {workset_name: [project1, project2, ...]}
        """
        result = {}
        result_just_ws_name = {}
        ws_view = self.application.worksets_db.view("worksets/summary", descending=True)

        for ws in ws_view:
            ws_id_name = [ws.value["id"], ws.key]
            dic_ws_project_names = {}
            ws_project_names = []
            ws_project_number = []

            for project_id in ws.value["projects"]:
                ws_project_names.append(ws.value["projects"][project_id]["project_name"])   # ordered list
                ws_project_number.append(project_id)                                        # same order as project names
            
            dic_ws_project_names["ws_project_names"] = ws_project_names
            dic_ws_project_names["ws_project_numbers"] = ws_project_number
            result[", ".join(ws_id_name)] = dic_ws_project_names
            result_just_ws_name[ws.key] = dic_ws_project_names
        return result, result_just_ws_name
    
    def add_workset_project(self, control_data, workset_data, workset_name_data):
        """Add workset projects to each control in the control_data dictionary
        """
        for control in control_data:
            control_ws_id_name = ", ".join([control_data[control]["workset_id"], control_data[control]["workset_name"]])
            if control_ws_id_name in workset_data:
                control_data[control]["workset_projects"] = workset_data[control_ws_id_name]
            else: #if the sample doesn't have a workset_id I only use the workset name to retrieve the projects of the workset, this will be marked with an asterisk in the html
                control_data[control]["workset_projects"] = workset_name_data[control_data[control]["workset_name"]] 
                control_data[control]["ws_name_used_only"] = True # this is used in the html to mark the workset with an asterisk
        return control_data
            

       