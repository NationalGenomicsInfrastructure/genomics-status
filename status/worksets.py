"""Handlers for worksets"""


import json
from status.util import SafeHandler
from genologics import lims
from genologics.entities import Process
from genologics.config import BASEURI, USERNAME, PASSWORD
from collections import OrderedDict
import datetime
from dateutil.relativedelta import relativedelta
from dateutil.parser import parse
from status.projects import RunningNotesDataHandler
from pathlib import Path
import yaml

class WorksetsDataHandler(SafeHandler):
    """returns basic worksets json
       Loaded through /api/v1/worksets
    """
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
    """Loaded through /worksets
       By default shows only worksets form the last 6 months, use the parameter 'all' to show all worksets.
    """
    def worksets_data(self, all=False):
        result={}
        half_a_year_ago = datetime.datetime.now() - relativedelta(months=6)
        ws_view= self.application.worksets_db.view("worksets/summary", descending=True)
        def _get_latest_running_note(val):
            notes = json.loads(val['Workset Notes'])
            latest_note = { max(notes.keys()): notes[max(notes.keys())] }
            return latest_note
        for row in ws_view:
            if all:
                result[row.key]=row.value
                result[row.key].pop("_id", None)
                result[row.key].pop("_rev", None)
                if 'Workset Notes' in row.value:
                    result[row.key]['Workset Notes'] = _get_latest_running_note(row.value)
            else:
                try:
                    if parse(row.value['date_run']) >= half_a_year_ago:
                        result[row.key]=row.value
                        result[row.key].pop("_id", None)
                        result[row.key].pop("_rev", None)
                        if 'Workset Notes' in row.value:
                            result[row.key]['Workset Notes'] = _get_latest_running_note(row.value)
                # Exception that date_run is not available
                except TypeError:
                    continue
        return result

    def get(self):
        # Default is to NOT show all worksets
        all=self.get_argument("all", False)
        t = self.application.loader.load("worksets.html")
        ws_data=self.worksets_data(all=all)
        headers= [['Date Run', 'date_run'],['Workset Name', 'workset_name'], \
                 ['Projects (samples)','projects'],['Sequencing Setup', 'sequencing_setup'], \
                 ['Date finished', 'finish date'],['Operator', 'technician'], \
                 ['Application', 'application'],['Library','library_method'], \
                 ['Samples Passed', 'passed'],['Samples Failed', 'failed'] , \
                 ['Pending Samples', 'unknown'],['Total samples', 'total'], \
                 ['Latest workset note', 'Workset Notes'],['Closed Worksets', 'closed_ws']];
        self.write(t.generate(gs_globals=self.application.gs_globals, worksets=all, user=self.get_current_user(), ws_data=ws_data, headers=headers, all=all))

class WorksetDataHandler(SafeHandler):
    """Loaded through /api/v1/workset/[workset]"""
    def get(self, workset):
        self.set_header("Content-type", "application/json")
        result = self.__class__.get_workset_data(self.application, workset)
        self.write(json.dumps(result))

    @staticmethod
    def get_workset_data(application, workset):
        ws_view = application.worksets_db.view("worksets/name", descending=True)
        result = {}
        for row in ws_view[workset]:
            result[row.key] = row.value
            result[row.key].pop("_id", None)
            result[row.key].pop("_rev", None)
        if not result:
        # Check if the lims id was used
            ws_view = application.worksets_db.view("worksets/lims_id")
            for row in ws_view[workset]:
                result[row.key] = row.value
                result[row.key].pop("_id", None)
                result[row.key].pop("_rev", None)
        for key in result:
            for project in result[key]['projects']:
                result[key]['projects'][project]['samples'] = dict(sorted(result[key]['projects'][project]['samples'].items()))
        return result

class ClosedWorksetsHandler(SafeHandler):
    """ Handles all closed worksets for the closed ws tab
    URL: /api/v1/closed_worksets
    """
    def get(self):
        result = {}
        a_year_ago = datetime.datetime.now() - relativedelta(years=1)
        project_dates_view = self.application.projects_db.view("project/id_name_dates")
        project_dates = dict((row.key, row.value) for row in project_dates_view)
        ws_view = self.application.worksets_db.view("worksets/summary", descending=True)
        for row in ws_view:
            if row.value.get('date_run'):
                if parse(row.value['date_run']) <= a_year_ago:
                    flag = True
                    for project in row.value['projects']:
                        close_date_s = project_dates[project]["close_date"]
                        if close_date_s == "0000-00-00":
                            flag = False
                            break
                        close_date = datetime.datetime.strptime(close_date_s, '%Y-%m-%d')
                        if close_date >= a_year_ago:
                            flag = False
                            break
                    if flag:
                        result[row.key] = row.value
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(result))

class WorksetHandler(SafeHandler):
    """Loaded through /workset/[workset]"""
    def get(self, workset):
        t = self.application.loader.load("workset_samples.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, workset_name=workset, lims_uri=BASEURI, user=self.get_current_user()))

class WorksetSearchHandler(SafeHandler):
    """ Searches Worksetsfor text string
    Loaded through /api/v1/workset_search/([^/]*)$
    """

    last_fetched = None
    cached_list = None

    def get(self, search_string):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.search_workset_names(search_string)))

    def search_workset_names(self, search_string=''):
        if len(search_string) == 0:
            return ''
        worksets = []

        # The list of worksets is cached for speed improvement
        t_threshold = datetime.datetime.now() - relativedelta(minutes=3)
        if WorksetSearchHandler.cached_list is None or \
                WorksetSearchHandler.last_fetched < t_threshold:
            ws_view = self.application.worksets_db.view("worksets/only_name", descending=True)
            WorksetSearchHandler.cached_list = [row.key for row in ws_view]
            WorksetSearchHandler.last_fetched = datetime.datetime.now()

        search_string=search_string.lower()
        for row_key in WorksetSearchHandler.cached_list:
            if search_string in row_key.lower():
                fc = {
                    "url": '/workset/'+row_key,
                    "name": row_key
                }
                worksets.append(fc)

        return worksets

class WorksetNotesDataHandler(SafeHandler):
    """Serves all notes from a given workset.
    It connects to LIMS to fetch and update Workset Notes information.
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
        for k, v in sorted(workset_notes.items(), key=lambda t: t[0], reverse=True):
            sorted_workset_notes[k] = v
        self.write(sorted_workset_notes)

    def post(self, workset):
        note = self.get_argument('note', '')
        user = self.get_current_user()
        category = self.get_argument('category', 'Workset')

        if category == '':
            category = 'Workset'

        workset_data = WorksetDataHandler.get_workset_data(self.application, workset)

        projects = list(workset_data[workset]['projects'])
        workset_name = workset_data[workset]['name']

        if not note:
            self.set_status(400)
            self.finish('<html><body>No workset id or note parameters found</body></html>')
        else:
            newNote = {'user': user.name, 'email': user.email, 'note': note, 'category': category}
            p = Process(self.lims, id=workset)
            p.get(force=True)
            workset_notes = json.loads(p.udf['Workset Notes']) if 'Workset Notes' in p.udf else {}
            workset_notes[str(datetime.datetime.now())] = newNote
            p.udf['Workset Notes'] = json.dumps(workset_notes)
            p.put()

            # Save the running note in statusdb per workset as well to be able
            # to quickly show it in the worksets list
            v = self.application.worksets_db.view("worksets/lims_id", key=workset)
            doc_id = v.rows[0].id
            doc = self.application.worksets_db.get(doc_id)
            doc['Workset Notes'] = json.dumps(workset_notes)
            self.application.worksets_db.save(doc)

            workset_link = '<a class="text-decoration-none" href="/workset/{0}">{0}</a>'.format(workset_name)
            project_note = "#####*Running note posted on workset {}:*\n".format(workset_link)
            project_note += note
            for project_id in projects:
                RunningNotesDataHandler.make_project_running_note(
                    self.application, project_id,
                    project_note, category,
                    user.name, user.email
                )

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
        Links are stored as JSON in LIMS / project
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
        for k, v in sorted(links.items(), key=lambda t: t[0], reverse=True):
            sorted_links[k] = v
        sorted_links = OrderedDict(sorted(sorted_links.items(), key=lambda k : k[1]['type']))
        self.write(sorted_links)

    def post(self, lims_step):
        user = self.get_current_user()
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
            links[str(datetime.datetime.now())] = {'user': user.name,
                                                   'email': user.email,
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

class WorksetPoolsHandler(SafeHandler):
    """ Serves all the samples that need to be added to worksets in LIMS
    URL: /api/v1/workset_pools
    """
    def get(self):
        import psycopg2
        limsbackend_cred_loc = Path(self.settings['lims_backend_credential_location']).expanduser()
        with limsbackend_cred_loc.open() as cred_file:
            lims_conf = yaml.safe_load(cred_file)

        queues = {}
        queues['TruSeqRNAprep'] = '311'
        queues['TruSeqRNAprepV2'] = '2301'
        queues['TruSeqSmallRNA'] = '410'
        queues['TruSeqDNAPCR_free'] = '407'
        queues['ThruPlex'] = '451'
        queues['Genotyping'] = '901'
        queues['RadSeq'] = '1201'
        queues['SMARTerPicoRNA'] = '1551'
        queues['ChromiumGenomev2'] = '1801'


        methods = queues.keys()
        projects = self.application.projects_db.view("project/project_id")
        connection = psycopg2.connect(user=lims_conf['username'], host=lims_conf['url'],
                                        database=lims_conf['db'], password=lims_conf['password'])
        cursor = connection.cursor()
        pools = {}

        for method in methods:
            pools[method] ={}
            query = ('select art.artifactid, art.name, st.lastmodifieddate, st.generatedbyid '
                            'from artifact art, stagetransition st where art.artifactid=st.artifactid and '
                            'st.stageid in (select stageid from stage where stepid={}) and '
                            'st.completedbyid is null and st.workflowrunid>0;'.format(queues[method]))
            cursor.execute(query)
            records = cursor.fetchall()
            for record in list(records):
                project = record[1].split('_')[0]
                requeued = False
                if record[3] is None:
                    requeued =True
                if project in pools[method]:
                    pools[method][project]['samples'].append((record[1], requeued))
                    if parse(pools[method][project]['oldest_sample_queued_date']) > record[2]:
                        pools[method][project]['oldest_sample_queued_date'] = record[2].isoformat()
                else:
                    proj_doc = self.application.projects_db.get(projects[project].rows[0].value)
                    total_num_samples = proj_doc['no_of_samples']
                    oldest_sample_queued_date = record[2].isoformat()
                    projName = proj_doc['project_name']
                    protocol = proj_doc['details']['library_construction_method']
                    latest_running_note = self._get_latest_running_note(proj_doc['details']['running_notes'])
                    pools[method][project] = {'samples': [(record[1], requeued)], 'total_num_samples': total_num_samples,
                                                'oldest_sample_queued_date': oldest_sample_queued_date, 'pname': projName,
                                                'protocol': protocol, 'latest_running_note': latest_running_note}

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(pools))

    def _get_latest_running_note(self, val):
        notes = json.loads(val)
        latest_note = { max(notes.keys()): notes[max(notes.keys())] }
        return latest_note
