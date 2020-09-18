import tornado.web
import json
import base64
import requests

from status.util import SafeHandler
from genologics.config import BASEURI, USERNAME, PASSWORD
from genologics import lims
from genologics.entities import Queue, Artifact, Container
import xml.etree.ElementTree as ET


class qPCRPoolsDataHandler(SafeHandler):
    """ Serves a page with qPCR queues from LIMS listed
    URL: /api/v1/qpcr_pools
    """
    def get(self):
        limsl = lims.Lims(BASEURI, USERNAME, PASSWORD)
        #qPCR queues
        queues = {}
        queues['MiSeq'] = Queue(limsl, id='1002')
        queues['NovaSeq'] = Queue(limsl, id='1666')
        queues['LibraryValidation'] = Queue(limsl, id='41')

        methods = queues.keys()
        pools = {}

        for method in methods:
            pools[method] ={}
            if queues[method].artifacts:
                tree = ET.fromstring(queues[method].xml())
                if tree.find('next-page') is not None:
                    flag =True
                    next_page_uri = tree.find('next-page').attrib['uri']
                    while flag:
                        next_page = ET.fromstring(Queue(limsl, uri = next_page_uri).xml())
                        for elem in next_page.findall('artifacts'):
                            tree.insert(0, elem)
                        if next_page.find('next-page') is not None:
                            next_page_uri = next_page.find('next-page').attrib['uri']
                        else:
                            flag = False
                for artifact in tree.iter('artifact'):
                    queue_time = artifact.find('queue-time').text
                    container = Container(limsl, uri = artifact.find('location').find('container').attrib['uri']).name
                    art = Artifact(limsl, uri = artifact.attrib['uri'])
                    value = artifact.find('location').find('value').text
                    library_type = ''
                    runmode = ''
                    if not 'lambda DNA' in art.name:
                        try:
                            library_type = art.samples[0].project.udf["Library construction method"]
                        except KeyError:  # I think this was an issue on stage with strange data
                            library_type = 'NA'
                        try:
                            runmode = art.samples[0].project.udf['Sequencing platform']
                        except KeyError:
                            runmode = 'NA'
                    if container in pools[method]:
                        pools[method][container]['samples'].append({'name': art.name, 'well': value, 'queue_time': queue_time})
                        if library_type and library_type not in pools[method][container]['library_types']:
                            pools[method][container]['library_types'].append(library_type)
                        if runmode and runmode not in pools[method][container]['runmodes']:
                            pools[method][container]['runmodes'].append(runmode)
                    else:
                        pools[method][container] = {
                                                    'samples':[{'name': art.name, 'well': value, 'queue_time': queue_time}],
                                                    'library_types': [library_type],
                                                    'runmodes': [runmode]
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
                             setup = sample.project.udf['Sequencing setup']
                             lanes = sample.project.udf['Sequence units ordered (lanes)']
                             librarytype = sample.project.udf['Library construction method']
                             runmode = sample.project.udf['Sequencing platform']
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
