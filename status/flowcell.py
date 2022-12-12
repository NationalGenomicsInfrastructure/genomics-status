from status.util import SafeHandler
from datetime import datetime
import pandas as pd


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


class FlowcellHandler(SafeHandler):
    """ Serves a page which shows information for a given flowcell.
    """
    def __init__(self, application, request, **kwargs):
        # to cache a list of project_names ->
        # then we don't query statusdb each time when accessing the flowcell page
        self._project_names = {}
        super(SafeHandler, self).__init__(application, request, **kwargs)

    def _get_project_id_by_name(self, project_name):
        if project_name not in self._project_names:
            view = self.application.projects_db.view('project/project_name')[project_name]
            # should be only one row, if not - will overwrite
            for row in view.rows:
                doc_id = row.value
                project_doc = self.application.projects_db.get(doc_id)
                project_id = project_doc.get('project_id')
                self._project_names[project_name] = project_id
        return self._project_names.get(project_name, '')

    def _get_project_list(self, flowcell):
        # replace '__' in project name
        replaced_plist = []
        if 'plist' in flowcell:
            for project in flowcell['plist']:
                if '__' in project:
                    project = project.replace('__', '.')
                else: # replace only the first one
                    project = project.replace('_', '.', 1)
                if project != 'default':
                    replaced_plist.append(project)
        return replaced_plist

    def find_DB_entry(self, flowcell_id):
        #Returns Runid (key), contents (complex)
        view = self.application.x_flowcells_db.view('info/summary2_full_id', key=flowcell_id)

        if view.rows:
            return view.rows[0]

        # No hit for a full name, check if the short name is found:
        complete_flowcell_rows = self.application.x_flowcells_db.view(
                                    'info/short_name_to_full_name',
                                    key=flowcell_id
                                ).rows

        if complete_flowcell_rows:
            complete_flowcell_id = complete_flowcell_rows[0].value
            view = self.application.x_flowcells_db.view(
                        'info/summary2_full_id',
                        key=complete_flowcell_id,
                        )

            if view.rows:
                return view.rows[0]

        return False

    def get(self, flowcell_id):

        entry = self.find_DB_entry(flowcell_id)

        if not entry:
            extra_message=""
            flowcell_date = datetime.strptime(flowcell_id[0:6], "%y%m%d")
            first_xflowcell_record = datetime(2015,3,13)
            if first_xflowcell_record>flowcell_date:
                extra_message = "Your flowcell is in an older database. It can still be accessed, contact your administrator."

            self.set_status(200)
            t = self.application.loader.load("flowcell_error.html")
            self.write(t.generate(gs_globals=self.application.gs_globals,
                                  flowcell_id=flowcell_id,
                                  user=self.get_current_user(),
                                  extra_message=extra_message
                                  ))
            return
        else:
            # replace '__' in project name
            entry.value['plist'] = self._get_project_list(entry.value)
            # list of project_names -> to create links to project page and bioinfo tab
            project_names = {project_name: self._get_project_id_by_name(project_name) for project_name in entry.value['plist']}
            t = self.application.loader.load("flowcell.html")
            self.write(t.generate(gs_globals=self.application.gs_globals,
                                  flowcell=entry.value,
                                  flowcell_id=flowcell_id,
                                  thresholds=thresholds,
                                  project_names=project_names,
                                  user=self.get_current_user()))


class ONTFlowcellHandler(SafeHandler):
    """ Serves a page which shows information for a given ONT flowcell.
    """

    def __init__(self, application, request, **kwargs):
        # to cache a list of project_names ->
        # then we don't query statusdb each time when accessing the flowcell page
        self._project_names = {}
        super(SafeHandler, self).__init__(application, request, **kwargs)

    def fetch_ont_flowcell(self):
        fc = {}
        fc_view = self.application.nanopore_runs_db.view("info/all_stats", descending=True)

        # TODO Find fc by index

        for row in fc_view:
            d = row.value
            for k in d:
                try:
                    d[k] = int(d[k])
                except ValueError:
                    pass
            ont_flowcells[row.key] = d

        for k, fc in ont_flowcells.items():

            if fc["TACA_run_status"] == "ongoing":

                fc["experiment_name"], fc["sample_name"], run_name = fc["TACA_run_path"].split("/")
                
                run_date, run_time, run_pos, run_fc, run_hash = run_name.split("_")

                fc["start_date"] = run_date #format
                fc["start_time"] = run_time #format
                fc["position"] = run_pos
                fc["flow_cell_id"] = run_fc
                fc["run_id"] = run_hash #format

            elif fc["TACA_run_status"] == "finished":

                # Calculate new metrics
                fc["basecalled_bases"] = fc["basecalled_pass_bases"] + fc["basecalled_fail_bases"]
                fc["accuracy"] = str(
                    round(fc["basecalled_pass_bases"] / fc["basecalled_bases"] * 100, 2)
                    ) + " %"
                
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
                    fc["_".join([metric, "str"])] = add_prefix(N=fc[metric], unit=unit)

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
            else:
                fc["project"] = ""

        # Use Pandas for column-wise operations
        df = pd.DataFrame.from_dict(ont_flowcells, orient = "index")
        df.fillna("", inplace = True)
        ont_flowcells = df.to_dict(orient = "index")

        return fc

    def get(self, run_name):

        fc = self.fetch_ont_flowcell(run_name)

        t = self.application.loader.load("ont_flowcell.html")
        self.write(t.generate(gs_globals=self.application.gs_globals,
                                fc=fc,
                                user=self.get_current_user()))


def add_prefix(N:int, unit:str):
    """ Convert integer to prefix string w. appropriate prefix
    """
    N = int(N)
    d = {
        1 : unit,
        10**3 : "K"+unit,
        10**6 : "M"+unit,
        10**9 : "G"+unit,
        10**12 : "T"+unit
    }

    for n, u in d.items():
        if N > n*1000:
            continue
        else:
            break
    
    if N > 1000:
        new_N = round(N/n, 2)
    else:
        new_N = N

    s = str(new_N) + " " + u
    return s