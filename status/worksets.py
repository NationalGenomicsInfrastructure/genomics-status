"""Handlers for worksets"""


import json
from status.util import SafeHandler


class WorksetsDataHandler(SafeHandler):
    """returns basic worksets json"""
    def get(self):
        self.set_header("Content-type", "application/json")
        ws_view= self.application.worksets_db.view("worksets/summary", descending=True)
        result={}
        for row in ws_view:
            result[row.key]=row.value
            result[row.key].pop("_id", None)
            result[row.key].pop("_rev",None)
        self.write(json.dumps(result))

class WorksetsHandler(SafeHandler):

    def get(self, worksets='all'):
        t = self.application.loader.load("worksets.html")
        columns = self.application.genstat_defaults.get('pv_columns')
        self.write(t.generate(columns=columns, worksets=worksets, user=self.get_current_user_name()))

class WorksetDataHandler(SafeHandler):
    def get(self, workset):
        self.set_header("Content-type", "application/json")
        ws_view= self.application.worksets_db.view("worksets/name", descending=True)
        result={}
        for row in ws_view[workset]:
            result[row.key]=row.value
            result[row.key].pop("_id", None)
            result[row.key].pop("_rev", None)
        self.write(json.dumps(result))

class WorksetHandler(SafeHandler):
    def get(self, workset):
        t = self.application.loader.load("workset_samples.html")
        self.write(t.generate(workset_name=workset, user=self.get_current_user_name()))

