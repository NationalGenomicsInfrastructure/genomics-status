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
    def worksets_data(self):
        ws_view= self.application.worksets_db.view("worksets/summary", descending=True)
        result={}
        for row in ws_view:
            result[row.key]=row.value
            result[row.key].pop("_id", None)
            result[row.key].pop("_rev", None)
        return result

    def get(self, worksets='all'):
        t = self.application.loader.load("worksets.html")
        ws_data=self.worksets_data()
        headers= [['Date Run', 'date_run'],['Workset Name', 'workset_name'], \
                 ['Projects (samples)','projects'], ['Sequencing Setup', 'sequencing_setup'], \
                 ['Date finished', 'finish date'],['Operator', 'technician'],\
                 ['Application', 'application'], ['Library','library_method'], \
                 ['Samples Passed', 'passed'],['Samples Failed', 'failed'], \
                 ['Pending Samples', 'unknown'], ['Total samples', 'total']];
        self.write(t.generate(gs_globals=self.application.gs_globals, worksets=worksets, user=self.get_current_user_name(), ws_data=ws_data,headers=headers))

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

class WorksetLinksHandler(SafeHandler):
    """ Serves external links for each project
        Links are stored as JSON in genologics LIMS / project
        URL: /api/v1/workset_links/([^/]*)
    """

    lims = lims.Lims(BASEURI, USERNAME, PASSWORD)
    def get(self, lims_step):
        self.set_header("Content-type", "application/json")
        p = Process(self.lims, id=lims_step)
        p.get(force=True)

        links = json.loads(p.udf['Links']) if 'Links' in p.udf else {}

        #Sort by descending date, then hopefully have deviations on top
        sorted_links = OrderedDict()
        for k, v in sorted(links.iteritems(), key=lambda t: t[0], reverse=True):
            sorted_links[k] = v
        sorted_links = OrderedDict(sorted(sorted_links.iteritems(), key=lambda (k,v): v['type']))
        self.write(sorted_links)

    def post(self, lims_step):
        user = self.get_secure_cookie('user')
        email = self.get_secure_cookie('email')
        a_type = self.get_argument('type', '')
        title = self.get_argument('title', '')
        url = self.get_argument('url', '')
        desc = self.get_argument('desc','')

        if not a_type or not title:
            self.set_status(400)
            self.finish('<html><body>Link title and type is required</body></html>')
        else:
            p = Process(self.lims, id=lims_step)
            p.get(force=True)
            links = json.loads(p.udf['Links']) if 'Links' in p.udf else {}
            links[str(datetime.datetime.now())] = {'user': user,
                                                   'email': email,
                                                   'type': a_type,
                                                   'title': title,
                                                   'url': url,
                                                   'desc': desc}
            p.udf['Links'] = json.dumps(links)
            p.put()
            self.set_status(200)
            #ajax cries if it does not get anything back
            self.set_header("Content-type", "application/json")
            self.finish(json.dumps(links))
