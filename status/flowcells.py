"""Set of handlers related with Flowcells"""

import datetime
import json
import logging
import re
from collections import OrderedDict

import pandas as pd
from dateutil.relativedelta import relativedelta
from genologics import lims
from genologics.config import BASEURI, PASSWORD, USERNAME

from status.flowcell import fetch_ont_run_stats, thresholds
from status.running_notes import LatestRunningNoteHandler
from status.util import SafeHandler

application_log = logging.getLogger("tornado.application")

lims = lims.Lims(BASEURI, USERNAME, PASSWORD)


def find_id(stringable, pattern_type: str) -> re.match:
    string = str(stringable)

    patterns = {
        "project": re.compile(r"P[1-9]\d{4,}"),
        "sample": re.compile(r"P\d+_[1-9]\d{2,3}"),
        "pool": re.compile(r"2-[1-9]\d{4,}"),
        "step": re.compile(r"24-[1-9]\d{4,}"),
    }

    match = re.match(patterns[pattern_type], string)

    if match:
        return match.group()
    else:
        return None


class FlowcellsHandler(SafeHandler):
    """Serves a page which lists all flowcells with some brief info.
    By default shows only flowcells form the last 6 months, use the parameter
    'all' to show all flowcells.
    """

    def list_flowcells(self, all=False):
        temp_flowcells = {}
        if all:
            fc_view = self.application.flowcells_db.view(
                "info/summary", descending=True
            )
            for row in fc_view:
                temp_flowcells[row.key] = row.value

            xfc_view = self.application.x_flowcells_db.view(
                "info/summary", descending=True
            )
        else:
            # fc_view are from 2016 and older so only include xfc_view here
            half_a_year_ago = (
                datetime.datetime.now() - relativedelta(months=6)
            ).strftime("%y%m%d")
            xfc_view = self.application.x_flowcells_db.view(
                "info/summary", descending=True, endkey=half_a_year_ago
            )
        note_keys = []
        for row in xfc_view:
            try:
                row.value["startdate"] = datetime.datetime.strptime(
                    row.value["startdate"], "%y%m%d"
                ).strftime("%Y-%m-%d")
            except ValueError:
                try:
                    row.value["startdate"] = datetime.datetime.strptime(
                        row.value["startdate"], "%Y-%m-%dT%H:%M:%SZ"
                    ).strftime("%Y-%m-%d")
                except ValueError:
                    row.value["startdate"] = datetime.datetime.strptime(
                        row.value["startdate"].split()[0], "%m/%d/%Y"
                    ).strftime("%Y-%m-%d")

            # Lanes were previously in the wrong order
            row.value["lane_info"] = OrderedDict(sorted(row.value["lane_info"].items()))
            note_key = row.key
            # NovaSeqXPlus has whole year in name
            if "LH" in row.value["instrument"]:
                note_key = f'{row.value["run id"].split("_")[0]}_{row.value["run id"].split("_")[-1]}'
            note_keys.append(note_key)
            temp_flowcells[row.key] = row.value

        notes = self.application.running_notes_db.view(
            "latest_note_previews/flowcell",
            reduce=True,
            group=True,
            keys=list(note_keys),
        )
        for row in notes:
            key = row.key
            # NovaSeqXPlus FCs have the complete year in the date as part of the name, which is shortened in
            # some views in x_flowcells db but not in running_notes db. Hence why we require a sort of
            # translation as below
            if len(row.key.split("_")[0]) > 6:
                elem = row.key.split("_")
                elem[0] = elem[0][2:]
                key = "_".join(elem)
            temp_flowcells[key]["latest_running_note"] = {
                row.value["created_at_utc"]: row.value
            }

        return OrderedDict(sorted(temp_flowcells.items(), reverse=True))

    def list_ont_flowcells(self):
        """Fetch dictionary of the form {ont_run_name : ont_run_stats_dict}"""

        view_all_stats = self.application.nanopore_runs_db.view(
            "info/all_stats", descending=True
        )
        view_args = self.application.nanopore_runs_db.view("info/args", descending=True)
        view_project = self.application.projects_db.view(
            "project/id_name_dates", descending=True
        )
        view_mux_scans = self.application.nanopore_runs_db.view(
            "info/mux_scans", descending=True
        )
        view_pore_count_history = self.application.nanopore_runs_db.view(
            "info/pore_count_history", descending=True
        )

        ont_flowcells = OrderedDict()

        unfetched_runs = []
        for row in view_all_stats.rows:
            try:
                ont_flowcells[row.key] = fetch_ont_run_stats(
                    run_name=row.key,
                    view_all_stats=view_all_stats,
                    view_args=view_args,
                    view_project=view_project,
                    view_mux_scans=view_mux_scans,
                    view_pore_count_history=view_pore_count_history,
                )
            except Exception:
                unfetched_runs.append(row.key)
                application_log.exception(f"Failed to fetch run {row.key}")

        if ont_flowcells:
            try:
                # Use Pandas dataframe for column-wise operations, every db entry becomes a row
                df = pd.DataFrame.from_dict(ont_flowcells, orient="index")

                # Empty values are replaced with empty strings
                df.fillna("", inplace=True)

                # Convert back to dictionary and return
                ont_flowcells = df.to_dict(orient="index")
            except Exception:
                application_log.exception("Failed to compile ONT flowcell dataframe")

        return ont_flowcells, unfetched_runs

    def list_element_flowcells(self):
        return self.application.element_runs_db.view("info/summary", descending=True)

    def get(self):
        # Default is to NOT show all flowcells
        all = self.get_argument("all", False)
        t = self.application.loader.load("flowcells.html")
        fcs = self.list_flowcells(all=all)
        ont_fcs, unfetched_runs = self.list_ont_flowcells()
        element_fcs = self.list_element_flowcells()
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                thresholds=thresholds,
                user=self.get_current_user(),
                flowcells=fcs,
                ont_flowcells=ont_fcs,
                element_fcs=element_fcs,
                form_date=LatestRunningNoteHandler.formatDate,
                find_id=find_id,
                all=all,
                unfetched_runs=unfetched_runs,
            )
        )


class FlowcellsDataHandler(SafeHandler):
    """Serves brief information for each flowcell in the database.

    Loaded through /api/v1/flowcells url
    """

    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_flowcells()))

    def list_flowcells(self):
        flowcells = {}
        fc_view = self.application.flowcells_db.view("info/summary", descending=True)
        for row in fc_view:
            flowcells[row.key] = row.value
        xfc_view = self.application.x_flowcells_db.view("info/summary", descending=True)
        for row in xfc_view:
            flowcells[row.key] = row.value

        return OrderedDict(sorted(flowcells.items()))


class FlowcellsInfoDataHandler(SafeHandler):
    """Serves brief information about a given flowcell.

    Loaded through /api/v1/flowcell_info2/([^/]*)$ url
    """

    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        flowcell_info = self.__class__.get_flowcell_info(self.application, flowcell)
        self.write(json.dumps(flowcell_info))

    @staticmethod
    def get_flowcell_info(application, flowcell):
        fc_view = application.flowcells_db.view("info/summary2", descending=True)
        xfc_view = application.x_flowcells_db.view(
            "info/summary2_full_id", descending=True
        )
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
                "info/short_name_to_full_name", key=flowcell
            ).rows

            if complete_flowcell_rows:
                complete_flowcell_id = complete_flowcell_rows[0].value
                view = application.x_flowcells_db.view(
                    "info/summary2_full_id",
                    key=complete_flowcell_id,
                )
                if view.rows:
                    return view.rows[0].value
        return flowcell_info


class FlowcellSearchHandler(SafeHandler):
    """Searches Flowcells for text string

    Loaded through /api/v1/flowcell_search/([^/]*)$
    """

    cached_fc_list = None
    cached_xfc_list = None
    cached_ont_fc_list = None
    cached_element_fc_list = None
    last_fetched = None

    def get(self, search_string):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.search_flowcell_names(search_string)))

    def search_flowcell_names(self, search_string=""):
        if len(search_string) == 0:
            return ""
        flowcells = []

        # The list of flowcells is cached for speed improvement
        t_threshold = datetime.datetime.now() - relativedelta(minutes=3)
        if (
            FlowcellSearchHandler.cached_fc_list is None
            or FlowcellSearchHandler.last_fetched < t_threshold
        ):
            fc_view = self.application.flowcells_db.view("info/id", descending=True)
            FlowcellSearchHandler.cached_fc_list = [row.key for row in fc_view]

            xfc_view = self.application.x_flowcells_db.view("info/id", descending=True)
            FlowcellSearchHandler.cached_xfc_list = [row.key for row in xfc_view]

            ont_fc_view = self.application.nanopore_runs_db.view(
                "names/name", descending=True
            )
            FlowcellSearchHandler.cached_ont_fc_list = [row.key for row in ont_fc_view]

            element_fc_view = self.application.element_runs_db.view(
                "info/name", descending=True
            )
            FlowcellSearchHandler.cached_element_fc_list = [
                row.key for row in element_fc_view
            ]

            FlowcellSearchHandler.last_fetched = datetime.datetime.now()

        search_string = search_string.lower()

        for row_key in FlowcellSearchHandler.cached_xfc_list:
            try:
                if search_string in row_key.lower():
                    splitted_fc = row_key.split("_")
                    fc = {
                        "url": f"/flowcells/{splitted_fc[0]}_{splitted_fc[-1]}",
                        "name": row_key,
                    }
                    flowcells.append(fc)
            except AttributeError:
                pass

        for row_key in FlowcellSearchHandler.cached_ont_fc_list:
            try:
                if search_string in row_key.lower():
                    fc = {
                        "url": f"/flowcells_ont/{row_key}",
                        "name": row_key,
                    }
                    flowcells.append(fc)
            except AttributeError:
                pass

        for row_key in FlowcellSearchHandler.cached_element_fc_list:
            try:
                if search_string in row_key.lower():
                    fc = {
                        "url": f"/flowcells_element/{row_key}",
                        "name": row_key,
                    }
                    flowcells.append(fc)
            except AttributeError:
                pass

        for row_key in FlowcellSearchHandler.cached_fc_list:
            try:
                if search_string in row_key.lower():
                    splitted_fc = row_key.split("_")
                    fc = {
                        "url": f"/flowcells/{splitted_fc[0]}_{splitted_fc[-1]}",
                        "name": row_key,
                    }
                    flowcells.append(fc)
            except AttributeError:
                pass

        return flowcells


class OldFlowcellsInfoDataHandler(SafeHandler):
    """Serves brief information about a given flowcell.

    Loaded through /api/v1/flowcell_info/([^/]*)$ url
    """

    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.flowcell_info(flowcell)))

    def flowcell_info(self, flowcell):
        fc_view = self.application.flowcells_db.view("info/summary", descending=True)
        for row in fc_view[flowcell]:
            flowcell_info = row.value
            break

        return flowcell_info


class FlowcellQCHandler(SafeHandler):
    """Serves QC data for each lane in a given flowcell.

    Loaded through /api/v1/flowcell_qc/([^/]*)$ url
    """

    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_sample_runs(flowcell), deprecated=True))

    def list_sample_runs(self, flowcell):
        lane_qc = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/qc")
        for row in lane_view[[flowcell, ""] : [flowcell, "Z"]]:
            lane_qc[row.key[1]] = row.value

        return lane_qc


class FlowcellDemultiplexHandler(SafeHandler):
    """Serves demultiplex yield data for each lane in a given flowcell.

    Loaded through /api/v1/flowcell_demultiplex/([^/]*)$ url
    """

    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.lane_stats(flowcell), deprecated=True))

    def lane_stats(self, flowcell):
        lane_qc = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/demultiplex")
        for row in lane_view[[flowcell, ""] : [flowcell, "Z"]]:
            lane_qc[row.key[1]] = row.value

        return lane_qc


class FlowcellQ30Handler(SafeHandler):
    """Serves the percentage ofr reads over Q30 for each lane in the given
    flowcell.

    Loaded through /api/v1/flowcell_q30/([^/]*)$ url
    """

    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.lane_q30(flowcell), deprecated=True))

    def lane_q30(self, flowcell):
        lane_q30 = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/gtq30", group_level=3)
        for row in lane_view[[flowcell, ""] : [flowcell, "Z"]]:
            lane_q30[row.key[2]] = row.value["sum"] / row.value["count"]

        return lane_q30


class FlowcellLinksDataHandler(SafeHandler):
    """Serves external links for each project
    Links are stored as JSON in LIMS / project
    URL: /api/v1/links/([^/]*)
    """

    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        try:
            p = get_container_from_id(flowcell)
        except (KeyError, IndexError):
            self.write("{}")
        else:
            try:
                links = json.loads(p.udf["Links"]) if "Links" in p.udf else {}
            except KeyError:
                links = {}

            # Sort by descending date, then hopefully have deviations on top
            sorted_links = OrderedDict()
            for k, v in sorted(links.items(), key=lambda t: t[0], reverse=True):
                sorted_links[k] = v
            sorted_links = OrderedDict(
                sorted(sorted_links.items(), key=lambda k: k[1]["type"])
            )
            self.write(sorted_links)

    def post(self, flowcell):
        user = self.get_current_user()
        a_type = self.get_argument("type", "")
        title = self.get_argument("title", "")
        url = self.get_argument("url", "")
        desc = self.get_argument("desc", "")

        if not a_type or not title:
            self.set_status(400)
            self.finish("<html><body>Link title and type is required</body></html>")
        else:
            try:
                p = get_container_from_id(flowcell)
            except (KeyError, IndexError):
                self.status(400)
                self.write("Flowcell not found")
            else:
                links = json.loads(p.udf["Links"]) if "Links" in p.udf else {}
                links[str(datetime.datetime.now())] = {
                    "user": user.name,
                    "email": user.email,
                    "type": a_type,
                    "title": title,
                    "url": url,
                    "desc": desc,
                }
                p.udf["Links"] = json.dumps(links)
                p.put()
                self.set_status(200)
                # ajax cries if it does not get anything back
                self.set_header("Content-type", "application/json")
                self.finish(json.dumps(links))


class ReadsTotalHandler(SafeHandler):
    """Serves external links for each project
    Links are stored as JSON in LIMS / project
    URL: /reads_total/([^/]*)
    """

    def get(self, query):
        data = {}
        ordereddata = OrderedDict()
        self.set_header("Content-type", "text/html")
        t = self.application.loader.load("reads_total.html")

        if not query:
            self.write(
                t.generate(
                    gs_globals=self.application.gs_globals,
                    user=self.get_current_user(),
                    readsdata=ordereddata,
                    query=query,
                )
            )
        else:
            xfc_view = self.application.x_flowcells_db.view(
                "samples/lane_clusters", reduce=False
            )
            bioinfo_view = self.application.bioinfo_db.view("latest_data/sample_id")
            fc_view = self.application.x_flowcells_db.view(
                "info/summary", descending=True
            )

            for row in xfc_view[query : f"{query}Z"]:
                if row.key not in data:
                    data[row.key] = []
                # To add correct threshold values
                fc_long_name = row.value["fcp"].split(":")[0]
                fc_date_run = fc_long_name.split("_")[0]
                if len(fc_date_run) > 6:
                    fc_date_run = fc_date_run[-6:]
                fc_short_name = fc_date_run + "_" + fc_long_name.split("_")[-1]
                for info_row in fc_view[fc_short_name]:
                    row.value["run_mode"] = info_row.value["run_mode"]
                    row.value["longer_read_length"] = info_row.value[
                        "longer_read_length"
                    ]
                data[row.key].append(row.value)

            # To check if sample is failed on lane level
            for row in bioinfo_view[
                [query, None, None, None] : [f"{query}Z", "ZZ", "ZZ", "ZZ"]
            ]:
                if row.key[3] in data:
                    for fcl in data[row.key[3]]:
                        if row.key[1] + ":" + row.key[2] == fcl["fcp"]:
                            fcl["sample_status"] = row.value["sample_status"]
                            break  # since the row is already found
            for key in sorted(data.keys()):
                ordereddata[key] = sorted(data[key], key=lambda d: d["fcp"])
            self.write(
                t.generate(
                    gs_globals=self.application.gs_globals,
                    user=self.get_current_user(),
                    readsdata=ordereddata,
                    query=query,
                )
            )


# Functions
def get_container_from_id(flowcell):
    if flowcell[7:].startswith("00000000"):
        # Miseq
        proc = lims.get_processes(
            type="MiSeq Run (MiSeq) 4.0", udf={"Flow Cell ID": flowcell[7:]}
        )[0]
        c = lims.get_containers(name=proc.udf["Reagent Cartridge ID"])[0]
    else:
        # NovaSeq (S1, S2, S4 and SP),HiSeq2500 (Illumina Flow Cell) and HiSeqX (Patterned Flow Cell)
        if lims.get_containers(
            name=flowcell[8:],
            type=["S1", "S2", "S4", "SP", "Illumina Flow Cell", "Patterned Flow Cell"],
        ):
            c = lims.get_containers(name=flowcell[8:])[0]
        else:
            try:
                # NextSeq500
                proc = lims.get_processes(
                    type="Illumina Sequencing (NextSeq) v1.0",
                    udf={"Flow Cell ID": flowcell[8:]},
                )[0]
            except IndexError:
                # NextSeq2000
                proc = lims.get_processes(
                    type="Illumina Sequencing (NextSeq) v1.0",
                    udf={"Flow Cell ID": flowcell.split("_")[1]},
                )[0]
            c = lims.get_containers(name=proc.udf["Reagent Cartridge ID"])[0]
    return c
