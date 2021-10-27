import tornado.web
import json
import base64
import requests

from status.util import SafeHandler
from genologics.config import BASEURI, USERNAME, PASSWORD
from genologics import lims
from genologics.entities import Queue, Artifact, Container
import xml.etree.ElementTree as ET
import psycopg2


class qPCRPoolsDataHandler(SafeHandler):
    """ Serves a page with qPCR queues from LIMS listed
    URL: /api/v1/qpcr_pools
    """
    def get(self):
        qpcr_control_names = [ 'AM7852', 'E.Coli genDNA', 'Endogenous Positive Control', 'Exogenous Positive Control',
                                'Human Brain Reference RNA', 'lambda DNA', 'mQ Negative Control', 'NA10860', 'NA11992',
                                'NA11993', 'NA12878', 'NA12891', 'NA12892', 'No Amplification Control',
                                'No Reverse Transcriptase Control', 'No Template Control', 'PhiX v3', 'Universal Human Reference RNA',
                                'lambda DNA (qPCR)'
                              ]
        queues = {}
        #query for Miseq and NovaSeq
        query = ('select art.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid '
                    'from artifact art, stagetransition st, container ct, containerplacement ctp, sample s, artifact_sample_map asm '
                    'where art.artifactid=st.artifactid and st.stageid in (select stageid from stage where stepid={}) and st.completedbyid is null and st.workflowrunid>0 '
                    'and ctp.processartifactid=st.artifactid and ctp.containerid=ct.containerid and s.processid=asm.processid and asm.artifactid=art.artifactid '
                    'group by art.artifactid, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid;')
        #Queue = 1002, stepid in the query
        queues['MiSeq'] = query.format(1002)
        #Queue = 1666, stepid in the query
        queues['NovaSeq'] = query.format(1666)
        #Queue = 2102, stepid in the query
        queues['NextSeq'] = query.format(2102)
        #Queue 41, but query is slightly different to use protocolid for Library Validation QC which is 8 and, also to exclude the controls
        queues['LibraryValidation'] = ("select  st.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid "
                                        "from artifact art, stagetransition st, container ct, containerplacement ctp, sample s, artifact_sample_map asm where "
                                        "art.artifactid=st.artifactid and st.stageid in (select stageid from stage where membershipid in (select sectionid from workflowsection where protocolid=8)) "
                                        "and st.workflowrunid>0 and st.completedbyid is null and ctp.processartifactid=st.artifactid and ctp.containerid=ct.containerid and s.processid=asm.processid "
                                        "and asm.artifactid=art.artifactid and art.name not in {} "
                                        "group by st.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, ctp.wellxposition, ctp.wellyposition, s.projectid;".format(tuple(qpcr_control_names)))

        methods = queues.keys()
        projects = self.application.projects_db.view("project/project_id")
        connection = psycopg2.connect(user=self.application.lims_conf['username'], host=self.application.lims_conf['url'],
                                        database=self.application.lims_conf['db'], password=self.application.lims_conf['password'])
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
                value = chr(65+int(record[6])) + ':' + str(int(record[5])+1)
                project = 'P'+str(record[7])
                library_type = ''
                runmode = ''

                if container in pools[method]:
                    pools[method][container]['samples'].append({'name': record[1], 'well': value, 'queue_time': queue_time})
                    if project not in pools[method][container]['projects']:
                        proj_doc = self.application.projects_db.get(projects[project].rows[0].value)
                        library_type =  proj_doc['details'].get('library_construction_method', '')
                        runmode = proj_doc['details'].get('sequencing_platform', '')
                        if library_type not in pools[method][container]['library_types']:
                            pools[method][container]['library_types'].append(library_type)
                        if runmode not in pools[method][container]['runmodes']:
                            pools[method][container]['runmodes'].append(runmode)
                        pools[method][container]['projects'].append(project)
                else:
                    proj_doc = self.application.projects_db.get(projects[project].rows[0].value)
                    library_type =  proj_doc['details']['library_construction_method']
                    runmode = proj_doc['details']['sequencing_platform']
                    pools[method][container] = {
                                                'samples':[{'name': record[1], 'well': value, 'queue_time': queue_time}],
                                                'library_types': [library_type],
                                                'runmodes': [runmode],
                                                'projects': [project]
                                                }

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(pools))


class qPCRPoolsHandler(SafeHandler):
    """ Serves a page with qPCR queues from LIMS listed
    URL: /pools_qpcr
    """
    def get(self):
        t = self.application.loader.load("qpcr_pools.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user()))


class SequencingQueuesDataHandler(SafeHandler):
    """ Serves a page with sequencing queues from LIMS listed
    URL: /api/v1/sequencing_queues
    """

    def get(self):

        query = ('select art.artifactid, art.name, st.lastmodifieddate, st.generatedbyid, ct.name, s.projectid '
                    'from artifact art, stagetransition st, container ct, containerplacement ctp, sample s, artifact_sample_map asm '
                    'where art.artifactid=st.artifactid and st.stageid in (select stageid from stage where stepid={}) and st.completedbyid is null and '
                    'st.workflowrunid>0 and ctp.processartifactid=st.artifactid and ctp.containerid=ct.containerid and  s.processid=asm.processid and '
                    'asm.artifactid=art.artifactid group by art.artifactid, st.lastmodifieddate, st.generatedbyid, ct.name, s.projectid;')

        #sequencing queues are currently taken as the following
        queues = {}
        #Miseq- Step 7: Denature, Dilute and load sample
        queues['MiSeq'] = query.format(55)
        #NextSeq- Step 7: Load to Flowcell
        queues['NextSeq'] = query.format(2109)
        #Novaseq Step 11: Load to flow cell
        queues['NovaSeq'] = query.format(1662)

        methods = queues.keys()
        projects = self.application.projects_db.view("project/project_id")
        connection = psycopg2.connect(user=self.application.lims_conf['username'], host=self.application.lims_conf['url'],
                                        database=self.application.lims_conf['db'], password=self.application.lims_conf['password'])
        cursor = connection.cursor()
        pools = {}
        for method in methods:
            pools[method] ={}
            query = queues[method]
            cursor.execute(query)
            records = cursor.fetchall()
            for record in list(records):
                queue_time = record[2].isoformat()
                container = record[4]
                proj_and_samples = {}
                conc_qpcr = ''
                project = 'P'+str(record[5])
                final_loading_conc = 'TBD'
                if project not in pools[method]:
                    proj_doc = self.application.projects_db.get(projects[project].rows[0].value)
                    setup = proj_doc['details'].get('sequencing_setup','')
                    lanes = proj_doc['details'].get('sequence_units_ordered_(lanes)', '')
                    librarytype = proj_doc['details'].get('library_construction_method', '')
                    runmode = proj_doc['details'].get('sequencing_platform','')
                    name = proj_doc['project_name']
                    pools[method][project] = {
                                               'name': name,
                                               'setup': setup,
                                               'lanes': lanes,
                                               'runmode': runmode,
                                               'librarytype': librarytype,
                                               'plates': { container: {
                                                                       'queue_time': queue_time,
                                                                       }
                                                           }
                                               }
                else:
                    if container not in pools[method][project]['plates']:
                        pools[method][project]['plates'][container] = {'queue_time' : queue_time}

                if method is not 'NovaSeq':
                    conc_rerun_query = ('select udfname, udfvalue from artifact_udf_view where udfname in {} '
                                        'and artifactid={}').format(tuple(['Concentration', 'Rerun', 'Pool Conc. (nM)']), record[0])
                    cursor.execute(conc_rerun_query)
                    conc_rerun_res = cursor.fetchall()
                    for udf in list(conc_rerun_res):
                        if udf[0] == 'Rerun':
                            is_rerun = False if udf[1] == 'False' else True
                        else:
                            conc_qpcr = udf[1]
                elif method is 'NovaSeq':
                    rerun_query = ('select count(artifactid) from stagetransition '
                                    'where stageid in (select stageid from stage where stepid=1662) '
                                    'and artifactid={} group by artifactid')
                    #The final loading conc is defined in the Define Run format stap whose stepid is 1659
                    final_lconc_query = ('select udfname, udfvalue from artifact_udf_view where udfname in (\'Final Loading Concentration (pM)\') '
                                         'and artifactid in (select st.artifactid from stagetransition st, artifact_sample_map asm, sample, project '
                                         'where st.artifactid = asm.artifactid AND sample.processid = asm.processid and sample.projectid = project.projectid '
                                         'and project.projectid = {pnum} and generatedbyid in (select st.completedbyid '
                                         'from stagetransition st, stage s, artifact_sample_map asm, sample, project '
                                         'where st.stageid = s.stageid and s.stepid=1659 and st.artifactid = asm.artifactid and sample.processid = asm.processid '
                                         'and sample.projectid = project.projectid AND project.projectid = {pnum} group by st.completedbyid) group by st.artifactid)')
                    conc_query = ('select udfname, udfvalue from artifact_udf_view where udfname in (\'Concentration\') '
                                        'and artifactid={}')

                    #rerun
                    is_rerun = False
                    cursor.execute(rerun_query.format(record[0]))
                    rerun_res = cursor.fetchone()[0]
                    if rerun_res > 1:
                        is_rerun = True

                    #Final loading conc
                    cursor.execute(final_lconc_query.format(pnum=record[5]))
                    final_lconc_res = dict(cursor.fetchall())
                    flc_novaseq = final_lconc_res.get('Final Loading Concentration (pM)')
                    if flc_novaseq is not None:
                        final_loading_conc = flc_novaseq

                    #qPCR conc
                    qpcr_conc_query = ('select art.artifactid, art.name from artifact_sample_map asm, artifact art '
                                  'where processid=(select processid from artifact_sample_map where artifactid={} limit 1)'
                                  'and art.artifactid=asm.artifactid and art.name=\'qPCR Measurement\';')
                    cursor.execute(qpcr_conc_query.format(record[0]))
                    c_res = cursor.fetchone()
                    if c_res is None:
                        conc_qpcr = 0.0
                    else:
                        cursor.execute(conc_query.format(c_res[0]))
                        conc_qpcr = cursor.fetchone()[1]

                pools[method][project]['final_loading_conc'] = final_loading_conc
                pools[method][project]['plates'][container]['conc_pool_qpcr'] = conc_qpcr
                pools[method][project]['plates'][container]['is_rerun'] = is_rerun

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(pools))


class SequencingQueuesHandler(SafeHandler):
    """ Serves a page with sequencing queues from LIMS listed
    URL: /sequencing_queues
    """
    def get(self):
        t = self.application.loader.load("sequencing_queues.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user()))
