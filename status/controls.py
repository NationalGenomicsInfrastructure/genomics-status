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
        negative_control_data = self.find_control_data('negative control')
        positive_control_data = self.find_control_data('positive control')
        headers = [
            ['Project', 'project'],
            ['Sample ID', 'sample_id'],
            ['Sample Name', 'customer_name'],
            ['Workset', 'workset_name'],
            ['Flowcell(s)', 'sequenced_fc'],
        ]
        self.write( #anything in here is used to create the html. In essence, anything listed here can be accessed in /controls.html
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user(),
                negative_control_data = negative_control_data, # control_data is a dictionary with the control data, it can be called in the html with the name before the equal sign
                positive_control_data = positive_control_data, 
                headers=headers,
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
                    result[cont_sample]["sequenced_fc"] = ", ".join(cont_proj.value[cont_sample]["sequenced_fc"])
        
        return result
            

       