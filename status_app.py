""" Main genomics-status web application.
"""
import base64
import uuid
import yaml

from collections import OrderedDict
from couchdb import Server

import tornado.autoreload
import tornado.httpserver
import tornado.ioloop
import tornado.web

from tornado import template
from tornado.options import define, options

from status.applications import *
from status.authorization import *
from status.barcode_vs_expected import *
from status.flowcells import *
from status.phix_err_rate import *
from status.production import *
from status.projects import *
from status.quotas import *
from status.q30 import *
from status.reads_per_lane import *
from status.reads_vs_qv import *
from status.samples import *
from status.sequencing import *
from status.suggestion_box import *
from status.testing import *
from status.util import *

import status.worksets

class Application(tornado.web.Application):
    def __init__(self, settings):
        handlers = [
            ("/", MainHandler),
            ("/login", LoginHandler),
            ("/logout", LogoutHandler),
            ("/unauthorized", UnAuthorizedHandler),
            ("/api/v1", DataHandler),
            ("/api/v1/applications", ApplicationsDataHandler),
            ("/api/v1/application/([^/]*)$", ApplicationDataHandler),
            ("/api/v1/expected", BarcodeVsExpectedDataHandler),
            tornado.web.URLSpec("/api/v1/caliper_image/(?P<project>[^/]+)/(?P<sample>[^/]+)/(?P<step>[^/]+)", CaliperImageHandler, name="CaliperImageHandler"),
            ("/api/v1/delivered_monthly", DeliveredMonthlyDataHandler),
            ("/api/v1/delivered_monthly.png", DeliveredMonthlyPlotHandler),
            ("/api/v1/delivered_quarterly", DeliveredQuarterlyDataHandler),
            ("/api/v1/delivered_quarterly.png", DeliveredQuarterlyPlotHandler),
            ("/api/v1/flowcells", FlowcellsDataHandler),
            ("/api/v1/flowcell_info2/([^/]*)$", FlowcellsInfoDataHandler),
            ("/api/v1/flowcell_info/([^/]*)$", OldFlowcellsInfoDataHandler),
            ("/api/v1/flowcell_qc/([^/]*)$", FlowcellQCHandler),
            ("/api/v1/flowcell_demultiplex/([^/]*)$",
                FlowcellDemultiplexHandler),
            ("/api/v1/flowcell_q30/([^/]*)$", FlowcellQ30Handler),
            ("/api/v1/flowcells/([^/]*)$", FlowcellDataHandler),
            ("/api/v1/flowcell_search/([^/]*)$", FlowcellSearchHandler),
            ("/api/v1/instrument_cluster_density",
                InstrumentClusterDensityDataHandler),
            ("/api/v1/instrument_cluster_density.png",
                InstrumentClusterDensityPlotHandler),
            ("/api/v1/instrument_error_rates", InstrumentErrorrateDataHandler),
            ("/api/v1/instrument_error_rates.png",
                InstrumentErrorratePlotHandler),
            ("/api/v1/instrument_unmatched", InstrumentUnmatchedDataHandler),
            ("/api/v1/instrument_unmatched.png", InstrumentUnmatchedPlotHandler),
            ("/api/v1/instrument_yield", InstrumentYieldDataHandler),
            ("/api/v1/instrument_yield.png", InstrumentYieldPlotHandler),
            ("/api/v1/last_updated", UpdatedDocumentsDatahandler),
            ("/api/v1/last_psul", LastPSULRunHandler),
            ("/api/v1/plot/q30.png", Q30PlotHandler),
            ("/api/v1/plot/samples_per_lane.png",
                SamplesPerLanePlotHandler),
            ("/api/v1/plot/reads_per_lane.png", ReadsPerLanePlotHandler),
            ("/api/v1/plot/barcodes_vs_expected([^/]*)$", BarcodeVsExpectedPlotHandler),
            ("/api/v1/samples_per_lane", SamplesPerLaneDataHandler),
            ("/api/v1/produced_monthly", ProducedMonthlyDataHandler),
            ("/api/v1/produced_monthly.png", ProducedMonthlyPlotHandler),
            ("/api/v1/produced_quarterly", ProducedQuarterlyDataHandler),
            ("/api/v1/produced_quarterly.png", ProducedQuarterlyPlotHandler),
            ("/api/v1/production/cronjobs", ProductionCronjobsDataHandler),
            ("/api/v1/projects", ProjectsDataHandler),
            ("/api/v1/project/([^/]*)$", ProjectSamplesDataHandler),
            ("/api/v1/project/([^/]*)/tickets", ProjectTicketsDataHandler),
            ("/api/v1/projects_fields", ProjectsFieldsDataHandler),
            ("/api/v1/project_summary/([^/]*)$", ProjectDataHandler),
            ("/api/v1/project_search/([^/]*)$", ProjectsSearchHandler),
            ("/api/v1/presets", PresetsHandler),
            ("/api/v1/qc/([^/]*)$", SampleQCDataHandler),
            ("/api/v1/projectqc/([^/]*)$", ProjectQCDataHandler),
            ("/api/v1/quotas/(\w+)?", QuotaDataHandler),
            ("/api/v1/reads_vs_quality", ReadsVsQDataHandler),
            ("/api/v1/running_notes/([^/]*)$", RunningNotesDataHandler),
            ("/api/v1/links/([^/]*)$", LinksDataHandler),
            ("/api/v1/sample_info/([^/]*)$", SampleInfoDataHandler),
            ("/api/v1/sample_readcount/(\w+)?", SampleReadCountDataHandler),
            ("/api/v1/sample_run_counts/(\w+)?",
                SampleRunReadCountDataHandler),
            ("/api/v1/sample_alignment/([^/]*)$",
                SampleQCAlignmentDataHandler),
            ("/api/v1/sample_coverage/([^/]*)$", SampleQCCoverageDataHandler),
            ("/api/v1/sample_summary/([^/]*)$", SampleQCSummaryDataHandler),
            ("/api/v1/sample_insert_sizes/([^/]*)$",
                SampleQCInsertSizesDataHandler),
            ("/api/v1/samples/start/([^/]*)$", PagedQCDataHandler),
            ("/api/v1/samples/([^/]*)$", SampleRunDataHandler),
            ("/api/v1/suggestions", SuggestionBoxDataHandler),
            ("/api/v1/test/(\w+)?", TestDataHandler),
            ("/api/v1/uppmax_projects", UppmaxProjectsDataHandler),
            ("/api/v1/phix_err_rate", PhixErrorRateDataHandler),
            ("/api/v1/worksets", status.worksets.WorksetsDataHandler),
            ("/api/v1/workset/([^/]*)$", status.worksets.WorksetDataHandler),
            ("/api/v1/workset_search/([^/]*)$", status.worksets.WorksetSearchHandler),
            ("/applications", ApplicationsHandler),
            ("/application/([^/]*)$", ApplicationHandler),
            ("/barcode_vs_expected", ExpectedHandler),
            ("/flowcells", FlowcellsHandler),
            ("/flowcells/([^/]*)$", FlowcellHandler),
            ("/q30", Q30Handler),
            ("/qc/([^/]*)$", SampleQCSummaryHandler),
            (r"/qc_reports/(.*)", SafeStaticFileHandler, {"path": 'qc_reports'}),
            ("/quotas", QuotasHandler),
            ("/quotas/(\w+)?", QuotaHandler),
            ("/phix_err_rate", PhixErrorRateHandler),
            ("/production", ProductionHandler),
            ("/production/cronjobs", ProductionCronjobsHandler),
            ("/project/([^/]*)$", ProjectSamplesHandler),
            ("/projects/([^/]*)$", ProjectsHandler),
            ("/reads_vs_qv", ReadsVsQvhandler),
            ("/reads_per_lane", ReadsPerLaneHandler),
            ("/samples_per_lane", SamplesPerLaneHandler),
            ("/samples/([^/]*)$", SampleRunHandler),
            ("/sequencing", SequencingStatsHandler),
            ("/suggestion_box", SuggestionBoxHandler),
            ("/worksets", status.worksets.WorksetsHandler),
            ("/workset/([^/]*)$", status.worksets.WorksetHandler),
            (r'.*', BaseHandler)
        ]

        self.declared_handlers = handlers

        # Load templates
        self.loader = template.Loader("design")

        # Global connection to the database
        couch = Server(settings.get("couch_server", None))
        if couch:
            self.uppmax_db = couch["uppmax"]
            self.samples_db = couch["samples"]
            self.projects_db = couch["projects"]
            self.flowcells_db = couch["flowcells"]
            self.gs_users_db = couch["gs_users"]
            self.cronjobs_db = couch["cronjobs"]
            self.suggestions_db = couch["suggestion_box"]
            self.worksets_db=couch["worksets"]
        else:
            print settings.get("couch_server", None)
            raise IOError("Cannot connect to couchdb");
        #Load columns and presets from genstat-defaults user in StatusDB
        genstat_id = ''
        for u in self.gs_users_db.view('authorized/users'):
            if u.get('key') == 'genstat-defaults':
                genstat_id = u.get('value')

        #It's important to check that this user exists!
        if not genstat_id:
            raise RuntimeError("genstat-defaults user not found on {}, please " \
                               "make sure that the user is abailable with the " \
                               "corresponding defaults information.".format(settings.get("couch_server", None)))

        # We need to get this database as OrderedDict, so the pv_columns doesn't
        # mess up
        user = settings.get("username", None)
        password = settings.get("password", None)
        headers = {"Accept": "application/json",
                   "Authorization": "Basic " + "{}:{}".format(user, password).encode('base64')[:-1]}
        decoder = json.JSONDecoder(object_pairs_hook=OrderedDict)
        user_url = "{}/gs_users/{}".format(settings.get("couch_server"), genstat_id)
        json_user = requests.get(user_url, headers=headers).content.rstrip()

        self.genstat_defaults = decoder.decode(json_user)

        # Load private instrument listing
        self.instrument_list = settings.get("instruments")

        # If settings states  mode, no authentication is used
        self.test_mode = settings["Testing mode"]

        # google oauth key
        self.oauth_key = settings["google_oauth"]["key"]

        # ZenDesk
        self.zendesk_url = settings["zendesk"]["url"]
        self.zendesk_user = settings["zendesk"]["username"]
        self.zendesk_token = settings["zendesk"]["token"]
        self.zendesk = Zendesk(self.zendesk_url, use_api_token=True, zendesk_username=self.zendesk_user,
                                zendesk_password=self.zendesk_token, api_version=2)

        # Trello
        self.trello_api_key = settings['trello']['api_key']
        self.trello_api_secret = settings['trello']['api_secret']
        self.trello_token = settings['trello']['token']

        # Load password seed
        self.password_seed = settings.get("password_seed")

        # load logins for the genologics sftp
        self.genologics_login=settings['sftp']['login']
        self.genologics_pw=settings['sftp']['password']

        # Location of the psul log
        self.psul_log=settings.get("psul_log")
        
        # Setup the Tornado Application
        cookie_secret = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
        settings = {"debug": True,
                    "static_path": "static",
                    "cookie_secret": cookie_secret,
                    "login_url": "/login",
                    "google_oauth": {
                        "key": self.oauth_key,
                        "secret": settings["google_oauth"]["secret"]},
                    "contact_person": settings['contact_person'],
                    "redirect_uri": settings['redirect_uri']
                     }

        if options['develop']:
            tornado.autoreload.watch("design/application.html")
            tornado.autoreload.watch("design/applications.html")
            tornado.autoreload.watch("design/barcodes.html")
            tornado.autoreload.watch("design/base.html")
            tornado.autoreload.watch("design/base_new.html")
            tornado.autoreload.watch("design/cronjobs.html")
            tornado.autoreload.watch("design/expected.html")
            tornado.autoreload.watch("design/flowcell_samples.html")
            tornado.autoreload.watch("design/flowcells.html")
            tornado.autoreload.watch("design/index.html")
            tornado.autoreload.watch("design/phix_err_rate.html")
            tornado.autoreload.watch("design/production.html")
            tornado.autoreload.watch("design/projects.html")
            tornado.autoreload.watch("design/project_samples.html")
            tornado.autoreload.watch("design/q30.html")
            tornado.autoreload.watch("design/quota_grid.html")
            tornado.autoreload.watch("design/quota.html")
            tornado.autoreload.watch("design/reads_per_lane.html")
            tornado.autoreload.watch("design/reads_vs_qv.html")
            tornado.autoreload.watch("design/sample_run_qc.html")
            tornado.autoreload.watch("design/sample_runs.html")
            tornado.autoreload.watch("design/samples.html")
            tornado.autoreload.watch("design/sequencing_stats.html")
            tornado.autoreload.watch("design/suggestion_box.html")
            tornado.autoreload.watch("design/unauthorized.html")
            tornado.autoreload.watch("design/login.html")

        tornado.web.Application.__init__(self, handlers, **settings)


if __name__ == '__main__':
    # Tornado built-in command line parsing. Auto configures logging
    define('testing_mode', default=False, help=("WARNING, this option disables "
                                                "all security measures, use only "
                                                "for testing purposes"))
    define('develop', default=False, help=("Define develop mode to look for changes "
                                           "in files and automatically reloading them"))
    # After parsing the command line, the command line flags are stored in tornado.options
    tornado.options.parse_command_line()

    # Load configuration file
    with open("settings.yaml") as settings_file:
        server_settings = yaml.load(settings_file)

    server_settings["Testing mode"] = options['testing_mode']

    # Instantiate Application
    application = Application(server_settings)

    # Load ssl certificate and key files
    ssl_cert = server_settings.get("ssl_cert", None)
    ssl_key = server_settings.get("ssl_key", None)

    if ssl_cert and ssl_key:
        ssl_options = {"certfile": ssl_cert,
                       "keyfile": ssl_key}
    else:
        ssl_options = None

    # Start HTTP Server
    http_server = tornado.httpserver.HTTPServer(application,
                                                ssl_options = ssl_options)

    http_server.listen(server_settings.get("port", 8888))
    
    # Get a handle to the instance of IOLoop
    ioloop = tornado.ioloop.IOLoop.instance()

    # Start the IOLoop
    ioloop.start()
