"""
Handler related to Controls page
"""

from genologics.config import BASEURI

from status.util import SafeHandler


class ControlsHandler(SafeHandler):
    def get(self):
        t = self.application.loader.load("controls.html")

        # get information from databases
        ws_data, ws_name_data = self.worksets_data()
        all_control_data = {}
        for control_data_type in ["negative", "positive"]:
            all_control_data[control_data_type] = self.collect_control_info(
                control_data_type, ws_data, ws_name_data
            )

        # define headers for controls.html
        headers = [
            ["Project", "project"],
            ["Sample ID", "sample_id"],
            ["Sample Name", "customer_name"],
            ["Sample Status", "status_manual"],
            ["Workset", "workset_name"],
            ["Workset Projects", "workset_projects"],
            ["Library Prep Status", "prep_status"],
            ["Flowcell(s)", "sequenced_fc"],
        ]

        # anything in here is used to create the .html page. In essence, anything listed here can be accessed in /controls.html
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
                all_control_data=all_control_data,  # control_data is a dictionary with the control data, it can be called in the html with the name before the equal sign
                headers=headers,
                ws_data=ws_data,
                lims_uri=BASEURI,
            )
        )

    def find_control_data(self, control_type):
        """Find control data from the couchDB from project/controls view"""
        from collections import defaultdict

        result = defaultdict(dict)
        all_cont_proj = self.application.cloudant.post_view(
            db="projects",
            ddoc="project",
            view="controls",
            start_key=[control_type, ""],
            end_key=[control_type, "Z"],
        ).get_result()["rows"]
        for cont_proj in all_cont_proj:
            for cont_sample in cont_proj["value"]:
                for workset in cont_proj[
                    "value"
                ][
                    cont_sample
                ]:  # here we create one entry in result for each workset, this will be one line in the controls table
                    if workset != "no_workset":
                        workset_sample_id = workset + cont_sample
                        result[workset_sample_id]["sample_id"] = cont_sample
                        result[workset_sample_id]["customer_name"] = cont_proj["value"][
                            cont_sample
                        ][workset]["customer_name"]
                        if (
                            "status_manual" in cont_proj["value"][cont_sample][workset]
                        ):  # status originates from LIMS project overview, is often not set for controls
                            result[workset_sample_id]["status_manual"] = cont_proj[
                                "value"
                            ][cont_sample][workset]["status_manual"]
                        else:
                            result[workset_sample_id]["status_manual"] = (
                                "* In Progress"  # asterisk indicates that the status in LIMS is not set, the sample has a workset and so MUST be at least "In Progress"
                            )
                        result[workset_sample_id]["project"] = cont_proj["key"][1]
                        result[workset_sample_id]["workset_name"] = cont_proj["value"][
                            cont_sample
                        ][workset]["workset_name"]
                        if "workset_id" in cont_proj["value"][cont_sample][workset]:
                            result[workset_sample_id]["workset_id"] = cont_proj[
                                "value"
                            ][cont_sample][workset]["workset_id"]
                        else:
                            result[workset_sample_id]["workset_id"] = "NA"
                        if "prep_status" in cont_proj["value"][cont_sample][workset]:
                            result[workset_sample_id]["prep_status"] = cont_proj[
                                "value"
                            ][cont_sample][workset]["prep_status"]
                        else:
                            result[workset_sample_id]["prep_status"] = ""
                        result[workset_sample_id]["sequenced_fc"] = cont_proj["value"][
                            cont_sample
                        ][workset]["sequenced_fc"]
        return result

    def worksets_data(self):
        """retrieves projects for each workset and return a dictionary:
        {"P.roject_00_01": "P12346" , "P.roject_00_02": "P23456", ...}
        be aware that the workset_id and workset_name are concatenated in the key and that workset_id may not be present in the workset document.

        an additional dictionary with only the workset name as key is also returned and can be used in cases were no workset_id is present in the control data:
        {"P.roject_00_01": "P12346" , "P.roject_00_02": "P23456", ...}
        """
        result = {}
        result_just_ws_name = {}

        controls_ws_view = self.application.cloudant.post_view(
            db="worksets",
            ddoc="worksets",
            view="controls_project_list",
            descending=True,
        ).get_result()["rows"]
        for ws in controls_ws_view:
            result[", ".join(ws["key"])] = ws["value"]
            result_just_ws_name[ws["key"][1]] = ws["value"]
        return result, result_just_ws_name

    def collect_control_info(self, control_type, workset_data, workset_name_data):
        """
        - Get control data from couchDB via the function find_control_data
        - Add workset projects to each control in the control_data dictionary
        """
        control_data = self.find_control_data(control_type + " control")
        for control in control_data:
            if control != "no_workset":
                if "workset_id" in control_data[control]:
                    control_ws_id_name = ", ".join(
                        [
                            control_data[control]["workset_id"],
                            control_data[control]["workset_name"],
                        ]
                    )
                if control_ws_id_name in workset_data:
                    control_data[control]["workset_projects"] = workset_data[
                        control_ws_id_name
                    ]
                elif (
                    control in workset_name_data
                ):  # if the sample doesn't have a workset_id I only use the workset name to retrieve the projects of the workset
                    control_data[control]["workset_projects"] = workset_name_data[
                        control_data[control]["workset_name"]
                    ]
                else:
                    control_data[control]["ws_not_found"] = True
        return control_data
