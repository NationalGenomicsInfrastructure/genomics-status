from collections import OrderedDict

from genologics import lims
from genologics.config import BASEURI, PASSWORD, USERNAME
from genologics.entities import Project as LIMSProject
from genologics.entities import Udfconfig
from ibm_cloud_sdk_core.api_exception import ApiException

from status.running_notes import LatestRunningNoteHandler
from status.util import SafeHandler

lims = lims.Lims(BASEURI, USERNAME, PASSWORD)


class DeliveriesPageHandler(SafeHandler):
    def post(self):
        project_id = self.get_argument("project_id", "")
        responsible = self.get_argument("responsible", "")
        if not project_id or not responsible:
            self.set_status(400)
            self.write("no project_id or bioinfo_responsible")
            return
        lims_project = LIMSProject(lims, id=project_id)
        if not lims_project:
            self.set_status(400)
            self.write(f"lims project not found: {project_id}")
            return
        project_name = lims_project.name
        stepname = ["Project Summary 1.3"]
        processes = lims.get_processes(type=stepname, projectname=project_name)
        if processes == []:
            error = f"{stepname} for {project_name} is not available in LIMS."
            self.set_status(400)
            self.write(error)
            return

        for process in processes:
            process.get(force=True)
            process.udf["Bioinfo responsible"] = responsible
            try:
                process.put()
            except Exception as e:
                # still try to update everything
                # but will print error anyway
                self.set_status(400)
                self.write(str(e))
                continue

        # update status db
        # if lims was not updated, after a while this change will be discarded
        view_row = self.application.cloudant.post_view(
            db="projects",
            ddoc="project",
            view="project_id",
            key=project_id,
            include_docs=True,
        ).get_result()["rows"]
        if not view_row:
            self.set_status(400)
            self.write("Status DB has not been updated: project not found")
            return
        doc = view_row[0]["doc"]
        doc["project_summary"]["bioinfo_responsible"] = (
            responsible if responsible != "unassigned" else None
        )
        try:
            self.application.cloudant.put_document(
                db="projects", document=doc, doc_id=doc["_id"]
            )
        except ApiException as e:
            self.set_status(400)
            self.write(e.message)

        self.set_status(201)
        self.write({"success": "success!!"})

    def get(self):
        # get project summary data
        summary_view = self.application.cloudant.post_view(
            db="projects",
            ddoc="project",
            view="summary",
            descending=True,
            start_key=["open", "Z"],
            end_key=["open", ""],
        ).get_result()["rows"]
        summary_data = {}
        for row in summary_view:
            # todo: check if this one works
            if row["key"][0] != "closed":
                project_id = row["key"][1]
                summary_data[project_id] = row["value"]

        bioinfo_data_view = self.application.cloudant.post_view(
            db="bioinfo_analysis",
            ddoc="latest_data",
            view="sample_id_open",
        ).get_result()["rows"]
        bioinfo_data = {}

        ongoing_deliveries = {}
        # make a normal dict from the view result
        for row in bioinfo_data_view:
            project_id, flowcell_id, lane_id, sample_id = row["key"]

            if project_id not in ongoing_deliveries and project_id in summary_data:
                ongoing_deliveries[project_id] = {}
            # project_id, lane_id, sample_id, flowcell_id = row.key
            if project_id not in bioinfo_data:
                bioinfo_data[project_id] = {
                    flowcell_id: {lane_id: {sample_id: row["value"]}}
                }
            elif flowcell_id not in bioinfo_data[project_id]:
                bioinfo_data[project_id][flowcell_id] = {
                    lane_id: {sample_id: row["value"]}
                }
            elif lane_id not in bioinfo_data[project_id][flowcell_id]:
                bioinfo_data[project_id][flowcell_id][lane_id] = {
                    sample_id: row["value"]
                }
            elif sample_id not in bioinfo_data[project_id][flowcell_id][lane_id]:
                bioinfo_data[project_id][flowcell_id][lane_id][sample_id] = row["value"]
            else:
                bioinfo_data[project_id][flowcell_id][lane_id].update(
                    {sample_id: row["value"]}
                )

        projects_to_be_closed = 0
        ongoing_projects = 0
        number_of_flowcells = 0
        number_of_lanes = 0
        number_of_samples = 0
        status_list = OrderedDict()
        project_status = {}
        project_type_list = {}
        responsible_list = {}
        # Predefined statuses and order
        flowcell_statuses = [
            "Sequencing",
            "Demultiplexing",
            "New",
            "QC-ongoing",
            "QC-done",
            "BP-ongoing",
            "BP-done",
            "Delivered",
            "ERROR",
            "Failed",
        ]
        for status in flowcell_statuses:
            status_list[status] = 0

        for project_id in ongoing_deliveries:
            if project_id in summary_data and project_id in bioinfo_data:
                flowcells = bioinfo_data[project_id]
                runs_bioinfo = {}
                platforms = set()
                for flowcell_id in flowcells:
                    number_of_flowcells += 1
                    flowcell_statuses = []
                    flowcell_checklists = {"total": 0, "completed": 0}
                    for lane_id in flowcells[flowcell_id]:
                        number_of_lanes += 1
                        lane_statuses = []
                        lane_checklists = {"total": 0, "completed": 0}
                        for sample_id in flowcells[flowcell_id][lane_id]:
                            number_of_samples += 1

                            # define bioinfo checklist
                            sample_data = flowcells[flowcell_id][lane_id][sample_id]
                            instrument_type = sample_data.get("instrument_type")
                            platforms.add(sample_data.get("instrument"))
                            checklist = self.__fill_checklist(sample_data)
                            if checklist["total"] and len(checklist["total"]) == len(
                                checklist["passed"]
                            ) + len(checklist["warnings"]) + len(checklist["failed"]):
                                lane_checklists["completed"] += 1
                            lane_checklists["total"] += 1

                            lane_statuses.append(sample_data.get("sample_status"))

                            if flowcell_id not in runs_bioinfo:
                                runs_bioinfo[flowcell_id] = {
                                    "lanes": {
                                        lane_id: {
                                            "samples": {
                                                sample_id: {
                                                    "checklist": checklist,
                                                    "status": sample_data.get(
                                                        "sample_status", "?"
                                                    ),
                                                }
                                            }
                                        }
                                    }
                                }
                            elif lane_id not in runs_bioinfo[flowcell_id]["lanes"]:
                                runs_bioinfo[flowcell_id]["lanes"][lane_id] = {
                                    "samples": {
                                        sample_id: {
                                            "checklist": checklist,
                                            "status": sample_data.get(
                                                "sample_status", "?"
                                            ),
                                        }
                                    }
                                }
                            elif (
                                sample_id
                                not in runs_bioinfo[flowcell_id]["lanes"][lane_id][
                                    "samples"
                                ]
                            ):
                                runs_bioinfo[flowcell_id]["lanes"][lane_id]["samples"][
                                    sample_id
                                ] = {
                                    "checklist": checklist,
                                    "status": sample_data.get("sample_status", "?"),
                                }
                            else:
                                runs_bioinfo[flowcell_id]["lanes"][lane_id]["samples"][
                                    sample_id
                                ].update(
                                    {
                                        "checklist": checklist,
                                        "status": sample_data.get("sample_status", "?"),
                                    }
                                )
                        if lane_checklists["total"] == lane_checklists["completed"]:
                            flowcell_checklists["completed"] += 1
                        flowcell_checklists["total"] += 1

                        lane_status = self.__aggregate_status(lane_statuses)

                        runs_bioinfo[flowcell_id]["lanes"][lane_id]["lane_status"] = (
                            lane_status
                        )
                        runs_bioinfo[flowcell_id]["lanes"][lane_id]["checklist"] = (
                            lane_checklists
                        )
                        flowcell_statuses.append(lane_status)

                    # the same logic here -> agregate flowcell statuses
                    flowcell_status = self.__aggregate_status(flowcell_statuses)
                    runs_bioinfo[flowcell_id]["flowcell_status"] = flowcell_status
                    runs_bioinfo[flowcell_id]["checklist"] = flowcell_checklists
                    runs_bioinfo[flowcell_id]["instrument_type"] = instrument_type

                    # add flowcell_status to the status_list (needed for filtering)
                    if flowcell_status not in status_list:
                        status_list[flowcell_status] = 0
                    status_list[flowcell_status] += 1

                    if project_id not in project_status:
                        project_status[project_id] = []
                    if flowcell_status not in project_status[project_id]:
                        project_status[project_id].append(flowcell_status)
                if set(project_status[project_id]) == set(["Delivered"]):
                    projects_to_be_closed += 1
                else:
                    ongoing_projects += 1

                latest_running_note = list(
                    LatestRunningNoteHandler.get_latest_running_note(
                        self.application, "project", project_id
                    ).values()
                )[0]

                # project type (needed for filters)
                project_type = (
                    summary_data[project_id].get("details").get("type") or "unknown"
                )

                if project_type not in project_type_list:
                    project_type_list[project_type] = 0
                project_type_list[project_type] += 1

                # responsibles (needed for filters)
                bioinfo_responsible = (
                    summary_data[project_id]
                    .get("project_summary", {})
                    .get("bioinfo_responsible")
                    or "unassigned"
                )

                if bioinfo_responsible not in responsible_list:
                    responsible_list[bioinfo_responsible] = 0
                responsible_list[bioinfo_responsible] += 1
                if None in platforms:
                    platforms.remove(None)

                project_data = {
                    "project_name": summary_data[project_id]["project_name"],
                    "application": summary_data[project_id].get(
                        "application", "unknown"
                    ),
                    "type": summary_data[project_id]["details"].get("type"),
                    "bioinfo_responsible": bioinfo_responsible,
                    "runs": runs_bioinfo,
                    "latest_running_note": latest_running_note,
                    "sequencing_platforms": list(platforms),
                }

            else:
                project_data = {
                    "error": f"could not find project information for {project_id}"
                }

            ongoing_deliveries[project_id].update(project_data)
        try:
            lims_responsibles = ["unassigned"] + sorted(
                Udfconfig(lims, id="1128").presets
            )
        except Exception:
            lims_responsibles = ["unassigned"] + sorted(responsible_list)
        template = self.application.loader.load("deliveries.html")
        self.write(
            template.generate(
                gs_globals=self.application.gs_globals,
                deliveries=ongoing_deliveries,
                ongoing_projects=ongoing_projects,
                projects_to_be_closed=projects_to_be_closed,
                number_of_flowcells=number_of_flowcells,
                number_of_lanes=number_of_lanes,
                number_of_samples=number_of_samples,
                status_list=status_list,
                project_status=project_status,
                project_type_list=project_type_list,
                responsible_list=responsible_list,
                lims_responsibles=lims_responsibles,
                form_date=LatestRunningNoteHandler.formatDate,
                user=self.get_current_user(),
            )
        )

    def __aggregate_status(self, list_of_statuses):
        """
        helper method. aggregates status of parent entry
        """
        if len(set(list_of_statuses)) == 1:
            status = list_of_statuses[0]
        elif "New" in list_of_statuses:
            status = "New"
        elif "Sequencing" in list_of_statuses:
            status = "Sequencing"
        elif "Demultiplexing" in list_of_statuses:
            status = "Demultiplexing"
        elif "Transferring" in list_of_statuses:
            status = "Transferring"
        elif "QC-ongoing" in list_of_statuses:
            status = "QC-ongoing"
        elif "QC-done" in list_of_statuses:
            status = "QC-done"
        elif "BP-ongoing" in list_of_statuses:
            status = "BP-ongoing"
        elif "BP-done" in list_of_statuses:
            status = "BP-done"
        elif "ERROR" in list_of_statuses:
            status = "ERROR"
        else:
            # should not happen
            status = ""
        return status

    def __fill_checklist(self, sample_data):
        """
        helper method to create a progress bar checklist
        """
        checklist = {
            "passed": [],
            "warnings": [],
            "failed": [],
            "total": [],
        }
        qc_and_bp = {}
        for key in sample_data.get("qc", {}).keys():
            checklist["total"].append(key)
            qc_and_bp[key] = sample_data["qc"][key]
        for key in sample_data.get("bp", {}).keys():
            checklist["total"].append(key)
            qc_and_bp[key] = sample_data["bp"][key]
        for key in qc_and_bp.keys():
            if qc_and_bp[key] == "Pass":
                checklist["passed"].append(key)
            elif qc_and_bp[key] == "Warning":
                checklist["warnings"].append(key)
            elif qc_and_bp[key] == "Fail":
                checklist["failed"].append(key)
            # don't count 'N/A'
            elif qc_and_bp[key] == "N/A":
                checklist["total"].remove(key)
            # else: do not do anything if '?' or anything else
        return checklist
