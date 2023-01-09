from status.util import SafeHandler
from datetime import datetime
import pandas as pd
import re
import html


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


class ONTReportHandler(SafeHandler):
    """ Serves a page showing the MinKNOW .html report of a given run
    """

    def __init__(self, application, request, **kwargs):
        super(SafeHandler, self).__init__(application, request, **kwargs)

    def fetch_ont_report(self, name):
        """ Fetches the MinKNOW .html run report, saved as an escaped string in the
        database run entry and returns the unescaped string which can be written as .html
        """

        view_report = self.application.nanopore_runs_db.view("info/minknow_report", descending=True)
        row = [row for row in view_report.rows if name in row.key][0]
        str_html = html.unescape(row.value)

        return str_html

    def get(self, name):
        self.write(self.fetch_ont_report(name))


class ONTFlowcellHandler(SafeHandler):
    """ Serves a page which shows information for a given ONT flowcell.
    """

    def __init__(self, application, request, **kwargs):
        super(SafeHandler, self).__init__(application, request, **kwargs)

    def fetch_ont_flowcell(self, name):

        view_all = self.application.nanopore_runs_db.view("info/all_stats", descending=True)
        view_status = self.application.nanopore_runs_db.view("info/run_status", descending=True)
        view_project = self.application.projects_db.view("project/id_name_dates", descending=True)

        fc = {}

        row = [row for row in view_status.rows if name in row.key][0]

        if row.value == "ongoing":
            fc["TACA_run_path"] = row.key
            fc["TACA_run_status"] = row.value

        elif row.value == "finished":
            name = row.key.split("/")[-1]

            row = view_all[name].rows[0]
            fc["name"] = row.key

            for key in row.value:
                # Convert digit-only strings to ints
                if type(row.value[key]) == str and re.match("^\d*$", row.value[key]):
                    fc[key] = int(row.value[key])
                else:
                    fc[key] = row.value[key]

        if fc["TACA_run_status"] == "ongoing":

            fc["experiment_name"], fc["sample_name"], fc["name"] = fc["TACA_run_path"].split("/")
            
            run_date, run_time, run_pos, run_fc, run_hash = fc["name"].split("_")

            fc["start_date"] = datetime.strptime(str(run_date), '%Y%m%d').strftime('%Y-%m-%d')
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

        return fc


    def fetch_barcodes(self, name):

        view_barcodes = self.application.nanopore_runs_db.view("info/barcodes", descending=True)
        
        if view_barcodes[name].rows[0].value:
            barcodes = view_barcodes[name].rows[0].value

            barcodes_formatted = {}
            for bc in barcodes:
                barcodes_formatted[bc] = {}
                for key in barcodes[bc]:
                    if type(barcodes[bc][key]) == str and re.match("^\d*$", barcodes[bc][key]):
                        barcodes_formatted[bc][key] = int(barcodes[bc][key])
                    else:
                        barcodes_formatted[bc][key] = barcodes[bc][key]


            # Every barcode becomes a row in a dataframe for column-wise formatting
            df = pd.DataFrame.from_dict(barcodes_formatted, orient = "index")

            # The barcode names "barcode01", "barcode02", etc. are moved to their own column and the index is set to the barcode ID number
            df["bc_name"] = df.index
            df["bc_id"] = pd.Series(df.index).apply(lambda x:int(x[-2:]) if "barcode" in x else x).values
            df.set_index("bc_id", inplace=True)

            # === Start making column-wise formatting ===

            # If the barcode alias is redunant, remove it
            df.loc[df.bc_name == df.barcode_alias, "barcode_alias"] = ""

            # Calculate percentages, set empty if <0.01
            df["basecalled_pass_read_count_pc"] = (df.basecalled_pass_read_count / sum(df.basecalled_pass_read_count)).apply(
                lambda x: round(x*100, 2) if round(x*100, 2) > 0 else "")
            df["basecalled_pass_bases_pc"] = (df.basecalled_pass_bases / sum(df.basecalled_pass_bases)).apply(
                lambda x: round(x*100, 2) if round(x*100, 2) > 0 else "")
            # Calculate new metrics
            df["average_read_length_passed"] =  (df.basecalled_pass_bases / df.basecalled_pass_read_count).apply(
                lambda x: int(round(x, 0)))
            df["accuracy"] =  (df.basecalled_pass_bases / (df.basecalled_pass_bases + df.basecalled_fail_bases)).apply(
                lambda x: round(x*100, 2) if round(x*100, 2) > 0 else "")

            # Return dict for easy Tornado templating
            df.fillna("", inplace=True)
            barcodes_formatted = df.to_dict(orient="index")
            return barcodes_formatted
        
        else:
            return None
    
    def fetch_args(self, name):
        view_args = self.application.nanopore_runs_db.view("info/args", descending=True)
        l = [row for row in view_args.rows if name in row.key][0].value

        group = "([^\s=]+)"
        flag_pair = re.compile(f"^--{group}={group}$")
        flag_key_or_header = re.compile(f"^--{group}$")
        val = re.compile(f"^(?!--){group}$")
        pair = re.compile(f"^(?!--){group}={group}$")

        entries = {}
        idxs_args = iter(zip(range(0, len(l)), l))
        for (idx, arg) in idxs_args:
            # Flag pair --> Tuple
            if re.match(flag_pair, arg):
                k, v = re.match(flag_pair, arg).groups()
                entries[(k,v)]="pair"
            # Flag single
            elif re.match(flag_key_or_header, arg):
                # If followed by pair --> Header
                if re.match(pair, l[idx+1]):
                    h = re.match(flag_key_or_header, arg).groups()[0]
                    entries[h]="header"
                # If followed by val --> Add both as tuple and skip ahead
                elif re.match(val, l[idx+1]):
                    k = re.match(flag_key_or_header, arg).groups()[0]
                    v = re.match(val, l[idx+1]).groups()[0]
                    entries[(k,v)]="pair"
                    next(idxs_args)
            # Pair 
            elif re.match(pair, arg):
                k, v = re.match(pair, arg).groups()
                entries[(k,v)]="sub_pair"

        return entries

    def get(self, name):

        t = self.application.loader.load("ont_flowcell.html")
        self.write(t.generate(gs_globals=self.application.gs_globals,
                                flowcell=self.fetch_ont_flowcell(name),
                                barcodes=self.fetch_barcodes(name),
                                args=self.fetch_args(name),
                                user=self.get_current_user()))


def add_prefix(input_int:int, unit:str):
    """ Convert integer to prefix string w. appropriate prefix
    """
    input_int = int(input_int)

    dict_magnitude_to_unit = {
        1 : unit,
        10**3 : "K"+unit,
        10**6 : "M"+unit,
        10**9 : "G"+unit,
        10**12 : "T"+unit
    }

    for magnitude, unit in dict_magnitude_to_unit.items():
        if input_int > magnitude*1000:
            continue
        else:
            break
    
    if input_int > 1000:
        output_int = round(input_int/magnitude, 2)
    else:
        output_int = input_int

    output_str = " ".join([str(output_int), unit])
    return output_str