"""
    Handler related to Controls page
"""
from status.util import SafeHandler
from genologics import lims
from genologics.config import BASEURI, USERNAME, PASSWORD

lims = lims.Lims(BASEURI, USERNAME, PASSWORD)

class ControlsHandler(SafeHandler):

    def get(self):
        t = self.application.loader.load('controls.html')

        # get information from databases
        ws_data, ws_name_data = self.worksets_data()
        neg_control_data = self.find_control_data('negative control')
        pos_control_data = self.find_control_data('positive control')

        # create a dictionary with all control data in the correct format
        all_control_data = {}
        all_control_data["negative"] = self.add_workset_project(neg_control_data, ws_data, ws_name_data)
        all_control_data["positive"] = self.add_workset_project(pos_control_data, ws_data, ws_name_data)

        #import pdb; pdb.set_trace()
        # define headers for controls.html
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

        #anything in here is used to create the .html page. In essence, anything listed here can be accessed in /controls.html
        self.write( 
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user(),
                all_control_data = all_control_data, # control_data is a dictionary with the control data, it can be called in the html with the name before the equal sign
                headers=headers,
                ws_data = ws_data,
                lims_uri=BASEURI,
            )
        )

    def find_control_data(self, control_type):
        """Find control data from the couchDB from project/controls view
        """
        from collections import defaultdict
        result = defaultdict(dict)
        controls_view = self.application.projects_db.view("project/controls")

        all_cont_proj = controls_view[[control_type,'']:[control_type,"Z"]]
        for cont_proj in all_cont_proj:
            for cont_sample in cont_proj.value:
                for workset in cont_proj.value[cont_sample]:
                    #if workset == '24-952364':  #24-958480 24-952364
                    #    import pdb; pdb.set_trace()
                    if workset != "no_workset":
                        result[workset]["sample_id"] = cont_sample
                        result[workset]["customer_name"] = cont_proj.value[cont_sample][workset]["customer_name"]
                        if "status_manual" in cont_proj.value[cont_sample][workset]:
                            result[workset]["status_manual"] = cont_proj.value[cont_sample][workset]["status_manual"]
                        else:
                            result[workset]["status_manual"] = "* In Progress" # asterisk indicates that the status in LIMS is not set, the sample has a workset and so MUST be at least "In Progress"
                # passed_sequencing_qc
                # app_qc
                        result[workset]["project"] = cont_proj.key[1]
                
                #if workset == '24-958480': 
                    #import pdb; pdb.set_trace()

                    
                    #import pdb; pdb.set_trace()    
                        result[workset]["workset_name"] = cont_proj.value[cont_sample][workset]["workset_name"]
                        if not "workset_id" in cont_proj.value[cont_sample][workset]:
                           result[workset]["workset_id"] = "NA"
                        else:
                            result[workset]["workset_id"] = cont_proj.value[cont_sample][workset]["workset_id"]
                        if "prep_status" in cont_proj.value[cont_sample][workset]:
                            result[workset]["prep_status"] = cont_proj.value[cont_sample][workset]["prep_status"]
                        else:                            
                            result[workset]["prep_status"] = "" 
                        result[workset]["sequenced_fc"] = cont_proj.value[cont_sample][workset]["sequenced_fc"]
        #print(result)
        return result
    
    def worksets_data(self):
        """retrieves projects for each workset and return a dictionary:
        {[workset_id, workset_name]: [project1, project2, ...]}
        be aware that the workset_id and workset_name are concatenated in the key and that workset_id may not be present in the workset document

        and additional dictionary with only the workset name as key is also returned and can be used in cases were no workset_id is present in the control data:
        {workset_name: [project1, project2, ...]}
        """
        result = {}
        result_just_ws_name = {}

        controls_ws_view = self.application.worksets_db.view("worksets/controls_project_list", descending=True)
        for ws in controls_ws_view:
            result[", ".join(ws.key)] = ws.value
            result_just_ws_name[ws.key[1]] = ws.value

        return result, result_just_ws_name
    
    def add_workset_project(self, control_data, workset_data, workset_name_data):
        """Add workset projects to each control in the control_data dictionary
        """
        for control in control_data:
            #import pdb; pdb.set_trace()
            if control != "no_workset":
                if "workset_id" in control_data[control]:
                    control_ws_id_name = ", ".join([control_data[control]["workset_id"], control_data[control]["workset_name"]])
                else:
                    print("No workset_id in control data")
                if control_ws_id_name in workset_data:
                    control_data[control]["workset_projects"] = workset_data[control_ws_id_name]
                elif control in workset_name_data: #if the sample doesn't have a workset_id I only use the workset name to retrieve the projects of the workset, this will be marked with an asterisk in the html
                    control_data[control]["workset_projects"] = workset_name_data[control_data[control]["workset_name"]] 
                    control_data[control]["ws_name_used_only"] = True # this is used in the html to mark the workset with an asterisk
                else:
                    control_data[control]["ws_not_found"] = True 
        return control_data
            

       