"""Handlers for worksets"""


import json
from status.util import SafeHandler
from genologics import lims
from genologics.entities import Process
from genologics.config import BASEURI, USERNAME, PASSWORD
from collections import OrderedDict
import datetime


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
        self.write(t.generate(gs_globals=self.application.gs_globals, columns=columns, worksets=worksets, user=self.get_current_user_name()))

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
        self.write(t.generate(gs_globals=self.application.gs_globals, workset_name=workset, user=self.get_current_user_name()))

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

class WorksetNotesDataHandler(SafeHandler):
    """Serves all notes from a given workset.
    It connects to the genologics LIMS to fetch and update Workset Notes information.
    URL: /api/v1/workset_notes/([^/]*)
    """
    lims = lims.Lims(BASEURI, USERNAME, PASSWORD)
    def get(self, workset):
        self.set_header("Content-type", "application/json")
        p = Process(self.lims, id=workset)
        p.get(force=True)
        # Sorted running notes, by date
        workset_notes = json.loads(p.udf['Workset Notes']) if 'Workset Notes' in p.udf else {}
        sorted_workset_notes = OrderedDict()
        for k, v in sorted(workset_notes.iteritems(), key=lambda t: t[0], reverse=True):
            sorted_workset_notes[k] = v
        self.write(sorted_workset_notes)

    def post(self, workset):
        note = self.get_argument('note', '')
        user = self.get_secure_cookie('user')
        email = self.get_secure_cookie('email')
        if not note:
            self.set_status(400)
            self.finish('<html><body>No workset id or note parameters found</body></html>')
        else:
            newNote = {'user': user, 'email': email, 'note': note}
            p = Process(self.lims, id=workset)
            p.get(force=True)
            workset_notes = json.loads(p.udf['Workset Notes']) if 'Workset Notes' in p.udf else {}
            workset_notes[str(datetime.datetime.now())] = newNote
            p.udf['Workset Notes'] = json.dumps(workset_notes)
            p.put()
            self.set_status(201)
            self.write(json.dumps(newNote))
    def delete(self, workset):
        note_id=self.get_argument('note_id')
        p = Process(self.lims, id=workset)
        p.get(force=True)
        workset_notes = json.loads(p.udf['Workset Notes']) if 'Workset Notes' in p.udf else {}
        try:
            self.set_header("Content-type", "application/json")
            del workset_notes[note_id]
            p.udf['Workset Notes'] = json.dumps(workset_notes)
            p.put()
            self.set_status(201)
            self.write(json.dumps(workset_notes))
        except:
            self.set_status(400)
            self.finish('<html><body>No note found</body></html>')
