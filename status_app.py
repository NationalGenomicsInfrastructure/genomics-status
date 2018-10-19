""" Main genomics-status web application.
"""
import base64
import subprocess
import uuid
import yaml
import json
import requests

from collections import OrderedDict
from couchdb import Server

import tornado.autoreload
import tornado.httpserver
import tornado.ioloop
import tornado.web

from tornado import template
from tornado.options import define, options

from status.applications import ApplicationDataHandler, ApplicationHandler, ApplicationsDataHandler, ApplicationsHandler
from status.authorization import LoginHandler, LogoutHandler, UnAuthorizedHandler
from status.bioinfo_analysis import BioinfoAnalysisHandler
from status.deliveries import DeliveriesPageHandler
from status.flowcell import FlowcellHandler
from status.flowcells import FlowcellDemultiplexHandler, FlowcellLinksDataHandler, \
    FlowcellNotesDataHandler, FlowcellQ30Handler, FlowcellQCHandler, FlowcellsDataHandler, FlowcellSearchHandler, \
    FlowcellsHandler, FlowcellsInfoDataHandler, OldFlowcellsInfoDataHandler, ReadsTotalHandler
from status.instruments import InstrumentLogsHandler, DataInstrumentLogsHandler, InstrumentNamesHandler
from status.multiqc_report import MultiQCReportHandler
from status.pricing import PricingComponentsDataHandler, PricingProductsDataHandler, \
    PricingDateToVersionDataHandler, PricingExchangeRatesDataHandler
from status.production import DeliveredMonthlyDataHandler, DeliveredMonthlyPlotHandler, DeliveredQuarterlyDataHandler, \
    DeliveredQuarterlyPlotHandler, ProducedMonthlyDataHandler, ProducedMonthlyPlotHandler, ProducedQuarterlyDataHandler, \
    ProducedQuarterlyPlotHandler, ProductionCronjobsHandler
from status.projects import CaliperImageHandler, CharonProjectHandler, \
    LinksDataHandler, PresetsHandler, ProjectDataHandler, ProjectQCDataHandler, ProjectSamplesDataHandler, ProjectSamplesHandler, \
    ProjectsDataHandler, ProjectsFieldsDataHandler, ProjectsHandler, ProjectsSearchHandler, ProjectSummaryHandler, \
    ProjectSummaryUpdateHandler, ProjectTicketsDataHandler, RunningNotesDataHandler, RecCtrlDataHandler, \
    ProjMetaCompareHandler, ProjectInternalCostsHandler, ProjectRNAMetaDataHandler, FragAnImageHandler, PresetsOnLoadHandler

from status.nas_quotas import NASQuotasHandler
from status.reads_plot import DataFlowcellYieldHandler, FlowcellPlotHandler, FlowcellCountPlotHandler, FlowcellCountApiHandler
from status.samples import SampleInfoDataHandler, SampleQCAlignmentDataHandler, SampleQCCoverageDataHandler, \
    SampleQCDataHandler, SampleQCInsertSizesDataHandler, SampleQCSummaryDataHandler, SampleQCSummaryHandler, \
    SampleReadCountDataHandler, SampleRunDataHandler, SampleRunHandler, SampleRunReadCountDataHandler, SamplesPerLaneDataHandler, \
    SamplesPerLaneHandler, SamplesPerLanePlotHandler
from status.sequencing import InstrumentClusterDensityPlotHandler, InstrumentErrorratePlotHandler, InstrumentUnmatchedPlotHandler, \
    InstrumentYieldPlotHandler, InstrumentClusterDensityDataHandler, InstrumentErrorrateDataHandler, InstrumentUnmatchedDataHandler, \
    InstrumentYieldDataHandler
from status.statistics import YearApplicationsProjectHandler, YearApplicationsSamplesHandler, YearAffiliationProjectsHandler, YearDeliverytimeProjectsHandler, \
    ApplicationOpenProjectsHandler, ApplicationOpenSamplesHandler, WeekInstrumentTypeYieldHandler, StatsAggregationHandler, YearDeliverytimeApplicationHandler
from status.suggestion_box import SuggestionBoxDataHandler, SuggestionBoxHandler
from status.testing import TestDataHandler
from status.util import BaseHandler, DataHandler, LastPSULRunHandler, MainHandler, PagedQCDataHandler, SafeStaticFileHandler, \
    UpdatedDocumentsDatahandler
from status.worksets import WorksetHandler, WorksetsHandler, WorksetDataHandler, WorksetLinksHandler, WorksetNotesDataHandler, \
    WorksetsDataHandler, WorksetSearchHandler


from zendesk import Zendesk


class Application(tornado.web.Application):
    def __init__(self, settings):

        # Set up a set of globals to pass to every template
        self.gs_globals = {}

        # GENOMICS STATUS MAJOR VERSION NUMBER
        # Bump this with any change that requires an update to documentation
        self.gs_globals['gs_version'] = '1.0';

        # Get the latest git commit hash
        # This acts as a minor version number for small updates
        # It also forces javascript / CSS updates and solves caching problems
        try:
            self.gs_globals['git_commit'] = subprocess.check_output(['git', 'rev-parse', '--short=7', 'HEAD']).strip()
            self.gs_globals['git_commit_full'] = subprocess.check_output(['git', 'rev-parse', 'HEAD']).strip()
        except:
            self.gs_globals['git_commit'] = 'unknown'
            self.gs_globals['git_commit_full'] = 'unknown'

        handlers = [
            ("/", MainHandler),
            ("/login", LoginHandler),
            ("/logout", LogoutHandler),
            ("/unauthorized", UnAuthorizedHandler),
            ("/api/v1", DataHandler),
            ("/api/v1/applications", ApplicationsDataHandler),
            ("/api/v1/application/([^/]*)$", ApplicationDataHandler),
            ("/api/v1/bioinfo_analysis", BioinfoAnalysisHandler),
            ("/api/v1/bioinfo_analysis/([^/]*)$", BioinfoAnalysisHandler),
            tornado.web.URLSpec("/api/v1/caliper_image/(?P<project>[^/]+)/(?P<sample>[^/]+)/(?P<step>[^/]+)", CaliperImageHandler, name="CaliperImageHandler"),
            ("/api/v1/charon_summary/([^/]*)$",CharonProjectHandler ),
            ("/api/v1/delivered_monthly", DeliveredMonthlyDataHandler),
            ("/api/v1/delivered_monthly.png", DeliveredMonthlyPlotHandler),
            ("/api/v1/delivered_quarterly", DeliveredQuarterlyDataHandler),
            ("/api/v1/delivered_quarterly.png", DeliveredQuarterlyPlotHandler),
            ("/api/v1/flowcells", FlowcellsDataHandler),
            ("/api/v1/flowcell_count/", FlowcellCountApiHandler),
            ("/api/v1/flowcell_info2/([^/]*)$", FlowcellsInfoDataHandler),
            ("/api/v1/flowcell_info/([^/]*)$", OldFlowcellsInfoDataHandler),
            ("/api/v1/flowcell_qc/([^/]*)$", FlowcellQCHandler),
            ("/api/v1/flowcell_demultiplex/([^/]*)$",
                FlowcellDemultiplexHandler),
            ("/api/v1/flowcell_q30/([^/]*)$", FlowcellQ30Handler),
            # ("/api/v1/flowcells/([^/]*)$", FlowcellDataHandler),
            ("/api/v1/flowcell_notes/([^/]*)$", FlowcellNotesDataHandler),
            ("/api/v1/flowcell_links/([^/]*)$", FlowcellLinksDataHandler),
            ("/api/v1/flowcell_search/([^/]*)$", FlowcellSearchHandler),
            ("/api/v1/flowcell_yield/([^/]*)$", DataFlowcellYieldHandler),
            tornado.web.URLSpec("/api/v1/frag_an_image/(?P<project>[^/]+)/(?P<sample>[^/]+)/(?P<step>[^/]+)", FragAnImageHandler, name="FragAnImageHandler"),
            ("/api/v1/instrument_cluster_density",
                InstrumentClusterDensityDataHandler),
            ("/api/v1/instrument_cluster_density.png",
                InstrumentClusterDensityPlotHandler),
            ("/api/v1/instrument_error_rates", InstrumentErrorrateDataHandler),
            ("/api/v1/instrument_error_rates.png",
                InstrumentErrorratePlotHandler),
            ("/api/v1/instrument_logs", DataInstrumentLogsHandler),
            ("/api/v1/instrument_logs/([^/]*)$", DataInstrumentLogsHandler),
            ("/api/v1/instrument_names",InstrumentNamesHandler ),
            ("/api/v1/instrument_unmatched", InstrumentUnmatchedDataHandler),
            ("/api/v1/instrument_unmatched.png", InstrumentUnmatchedPlotHandler),
            ("/api/v1/instrument_yield", InstrumentYieldDataHandler),
            ("/api/v1/instrument_yield.png", InstrumentYieldPlotHandler),
            ("/api/v1/internal_costs/([^/]*)", ProjectInternalCostsHandler),
            ("/api/v1/last_updated", UpdatedDocumentsDatahandler),
            ("/api/v1/last_psul", LastPSULRunHandler),
            ("/api/v1/plot/samples_per_lane.png",
                SamplesPerLanePlotHandler),
            ("/api/v1/samples_per_lane", SamplesPerLaneDataHandler),
            ("/api/v1/pricing_date_to_version", PricingDateToVersionDataHandler),
            ("/api/v1/pricing_components", PricingComponentsDataHandler),
            ("/api/v1/pricing_components/([^/]*)$", PricingComponentsDataHandler),
            ("/api/v1/pricing_exchange_rates", PricingExchangeRatesDataHandler),
            ("/api/v1/pricing_products", PricingProductsDataHandler),
            ("/api/v1/pricing_products/([^/]*)$", PricingProductsDataHandler),
            ("/api/v1/produced_monthly", ProducedMonthlyDataHandler),
            ("/api/v1/produced_monthly.png", ProducedMonthlyPlotHandler),
            ("/api/v1/produced_quarterly", ProducedQuarterlyDataHandler),
            ("/api/v1/produced_quarterly.png", ProducedQuarterlyPlotHandler),
            ("/api/v1/projects", ProjectsDataHandler),
            ("/api/v1/project/([^/]*)$", ProjectSamplesDataHandler),
            ("/api/v1/project/([^/]*)/tickets", ProjectTicketsDataHandler),
            ("/api/v1/projects_fields", ProjectsFieldsDataHandler),
            ("/api/v1/project_summary/([^/]*)$", ProjectDataHandler),
            ("/api/v1/project_summary_update/([^/]*)/([^/]*)$", ProjectSummaryUpdateHandler),
            ("/api/v1/project_search/([^/]*)$", ProjectsSearchHandler),
            ("/api/v1/presets", PresetsHandler),
            ("/api/v1/presets/onloadcheck", PresetsOnLoadHandler),
            ("/api/v1/qc/([^/]*)$", SampleQCDataHandler),
            ("/api/v1/projectqc/([^/]*)$", ProjectQCDataHandler),
            ("/api/v1/rna_report/([^/]*$)", ProjectRNAMetaDataHandler),
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
            ("/api/v1/stats",StatsAggregationHandler),
            ("/api/v1/stats/application_open_projects",ApplicationOpenProjectsHandler),
            ("/api/v1/stats/application_open_samples",ApplicationOpenSamplesHandler),
            ("/api/v1/stats/week_instr_yield",WeekInstrumentTypeYieldHandler),
            ("/api/v1/stats/year_application",YearApplicationsProjectHandler),
            ("/api/v1/stats/year_application_samples",YearApplicationsSamplesHandler),
            ("/api/v1/stats/year_affiliation_projects",YearAffiliationProjectsHandler),
            ("/api/v1/stats/year_deliverytime_projects",YearDeliverytimeProjectsHandler),
            ("/api/v1/stats/year_deliverytime_application",YearDeliverytimeApplicationHandler),
            ("/api/v1/deliveries/set_bioinfo_responsible$", DeliveriesPageHandler),
            ("/api/v1/suggestions", SuggestionBoxDataHandler),
            ("/api/v1/test/(\w+)?", TestDataHandler),
            ("/applications", ApplicationsHandler),
            ("/application/([^/]*)$", ApplicationHandler),
            ("/bioinfo/(P[^/]*)$", BioinfoAnalysisHandler),
            ("/deliveries", DeliveriesPageHandler),
            ("/flowcells", FlowcellsHandler),
            ("/flowcells/([^/]*)$", FlowcellHandler),
            ("/flowcells_plot", FlowcellPlotHandler),
            ("/flowcell_count_plot", FlowcellCountPlotHandler),
            ("/instrument_logs",InstrumentLogsHandler),
            ("/instrument_logs/([^/]*)$", InstrumentLogsHandler),
            ("/multiqc_report/([^/]*)$", MultiQCReportHandler),
            ("/nas_quotas", NASQuotasHandler),
            ("/qc/([^/]*)$", SampleQCSummaryHandler),
            (r"/qc_reports/(.*)", SafeStaticFileHandler, {"path": 'qc_reports'}),
            ("/production/cronjobs", ProductionCronjobsHandler),
            ("/project/([^/]*)$", ProjectSamplesHandler),
            ("/project/(P[^/]*)/([^/]*)$", ProjectSamplesHandler),
            ("/project_summary/([^/]*)$", ProjectSummaryHandler),
            ("/projects", ProjectsHandler),
            ("/proj_meta", ProjMetaCompareHandler),
            ("/reads_total/([^/]*)$", ReadsTotalHandler),
            ("/rec_ctrl_view/([^/]*)$", RecCtrlDataHandler),
            ("/samples/([^/]*)$", SampleRunHandler),
            ("/suggestion_box", SuggestionBoxHandler),
            ("/worksets", WorksetsHandler),
            ("/api/v1/workset/([^/]*)$", WorksetDataHandler),
            ("/api/v1/workset_search/([^/]*)$", WorksetSearchHandler),
            ("/api/v1/workset_notes/([^/]*)$", WorksetNotesDataHandler),
            ("/api/v1/workset_links/([^/]*)$", WorksetLinksHandler),
            ("/workset/([^/]*)$", WorksetHandler),
            (r'.*', BaseHandler)
        ]

        self.declared_handlers = handlers

        # Load templates
        self.loader = template.Loader("design")

        # Global connection to the database
        couch = Server(settings.get("couch_server", None))
        if couch:
            self.analysis_db= couch["analysis"]
            self.application_categories_db = couch["application_categories"]
            self.bioinfo_db = couch["bioinfo_analysis"]
            self.cronjobs_db = couch["cronjobs"]
            self.flowcells_db = couch["flowcells"]
            self.gs_users_db = couch["gs_users"]
            self.instruments_db= couch["instruments"]
            self.instrument_logs_db = couch["instrument_logs"]
            self.pricing_components_db = couch["pricing_components"]
            self.pricing_exchange_rates_db = couch["pricing_exchange_rates"]
            self.pricing_products_db = couch["pricing_products"]
            self.projects_db = couch["projects"]
            self.samples_db = couch["samples"]
            self.server_status_db = couch['server_status']
            self.suggestions_db = couch["suggestion_box"]
            self.worksets_db = couch["worksets"]
            self.x_flowcells_db = couch["x_flowcells"]
        else:
            print settings.get("couch_server", None)
            raise IOError("Cannot connect to couchdb");

        # Load columns and presets from genstat-defaults user in StatusDB
        genstat_id = ''
        user_id = ''
        user = settings.get("username", None)
        for u in self.gs_users_db.view('authorized/users'):
            if u.get('key') == 'genstat-defaults':
                genstat_id = u.get('value')

        # It's important to check that this user exists!
        if not genstat_id:
            raise RuntimeError("genstat-defaults user not found on {}, please " \
                               "make sure that the user is abailable with the " \
                               "corresponding defaults information.".format(settings.get("couch_server", None)))

        # We need to get this database as OrderedDict, so the pv_columns doesn't
        # mess up
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

        # to display instruments in the server status
        self.server_status = settings.get('server_status')

        # project summary - multiqc tab
        self.multiqc_path = settings.get('multiqc_path')

        # Setup the Tornado Application
        cookie_secret = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
        settings["debug"]= True
        settings["static_path"]= "static"
        settings["cookie_secret"]= cookie_secret
        settings["login_url"]= "/login"


        if options['develop']:
            tornado.autoreload.watch("design/application.html")
            tornado.autoreload.watch("design/applications.html")
            tornado.autoreload.watch("design/base.html")
            tornado.autoreload.watch("design/bioinfo_tab.html")
            tornado.autoreload.watch("design/bioinfo_tab/run_lane_sample_view.html")
            tornado.autoreload.watch("design/bioinfo_tab/sample_run_lane_view.html")
            tornado.autoreload.watch("design/cronjobs.html")
            tornado.autoreload.watch("design/deliveries.html")
            tornado.autoreload.watch("design/error_page.html")
            tornado.autoreload.watch("design/flowcell.html")
            tornado.autoreload.watch("design/flowcell_error.html")
            tornado.autoreload.watch("design/flowcell_samples.html")
            tornado.autoreload.watch("design/flowcells.html")
            tornado.autoreload.watch("design/index.html")
            tornado.autoreload.watch("design/instrument_logs.html")
            tornado.autoreload.watch("design/link_tab.html")
            tornado.autoreload.watch("design/nas_quotas.html")
            tornado.autoreload.watch("design/proj_meta_compare.html")
            tornado.autoreload.watch("design/project_samples.html")
            tornado.autoreload.watch("design/project_summary.html")
            tornado.autoreload.watch("design/projects.html")
            tornado.autoreload.watch("design/reads_total.html")
            tornado.autoreload.watch("design/rec_ctrl_view.html")
            tornado.autoreload.watch("design/running_notes_help.html")
            tornado.autoreload.watch("design/running_notes_tab.html")
            tornado.autoreload.watch("design/suggestion_box.html")
            tornado.autoreload.watch("design/unauthorized.html")
            tornado.autoreload.watch("design/workset_placement.html")
            tornado.autoreload.watch("design/workset_samples.html")
            tornado.autoreload.watch("design/worksets.html")
            tornado.autoreload.watch("design/flowcell_trend_plot.html")

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
