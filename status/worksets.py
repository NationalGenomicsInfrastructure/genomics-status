"""Handlers for worksets"""


import json
from status.util import SafeHandler


class WorksetsDataHandler(SafeHandler):
    """returns basic worksets json
       Loaded through /api/v1/worksets """
    def get(self):
        self.set_header("Content-type", "application/json")
        ws_view= self.application.worksets_db.view("worksets/summary", descending=True)
        result={}
        for row in ws_view:
            result[row.key]=row.value
            result[row.key].pop("_id", None)
            result[row.key].pop("_rev", None)
        self.write(json.dumps(result))

class WorksetsHandler(SafeHandler):
    """Loaded through /worksets"""
    def get(self, worksets='all'):
        t = self.application.loader.load("worksets.html")
        columns = self.application.genstat_defaults.get('pv_columns')
        self.write(t.generate(columns=columns, worksets=worksets, user=self.get_current_user_name()))

class WorksetDataHandler(SafeHandler):
    """Loaded through /api/v1/workset/[workset]"""
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
    """Loaded through /workset/[workset]"""
    def get(self, workset):
        t = self.application.loader.load("workset_samples.html")
        self.write(t.generate(workset_name=workset, user=self.get_current_user_name()))

class WorksetSearchHandler(SafeHandler):
    """ Searches Worksetsfor text string
    Loaded through /api/v1/workset_search/([^/]*)$
    """
    def get(self, search_string):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.search_workset_names(search_string)))

    def search_workset_names(self, search_string=''):
        if len(search_string) == 0:
            return ''
        worksets = []
        ws_view = self.application.worksets_db.view("worksets/name")
        for row in ws_view:
            try:
                if search_string.lower() in row.key.lower():
                    fc = {
                        "url": '/workset/'+row.key,
                        "name": row.key
                    }
                    worksets.append(fc);
            except AttributeError:
                pass
        return worksets
