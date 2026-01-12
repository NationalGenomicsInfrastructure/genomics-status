import ast
import json
import logging

from dateutil.parser import parse
from genologics_sql import queries as geno_queries
from genologics_sql import utils as geno_utils

from status.running_notes import LatestRunningNoteHandler
from status.util import LIMSQueryBaseHandler, SafeHandler


class QueuesBaseHandler(LIMSQueryBaseHandler):
    """Base class that other queue handlers should inherit from.

    Contains common methods and properties used across different queue handlers.
    """

    def get_proj_details(self, project_id):
        proj_doc = self.application.cloudant.post_view(
            db="projects",
            ddoc="project",
            view="project_id",
            key=project_id,
            include_docs=True,
        ).get_result()["rows"][0]["doc"]
        proj_details = {}
        proj_details["library_type"] = proj_doc["details"].get(
            "library_construction_method", ""
        )
        proj_details["sequencing_platform"] = proj_doc["details"].get(
            "sequencing_platform", ""
        )
        proj_details["flowcell"] = proj_doc["details"].get("flowcell", "")
        queued_date = proj_doc["details"].get("queued", "")
        if not queued_date:
            queued_date = proj_doc.get("project_summary", {}).get("queued", "")
        proj_details["queued_date"] = queued_date
        proj_details["setup"] = proj_doc["details"].get("sequencing_setup", "")
        proj_details["lanes"] = proj_doc["details"].get(
            "sequence_units_ordered_(lanes)", ""
        )
        proj_details["flowcell_option"] = proj_doc["details"].get("flowcell_option", "")
        proj_details["name"] = proj_doc["project_name"]
        proj_details["total_num_samples"] = proj_doc["no_of_samples"]
        proj_details["oldest_sample_queued_date"] = proj_doc.get(
            "project_summary", {}
        ).get("queued", "")
        return proj_details

    def get_control_names(self):
        """Fetches control names from the database."""
        query = "SELECT name FROM controltype;"
        rows = self.get_query_result(query)
        return [row[0] for row in rows]

    def fetch_queue_definitions(self, queue):
        """Fetches queue definitions from the Couchdb."""
        queue_def_doc = self.application.cloudant.get_document(
            db="gs_configs",
            doc_id="queue_definitions",
        ).get_result()
        return (
            queue_def_doc["queues"][queue] if queue in queue_def_doc["queues"] else {}
        )


class qPCRPoolsDataHandler(QueuesBaseHandler):
    """Serves a page with qPCR queues from LIMS listed
    URL: /api/v1/qpcr_pools
    """

    def is_artifact_a_pool(self, artifactid):
        """Check if the artifact is a pool by counting the number of samples associated with it."""
        query = (
            "SELECT COUNT(DISTINCT processid) "
            "FROM artifact_sample_map "
            f"WHERE artifactid={artifactid};"
        )
        cursor = self._get_lims_cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        if rows and rows[0][0] > 1:
            return True
        return False

    def get(self):
        queue_definitions_doc = self.application.cloudant.get_document(
            db="gs_configs",
            doc_id="queue_definitions",
        ).get_result()
        unwanted_in_lib_val = queue_definitions_doc.get(
            "unwanted_in_qPCR_LibraryValidation", []
        )
        unwanted_in_lib_val_except_in_pools = queue_definitions_doc.get(
            "unwanted_in_qPCR_LibraryValidation_except_in_pools", []
        )
        control_names = self.get_control_names()
        query = (
            "select art.artifactid, art.name, CAST(st.lastmodifieddate as DATE), st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid "
            "from artifact art, stagetransition st, container ct, containerplacement ctp, sample s, artifact_sample_map asm "
            "where art.artifactid=st.artifactid and st.stageid in (select stageid from stage where stepid={}) and st.completedbyid is null and st.workflowrunid>0 "
            "and ctp.processartifactid=st.artifactid and ctp.containerid=ct.containerid and s.processid=asm.processid and asm.artifactid=art.artifactid "
            "group by art.artifactid, CAST(st.lastmodifieddate as DATE), st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid;"
        )
        lib_validation_query = (
            "select  st.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid, e.udfvalue "
            "from artifact art, stagetransition st, container ct, containerplacement ctp, sample s, artifact_sample_map asm, entity_udf_view e where "
            "art.artifactid=st.artifactid and st.stageid in (select stageid from stage where membershipid in (select sectionid from workflowsection where protocolid={})) "
            "and st.workflowrunid>0 and st.completedbyid is null and ctp.processartifactid=st.artifactid and ctp.containerid=ct.containerid and s.processid=asm.processid "
            f"and asm.artifactid=art.artifactid and art.name not in {tuple(control_names)} and s.projectid=e.attachtoid and e.udfname='Library construction method'"
            "group by st.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid, e.udfvalue;"
        )

        queues = {}
        queue_defs = self.fetch_queue_definitions("qPCR")
        for key, value in queue_defs.items():
            if key != "LibraryValidation":
                queues[key] = query.format(value["stepid"])
            else:
                # Library validation has a different query
                # Queue 41, but query is slightly different to use protocolid for Library Validation QC which is 8 and, also to exclude the controls
                queues[key] = lib_validation_query.format(value["protocolid"])

        methods = queues.keys()
        cursor = self._get_lims_cursor()
        pools = {}
        for method in methods:
            pools[method] = {}
            query = queues[method]
            cursor.execute(query)
            records = cursor.fetchall()
            for record in list(records):
                queue_time = record[2].isoformat()
                container = record[4]
                value = chr(65 + int(record[6])) + ":" + str(int(record[5]) + 1)
                project = "P" + str(record[7])

                if container in pools[method]:
                    pools[method][container]["samples"].append(
                        {"name": record[1], "well": value, "queue_time": queue_time}
                    )
                    if project not in pools[method][container]["projects"]:
                        if method == "LibraryValidation" and (
                            record[8] in unwanted_in_lib_val
                        ):
                            if not (
                                record[8] in unwanted_in_lib_val_except_in_pools
                                and self.is_artifact_a_pool(record[0])
                            ):
                                pools[method][container]["samples"].pop()
                                continue
                        proj_details = self.get_proj_details(project)
                        if (
                            proj_details["library_type"]
                            not in pools[method][container]["library_types"]
                        ):
                            pools[method][container]["library_types"].append(
                                proj_details["library_type"]
                            )
                        if (
                            proj_details["sequencing_platform"]
                            not in pools[method][container]["sequencing_platforms"]
                        ):
                            pools[method][container]["sequencing_platforms"].append(
                                proj_details["sequencing_platform"]
                            )
                        if (
                            proj_details["flowcell"]
                            not in pools[method][container]["flowcells"]
                        ):
                            pools[method][container]["flowcells"].append(
                                proj_details["flowcell"]
                            )
                        pools[method][container]["proj_queue_dates"].append(
                            proj_details["queued_date"]
                        )
                        latest_running_note = (
                            LatestRunningNoteHandler.get_latest_running_note(
                                self.application, "project", project
                            )
                        )
                        pools[method][container]["projects"][project] = {
                            "name": proj_details["name"],
                            "latest_running_note": latest_running_note,
                        }
                else:
                    if method == "LibraryValidation" and (
                        record[8] in unwanted_in_lib_val
                    ):
                        if not (
                            record[8] in unwanted_in_lib_val_except_in_pools
                            and self.is_artifact_a_pool(record[0])
                        ):
                            continue
                    proj_details = self.get_proj_details(project)
                    latest_running_note = (
                        LatestRunningNoteHandler.get_latest_running_note(
                            self.application, "project", project
                        )
                    )
                    pools[method][container] = {
                        "samples": [
                            {"name": record[1], "well": value, "queue_time": queue_time}
                        ],
                        "library_types": [proj_details["library_type"]],
                        "sequencing_platforms": [proj_details["sequencing_platform"]],
                        "flowcells": [proj_details["flowcell"]],
                        "proj_queue_dates": [proj_details["queued_date"]],
                        "projects": {
                            project: {
                                "name": proj_details["name"],
                                "latest_running_note": latest_running_note,
                            }
                        },
                    }

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(pools))


class qPCRPoolsHandler(SafeHandler):
    """Serves a page with qPCR queues from LIMS listed
    URL: /pools_qpcr
    """

    def get(self):
        t = self.application.loader.load("qpcr_pools.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class SequencingQueuesDataHandler(QueuesBaseHandler):
    """Serves a page with sequencing queues from LIMS listed
    URL: /api/v1/sequencing_queues
    """

    def get(self):
        query = (
            "select art.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, s.projectid "
            "from artifact art, stagetransition st, container ct, containerplacement ctp, sample s, artifact_sample_map asm "
            "where art.artifactid=st.artifactid and st.stageid in (select stageid from stage where stepid={}) and st.completedbyid is null and "
            "st.workflowrunid>0 and ctp.processartifactid=st.artifactid and ctp.containerid=ct.containerid and  s.processid=asm.processid and "
            "asm.artifactid=art.artifactid and s.name not in (select name from controltype) "
            "group by art.artifactid, st.lastmodifieddate, st.generatedbyid, ct.name, s.projectid;"
        )

        # works for 2109, 1659
        # does not work for 1662, 1655, 1656
        pool_conc_query = (
            "select udfvalue from artifact_udf_view where udfname='{}' "
            "and artifactid in (select art.artifactid from artifact_sample_map asm, artifact art "
            "where processid=(select processid from artifact_sample_map where artifactid={} limit 1) "
            "and art.artifactid=asm.artifactid and art.name='{}');"
        )

        qpcr_conc_query = (
            "select aus.numeric0 from artifactudfstorage aus, artifact_ancestor_map aam, artifact art "
            "where aam.ancestorartifactid={} and aus.artifactid=aam.artifactid and aus.artifactid=art.artifactid "
            "and art.name='qPCR Measurement' and aus.text0='nM';"
        )
        # 1662
        pool_conc_query_nextseq = (
            "select udfvalue from artifact_udf_view where udfname='{}' "
            "and artifactid=(select artifactid from artifactstate "
            "where stateid=(select inputstatepostid from processiotracker where processid={} limit 1));"
        )
        rerun_query = (
            "select count(artifactid) from stagetransition "
            "where stageid in (select stageid from stage where stepid={}) "
            "and artifactid={} group by artifactid"
        )

        # sequencing queues are currently taken as the following
        queue_defs = self.fetch_queue_definitions("sequencing")
        queues = {key: value["stepid"] for key, value in queue_defs.items()}

        methods = queues.keys()
        cursor = self._get_lims_cursor()
        control_names = self.get_control_names()
        pool_groups = {}
        for method in methods:
            pool_groups[method] = {}
            queue_query = query.format(queues[method])
            cursor.execute(queue_query)
            records = cursor.fetchall()
            for record in list(records):
                if str(record[1]) in control_names:
                    continue
                queue_time = record[2].isoformat()
                container = record[4]
                conc_qpcr = ""
                project = "P" + str(record[5])
                final_loading_conc = "TBD"
                if project not in pool_groups[method]:
                    proj_details = self.get_proj_details(project)
                    pool_groups[method][project] = {
                        "name": proj_details["name"],
                        "setup": proj_details["setup"],
                        "lanes": proj_details["lanes"],
                        "sequencing_platform": proj_details["sequencing_platform"],
                        "flowcell": proj_details["flowcell"],
                        "proj_queue_date": proj_details["queued_date"],
                        "flowcell_option": proj_details["flowcell_option"],
                        "librarytype": proj_details["library_type"],
                        "plates": {
                            container: {
                                "queue_time": queue_time,
                                "pools": [{"name": record[1], "is_rerun": False}],
                            }
                        },
                    }
                else:
                    if container not in pool_groups[method][project]["plates"]:
                        pool_groups[method][project]["plates"][container] = {
                            "queue_time": queue_time,
                            "pools": [],
                        }
                    pool_groups[method][project]["plates"][container]["pools"].append(
                        {"name": record[1], "is_rerun": False}
                    )

                # Get Pool Conc
                if "Finished library" in proj_details["library_type"]:
                    if method in ["1662"]:
                        pcquery = pool_conc_query_nextseq.format(
                            "Concentration", record[3]
                        )
                    else:
                        pcquery = pool_conc_query.format(
                            "Concentration", record[0], record[1]
                        )

                else:
                    if method in ["1662"]:
                        pcquery = pool_conc_query_nextseq.format(
                            "Pool Conc. (nM)", record[3]
                        )
                    else:
                        pcquery = pool_conc_query.format(
                            "Pool Conc. (nM)", record[0], record[1]
                        )

                cursor.execute(pcquery)
                row = cursor.fetchone()
                if row is None:
                    pool_conc = ""
                else:
                    pool_conc = row[0]

                if "NovaSeq" not in method:
                    non_novaseq_rerun_query = (
                        "select udfname, udfvalue from artifact_udf_view where udfname = 'Rerun' "
                        f"and artifactid={record[0]}"
                    )
                    cursor.execute(non_novaseq_rerun_query)
                    rerun_res = cursor.fetchone()
                    is_rerun = False
                    if rerun_res[1]:
                        is_rerun = ast.literal_eval(rerun_res[1])
                    else:
                        # When Proj coordinators queue samples, the field does not seem to be set
                        cursor.execute(rerun_query.format(queues[method], record[0]))
                        rerun_res = cursor.fetchone()[0]
                        if rerun_res > 1:
                            is_rerun = True

                    # Get qPCR conc
                    conc_qpcr = 0.0
                    if (
                        "Finished library" not in proj_details["library_type"]
                        or is_rerun
                    ):
                        cursor.execute(qpcr_conc_query.format(record[0]))
                        row = cursor.fetchone()
                        if row is None:
                            conc_qpcr = "NA"
                        else:
                            conc_qpcr = row[0]

                elif "NovaSeq" in method:
                    # The final loading conc is defined in the Define Run format step whose stepid is 1659
                    final_lconc_query = (
                        "select udfname, udfvalue from artifact_udf_view where udfname in ('Final Loading Concentration (pM)') "
                        "and artifactid in (select st.artifactid from stagetransition st, artifact_sample_map asm, sample, project "
                        "where st.artifactid = asm.artifactid AND sample.processid = asm.processid and sample.projectid = project.projectid "
                        "and project.projectid = {pnum} and generatedbyid in (select st.completedbyid "
                        "from stagetransition st, stage s, artifact_sample_map asm, sample, project "
                        "where st.stageid = s.stageid and s.stepid=1659 and st.artifactid = asm.artifactid and sample.processid = asm.processid "
                        "and sample.projectid = project.projectid AND project.projectid = {pnum} group by st.completedbyid) group by st.artifactid)"
                    )

                    # rerun
                    is_rerun = False
                    cursor.execute(rerun_query.format(queues[method], record[0]))
                    rerun_res = cursor.fetchone()[0]
                    if rerun_res > 1:
                        is_rerun = True

                    # Final loading conc
                    cursor.execute(final_lconc_query.format(pnum=record[5]))
                    final_lconc_res = dict(cursor.fetchall())
                    flc_novaseq = final_lconc_res.get(
                        "Final Loading Concentration (pM)"
                    )
                    if flc_novaseq is not None:
                        final_loading_conc = flc_novaseq

                    # qPCR conc
                    conc_qpcr = 0.0
                    if (
                        "Finished library" not in proj_details["library_type"]
                        or is_rerun
                    ):
                        cursor.execute(qpcr_conc_query.format(record[0]))
                        row = cursor.fetchone()
                        if row is None:
                            conc_qpcr = "NA"
                        else:
                            conc_qpcr = row[0]

                pool_groups[method][project]["final_loading_conc"] = final_loading_conc
                pool_groups[method][project]["plates"][container]["conc_qpcr"] = (
                    conc_qpcr
                )
                pool_groups[method][project]["plates"][container]["pools"][-1][
                    "is_rerun"
                ] = is_rerun
                pool_groups[method][project]["plates"][container]["conc_pool"] = (
                    pool_conc
                )

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(pool_groups))


class SequencingQueuesHandler(SafeHandler):
    """Serves a page with sequencing queues from LIMS listed
    URL: /sequencing_queues
    """

    def get(self):
        t = self.application.loader.load("sequencing_queues.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class WorksetQueuesDataHandler(QueuesBaseHandler):
    """Serves all the samples that need to be added to worksets in LIMS
    URL: /api/v1/workset_queues
    """

    def get(self):
        queue_defs = self.fetch_queue_definitions("workset")
        queues = {key: value["stepid"] for key, value in queue_defs.items()}

        methods = queues.keys()
        cursor = self._get_lims_cursor()
        control_names = self.get_control_names()
        pools = {}

        for method in methods:
            pools[method] = {}
            query = (
                "select art.artifactid, art.name, st.lastmodifieddate, st.generatedbyid "
                "from artifact art, stagetransition st where art.artifactid=st.artifactid and "
                f"st.stageid in (select stageid from stage where stepid={queues[method]}) and "
                f"st.completedbyid is null and st.workflowrunid>0 and art.name not in {tuple(control_names)};"
            )
            cursor.execute(query)
            records = cursor.fetchall()
            for record in list(records):
                project = record[1].split("_")[0]
                requeued = False
                if record[3] is None:
                    requeued = True
                if project in pools[method]:
                    pools[method][project]["samples"].append((record[1], requeued))
                    if (
                        parse(pools[method][project]["oldest_sample_queued_date"])
                        > record[2]
                    ):
                        pools[method][project]["oldest_sample_queued_date"] = record[
                            2
                        ].isoformat()
                else:
                    proj_details = self.get_proj_details(project)
                    oldest_sample_queued_date = record[2].isoformat()
                    latest_running_note = (
                        LatestRunningNoteHandler.get_latest_running_note(
                            self.application, "project", project
                        )
                    )
                    pools[method][project] = {
                        "samples": [(record[1], requeued)],
                        "total_num_samples": proj_details["total_num_samples"],
                        "oldest_sample_queued_date": oldest_sample_queued_date,
                        "pname": proj_details["name"],
                        "protocol": proj_details["library_type"],
                        "latest_running_note": latest_running_note,
                        "queued_date": proj_details["queued_date"],
                    }

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(pools))


class WorksetQueuesHandler(SafeHandler):
    """Serves a page with sequencing queues from LIMS listed
    URL: /workset_queues
    """

    def get(self):
        t = self.application.loader.load("workset_queues.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class LibraryPoolingQueuesDataHandler(QueuesBaseHandler):
    """Serves all the samples that need to be added to worksets in LIMS
    URL: /api/v1/libpooling_queues
    """

    def get(self):
        queue_defs = self.fetch_queue_definitions("library_pooling")
        queues = {key: value["stepid"] for key, value in queue_defs.items()}

        methods = queues.keys()
        cursor = self._get_lims_cursor()
        control_names = self.get_control_names()
        pools = {}

        query = (
            "select art.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, s.projectid "
            "from artifact art, stagetransition st, container ct, containerplacement ctp, sample s, artifact_sample_map asm "
            "where art.artifactid=st.artifactid and st.stageid in (select stageid from stage where stepid={}) and st.completedbyid is null and "
            "st.workflowrunid>0 and ctp.processartifactid=st.artifactid and ctp.containerid=ct.containerid and  s.processid=asm.processid and "
            "asm.artifactid=art.artifactid and art.name not in {} group by art.artifactid, st.lastmodifieddate, st.generatedbyid, ct.name, s.projectid;"
        )
        for method in methods:
            pools[method] = {}
            cursor.execute(query.format(queues[method], tuple(control_names)))
            records = cursor.fetchall()
            for record in list(records):
                container = record[4]
                name = record[1]
                project = "P" + str(record[5])
                if container in pools[method]:
                    pools[method][container]["samples"].append({"name": name})
                    if project not in pools[method][container]["projects"]:
                        proj_details = self.get_proj_details(project)
                        if (
                            proj_details["library_type"]
                            not in pools[method][container]["library_types"]
                        ):
                            pools[method][container]["library_types"].append(
                                proj_details["library_type"]
                            )
                        pools[method][container]["proj_queue_dates"].append(
                            proj_details["queued_date"]
                        )
                        pools[method][container]["projects"][project] = proj_details[
                            "name"
                        ]
                else:
                    proj_details = self.get_proj_details(project)
                    pools[method][container] = {
                        "samples": [{"name": name}],
                        "library_types": [proj_details["library_type"]],
                        "proj_queue_dates": [proj_details["queued_date"]],
                        "projects": {project: proj_details["name"]},
                    }

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(pools))


class LibraryPoolingQueuesHandler(SafeHandler):
    """Serves a page with sequencing queues from LIMS listed
    URL: /libpooling_queues
    """

    def get(self):
        t = self.application.loader.load("libpooling_queues.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class SmartSeq3ProgressPageHandler(SafeHandler):
    """Serves a page with SmartSeq3 progress table with all samples in the workflow
    URL: /smartseq3_progress
    """

    def get(self):
        t = self.application.loader.load("smartseq3_progress.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
            )
        )


class SmartSeq3ProgressPageDataHandler(SafeHandler):
    """Serves a page with SmartSeq3 progress table with all samples in the workflow
    URL: /api/v1/smartseq3_progress
    """

    def get(self):
        # Get all samples in the SmartSeq3 workflow
        gen_log = logging.getLogger("tornado.general")
        workflow_name = "Smart-seq3 for NovaSeqXPlus v1.0"
        sample_level_udfs_list = [
            "Sample Type",
            "Sample Links",
            "Cell Type",
            "Tissue Type",
            "Species Name",
            "Comment",
        ]
        project_level_udfs_list = ["Sequence units ordered (lanes)"]
        # Define the step level udfs and the step names they are associated with
        step_level_udfs_definition = {
            "Plates to Send": ["Sample plate sent date"],
            "Plates Sent": ["Sample plate received date"],
            "Lysis, RT and pre-Amp": ["PCR Cycles"],
            "cDNA QC": ["Optimal Cycle Number"],
        }
        step_level_udfs_id = {}
        samples_in_step_dict = {}
        project_level_udfs = {}

        geno_session = geno_utils.get_session()
        # Get all steps in the workflow with step ids and step name
        workflow_steps = geno_queries.get_all_steps_for_workflow(
            geno_session, workflow_name
        )
        stepid_to_stepindex = {}

        for stepname, stepid, protocolname, stepindex in workflow_steps:
            samples_in_step_dict[stepindex] = {
                "stepname": stepname,
                "protocolname": protocolname,
                "stepid": stepid,
                "samples": {},
            }
            stepid_to_stepindex[stepid] = stepindex
            # Connect stepid to udfname
            # We need this cos different versions of the workflow will have different stepids for the same stepname
            if stepname in step_level_udfs_definition:
                step_level_udfs_id[stepid] = step_level_udfs_definition[stepname]

        # Get all the information for each sample in given workflow
        samples = geno_queries.get_all_samples_in_a_workflow(
            geno_session, workflow_name
        )
        for _, sample_name, sampleid, stepid, projectid, _ in samples:
            sample_dict = {"projectid": projectid}
            if projectid not in project_level_udfs:
                query_res = geno_queries.get_udfs_from_project(
                    geno_session, projectid, project_level_udfs_list
                )
                proj_data = {}
                for udfname, udfvalue, _, projectname in query_res:
                    proj_data[udfname] = udfvalue
                    # This is redundant
                    proj_data["projectname"] = projectname
                project_level_udfs[projectid] = proj_data
            # Get sample level udfs
            sample_level_udfs = geno_queries.get_udfs_from_sample(
                geno_session, sampleid, sample_level_udfs_list
            )
            for udfname, udfvalue, _ in sample_level_udfs:
                sample_dict[udfname] = udfvalue

            # Get reagent label
            sample_dict["Reagent Label"] = geno_queries.get_reagentlabel_for_sample(
                geno_session, sampleid
            )

            # Get udfs specific to a step and the steps before it
            for step in stepid_to_stepindex:
                # Only check steps before the current step
                if stepid_to_stepindex[step] <= stepid_to_stepindex[stepid]:
                    # Check if the step has any udfs associated with it that we are interested in
                    if step in step_level_udfs_id:
                        step_level_udfs = geno_queries.get_sample_udfs_from_step(
                            geno_session, sampleid, step, step_level_udfs_id[step]
                        )
                        for udfname, udfvalue, _ in step_level_udfs:
                            if udfvalue:
                                # If udfname was already set, check if the value is the same
                                if udfname in sample_dict:
                                    # If the value is different, log a warning
                                    if sample_dict[udfname] != udfvalue:
                                        gen_log.warning(
                                            f"Sample {sample_name} has different values for udf {udfname} in step {stepname} "
                                            f"previous value: {sample_dict[udfname]}, new value: {udfvalue}"
                                        )
                                else:
                                    sample_dict[udfname] = udfvalue

            samples_in_step_dict[stepid_to_stepindex[stepid]]["samples"][
                sample_name
            ] = sample_dict

        self.set_header("Content-type", "application/json")
        self.write(json.dumps([samples_in_step_dict, project_level_udfs]))
