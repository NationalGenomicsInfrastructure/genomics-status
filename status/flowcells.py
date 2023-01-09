"""Set of handlers related with Flowcells
"""

import tornado.web
import json
import datetime
import re
import pandas as pd
from dateutil.relativedelta import relativedelta

from genologics.entities import Container
from genologics import lims
from genologics.config import BASEURI, USERNAME, PASSWORD
from collections import OrderedDict
from status.util import SafeHandler
from status.projects import RunningNotesDataHandler
from status.flowcell import FlowcellHandler, add_prefix

lims = lims.Lims(BASEURI, USERNAME, PASSWORD)

thresholds = {
    'HiSeq X': 320,
    'RapidHighOutput': 188,
    'HighOutput': 143,
    'RapidRun': 114,
    'MiSeq Version3': 18,
    'MiSeq Version2': 10,
    'MiSeq Version2Nano': 0.75,
    'NovaSeq SP': 325,
    'NovaSeq S1': 650,
    'NovaSeq S2': 1650,
    'NovaSeq S4': 2000,
    'NextSeq Mid' : 25,
    'NextSeq High' : 75,
    'NextSeq 2000 P1' : 100,
    'NextSeq 2000 P2' : 400,
    'NextSeq 2000 P3' : 1100
}

def formatDate(date):
    datestr=datetime.datetime.strptime(date, "%Y-%m-%d %H:%M:%S.%f")
    return datestr.strftime("%a %b %d %Y, %I:%M:%S %p")

class FlowcellsHandler(SafeHandler):
    """ Serves a page which lists all flowcells with some brief info.
    By default shows only flowcells form the last 6 months, use the parameter
    'all' to show all flowcells.
    """
    def list_flowcells(self, all=False):
        flowcells = OrderedDict()
        temp_flowcells = {}
        if all:
            fc_view = self.application.flowcells_db.view("info/summary",
                                                        descending=True)
            for row in fc_view:
                temp_flowcells[row.key] = row.value

            xfc_view = self.application.x_flowcells_db.view("info/summary",
                                                            descending=True)
        else:
            # fc_view are from 2016 and older so only include xfc_view here
            half_a_year_ago = (datetime.datetime.now() - relativedelta(months=6)).strftime("%y%m%d")
            xfc_view = self.application.x_flowcells_db.view("info/summary",
                                                            descending=True,
                                                            endkey=half_a_year_ago)
        for row in xfc_view:
            try:
                row.value['startdate'] = datetime.datetime.strptime(row.value['startdate'], "%y%m%d").strftime("%Y-%m-%d")
            except ValueError:
                try:
                    row.value['startdate'] = datetime.datetime.strptime(row.value['startdate'], "%Y-%m-%dT%H:%M:%SZ").strftime("%Y-%m-%d")
                except ValueError:
                    row.value['startdate'] = datetime.datetime.strptime(row.value['startdate'].split()[0], "%m/%d/%Y").strftime("%Y-%m-%d")

            # Lanes were previously in the wrong order
            row.value['lane_info'] = OrderedDict(sorted(row.value['lane_info'].items()))
            temp_flowcells[row.key] = row.value

        return OrderedDict(sorted(temp_flowcells.items(), reverse=True))

    def list_ont_flowcells(self):
        ont_flowcells = OrderedDict()
        view_all = self.application.nanopore_runs_db.view("info/all_stats", descending=True)
        view_status = self.application.nanopore_runs_db.view("info/run_status", descending=True)
        view_project = self.application.projects_db.view("project/id_name_dates", descending=True)

        for row in view_status:

            if row.value == "finished":
                name = row.key.split("/")[-1]
                d = view_all[name].rows[0].value
                for k in d:
                    try:
                        d[k] = int(d[k])
                    except ValueError:
                        pass

            elif row.value == "ongoing":
                name = row.key.split("/")[-1]
                d = {}
                d["TACA_run_path"] = row.key
                d["TACA_run_status"] = row.value

            ont_flowcells[name] = d


        for k, fc in ont_flowcells.items():

            if fc["TACA_run_status"] == "ongoing":

                fc["experiment_name"], fc["sample_name"], name = fc["TACA_run_path"].split("/")
                
                run_date, run_time, run_pos, run_fc, run_hash = name.split("_")

                fc["start_date"] = datetime.datetime.strptime(str(run_date), '%Y%m%d').strftime('%Y-%m-%d')
                fc["start_time"] = run_time
                fc["position"] = run_pos
                fc["flow_cell_id"] = run_fc
                fc["run_id"] = run_hash

            elif fc["TACA_run_status"] == "finished":

                # Calculate new metrics
                fc["basecalled_bases"] = fc["basecalled_pass_bases"] + fc["basecalled_fail_bases"]
                fc["accuracy"] = round(fc["basecalled_pass_bases"] / fc["basecalled_bases"] * 100, 2)
                
                # TODO yield per pore, fetch pore count from 1st MUX scan message, LIMS or QC

                # Add prefix metrics
                metrics = [
                    "read_count",
                    "basecalled_pass_read_count",
                    "basecalled_fail_read_count",
                    "basecalled_bases",
                    "basecalled_pass_bases",
                    "basecalled_fail_bases",
                    "n50"
                ]
                for metric in metrics:
                    # Readable metrics
                    unit = "" if "count" in metric else "bp"
                    fc["_".join([metric, "str"])] = add_prefix(input_int=fc[metric], unit=unit)

                    # Formatted metrics
                    if "count" in metric:
                        prefixed_unit = "M"
                        divby = 10**6
                    elif "n50" in metric:
                        prefixed_unit = "Kbp"
                        divby = 10**3
                    elif "bases" in metric:
                        prefixed_unit = "Gbp"
                        divby = 10**9
                    else:
                        continue
                    fc["_".join([metric, prefixed_unit])] = round(fc[metric] / divby, 2)
                
            else:
                continue

            # Find project

            query = re.compile("(p|P)\d{5}")
            match = query.search(fc["experiment_name"])
            if match:
                fc["project"] = match.group(0).upper()
                try:
                    fc["project_name"] = view_project[fc["project"]].rows[0].value["project_name"]
                except:
                    # If the project ID can't fetch a project name, leave empty
                    fc["project_name"] = ""
            else:
                fc["project"] = ""
                fc["project_name"] = ""

        # Use Pandas dataframe for column-wise operations, every db entry becomes a row
        df = pd.DataFrame.from_dict(ont_flowcells, orient = "index")

        # Calculate ranks, to enable color coding
        df["basecalled_pass_bases_Gbp_rank"] = (df.basecalled_pass_bases_Gbp.rank() / len(df) * 100).apply(lambda x: round(x,2))
        df["n50_rank"] = (df.n50.rank() / len(df) * 100).apply(lambda x: round(x,2))
        df["accuracy_rank"] = (df.accuracy.rank() / len(df) * 100).apply(lambda x: round(x,2))

        # Empty values are replaced with empty strings
        df.fillna("", inplace = True)

        # Convert back to dictionary and return
        ont_flowcells = df.to_dict(orient = "index")
        return ont_flowcells
        
    def get(self):
        # Default is to NOT show all flowcells
        all=self.get_argument("all", False)
        t = self.application.loader.load("flowcells.html")
        fcs=self.list_flowcells(all=all)
        ont_fcs=self.list_ont_flowcells()
        self.write(t.generate(gs_globals=self.application.gs_globals, thresholds=thresholds, user=self.get_current_user(), flowcells=fcs, ont_flowcells=ont_fcs, form_date=formatDate, all=all))


class FlowcellsDataHandler(SafeHandler):
    """ Serves brief information for each flowcell in the database.

    Loaded through /api/v1/flowcells url
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_flowcells()))

    def list_flowcells(self):
        flowcells = {}
        fc_view = self.application.flowcells_db.view("info/summary",
                                                     descending=True)
        for row in fc_view:
            flowcells[row.key] = row.value
        xfc_view = self.application.x_flowcells_db.view("info/summary",
                                                     descending=True)
        for row in xfc_view:
            flowcells[row.key] = row.value

        return OrderedDict(sorted(flowcells.items()))
        

class FlowcellsInfoDataHandler(SafeHandler):
    """ Serves brief information about a given flowcell.

    Loaded through /api/v1/flowcell_info2/([^/]*)$ url
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        flowcell_info = self.__class__.get_flowcell_info(self.application, flowcell)
        self.write(json.dumps(flowcell_info))

    @staticmethod
    def get_flowcell_info(application, flowcell):
        fc_view = application.flowcells_db.view("info/summary2",
                                                     descending=True)
        xfc_view = application.x_flowcells_db.view("info/summary2_full_id",
                                                     descending=True)
        flowcell_info = None
        for row in fc_view[flowcell]:
            flowcell_info = row.value
            break
        for row in xfc_view[flowcell]:
            flowcell_info = row.value
            break
        if flowcell_info is not None:
            return flowcell_info
        else:
            # No hit for a full name, check if the short name is found:
            complete_flowcell_rows = application.x_flowcells_db.view(
                                        'info/short_name_to_full_name',
                                        key=flowcell
                                    ).rows

            if complete_flowcell_rows:
                complete_flowcell_id = complete_flowcell_rows[0].value
                view = application.x_flowcells_db.view(
                            'info/summary2_full_id',
                            key=complete_flowcell_id,
                            )
                if view.rows:
                    return view.rows[0].value
        return flowcell_info


class FlowcellSearchHandler(SafeHandler):
    """ Searches Flowcells for text string

    Loaded through /api/v1/flowcell_search/([^/]*)$
    """
    cached_fc_list = None
    cached_xfc_list = None
    last_fetched = None

    def get(self, search_string):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.search_flowcell_names(search_string)))

    def search_flowcell_names(self, search_string=''):
        if len(search_string) == 0:
            return ''
        flowcells = []

        # The list of flowcells is cached for speed improvement
        t_threshold = datetime.datetime.now() - relativedelta(minutes=3)
        if FlowcellSearchHandler.cached_fc_list is None or \
            FlowcellSearchHandler.last_fetched < t_threshold:
            fc_view = self.application.flowcells_db.view("info/id", descending=True)
            FlowcellSearchHandler.cached_fc_list = [row.key for row in fc_view]

            xfc_view = self.application.x_flowcells_db.view("info/id", descending=True)
            FlowcellSearchHandler.cached_xfc_list = [row.key for row in xfc_view]

            FlowcellSearchHandler.last_fetched = datetime.datetime.now()

        search_string = search_string.lower()

        for row_key in FlowcellSearchHandler.cached_xfc_list:
            try:
                if search_string in row_key.lower():
                    splitted_fc = row_key.split('_')
                    fc = {
                        "url": '/flowcells/{}_{}'.format(splitted_fc[0], splitted_fc[-1]),
                        "name": row_key
                    }
                    flowcells.append(fc)
            except AttributeError:
                pass

        for row_key in FlowcellSearchHandler.cached_fc_list:
            try:
                if search_string in row_key.lower():
                    splitted_fc = row_key.split('_')
                    fc = {
                        "url": '/flowcells/{}_{}'.format(splitted_fc[0], splitted_fc[-1]),
                        "name": row_key
                    }
                    flowcells.append(fc)
            except AttributeError:
                pass

        return flowcells


class OldFlowcellsInfoDataHandler(SafeHandler):
    """ Serves brief information about a given flowcell.

    Loaded through /api/v1/flowcell_info/([^/]*)$ url
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.flowcell_info(flowcell)))

    def flowcell_info(self, flowcell):
        fc_view = self.application.flowcells_db.view("info/summary",
                                                     descending=True)
        for row in fc_view[flowcell]:
            flowcell_info = row.value
            break

        return flowcell_info


class FlowcellQCHandler(SafeHandler):
    """ Serves QC data for each lane in a given flowcell.

    Loaded through /api/v1/flowcell_qc/([^/]*)$ url
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_sample_runs(flowcell), deprecated = True))

    def list_sample_runs(self, flowcell):
        lane_qc = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/qc")
        for row in lane_view[[flowcell, ""]:[flowcell, "Z"]]:
            lane_qc[row.key[1]] = row.value

        return lane_qc


class FlowcellDemultiplexHandler(SafeHandler):
    """ Serves demultiplex yield data for each lane in a given flowcell.

    Loaded through /api/v1/flowcell_demultiplex/([^/]*)$ url
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.lane_stats(flowcell), deprecated=True))

    def lane_stats(self, flowcell):
        lane_qc = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/demultiplex")
        for row in lane_view[[flowcell, ""]:[flowcell, "Z"]]:
            lane_qc[row.key[1]] = row.value

        return lane_qc


class FlowcellQ30Handler(SafeHandler):
    """ Serves the percentage ofr reads over Q30 for each lane in the given
    flowcell.

    Loaded through /api/v1/flowcell_q30/([^/]*)$ url
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.lane_q30(flowcell), deprecated=True))

    def lane_q30(self, flowcell):
        lane_q30 = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/gtq30", group_level=3)
        for row in lane_view[[flowcell, ""]:[flowcell, "Z"]]:
            lane_q30[row.key[2]] = row.value["sum"] / row.value["count"]

        return lane_q30

class FlowcellNotesDataHandler(SafeHandler):
    """Serves all running notes from a given flowcell.
    It connects to LIMS to fetch and update Running Notes information.
    URL: /api/v1/flowcell_notes/([^/]*)
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        doc_id = FlowcellHandler.find_DB_entry(self, flowcell).id
        if not doc_id:
            self.write('{}')
        fc_doc = self.application.x_flowcells_db[doc_id]
        lims_data = fc_doc.get('lims_data')
        if not lims_data:
            self.write('{}')
        else:
            running_notes = lims_data.get('container_running_notes', {})
            sorted_running_notes = OrderedDict()
            for k, v in sorted(running_notes.items(), key=lambda t: t[0], reverse=True):
                sorted_running_notes[k] = v
            self.write(sorted_running_notes)

    def post(self, flowcell):
        note = self.get_argument('note', '')
        category = self.get_argument('category', 'Flowcell')

        if category == '':
            category = 'Flowcell'

        user = self.get_current_user()
        flowcell_info = FlowcellsInfoDataHandler.get_flowcell_info(self.application, flowcell)
        projects = flowcell_info['pid_list']
        if not note:
            self.set_status(400)
            self.finish('<html><body>No note parameters found</body></html>')
        else:
            newNote = {'user': user.name, 'email': user.email, 'note': note, 'category': category}

            doc_id = FlowcellHandler.find_DB_entry(self, flowcell).id
            if not doc_id:
                self.set_status(400)
                self.write('Flowcell not found')
            else:
                fc_doc = self.application.x_flowcells_db[doc_id]
                lims_data = fc_doc.get('lims_data', {})
                running_notes = lims_data.get('container_running_notes', {})
                running_notes[str(datetime.datetime.now())] = newNote
                lims_data['container_running_notes'] = running_notes

                flowcell_link = "<a class='text-decoration-none' href='/flowcells/{0}'>{0}</a>".format(flowcell)
                project_note = "#####*Running note posted on flowcell {}:*\n".format(flowcell_link)
                project_note += note

                fc_doc['lims_data'] = lims_data
                self.application.x_flowcells_db.save(fc_doc)
                #write running note to projects only if it has been saved successfully in FC
                for project in projects:
                    RunningNotesDataHandler.make_project_running_note(
                        self.application, project,
                        project_note, category,
                        user.name, user.email
                    )
                self.set_status(201)
                self.write(json.dumps(newNote))

class FlowcellLinksDataHandler(SafeHandler):
    """ Serves external links for each project
        Links are stored as JSON in LIMS / project
        URL: /api/v1/links/([^/]*)
    """

    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        try:
            p=get_container_from_id(flowcell)
        except (KeyError, IndexError) as e:
            self.write('{}')
        else:
            try:
                links = json.loads(p.udf['Links']) if 'Links' in p.udf else {}
            except (KeyError) as e:
                links = {}

            # Sort by descending date, then hopefully have deviations on top
            sorted_links = OrderedDict()
            for k, v in sorted(links.items(), key=lambda t: t[0], reverse=True):
                sorted_links[k] = v
            sorted_links = OrderedDict(sorted(sorted_links.items(), key=lambda k: k[1]['type']))
            self.write(sorted_links)

    def post(self, flowcell):
        user = self.get_current_user()
        a_type = self.get_argument('type', '')
        title = self.get_argument('title', '')
        url = self.get_argument('url', '')
        desc = self.get_argument('desc','')

        if not a_type or not title:
            self.set_status(400)
            self.finish('<html><body>Link title and type is required</body></html>')
        else:
            try:
                p=get_container_from_id(flowcell)
            except (KeyError, IndexError) as e:
                self.status(400)
                self.write('Flowcell not found')
            else:
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

class ReadsTotalHandler(SafeHandler):
    """ Serves external links for each project
        Links are stored as JSON in LIMS / project
        URL: /reads_total/([^/]*)
    """
    def get(self, query):
        data={}
        ordereddata=OrderedDict()
        self.set_header("Content-type", "text/html")
        t = self.application.loader.load("reads_total.html")

        if not query:
            self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user(), readsdata=ordereddata, query=query))
        else:
            xfc_view = self.application.x_flowcells_db.view("samples/lane_clusters", reduce=False)
            bioinfo_view = self.application.bioinfo_db.view("latest_data/sample_id")
            for row in xfc_view[query:"{}Z".format(query)]:
                if not row.key in data:
                    data[row.key]=[]
                data[row.key].append(row.value)
            #To check if sample is failed on lane level
            for row in bioinfo_view[[query, None, None, None]:[f'{query}Z', 'ZZ', 'ZZ', 'ZZ']]:
                    if row.key[3] in data:
                        for fcl in data[row.key[3]]:
                            if row.key[1] + ':' + row.key[2] == fcl['fcp']:
                                fcl['sample_status'] = row.value['sample_status']
                                break # since the row is already found
            for key in sorted(data.keys()):
                ordereddata[key]=sorted(data[key], key=lambda d:d['fcp'])
            self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user(), readsdata=ordereddata, query=query))
#Functions
def get_container_from_id(flowcell):
    if flowcell[7:].startswith('00000000'):
        #Miseq
        proc=lims.get_processes(type='MiSeq Run (MiSeq) 4.0',udf={'Flow Cell ID': flowcell[7:]})[0]
        c = lims.get_containers(name=proc.udf['Reagent Cartridge ID'])[0]
    else:
        #NovaSeq (S1, S2, S4 and SP),HiSeq2500 (Illumina Flow Cell) and HiSeqX (Patterned Flow Cell)
        if lims.get_containers(name=flowcell[8:],type=['S1','S2','S4','SP','Illumina Flow Cell','Patterned Flow Cell']):
            c = lims.get_containers(name=flowcell[8:])[0]
        else:
            try:
                #NextSeq500
                proc = lims.get_processes(type='Illumina Sequencing (NextSeq) v1.0',udf={'Flow Cell ID': flowcell[8:]})[0]
            except IndexError:
                #NextSeq2000
                proc = lims.get_processes(type='Illumina Sequencing (NextSeq) v1.0',udf={'Flow Cell ID': flowcell.split('_')[1]})[0]
            c = lims.get_containers(name=proc.udf['Reagent Cartridge ID'])[0]
    return c
