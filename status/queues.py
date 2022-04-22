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
from dateutil.parser import parse


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
                sequencing_platform = ''
                flowcell = ''
                queued_date = ''

                if container in pools[method]:
                    pools[method][container]['samples'].append({'name': record[1], 'well': value, 'queue_time': queue_time})
                    if project not in pools[method][container]['projects']:
                        proj_doc = self.application.projects_db.get(projects[project].rows[0].value)
                        library_type =  proj_doc['details'].get('library_construction_method', '')
                        sequencing_platform = proj_doc['details'].get('sequencing_platform', '')
                        flowcell = proj_doc['details'].get('flowcell', '')
                        queued_date = proj_doc['details'].get('queued', '')
                        if library_type not in pools[method][container]['library_types']:
                            pools[method][container]['library_types'].append(library_type)
                        if sequencing_platform not in pools[method][container]['sequencing_platform']:
                            pools[method][container]['sequencing_platforms'].append(sequencing_platform)
                        if flowcell not in pools[method][container]['flowcells']:
                            pools[method][container]['flowcells'].append(flowcell)
                        pools[method][container]['proj_queue_dates'].append(queued_date)
                        pools[method][container]['projects'][project] = proj_doc['project_name']
                else:
                    proj_doc = self.application.projects_db.get(projects[project].rows[0].value)
                    library_type =  proj_doc['details'].get('library_construction_method', '')
                    sequencing_platform = proj_doc['details'].get('sequencing_platform', '')
                    flowcell = proj_doc['details'].get('flowcell', '')
                    queued_date = proj_doc['details'].get('queued', '')
                    pools[method][container] = {
                                                'samples':[{'name': record[1], 'well': value, 'queue_time': queue_time}],
                                                'library_types': [library_type],
                                                'sequencing_platforms': [sequencing_platform],
                                                'flowcells': [flowcell],
                                                'proj_queue_dates': [queued_date],
                                                'projects': {project: proj_doc['project_name']}
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
        queues['MiSeq: Denature, Dilute and Load Sample'] = '55'
        #NextSeq- Step 7: Load to Flowcell
        queues['NextSeq: Load to Flowcell'] = '2109'
        #Novaseq Step 11: Load to flow cell
        queues['NovaSeq: Load to Flowcell'] = '1662'
        #Novaseq Step 7: Define Run Format
        queues['NovaSeq: Define Run Format'] = '1659'
        #Novaseq Step 8: Make Bulk Pool for Novaseq Standard
        queues['NovaSeq: Make Bulk Pool for Standard'] = '1655'
        #Novaseq Step 10: Make Bulk Pool for Novaseq Xp
        queues['NovaSeq : Make Bulk Pool for Xp'] = '1656'

        methods = queues.keys()
        projects = self.application.projects_db.view("project/project_id")
        connection = psycopg2.connect(user=self.application.lims_conf['username'], host=self.application.lims_conf['url'],
                                        database=self.application.lims_conf['db'], password=self.application.lims_conf['password'])
        cursor = connection.cursor()
        pools = {}
        for method in methods:
            pools[method] ={}
            queue_query = query.format(queues[method])
            cursor.execute(queue_query)
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
                    sequencing_platform = proj_doc['details'].get('sequencing_platform','')
                    flowcell = proj_doc['details'].get('flowcell', '')
                    queued_date = proj_doc['details'].get('queued', '')
                    flowcell_option = proj_doc['details'].get('flowcell_option', '')
                    name = proj_doc['project_name']
                    pools[method][project] = {
                                               'name': name,
                                               'setup': setup,
                                               'lanes': lanes,
                                               'sequencing_platform': sequencing_platform,
                                               'flowcell': flowcell,
                                               'proj_queue_date': queued_date,
                                               'flowcell_option': flowcell_option,
                                               'librarytype': librarytype,
                                               'plates': { container: {
                                                                       'queue_time': queue_time,
                                                                       }
                                                           }
                                               }
                else:
                    if container not in pools[method][project]['plates']:
                        pools[method][project]['plates'][container] = {'queue_time' : queue_time}

                if 'NovaSeq' not in method:
                    conc_rerun_query = ('select udfname, udfvalue from artifact_udf_view where udfname in {} '
                                        'and artifactid={}').format(tuple(['Concentration', 'Rerun', 'Pool Conc. (nM)']), record[0])
                    cursor.execute(conc_rerun_query)
                    conc_rerun_res = cursor.fetchall()
                    for udf in list(conc_rerun_res):
                        if udf[0] == 'Rerun':
                            is_rerun = False if udf[1] == 'False' else True
                        else:
                            conc_qpcr = udf[1]
                elif 'NovaSeq' in method:
                    rerun_query = ('select count(artifactid) from stagetransition '
                                    'where stageid in (select stageid from stage where stepid={}) '
                                    'and artifactid={} group by artifactid')
                    #The final loading conc is defined in the Define Run format step whose stepid is 1659
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
                    cursor.execute(rerun_query.format(queues[method], record[0]))
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

class WorksetQueuesDataHandler(SafeHandler):
    """ Serves all the samples that need to be added to worksets in LIMS
    URL: /api/v1/workset_queues
    """
    def get(self):

        queues = {}
        queues['TruSeqRNAprep'] = '311'
        queues['TruSeqRNAprepV2'] = '2301'
        queues['TruSeqSmallRNA'] = '410'
        queues['TruSeqDNAPCR_free'] = '407'
        queues['ThruPlex'] = '451'
        queues['Genotyping'] = '901'
        queues['RadSeq'] = '1201'
        queues['SMARTerPicoRNA'] = '1551'
        queues['ChromiumGenomev2'] = '1801'

        control_names = [ 'AM7852', 'E.Coli genDNA', 'Endogenous Positive Control', 'Exogenous Positive Control',
                            'Human Brain Reference RNA', 'lambda DNA', 'mQ Negative Control', 'NA10860', 'NA11992',
                            'NA11993', 'NA12878', 'NA12891', 'NA12892', 'No Amplification Control',
                            'No Reverse Transcriptase Control', 'No Template Control', 'PhiX v3', 'Universal Human Reference RNA',
                            'lambda DNA (qPCR)'
                         ]


        methods = queues.keys()
        projects = self.application.projects_db.view("project/project_id")
        connection = psycopg2.connect(user=self.application.lims_conf['username'], host=self.application.lims_conf['url'],
                                        database=self.application.lims_conf['db'], password=self.application.lims_conf['password'])
        cursor = connection.cursor()
        pools = {}

        for method in methods:
            pools[method] ={}
            query = ("select art.artifactid, art.name, st.lastmodifieddate, st.generatedbyid "
                            "from artifact art, stagetransition st where art.artifactid=st.artifactid and "
                            "st.stageid in (select stageid from stage where stepid={}) and "
                            "st.completedbyid is null and st.workflowrunid>0 and art.name not in {};".format(queues[method], tuple(control_names)))
            cursor.execute(query)
            records = cursor.fetchall()
            for record in list(records):
                project = record[1].split('_')[0]
                requeued = False
                if record[3] is None:
                    requeued =True
                if project in pools[method]:
                    pools[method][project]['samples'].append((record[1], requeued))
                    if parse(pools[method][project]['oldest_sample_queued_date']) > record[2]:
                        pools[method][project]['oldest_sample_queued_date'] = record[2].isoformat()
                else:
                    proj_doc = self.application.projects_db.get(projects[project].rows[0].value)
                    total_num_samples = proj_doc['no_of_samples']
                    oldest_sample_queued_date = record[2].isoformat()
                    projName = proj_doc['project_name']
                    protocol = proj_doc['details']['library_construction_method']
                    queued_date = proj_doc.get('project_summary', {}).get('queued', 'NA')
                    latest_running_note = self._get_latest_running_note(proj_doc['details'].get('running_notes'))
                    pools[method][project] = {'samples': [(record[1], requeued)], 'total_num_samples': total_num_samples,
                                                'oldest_sample_queued_date': oldest_sample_queued_date, 'pname': projName,
                                                'protocol': protocol, 'latest_running_note': latest_running_note,
                                                'queued_date': queued_date }

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(pools))

    def _get_latest_running_note(self, val):
        if not val:
            return ''
        notes = json.loads(val)
        latest_note = { max(notes.keys()): notes[max(notes.keys())] }
        return latest_note

class WorksetQueuesHandler(SafeHandler):
    """ Serves a page with sequencing queues from LIMS listed
    URL: /workset_queues
    """
    def get(self):
        t = self.application.loader.load("workset_queues.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user()))
