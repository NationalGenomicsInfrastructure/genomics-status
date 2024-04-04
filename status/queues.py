import json

from status.util import SafeHandler
import psycopg2
from dateutil.parser import parse
import ast

from genologics_sql import queries as geno_queries
from genologics_sql import utils as geno_utils

from status.running_notes import LatestRunningNoteHandler

# Control names can be found in the table controltype in the lims backend. Will continue to check against this list for now, should
# consider incorporating a check against this table directly into the queries in the future
control_names = [
    "AM7852",
    "E.Coli genDNA",
    "Endogenous Positive Control",
    "Exogenous Positive Control",
    "Human Brain Reference RNA",
    "lambda DNA",
    "mQ Negative Control",
    "NA10860",
    "NA11992",
    "NA11993",
    "NA12878",
    "NA12891",
    "NA12892",
    "No Amplification Control",
    "No Reverse Transcriptase Control",
    "No Template Control",
    "PhiX v3",
    "Universal Human Reference RNA",
    "lambda DNA (qPCR)",
]


class qPCRPoolsDataHandler(SafeHandler):
    """Serves a page with qPCR queues from LIMS listed
    URL: /api/v1/qpcr_pools
    """

    def get(self):
        unwanted_in_lib_val = [
            "Illumina TruSeq PCR-free",
            "Illumina DNA PCR-free FLEX",
            "SMARTer ThruPLEX DNA-seq (small genome)",
            "SMARTer ThruPLEX DNA-seq (complex genome, metagenomes)",
            "SMARTer ThruPLEX DNA-seq (ChIP)",
            "Illumina TruSeq Stranded mRNA (polyA)",
            "Illumina TruSeq Stranded total RNA",
            "SMARTer Total Stranded RNA-seq, Pico input mammalian",
            "SMARTer Total Stranded RNA-seq, Pico input mammalian - V3",
            "Illumina TruSeq small RNA",
            "QIAseq miRNA low input",
            "Visium Spatial Gene Expression",
            "RAD-seq",
            "ATAC-seq",
            "Dovetail OmniC",
            "Dovetail MicroC",
            "Arima HiC (standard)",
            "Arima HiC (low input)",
            "16S",
            "Amplicon indexing (without cleanup)",
            "Amplicon indexing (with cleanup)",
            "Special",
            "ONT ligation - DNA",
            "ONT PCR - DNA",
            "ONT cDNA PCR - RNA",
            "ONT direct cDNA - RNA",
            "ONT direct RNA - RNA",
        ]

        queues = {}
        # query for Miseq and NovaSeq
        query = (
            "select art.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid "
            "from artifact art, stagetransition st, container ct, containerplacement ctp, sample s, artifact_sample_map asm "
            "where art.artifactid=st.artifactid and st.stageid in (select stageid from stage where stepid={}) and st.completedbyid is null and st.workflowrunid>0 "
            "and ctp.processartifactid=st.artifactid and ctp.containerid=ct.containerid and s.processid=asm.processid and asm.artifactid=art.artifactid "
            "group by art.artifactid, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid;"
        )
        # Queue = 1002, stepid in the query
        queues["MiSeq"] = query.format(1002)
        # Queue = 1666, stepid in the query
        queues["NovaSeq"] = query.format(1666)
        # Queue = 2102, stepid in the query
        queues["NextSeq"] = query.format(2102)
        # Queue = 3055, stepid in the query
        queues["NovaSeqXPlus"] = query.format(3055)
        # Queue 41, but query is slightly different to use protocolid for Library Validation QC which is 8 and, also to exclude the controls
        queues["LibraryValidation"] = (
            "select  st.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid, e.udfvalue "
            "from artifact art, stagetransition st, container ct, containerplacement ctp, sample s, artifact_sample_map asm, entity_udf_view e where "
            "art.artifactid=st.artifactid and st.stageid in (select stageid from stage where membershipid in (select sectionid from workflowsection where protocolid=8)) "
            "and st.workflowrunid>0 and st.completedbyid is null and ctp.processartifactid=st.artifactid and ctp.containerid=ct.containerid and s.processid=asm.processid "
            "and asm.artifactid=art.artifactid and art.name not in {} and s.projectid=e.attachtoid and e.udfname='Library construction method'"
            "group by st.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid, e.udfvalue;".format(
                tuple(control_names)
            )
        )

        methods = queues.keys()
        projects = self.application.projects_db.view("project/project_id")
        connection = psycopg2.connect(
            user=self.application.lims_conf["username"],
            host=self.application.lims_conf["url"],
            database=self.application.lims_conf["db"],
            password=self.application.lims_conf["password"],
        )
        cursor = connection.cursor()
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
                library_type = ""
                sequencing_platform = ""
                flowcell = ""
                queued_date = ""

                if container in pools[method]:
                    pools[method][container]["samples"].append(
                        {"name": record[1], "well": value, "queue_time": queue_time}
                    )
                    if project not in pools[method][container]["projects"]:
                        if method == "LibraryValidation" and (
                            record[8] in unwanted_in_lib_val
                            or project in ["P28910", "P28911"]
                        ):
                            # We do not want the projects P28910, N.egative_00_00 and P28911, P.ositive_00_00
                            # showing up in Library validation as instructed by the lab
                            pools[method][container]["samples"].pop()
                            continue
                        proj_doc = self.application.projects_db.get(
                            projects[project].rows[0].value
                        )
                        library_type = proj_doc["details"].get(
                            "library_construction_method", ""
                        )
                        sequencing_platform = proj_doc["details"].get(
                            "sequencing_platform", ""
                        )
                        flowcell = proj_doc["details"].get("flowcell", "")
                        queued_date = proj_doc["details"].get("queued", "")
                        if not queued_date:
                            queued_date = proj_doc.get("project_summary", {}).get(
                                "queued", ""
                            )
                        if (
                            library_type
                            not in pools[method][container]["library_types"]
                        ):
                            pools[method][container]["library_types"].append(
                                library_type
                            )
                        if (
                            sequencing_platform
                            not in pools[method][container]["sequencing_platforms"]
                        ):
                            pools[method][container]["sequencing_platforms"].append(
                                sequencing_platform
                            )
                        if flowcell not in pools[method][container]["flowcells"]:
                            pools[method][container]["flowcells"].append(flowcell)
                        pools[method][container]["proj_queue_dates"].append(queued_date)
                        latest_running_note = (
                            LatestRunningNoteHandler.get_latest_running_note(
                                self.application, "project", project
                            )
                        )
                        pools[method][container]["projects"][project] = {
                            "name": proj_doc["project_name"],
                            "latest_running_note": latest_running_note,
                        }
                else:
                    if method == "LibraryValidation" and (
                        record[8] in unwanted_in_lib_val
                        or project in ["P28910", "P28911"]
                    ):
                        # We do not want the projects P28910, N.egative_00_00 and P28911, P.ositive_00_00
                        # showing up in Library validation as instructed by the lab
                        continue
                    proj_doc = self.application.projects_db.get(
                        projects[project].rows[0].value
                    )
                    library_type = proj_doc["details"].get(
                        "library_construction_method", ""
                    )
                    sequencing_platform = proj_doc["details"].get(
                        "sequencing_platform", ""
                    )
                    flowcell = proj_doc["details"].get("flowcell", "")
                    queued_date = proj_doc["details"].get("queued", "")
                    if not queued_date:
                        queued_date = proj_doc.get("project_summary", {}).get(
                            "queued", ""
                        )
                    latest_running_note = (
                        LatestRunningNoteHandler.get_latest_running_note(
                            self.application, "project", project
                        )
                    )
                    pools[method][container] = {
                        "samples": [
                            {"name": record[1], "well": value, "queue_time": queue_time}
                        ],
                        "library_types": [library_type],
                        "sequencing_platforms": [sequencing_platform],
                        "flowcells": [flowcell],
                        "proj_queue_dates": [queued_date],
                        "projects": {
                            project: {
                                "name": proj_doc["project_name"],
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


class SequencingQueuesDataHandler(SafeHandler):
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
        queues = {}
        # Miseq- Step 7: Denature, Dilute and load sample
        queues["MiSeq: Denature, Dilute and Load Sample"] = "55"
        # NextSeq- Step 7: Load to Flowcell
        queues["NextSeq: Load to Flowcell"] = "2109"
        # Novaseq Step 11: Load to flow cell
        queues["NovaSeq: Load to Flowcell"] = "1662"
        # Novaseq Step 7: Define Run Format
        queues["NovaSeq: Define Run Format"] = "1659"
        # Novaseq Step 8: Make Bulk Pool for Novaseq Standard
        queues["NovaSeq: Make Bulk Pool for Standard"] = "1655"
        # Novaseq Step 10: Make Bulk Pool for Novaseq Xp
        queues["NovaSeq : Make Bulk Pool for Xp"] = "1656"
        # NovaSeqXPlus Step 8:  Load to Flowcell (NovaSeqXPlus) v1.0
        queues["NovaSeqXPlus : Load to Flowcell (NovaSeqXPlus) v1.0"] = "3058"

        methods = queues.keys()
        projects = self.application.projects_db.view("project/project_id")
        connection = psycopg2.connect(
            user=self.application.lims_conf["username"],
            host=self.application.lims_conf["url"],
            database=self.application.lims_conf["db"],
            password=self.application.lims_conf["password"],
        )
        cursor = connection.cursor()
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
                    proj_doc = self.application.projects_db.get(
                        projects[project].rows[0].value
                    )
                    setup = proj_doc["details"].get("sequencing_setup", "")
                    lanes = proj_doc["details"].get(
                        "sequence_units_ordered_(lanes)", ""
                    )
                    librarytype = proj_doc["details"].get(
                        "library_construction_method", ""
                    )
                    sequencing_platform = proj_doc["details"].get(
                        "sequencing_platform", ""
                    )
                    flowcell = proj_doc["details"].get("flowcell", "")
                    queued_date = proj_doc["details"].get("queued", "")
                    if not queued_date:
                        queued_date = proj_doc.get("project_summary", {}).get(
                            "queued", ""
                        )
                    flowcell_option = proj_doc["details"].get("flowcell_option", "")
                    name = proj_doc["project_name"]
                    pool_groups[method][project] = {
                        "name": name,
                        "setup": setup,
                        "lanes": lanes,
                        "sequencing_platform": sequencing_platform,
                        "flowcell": flowcell,
                        "proj_queue_date": queued_date,
                        "flowcell_option": flowcell_option,
                        "librarytype": librarytype,
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
                if "Finished library" in librarytype:
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
                        "and artifactid={}"
                    ).format(record[0])
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
                    if "Finished library" not in librarytype or is_rerun:
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
                    if "Finished library" not in librarytype or is_rerun:
                        cursor.execute(qpcr_conc_query.format(record[0]))
                        row = cursor.fetchone()
                        if row is None:
                            conc_qpcr = "NA"
                        else:
                            conc_qpcr = row[0]

                pool_groups[method][project]["final_loading_conc"] = final_loading_conc
                pool_groups[method][project]["plates"][container][
                    "conc_qpcr"
                ] = conc_qpcr
                pool_groups[method][project]["plates"][container]["pools"][-1][
                    "is_rerun"
                ] = is_rerun
                pool_groups[method][project]["plates"][container][
                    "conc_pool"
                ] = pool_conc

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


class WorksetQueuesDataHandler(SafeHandler):
    """Serves all the samples that need to be added to worksets in LIMS
    URL: /api/v1/workset_queues
    """

    def get(self):
        queues = {}
        queues["TruSeqRNAprep"] = "311"
        queues["TruSeqRNAprepV2"] = "2301"
        queues["TruSeqSmallRNA"] = "410"
        queues["TruSeqDNAPCR_free"] = "407"
        queues["ThruPlex"] = "451"
        queues["Genotyping"] = "901"
        queues["RadSeq"] = "1201"
        queues["SMARTerPicoRNA"] = "1551"
        queues["ChromiumGenomev2"] = "1801"

        methods = queues.keys()
        projects = self.application.projects_db.view("project/project_id")
        connection = psycopg2.connect(
            user=self.application.lims_conf["username"],
            host=self.application.lims_conf["url"],
            database=self.application.lims_conf["db"],
            password=self.application.lims_conf["password"],
        )
        cursor = connection.cursor()
        pools = {}

        for method in methods:
            pools[method] = {}
            query = (
                "select art.artifactid, art.name, st.lastmodifieddate, st.generatedbyid "
                "from artifact art, stagetransition st where art.artifactid=st.artifactid and "
                "st.stageid in (select stageid from stage where stepid={}) and "
                "st.completedbyid is null and st.workflowrunid>0 and art.name not in {};".format(
                    queues[method], tuple(control_names)
                )
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
                    proj_doc = self.application.projects_db.get(
                        projects[project].rows[0].value
                    )
                    total_num_samples = proj_doc["no_of_samples"]
                    oldest_sample_queued_date = record[2].isoformat()
                    projName = proj_doc["project_name"]
                    protocol = proj_doc["details"]["library_construction_method"]
                    queued_date = proj_doc["details"].get("queued", "")
                    if not queued_date:
                        queued_date = proj_doc.get("project_summary", {}).get(
                            "queued", "NA"
                        )
                    latest_running_note = (
                        LatestRunningNoteHandler.get_latest_running_note(
                            self.application, "project", project
                        )
                    )
                    pools[method][project] = {
                        "samples": [(record[1], requeued)],
                        "total_num_samples": total_num_samples,
                        "oldest_sample_queued_date": oldest_sample_queued_date,
                        "pname": projName,
                        "protocol": protocol,
                        "latest_running_note": latest_running_note,
                        "queued_date": queued_date,
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


class LibraryPoolingQueuesDataHandler(SafeHandler):
    """Serves all the samples that need to be added to worksets in LIMS
    URL: /api/v1/libpooling_queues
    """

    def get(self):
        queues = {}
        queues["MiSeq"] = "52"
        queues["NovaSeq"] = "1652"
        queues["NextSeq"] = "2104"

        methods = queues.keys()
        projects = self.application.projects_db.view("project/project_id")
        connection = psycopg2.connect(
            user=self.application.lims_conf["username"],
            host=self.application.lims_conf["url"],
            database=self.application.lims_conf["db"],
            password=self.application.lims_conf["password"],
        )
        cursor = connection.cursor()
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
                        proj_doc = self.application.projects_db.get(
                            projects[project].rows[0].value
                        )
                        library_type = proj_doc["details"].get(
                            "library_construction_method", ""
                        )
                        queued_date = proj_doc["details"].get("queued", "")
                        if (
                            library_type
                            not in pools[method][container]["library_types"]
                        ):
                            pools[method][container]["library_types"].append(
                                library_type
                            )
                        pools[method][container]["proj_queue_dates"].append(queued_date)
                        pools[method][container]["projects"][project] = proj_doc[
                            "project_name"
                        ]
                else:
                    proj_doc = self.application.projects_db.get(
                        projects[project].rows[0].value
                    )
                    library_type = proj_doc["details"].get(
                        "library_construction_method", ""
                    )
                    queued_date = proj_doc["details"].get("queued", "")
                    if not queued_date:
                        queued_date = proj_doc.get("project_summary", {}).get(
                            "queued", ""
                        )
                    pools[method][container] = {
                        "samples": [{"name": name}],
                        "library_types": [library_type],
                        "proj_queue_dates": [queued_date],
                        "projects": {project: proj_doc["project_name"]},
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
                data=self.progress_data()
            )
        )

    
    def progress_data(self):

        #TODO: Add Sample: Sample/Reagent Label
        # Get all samples in the SmartSeq3 workflow
        workflow_name = 'Smart-seq3 for NovaSeqXPlus v1.0'
        sample_level_udfs_list = ['Sample Type', 'Sample Links', 'Cell Type', 'Tissue Type', 'Species Name', 'Comment']
        project_level_udfs_list = ['Sequence units ordered (lanes)']
        step_level_udfs_definition = {'Plates to Send': ['Sample plate sent date'],
                                        'Plates Sent': ['Sample plate received date'],
                                        'Lysis, RT and pre-Amp': ['PCR Cycles'],
                                        'cDNA QC': ['Optimal Cycle Number']}
        step_level_udfs_id = {}
        samples_in_step_dict= {}
        project_level_udfs = {}

        geno_session = geno_utils.get_session()
        workflow_steps=geno_queries.get_all_steps_for_workflow(geno_session, workflow_name)
        
        for stepname, stepid, protocolname, stepindex in workflow_steps:
            samples_in_step_dict[stepid] = {'stepname': stepname, 
                                            'protocolname': protocolname, 
                                            'stepindex': stepindex,
                                            'samples': {}}
            #Different versions of the workflow will have different stepids for the same stepname
            if stepname in step_level_udfs_definition:
                step_level_udfs_id[stepid] = step_level_udfs_definition[stepname]
        
        # Get all the information for each sample in given workflow
        samples = geno_queries.get_all_samples_in_a_workflow(geno_session, workflow_name)
        for _, sample_name, sampleid, stepid, projectid, _ in samples:
            sample_dict = {'projectid': projectid}
            if projectid not in project_level_udfs:
                query_res = geno_queries.get_udfs_from_project(geno_session, projectid, project_level_udfs_list)
                proj_data = {}
                for udfname, udfvalue, _, projectname in query_res:
                    proj_data[udfname] = udfvalue
                    #This is redundant
                    proj_data['projectname'] = projectname
                project_level_udfs[projectid] = proj_data
            #Get sample level udfs
            sample_level_udfs = geno_queries.get_udfs_from_sample(geno_session, sampleid, sample_level_udfs_list)
            for udfname, udfvalue, _ in sample_level_udfs:
                sample_dict[udfname] = udfvalue
            
            #Get udfs specific to a step
            if stepid in step_level_udfs_id:
                step_level_udfs = geno_queries.get_sample_udfs_from_step(geno_session, sampleid, stepid, step_level_udfs_id[stepid])
                for udfname, udfvalue, _ in step_level_udfs:
                    sample_dict[udfname] = udfvalue 

            samples_in_step_dict[stepid]['samples'][sample_name] = sample_dict

        return [samples_in_step_dict, project_level_udfs]