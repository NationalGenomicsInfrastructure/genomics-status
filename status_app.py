""" Main genomics-status web application.
"""
import yaml
import base64
import uuid

from couchdb import Server

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.autoreload
from tornado import template

from status.util import *
from status.amanita import *
from status.production import *
from status.applications import *
from status.projects import *
from status.sequencing import *
from status.samples import *
from status.picea import *
from status.flowcells import *
from status.barcode_vs_expected import *
from status.reads_per_lane import *
from status.reads_vs_qv import *
from status.q30 import *
from status.quotas import *
from status.phix_err_rate import *
from status.testing import *


class MainHandler(tornado.web.RequestHandler):
    """ Serves the html front page upon request.
    """
    def get(self):
        t = self.application.loader.load("index.html")
        self.write(t.generate())


class Application(tornado.web.Application):
    def __init__(self, settings):
        handlers = [
            ("/", MainHandler),
            ("/api/v1", DataHandler),
            ("/api/v1/applications", ApplicationsDataHandler),
            ("/api/v1/applications.png", ApplicationsPlotHandler),
            ("/api/v1/application/([^/]*)$", ApplicationDataHandler),
            ("/api/v1/expected", BarcodeVsExpectedDataHandler),
            ("/api/v1/amanita_home", AmanitaHomeDataHandler),
            ("/api/v1/amanita_home/users/", AmanitaUsersDataHandler),
            ("/api/v1/amanita_home/projects", AmanitaHomeProjectsDataHandler),
            ("/api/v1/amanita_home/projects/([^/]*)$",
                AmanitaHomeProjectDataHandler),
            ("/api/v1/amanita_home/([^/]*)$", AmanitaHomeUserDataHandler),
            ("/api/v1/amanita_box2", AmanitaBox2DataHandler),
            ("/api/v1/amanita_box2/([^/]*)$", AmanitaBox2ProjectDataHandler),
            ("/api/v1/amanita_box2/projects/",
                AmanitaBox2ProjectsDataHandler),
            ("/api/v1/delivered_monthly", DeliveredMonthlyDataHandler),
            ("/api/v1/delivered_monthly.png", DeliveredMonthlyPlotHandler),
            ("/api/v1/delivered_quarterly", DeliveredQuarterlyDataHandler),
            ("/api/v1/delivered_quarterly.png", DeliveredQuarterlyPlotHandler),
            ("/api/v1/flowcells", FlowcellsDataHandler),
            ("/api/v1/flowcell_info/([^/]*)$", FlowcellsInfoDataHandler),
            ("/api/v1/flowcell_qc/([^/]*)$", FlowcellQCHandler),
            ("/api/v1/flowcell_demultiplex/([^/]*)$",
                FlowcellDemultiplexHandler),
            ("/api/v1/flowcell_q30/([^/]*)$", FlowcellQ30Handler),
            ("/api/v1/flowcells/([^/]*)$", FlowcellDataHandler),
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
            ("/api/v1/plot/q30.png", Q30PlotHandler),
            ("/api/v1/plot/samples_per_lane.png",
                SamplesPerLanePlotHandler),
            ("/api/v1/plot/reads_per_lane.png", ReadsPerLanePlotHandler),
            ("/api/v1/plot/barcodes_vs_expected.png",
                BarcodeVsExpectedPlotHandler),
            ("/api/v1/picea_home", PiceaHomeDataHandler),
            ("/api/v1/samples_per_lane", SamplesPerLaneDataHandler),
            ("/api/v1/picea_home/users/", PiceaUsersDataHandler),
            ("/api/v1/picea_home/([^/]*)$", PiceaHomeUserDataHandler),
            ("/api/v1/produced_monthly", ProducedMonthlyDataHandler),
            ("/api/v1/produced_monthly.png", ProducedMonthlyPlotHandler),
            ("/api/v1/produced_quarterly", ProducedQuarterlyDataHandler),
            ("/api/v1/produced_quarterly.png", ProducedQuarterlyPlotHandler),
            ("/api/v1/projects", ProjectsDataHandler),
            ("/api/v1/projects/([^/]*)$", ProjectSamplesDataHandler),
            ("/api/v1/projects_fields", ProjectsFieldsDataHandler),
            ("/api/v1/project_summary/([^/]*)$", ProjectDataHandler),
            ("/api/v1/qc/([^/]*)$", SampleQCDataHandler),
            ("/api/v1/quotas/(\w+)?", QuotaDataHandler),
            ("/api/v1/reads_vs_quality", ReadsVsQDataHandler),
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
            ("/api/v1/samples_applications", SamplesApplicationsDataHandler),
            ("/api/v1/samples_applications.png",
                SamplesApplicationsPlotHandler),
            ("/api/v1/test/(\w+)?", TestDataHandler),
            ("/api/v1/uppmax_projects", UppmaxProjectsDataHandler),
            ("/api/v1/phix_err_rate", PhixErrorRateDataHandler),
            ("/amanita", AmanitaHandler),
            ("/applications", ApplicationsHandler),
            ("/application/([^/]*)$", ApplicationHandler),
            ("/barcode_vs_expected", ExpectedHandler),
            ("/flowcells", FlowcellsHandler),
            ("/flowcells/([^/]*)$", FlowcellHandler),
            ("/q30", Q30Handler),
            ("/picea", PiceaHandler),
            ("/qc/([^/]*)$", SampleQCSummaryHandler),
            ("/quotas", QuotasHandler),
            ("/quotas/(\w+)?", QuotaHandler),
            ("/phix_err_rate", PhixErrorRateHandler),
            ("/production", ProductionHandler),
            ("/projects", ProjectsHandler),
            ("/projects/([^/]*)$", ProjectSamplesHandler),
            ("/reads_vs_qv", ReadsVsQvhandler),
            ("/reads_per_lane", ReadsPerLaneHandler),
            ("/samples_per_lane", SamplesPerLaneHandler),
            ("/samples/([^/]*)$", SampleRunHandler),
            ("/sequencing", SequencingStatsHandler)
        ]

        self.declared_handlers = handlers

        # Load templates
        self.loader = template.Loader("design")

        # Global connection to the log database
        couch = Server(settings.get("couch_server", None))
        if couch:
            self.illumina_db = couch["illumina_logs"]
            self.uppmax_db = couch["uppmax"]
            self.samples_db = couch["samples"]
            self.projects_db = couch["projects"]
            self.flowcells_db = couch["flowcells"]
            self.amanita_db = couch["amanita"]
            self.picea_db = couch["picea"]

        # Load private instrument listing
        self.instrument_list = settings.get("instruments")

        # Setup the Tornado Application
        cookie_secret = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
        settings = {"debug": True,
                    "static_path": "static",
                    "cookie_secret": cookie_secret,
                    "login_url": "/login"}

        tornado.autoreload.watch("design/amanita.html")
        tornado.autoreload.watch("design/application.html")
        tornado.autoreload.watch("design/applications.html")
        tornado.autoreload.watch("design/barcodes.html")
        tornado.autoreload.watch("design/base.html")
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

        tornado.web.Application.__init__(self, handlers, **settings)


def main():
    """ Initialte server and start IOLoop.
    """
    with open("settings.yaml") as settings_file:
        server_settings = yaml.load(settings_file)

    # Instantiate Application
    application = Application(server_settings)

    # Start HTTP Server
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(server_settings.get("port", 8888))

    # Get a handle to the instance of IOLoop
    ioloop = tornado.ioloop.IOLoop.instance()

    # Start the IOLoop
    ioloop.start()


if __name__ == '__main__':
    main()
