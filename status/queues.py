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
                        library_type =  proj_doc['details']['library_construction_method']
                        runmode = proj_doc['details']['sequencing_platform']
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
        limsl = lims.Lims(BASEURI, USERNAME, PASSWORD)
        #sequencing queues are currently taken as the following
        #Miseq- Step 7: Denature, Dilute and load sample
        #Novaseq Step 11: Load to flow cell
        queues = {}
        queues['MiSeq'] = Queue(limsl, id='55')
        queues['NovaSeq'] = Queue(limsl, id='1662')

        methods = queues.keys()
        pools = {}

        for method in methods:
            pools[method] ={}
            if queues[method].artifacts:
                tree = ET.fromstring(queues[method].xml())
                for artifact in tree.iter('artifact'):
                    queue_time = artifact.find('queue-time').text
                    container = Container(limsl, uri = artifact.find('location').find('container').attrib['uri']).name
                    attr_name = Artifact(limsl, uri = artifact.attrib['uri']).name
                    value = artifact.find('location').find('value').text
                    proj_and_samples = {}
                    conc_qpcr = ''
                    art = Artifact(limsl, uri = artifact.attrib['uri'])
                    if method is 'MiSeq':
                        #FinishedLibrary
                        if 'Concentration' in dict(art.udf.items()).keys():
                            conc_qpcr = art.udf['Concentration']
                        #InhouseLibrary
                        elif 'Pool Conc. (nM)' in dict(art.udf.items()).keys():
                            conc_qpcr = str(art.udf['Pool Conc. (nM)'])
                        else:
                            pass
                        is_rerun = art.udf.get('Rerun', False)
                    elif method is 'NovaSeq':
                        if 'Concentration' in dict(art.udf.items()).keys():
                            conc_qpcr = art.udf["Concentration"]
                            is_rerun = art.udf.get('Rerun', False)
                        else:
                            new_art = art.parent_process.input_output_maps[0][0]
                            # The loop iterates 4 times as the values were found within the first 4 preceding
                            # parent processes(through trial and error). If the values are not found within 4 iterations, they can be looked up
                            # manually in LIMS. The loop is structured so as its not very clear in the genologics API which of the parent processes
                            # will contain the values in post process and 4 seemed to get everything for the data at hand.
                            i = 0
                            while i < 4:
                                if 'Concentration' in dict(new_art['post-process-uri'].udf.items()).keys():
                                    conc_qpcr = new_art['post-process-uri'].udf["Concentration"]
                                    is_rerun = new_art['post-process-uri'].udf.get('Rerun', False)
                                    break
                                else:
                                    new_art = new_art['parent-process'].input_output_maps[0][0]
                                    i = i + 1

                    for sample in art.samples:
                        project = sample.project.id
                        if project in pools[method]:
                            if container in pools[method][project]['plates']:
                                pools[method][project]['plates'][container]['samples'].append(sample.name)
                            else:
                                pools[method][project]['plates'][container] = {
                                                                                'samples': [sample.name],
                                                                                'well': value,
                                                                                'queue_time': queue_time,
                                                                                'conc_pool_qpcr' : conc_qpcr,
                                                                                'is_rerun' : is_rerun
                                                                                }
                        else:
                             setup = sample.project.udf.get('Sequencing setup', 'NA')
                             lanes = sample.project.udf.get('Sequence units ordered (lanes)', 'NA')
                             librarytype = sample.project.udf.get('Library construction method', 'NA')
                             runmode = sample.project.udf.get('Sequencing platform', 'NA')
                             final_loading_conc = 'TBD'
                             if method is 'NovaSeq':
                                 try:
                                     final_loading_conc = Artifact(limsl, uri=artifact.attrib['uri']).udf['Final Loading Concentration (pM)']
                                 except KeyError:
                                     pass
                             pools[method][project] = {
                                                        'name': sample.project.name,
                                                        'setup': setup,
                                                        'lanes': lanes,
                                                        'runmode': runmode,
                                                        'final_loading_conc': final_loading_conc,
                                                        'librarytype': librarytype,
                                                        'plates': { container: {
                                                                                'samples': [sample.name],
                                                                                'well': value,
                                                                                'queue_time': queue_time,
                                                                                'conc_pool_qpcr' : conc_qpcr,
                                                                                'is_rerun' : is_rerun
                                                                                }
                                                                    }
                                                        }
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(pools))


class SequencingQueuesHandler(SafeHandler):
    """ Serves a page with sequencing queues from LIMS listed
    URL: /sequencing_queues
    """
    def get(self):
        t = self.application.loader.load("sequencing_queues.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user()))
