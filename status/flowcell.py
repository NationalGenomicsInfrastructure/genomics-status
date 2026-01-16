import os
import re
from datetime import datetime

import pandas as pd

from status.util import SafeHandler

thresholds = {
    "HiSeq X": 320,
    "RapidHighOutput": 188,
    "HighOutput": 143,
    "RapidRun": 114,
    "MiSeq Version3": 18,
    "MiSeq Version2": 10,
    "MiSeq Version2Micro": 3,
    "MiSeq Version2Nano": 0.75,
    "NovaSeq SP": 325,
    "NovaSeq S1": 650,
    "NovaSeq S2": 1650,
    "NovaSeq S4": 2000,
    "NovaSeqXPlus 10B": 1000,
    "NovaSeqXPlus 1.5B": 750,  # Might need to be reviewed when we settle for a number in AM
    "NovaSeqXPlus 25B": 3000,  # Might need to be reviewed when we settle for a number in AM
    "NextSeq Mid": 25,
    "NextSeq High": 75,
    "NextSeq 2000 P1": 100,
    "NextSeq 2000 P2": 400,
    "NextSeq 2000 P3": 550,
}


class FlowcellHandler(SafeHandler):
    """Serves a page which shows information for a given flowcell."""

    def __init__(self, application, request, **kwargs):
        # to cache a list of project_names ->
        # then we don't query statusdb each time when accessing the flowcell page
        self._project_names = {}
        super(SafeHandler, self).__init__(application, request, **kwargs)

    def _get_project_id_by_name(self, project_name):
        if project_name not in self._project_names:
            view = self.application.cloudant.post_view(
                db="projects",
                ddoc="projects",
                view="name_to_id",
                key=project_name,
            ).get_result()["rows"]
            # should be only one row, if not - will overwrite
            for row in view:
                self._project_names[project_name] = row["value"]
        return self._project_names.get(project_name, "")

    def _get_project_list(self, flowcell):
        # replace '__' in project name
        replaced_plist = []
        if "plist" in flowcell:
            for project in flowcell["plist"]:
                if "__" in project:
                    project = project.replace("__", ".")
                else:  # replace only the first one
                    project = project.replace("_", ".", 1)
                if project != "default":
                    replaced_plist.append(project)
        return replaced_plist

    def find_DB_entry(self, flowcell_id):
        # Returns Runid (key), contents (complex)
        view = self.application.cloudant.post_view(
            db="x_flowcells",
            ddoc="info",
            view="summary2_full_id",
            key=flowcell_id,
        ).get_result()["rows"]

        if view:
            return view[0]

        # No hit for a full name, check if the short name is found:
        complete_flowcell_rows = self.application.cloudant.post_view(
            db="x_flowcells",
            ddoc="info",
            view="short_name_to_full_name",
            key=flowcell_id,
        ).get_result()["rows"]

        if complete_flowcell_rows:
            complete_flowcell_id = complete_flowcell_rows[0]["value"]
            view = self.application.cloudant.post_view(
                db="x_flowcells",
                ddoc="info",
                view="summary2_full_id",
                key=complete_flowcell_id,
            ).get_result()["rows"]

            if view:
                return view[0]

        return False

    def get(self, flowcell_id):
        entry = self.find_DB_entry(flowcell_id)

        if not entry:
            extra_message = ""
            try:
                flowcell_date = datetime.strptime(flowcell_id[0:6], "%y%m%d")
            except ValueError:
                # NovaSeqXPlus-like date
                flowcell_date = datetime.strptime(flowcell_id[0:8], "%Y%m%d")
            first_xflowcell_record = datetime(2015, 3, 13)
            if first_xflowcell_record > flowcell_date:
                extra_message = "Your flowcell is in an older database. It can still be accessed, contact your administrator."

            self.set_status(200)
            t = self.application.loader.load("flowcell_error.html")
            self.write(
                t.generate(
                    gs_globals=self.application.gs_globals,
                    flowcell_id=flowcell_id,
                    user=self.get_current_user(),
                    extra_message=extra_message,
                )
            )
            return
        else:
            # replace '__' in project name
            entry["value"]["plist"] = self._get_project_list(entry["value"])
            # list of project_names -> to create links to project page and bioinfo tab
            project_names = {
                project_name: self._get_project_id_by_name(project_name)
                for project_name in entry["value"]["plist"]
            }
            # Prepare summary table for total project/sample yields in each lane
            fc_project_yields = dict()
            fc_sample_yields = dict()
            for lane_nr in sorted(entry["value"].get("lanedata", {}).keys()):
                fc_project_yields_lane_list = []
                fc_sample_yields_lane_list = []
                lane_details = entry["value"]["lane"][lane_nr]
                total_lane_yield = int(
                    entry["value"]["lanedata"][lane_nr]["clustersnb"].replace(",", "")
                )
                unique_projects = list(set(lane["Project"] for lane in lane_details))
                unique_samples = list(set(lane["SampleName"] for lane in lane_details))
                threshold = thresholds.get(entry["value"].get("run_mode", ""), 0)
                for proj in unique_projects:
                    if proj == "default":
                        modified_proj_name = "undetermined"
                    else:
                        modified_proj_name = proj.replace("__", ".")
                    sum_project_lane_yield = sum(
                        int(lane["clustersnb"].replace(",", ""))
                        for lane in lane_details
                        if lane["Project"] == proj and lane["clustersnb"]
                    )
                    if sum_project_lane_yield:
                        weighted_sum_q30 = 0
                        sum_yield_with_zero_q30 = 0
                        for lane in lane_details:
                            if lane["Project"] == proj and lane["clustersnb"]:
                                if lane["overthirty"]:
                                    weighted_sum_q30 += int(
                                        lane["clustersnb"].replace(",", "")
                                    ) * float(lane["overthirty"])
                                else:
                                    sum_yield_with_zero_q30 += int(
                                        lane["clustersnb"].replace(",", "")
                                    )
                        weighted_mean_q30 = weighted_sum_q30 / (
                            sum_project_lane_yield - sum_yield_with_zero_q30
                        )
                    else:
                        weighted_mean_q30 = 0
                    proj_lane_percentage_obtained = (
                        (sum_project_lane_yield / total_lane_yield) * 100
                        if total_lane_yield
                        else 0
                    )
                    proj_lane_percentage_threshold = (
                        (sum_project_lane_yield / (threshold * 1000000)) * 100
                        if threshold
                        else 0
                    )
                    fc_project_yields_lane_list.append(
                        {
                            "modified_proj_name": modified_proj_name,
                            "sum_project_lane_yield": format(
                                sum_project_lane_yield, ","
                            ),
                            "weighted_mean_q30": weighted_mean_q30,
                            "proj_lane_percentage_obtained": proj_lane_percentage_obtained,
                            "proj_lane_percentage_threshold": proj_lane_percentage_threshold,
                        }
                    )
                fc_project_yields[lane_nr] = sorted(
                    fc_project_yields_lane_list, key=lambda d: d["modified_proj_name"]
                )
                for sample in unique_samples:
                    if sample == "Undetermined":
                        modified_proj_name = "default"
                        sample_barcode = "unknown"
                    else:
                        modified_proj_name = ",".join(
                            list(
                                set(
                                    [
                                        lane["Project"]
                                        for lane in lane_details
                                        if lane["SampleName"] == sample
                                        and lane["Project"]
                                    ]
                                )
                            )
                        ).replace("__", ".")
                        barcode_list = list(
                            set(
                                [
                                    lane["barcode"]
                                    for lane in lane_details
                                    if lane["SampleName"] == sample and lane["barcode"]
                                ]
                            )
                        )
                        if len(barcode_list) < 2:
                            sample_barcode = barcode_list[0]
                        else:
                            sample_barcode = "multiple"
                    sum_sample_lane_yield = sum(
                        int(lane["clustersnb"].replace(",", ""))
                        for lane in lane_details
                        if lane["SampleName"] == sample and lane["clustersnb"]
                    )
                    if sum_sample_lane_yield:
                        weighted_sum_q30 = 0
                        weighted_sum_mqs = 0
                        sum_yield_with_zero_q30 = 0
                        sum_yield_with_zero_mqs = 0
                        for lane in lane_details:
                            if lane["SampleName"] == sample and lane["clustersnb"]:
                                if lane["overthirty"]:
                                    weighted_sum_q30 += int(
                                        lane["clustersnb"].replace(",", "")
                                    ) * float(lane["overthirty"])
                                else:
                                    sum_yield_with_zero_q30 += int(
                                        lane["clustersnb"].replace(",", "")
                                    )
                                if lane["mqs"]:
                                    weighted_sum_mqs += int(
                                        lane["clustersnb"].replace(",", "")
                                    ) * float(lane["mqs"])
                                else:
                                    sum_yield_with_zero_mqs += int(
                                        lane["clustersnb"].replace(",", "")
                                    )
                        weighted_mean_q30 = weighted_sum_q30 / (
                            sum_sample_lane_yield - sum_yield_with_zero_q30
                        )
                        weighted_mqs = weighted_sum_mqs / (
                            sum_sample_lane_yield - sum_yield_with_zero_mqs
                        )
                    else:
                        weighted_mean_q30 = 0
                        weighted_mqs = 0
                    sample_lane_percentage = (
                        (sum_sample_lane_yield / total_lane_yield) * 100
                        if total_lane_yield
                        else 0
                    )
                    fc_sample_yields_lane_list.append(
                        {
                            "modified_proj_name": modified_proj_name,
                            "sample_name": sample,
                            "sum_sample_lane_yield": format(sum_sample_lane_yield, ","),
                            "weighted_mean_q30": weighted_mean_q30,
                            "sample_barcode": sample_barcode,
                            "sample_lane_percentage": sample_lane_percentage,
                            "weighted_mqs": weighted_mqs,
                        }
                    )
                fc_sample_yields[lane_nr] = sorted(
                    fc_sample_yields_lane_list,
                    key=lambda d: (d["modified_proj_name"], d["sample_name"]),
                )

            t = self.application.loader.load("flowcell.html")
            self.write(
                t.generate(
                    gs_globals=self.application.gs_globals,
                    flowcell=entry["value"],
                    flowcell_id=flowcell_id,
                    thresholds=thresholds,
                    fc_project_yields=fc_project_yields,
                    fc_sample_yields=fc_sample_yields,
                    project_names=project_names,
                    user=self.get_current_user(),
                    statusdb_url=self.settings["couch_url"],
                    statusdb_id=entry["id"],
                )
            )


def get_view_val(key: str, view, db_conn) -> dict | None:
    """Get the value of a specified key from a view"""

    matching_rows = db_conn.post_view(
        **view,
        key=key,
    ).get_result()["rows"]

    if len(matching_rows) == 1:
        return matching_rows[0]["value"]
    elif len(matching_rows) == 0:
        return None
    else:
        raise AssertionError(
            f"Multiple matching rows found for key {key} in view {view['view']}"
        )


class ONTMinKNOWReportHandler(SafeHandler):
    """Serves a page showing the MinKNOW .html report of a given run"""

    def __init__(self, application, request, **kwargs):
        super(SafeHandler, self).__init__(application, request, **kwargs)

    def get(self, name):
        report_path = os.path.join(
            self.application.report_path["minknow"], f"report_{name}.html"
        )

        self.write(open(report_path).read())


class ONTToulligQCReportHandler(SafeHandler):
    """Serves a page showing the ToulligQC .html report of a given run"""

    def __init__(self, application, request, **kwargs):
        super(SafeHandler, self).__init__(application, request, **kwargs)

    def get(self, name):
        report_path = os.path.join(
            self.application.report_path["toulligqc"], f"report_{name}.html"
        )

        self.write(open(report_path).read())


class ElementFlowcellHandler(SafeHandler):
    def get(self, name):
        t = self.application.loader.load("element_flowcell.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
                ngi_run_id=name,
            )
        )


def get_project_names_from_ids(project_ids: list, db_conn) -> list[dict]:
    """Given a list of project ids, perform a lookup to the projects db and return a json-style list of projects"""
    projects = []
    rows = db_conn.post_view(
        db="projects",
        ddoc="projects",
        view="id_to_name",
        keys=project_ids,
    ).get_result()["rows"]
    if rows:
        for row in rows:
            projects.append({"project_id": row["key"], "project_name": row["value"]})

    return projects


class ElementFlowcellDataHandler(SafeHandler):
    """Serves information for a given element flowcell.

    Loaded through /api/v1/element_flowcell/([^/]*$)
    """

    def get(self, name):
        rows = self.application.cloudant.post_view(
            db="element_runs",
            ddoc="info",
            view="id",
            key=name,
            include_docs=True,
        ).get_result()["rows"]
        if rows:
            flowcell = rows[0]["doc"]

            # Collect all project names
            project_ids = self.application.cloudant.post_view(
                db="element_runs",
                ddoc="names",
                view="project_ids_list",
                key=name,
            ).get_result()["rows"][0]["value"]

            projects = get_project_names_from_ids(
                project_ids, self.application.cloudant
            )

            flowcell["projects"] = projects

            self.write(flowcell)
        else:
            self.set_status(404)
            self.write({"error": f"No element flowcell found for run ID {name}"})


class ONTFlowcellHandler(SafeHandler):
    """Serves a page which shows information for a given ONT flowcell."""

    def __init__(self, application, request, **kwargs):
        super(SafeHandler, self).__init__(application, request, **kwargs)

    def get_fc_stats(self, run_name: str) -> dict:
        return_dict = self.application.cloudant.post_view(
            db="nanopore_runs",
            ddoc="info",
            view="all_stats",
            key=run_name,
        ).get_result()["rows"][0]["value"]

        return_dict["run_name"] = run_name

        # Some metrics can only be calculated for a finished run
        if "basecalled_pass_bases" in return_dict:
            # Accuracy
            return_dict["accuracy"] = (
                f"{int(return_dict['basecalled_pass_bases']) / (int(return_dict['basecalled_pass_bases']) + int(return_dict['basecalled_fail_bases'])) * 100:.2f}"
            )

            # Flatten custom metrics to prevent nested access calls
            return_dict.update(return_dict["pore_activity"])

            # Number of reloadings
            try:
                return_dict["n_reloadings"] = len(
                    return_dict["lims"]["reloading"][-1]["reload_fmols"]
                )
            except (KeyError, IndexError):
                return_dict["n_reloadings"] = 0

            # Add string representation of metrics with appropriate units
            key2unit = {
                "read_count": "",
                "basecalled_pass_read_count": "",
                "basecalled_fail_read_count": "",
                "basecalled_pass_bases": "bp",
                "basecalled_fail_bases": "bp",
                "n50": "bp",
            }

            for key, unit in key2unit.items():
                if return_dict[key] == "":
                    return_dict[key] = 0

                return_dict[f"{key}_str"] = int2formatted_str(
                    input_int=return_dict[key], unit=unit
                )

        return return_dict

    def get_fc_qc(self, run_name: str):
        return_dict = {}

        try:
            pore_count_history = self.application.cloudant.post_view(
                db="nanopore_runs",
                ddoc="info",
                view="pore_count_history",
                key=run_name,
            ).get_result()["rows"][0]["value"]

            if (
                pore_count_history
                and len(pore_count_history) > 0
                and pore_count_history[0]["type"] == "qc"
            ):
                qc = int(pore_count_history[0]["num_pores"])
                return_dict["qc"] = qc

                # Calculate the mux diff
                mux_scans = self.application.cloudant.post_view(
                    db="nanopore_runs",
                    ddoc="info",
                    view="mux_scans",
                    key=run_name,
                ).get_result()["rows"][0]["value"]
                if mux_scans and len(mux_scans) > 0:
                    first_mux = int(mux_scans[0]["total_pores"])
                    return_dict["first_mux_vs_qc"] = round((first_mux / qc) * 100, 2)

        except IndexError:
            pass

        return return_dict

    def collect_fc_info(self, run_name: str) -> dict:
        """Take a run name and different db views that uses run name as key.
        Return a dict containing all the relevant info to show on the flowcells page.
        """

        fc = {}
        fc.update(self.get_fc_stats(run_name))
        fc.update(self.get_fc_qc(run_name))

        return fc

    def fetch_barcodes(self, run_name: str) -> dict:
        """Returns dictionary whose keys are barcode IDs and whose values are dicts containing
        barcode metrics from the last data acquisition snapshot of the MinKNOW reports.
        """
        view_barcodes = self.application.cloudant.post_view(
            db="nanopore_runs",
            ddoc="info",
            view="barcodes",
            key=run_name,
        ).get_result()
        rows = view_barcodes["rows"]

        if rows and rows[0]["value"]:
            # Load the barcode metrics into a pandas DataFrame
            df = pd.DataFrame.from_dict(rows[0]["value"], orient="index")

            # Format a subset of all columns as integers
            integer_columns = df.columns.drop("barcode_alias")
            df[integer_columns] = df[integer_columns].fillna(0).astype(int)

            # The barcode names "barcode01", "barcode02", etc. are moved to their own column and the index is set to the barcode ID number
            df["bc_name"] = df.index
            df["bc_id"] = (
                pd.Series(df.index)
                .apply(lambda x: int(x[-2:]) if "barcode" in x else x)
                .values
            )
            df.set_index("bc_id", inplace=True)

            # === Start making column-wise formatting ===
            # If the barcode alias is redundant, remove it
            df.loc[df.bc_name == df.barcode_alias, "barcode_alias"] = ""

            # Calculate percentages
            df["basecalled_pass_read_count_pc"] = (
                round(
                    df.basecalled_pass_read_count
                    / sum(df.basecalled_pass_read_count)
                    * 100,
                    2,
                )
                if sum(df.basecalled_pass_read_count) > 0
                else "-"
            )
            df["basecalled_pass_bases_pc"] = (
                round(df.basecalled_pass_bases / sum(df.basecalled_pass_bases) * 100, 2)
                if sum(df.basecalled_pass_bases) > 0
                else "-"
            )

            df["average_read_length_passed"] = df.apply(
                lambda x: int(
                    round(
                        x["basecalled_pass_bases"] / x["basecalled_pass_read_count"], 0
                    )
                )
                if x["basecalled_pass_bases"] > 0
                and x["basecalled_pass_read_count"] > 0
                else 0,
                axis=1,
            )

            df["accuracy"] = df.apply(
                lambda x: round(
                    x["basecalled_pass_bases"]
                    / (x["basecalled_pass_bases"] + x["basecalled_fail_bases"])
                    * 100,
                    2,
                )
                if x["basecalled_pass_bases"] > 0 or x["basecalled_pass_read_count"] > 0
                else 0,
                axis=1,
            )

            # Return dict for easy Tornado templating
            df.fillna("", inplace=True)

            barcodes = df.to_dict(orient="index")

            return barcodes

        else:
            return None

    def fetch_args(self, run_name):
        view_args = self.application.cloudant.post_view(
            db="nanopore_runs",
            ddoc="info",
            view="args",
            descending=True,
            key=run_name,
        ).get_result()
        rows = view_args["rows"]

        entries = []
        if rows:
            args = rows[0]["value"]

            group = r"([^\s=]+)"  # Text component of cmd argument

            # Double-dash argument with assignment
            flag_pair = re.compile(f"^--{group}={group}$")

            # Double-dash argument w/o assignment
            flag_key_or_header = re.compile(f"^--{group}$")

            # Non-double-dash argument with assignment
            pair = re.compile(f"^(?!--){group}={group}$")

            # Non-double-dash argument w/o assignment
            val = re.compile(f"^(?!--){group}$")

            idxs_args = iter(zip(range(0, len(args)), args))
            for idx, arg in idxs_args:
                # Flag pair --> Tuple
                if re.match(flag_pair, arg):
                    k, v = re.match(flag_pair, arg).groups()
                    entries.append({"type": "pair", "content": (k, v)})
                # Flag single
                elif re.match(flag_key_or_header, arg):
                    # If followed by pair --> Header
                    if re.match(pair, args[idx + 1]):
                        h = re.match(flag_key_or_header, arg).groups()[0]
                        entries.append({"type": "header", "content": h})
                    # If followed by val --> Add both as tuple and skip ahead
                    elif re.match(val, args[idx + 1]):
                        k = re.match(flag_key_or_header, arg).groups()[0]
                        v = re.match(val, args[idx + 1]).groups()[0]
                        entries.append({"type": "pair", "content": (k, v)})
                        next(idxs_args)
                # Pair
                elif re.match(pair, arg):
                    k, v = re.match(pair, arg).groups()
                    entries.append({"type": "sub_pair", "content": (k, v)})

        return entries

    def get(self, name):
        t = self.application.loader.load("ont_flowcell.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                flowcell=self.collect_fc_info(name),
                barcodes=self.fetch_barcodes(name),
                args=self.fetch_args(name),
                has_minknow_report=os.path.exists(
                    os.path.join(
                        self.application.report_path["minknow"],
                        f"report_{name}.html",
                    )
                ),
                has_toulligqc_report=os.path.exists(
                    os.path.join(
                        self.application.report_path["toulligqc"],
                        f"report_{name}.html",
                    )
                ),
                user=self.get_current_user(),
            )
        )


def int2formatted_str(input_int: int, unit: str):
    """Convert integer to string w. appropriate prefixed unit."""
    input_int = int(input_int)

    magnitude2prefixed_unit = {
        1: unit,
        1e3: "K" + unit,
        1e6: "M" + unit,
        1e9: "G" + unit,
        1e12: "T" + unit,
    }

    # Find the largest magnitude / prefix that is smaller than the input_int
    for magnitude, prefixed_unit in magnitude2prefixed_unit.items():
        if input_int > magnitude * 1e3:
            continue
        else:
            break

    if input_int > 1e3:
        output_int = round(input_int / magnitude, 2)
    else:
        output_int = input_int

    output_str = " ".join([str(output_int), prefixed_unit])
    return output_str


def walk_str2int(iterable):
    """This function recursively traverses a JSON-like tree of mutable iterables (dicts, lists)
    and reassigns all list elements or dict values which are strings that can be interpreted as integers
    to the int type."""

    if isinstance(iterable, (dict, list)):
        for key, val in (
            iterable.items() if isinstance(iterable, dict) else enumerate(iterable)
        ):
            if isinstance(val, str) and re.match(r"^\d+$", val):
                iterable[key] = int(val)
            elif isinstance(val, (dict, list)):
                walk_str2int(val)
    else:
        raise AssertionError("Invalid input")
