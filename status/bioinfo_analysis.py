import datetime
import json
import traceback

import dateutil

from status.util import SafeHandler


def assert_project_id(p_id):
    assert p_id.startswith("P")
    try:
        int(p_id[1:])
    except ValueError:
        raise AssertionError


class BioinfoAnalysisHandler(SafeHandler):
    """queries and posts about bioinfo analysis
    URL: /api/v1/bioinfo/([^/]*)"""

    def post(self, project_id):
        v = self.application.bioinfo_db.view("full_doc/pj_run_lane_sample_to_doc")
        user = self.get_current_user()
        data = json.loads(self.request.body)
        saved_data = {}
        to_save = []
        assert_project_id(project_id)
        # Fetching documents one by one generates too many requests to statusdb
        # Hopefully fetching all documents at once doesn't require too much memory
        view = v[[project_id, "", "", ""]:[project_id, "Z", "Z", "Z"]]
        cached_view = {}
        for row in view.rows:
            if tuple(row.key) in cached_view:
                cached_view[tuple(row.key)].append(row)
            else:
                cached_view[tuple(row.key)] = [row]
        for run_id in data:
            ## why run_id is a string??
            project, sample, run, lane = run_id.split(",")
            for row in cached_view[(project, run, lane, sample)]:
                original_doc = row.value
                timestamp = datetime.datetime.now().isoformat()
                # if the doc wasn't change, skip it
                changed = False
                if "values" not in original_doc:
                    for key, value in data[run_id]["qc"].items():
                        if value != "?":
                            changed = True
                            original_doc["values"] = {}
                else:
                    last_timestamp = max(list(original_doc["values"]))
                    last_change = original_doc["values"][last_timestamp]
                    if (
                        last_change.get("qc") != data[run_id]["qc"]
                        or last_change.get("bp") != data[run_id]["bp"]
                        or last_change.get("datadelivered", "")
                        != data[run_id]["datadelivered"]
                    ):
                        changed = True
                if changed:
                    original_doc["values"][timestamp] = data[run_id]
                    original_doc["values"][timestamp]["user"] = user.name
                    original_doc["values"][timestamp]["sample_status"] = data[run_id][
                        "sample_status"
                    ]
                    original_doc["status"] = data[run_id]["sample_status"]
                    if "datadelivered" in data[run_id]:
                        original_doc["values"][timestamp]["datadelivered"] = data[
                            run_id
                        ]["datadelivered"]

                    to_save.append(original_doc)
                    saved_data[run_id] = original_doc["values"][
                        timestamp
                    ]  # the last one

        # couchdb bulk update
        try:
            save_result = self.application.bioinfo_db.update(to_save)
        except Exception:
            self.set_status(400)
            self.finish(
                f"<html><body><p>Could not save bioinfo data. Please try again later.</p><pre>{traceback.format_exc()}</pre></body></html>"
            )
            return None
        neg_save_res = []
        for res in save_result:
            if not res[0]:
                neg_save_res.append(res[1])
        self.set_status(200)
        self.set_header("Content-type", "application/json")
        self.write(json.dumps({"saved_data": saved_data, "not_saved": neg_save_res}))

    def get(self, project_id):
        t = self.application.loader.load("bioinfo_tab.html")
        view = self.application.bioinfo_db.view("full_doc/project_to_doc")
        bioinfo_data = {"sample_run_lane_view": {}, "run_lane_sample_view": {}}
        project_closed = False
        edit_history = {}
        for row in view[project_id].rows:
            flowcell_id = row.value.get("run_id")
            lane_id = row.value.get("lane")
            sample_id = row.value.get("sample")
            changes = row.value.get("values", {})
            last_timestamp = max(list(changes))
            bioinfo_qc = changes.get(last_timestamp, {})

            # building first view
            bioinfo1 = bioinfo_data["sample_run_lane_view"]
            if sample_id not in bioinfo1:
                bioinfo1[sample_id] = {
                    "flowcells": {flowcell_id: {"lanes": {lane_id: bioinfo_qc}}}
                }
            elif flowcell_id not in bioinfo1[sample_id]["flowcells"]:
                bioinfo1[sample_id]["flowcells"][flowcell_id] = {
                    "lanes": {lane_id: bioinfo_qc}
                }
            elif lane_id not in bioinfo1[sample_id]["flowcells"][flowcell_id]["lanes"]:
                bioinfo1[sample_id]["flowcells"][flowcell_id]["lanes"][
                    lane_id
                ] = bioinfo_qc
            else:
                bioinfo1[sample_id]["flowcells"][flowcell_id]["lanes"][lane_id].update(
                    bioinfo_qc
                )

            # building the second view
            bioinfo2 = bioinfo_data["run_lane_sample_view"]
            if flowcell_id not in bioinfo2:
                bioinfo2[flowcell_id] = {
                    "lanes": {lane_id: {"samples": {sample_id: bioinfo_qc}}}
                }
            elif lane_id not in bioinfo2[flowcell_id]["lanes"]:
                bioinfo2[flowcell_id]["lanes"][lane_id] = {
                    "samples": {sample_id: bioinfo_qc}
                }
            elif sample_id not in bioinfo2[flowcell_id]["lanes"][lane_id]["samples"]:
                bioinfo2[flowcell_id]["lanes"][lane_id]["samples"][
                    sample_id
                ] = bioinfo_qc
            else:
                bioinfo2[flowcell_id]["lanes"][lane_id]["samples"][sample_id].update(
                    bioinfo_qc
                )

            # add values to edit_history
            for long_timestamp, history in changes.items():
                timestamp = datetime.datetime.strftime(
                    dateutil.parser.parse(long_timestamp), "%Y-%m-%d %H:%M"
                )
                user = history.get("user", "")

                if (timestamp, user) not in edit_history:
                    edit_history[(timestamp, user)] = {
                        (flowcell_id, lane_id, sample_id): history
                    }
                else:
                    if (
                        project_id,
                        flowcell_id,
                        lane_id,
                        sample_id,
                    ) not in edit_history[(timestamp, user)]:
                        edit_history[(timestamp, user)][
                            (flowcell_id, lane_id, sample_id)
                        ] = history
                    else:
                        edit_history[(timestamp, user)][
                            (flowcell_id, lane_id, sample_id)
                        ].udpate(history)

        # checking status for run-lane-sample view
        for flowcell_id, flowcell in bioinfo_data["run_lane_sample_view"].items():
            fc_statuses = []
            fc_delivery_dates = []
            for lane_id, lane in flowcell["lanes"].items():
                lane_statuses = []
                lane_delivery_dates = []
                for sample_id, sample in lane["samples"].items():
                    lane_statuses.append(sample["sample_status"])
                    lane_delivery_dates.append(sample.get("datadelivered", ""))
                if all(lane_delivery_dates):
                    lane_delivery_date = min(lane_delivery_dates)
                else:
                    lane_delivery_date = ""
                lane["datadelivered"] = lane_delivery_date
                fc_delivery_dates.append(lane_delivery_date)
                lane["lane_status"] = self._agregate_status(lane_statuses)
                fc_statuses.append(lane["lane_status"])
            flowcell["flowcell_status"] = self._agregate_status(fc_statuses)
            if all(fc_delivery_dates):
                fc_delivery_date = min(fc_delivery_dates)
            else:
                fc_delivery_date = ""
            flowcell["datadelivered"] = fc_delivery_date

        # checking status for sample-run-lane view
        for sample_id, sample in bioinfo_data["sample_run_lane_view"].items():
            sample_statuses = []
            sample_delivery_dates = []
            for flowcell_id, flowcell in sample["flowcells"].items():
                fc_statuses = []
                fc_delivery_dates = []
                for lane_id, lane in flowcell["lanes"].items():
                    fc_statuses.append(lane["sample_status"])
                    fc_delivery_dates.append(lane.get("datadelivered", ""))
                if all(fc_delivery_dates):
                    fc_delivery_date = min(fc_delivery_dates)
                else:
                    fc_delivery_date = ""
                flowcell["datadelivered"] = fc_delivery_date
                sample_delivery_dates.append(fc_delivery_date)
                flowcell["flowcell_status"] = self._agregate_status(fc_statuses)
                sample_statuses.append(flowcell["flowcell_status"])
            sample["sample_status"] = self._agregate_status(sample_statuses)
            if all(sample_delivery_dates):
                sample_delivery_date = min(sample_delivery_dates)
            else:
                sample_delivery_date = ""
            sample["datadelivered"] = sample_delivery_date

        try:
            project_info = (
                self.application.projects_db.view("project/summary")["open", project_id]
                .rows[0]
                .value
            )
            project_closed = False
        except:
            project_info = (
                self.application.projects_db.view("project/summary")[
                    "closed", project_id
                ]
                .rows[0]
                .value
            )
            project_closed = True

        project_name = project_info.get("project_name")
        application = project_info.get("application")
        bioinfo_responsible = project_info.get("project_summary", {}).get(
            "bioinfo_responsible", "unknown"
        )
        project_type = project_info.get("details", {}).get(
            "type"
        )  # Production or Application

        app_classes = {
            "rnaseq": [
                "RNA-seq",
                "RNA-seq (total RNA)",
                "RNA-seq (RiboZero)",
                "RNA-seq (mRNA)",
                "stranded RNA-seq (total RNA)",
                "cDNA",
                "stranded RNA-seq (RiboZero)",
                "RNA-seq (bulk)",
                "RNA-seq (single cell)",
                "RNA-seq (spatial)",
            ],
            "exome": ["Exome capture"],
            "customCap": ["Custom capture"],
            "WGreseq": ["WG re-seq", "WG re-seq (IGN)"],
            "denovo": [
                "de novo",
                "Mate-pair",
                "Mate-pair (short insert)",
                "Mate-pair (long insert)",
            ],
        }

        for key in app_classes:
            if application in app_classes[key]:
                application = key
                break
        # to check if multiqc report exists (get_multiqc() is defined in util.BaseHandler)
        multiqc = self.get_multiqc(project_id) or ""
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
                bioinfo=bioinfo_data,
                app_classes=app_classes,
                application=application,
                project_closed=project_closed,
                project_name=project_name,
                project_id=project_id,
                bioinfo_responsible=bioinfo_responsible,
                project_type=project_type,
                edit_history=edit_history,
                multiqc=multiqc,
            )
        )

    def _agregate_status(self, statuses):
        """
        Helper function, agregates status from the lower levels
        """

        # my guess here agregation is already done from flowcell status
        # so this condition will most probably always be true
        if len(set(statuses)) == 1:
            status = statuses[0]
        elif "Sequencing" in statuses:
            status = "Sequencing"
        elif "Demultiplexing" in statuses:
            status = "Demulitplexing"
        elif "Transferring" in statuses:
            status = "Transferring"
        elif "New" in statuses:
            status = "New"
        elif "QC-ongoing" in statuses:
            status = "QC-ongoing"
        elif "QC-done" in statuses:
            status = "QC-done"
        elif "BP-ongoing" in statuses:
            status = "BP-ongoing"
        elif "BP-done" in statuses:
            status = "BP-done"
        elif "Failed" in statuses:
            status = "Failed"
        elif "Delivered" in statuses:
            status = "Delivered"
        else:
            pass
            # unknown status, if happens it will fail
        return status  # may fail here, if somebody defined a new status without updating this function
