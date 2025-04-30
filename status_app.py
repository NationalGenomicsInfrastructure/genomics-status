"""Main genomics-status web application."""

import base64
import logging
import subprocess
import uuid
from pathlib import Path
from urllib.parse import urlsplit

import tornado.autoreload
import tornado.httpserver
import tornado.ioloop
import tornado.web
import yaml
from couchdb import Server
from ibm_cloud_sdk_core.api_exception import ApiException
from ibmcloudant import CouchDbSessionAuthenticator, cloudant_v1
from tornado import template
from tornado.log import LogFormatter
from tornado.options import define, options
from zenpy import Zenpy

from status.applications import (
    ApplicationDataHandler,
    ApplicationHandler,
    ApplicationsDataHandler,
    ApplicationsHandler,
)
from status.authorization import LoginHandler, LogoutHandler, UnAuthorizedHandler
from status.barcode import BarcodeHandler
from status.bioinfo_analysis import BioinfoAnalysisHandler
from status.clone_project import CloneProjectHandler, LIMSProjectCloningHandler
from status.config_handler import ConfigDataHandler
from status.controls import ControlsHandler
from status.data_deliveries_plot import DataDeliveryHandler, DeliveryPlotHandler
from status.deliveries import DeliveriesPageHandler
from status.flowcell import (
    ElementFlowcellDataHandler,
    ElementFlowcellHandler,
    FlowcellHandler,
    ONTFlowcellHandler,
    ONTMinKNOWReportHandler,
    ONTToulligQCReportHandler,
)
from status.flowcells import (
    FlowcellDemultiplexHandler,
    FlowcellLinksDataHandler,
    FlowcellQ30Handler,
    FlowcellQCHandler,
    FlowcellsDataHandler,
    FlowcellSearchHandler,
    FlowcellsHandler,
    FlowcellsInfoDataHandler,
    OldFlowcellsInfoDataHandler,
    ReadsTotalHandler,
)
from status.hashtag_csv import HashTagCSVHandler
from status.instruments import (
    DataInstrumentLogsHandler,
    InstrumentLogsHandler,
    InstrumentNamesHandler,
)
from status.invoicing import (
    DeleteInvoiceHandler,
    GenerateInvoiceHandler,
    InvoiceSpecDateHandler,
    InvoicingOrderDetailsHandler,
    InvoicingPageDataHandler,
    InvoicingPageHandler,
    SentInvoiceHandler,
)
from status.lanes_ordered import LanesOrderedDataHandler, LanesOrderedHandler
from status.ngisweden_stats import NGISwedenHandler
from status.ont_plot import ONTFlowcellPlotHandler, ONTFlowcellYieldHandler
from status.people_assignments import (
    PeopleAssignmentsDataHandler,
    ProjectPeopleAssignmentDataHandler,
)
from status.pricing import (
    AgreementDataHandler,
    AgreementMarkSignHandler,
    AgreementTemplateTextHandler,
    GenerateQuoteHandler,
    PricingDataHandler,
    PricingDateToVersionDataHandler,
    PricingDraftDataHandler,
    PricingExchangeRatesDataHandler,
    PricingPreviewHandler,
    PricingPublishDataHandler,
    PricingQuoteHandler,
    PricingReassignLockDataHandler,
    PricingUpdateHandler,
    PricingValidateDraftDataHandler,
    SaveQuoteHandler,
)
from status.production import (
    ProductionCronjobsHandler,
)
from status.project_cards import ProjectCardsHandler, ProjectCardsWebSocket
from status.projects import (
    CaliperImageHandler,
    CharonProjectHandler,
    FragAnImageHandler,
    ImagesDownloadHandler,
    LinksDataHandler,
    PresetsHandler,
    PresetsOnLoadHandler,
    PrioProjectsTableHandler,
    ProjectDataHandler,
    ProjectRNAMetaDataHandler,
    ProjectSamplesDataHandler,
    ProjectSamplesHandler,
    ProjectSamplesOldHandler,
    ProjectsDataHandler,
    ProjectsFieldsDataHandler,
    ProjectsHandler,
    ProjectsSearchHandler,
    ProjectTicketsDataHandler,
    ProjMetaCompareHandler,
    RecCtrlDataHandler,
)
from status.queues import (
    LibraryPoolingQueuesDataHandler,
    LibraryPoolingQueuesHandler,
    SequencingQueuesDataHandler,
    SequencingQueuesHandler,
    SmartSeq3ProgressPageDataHandler,
    SmartSeq3ProgressPageHandler,
    WorksetQueuesDataHandler,
    WorksetQueuesHandler,
    qPCRPoolsDataHandler,
    qPCRPoolsHandler,
)
from status.reads_plot import DataFlowcellYieldHandler, FlowcellPlotHandler
from status.reports import (
    MultiQCReportHandler,
    ProjectSummaryReportHandler,
    SingleCellSampleSummaryReportHandler,
)
from status.running_notes import (
    LatestStickyNoteHandler,
    LatestStickyNotesMultipleHandler,
    RunningNotesDataHandler,
)
from status.sample_requirements import (
    SampleRequirementsDataHandler,
    SampleRequirementsDraftDataHandler,
    SampleRequirementsPreviewHandler,
    SampleRequirementsPublishDataHandler,
    SampleRequirementsReassignLockDataHandler,
    SampleRequirementsUpdateHandler,
    SampleRequirementsValidateDraftDataHandler,
    SampleRequirementsViewHandler,
)
from status.sensorpush import (
    SensorpushDataHandler,
    SensorpushHandler,
    SensorpushWarningsDataHandler,
)
from status.sequencing import (
    InstrumentClusterDensityDataHandler,
    InstrumentClusterDensityPlotHandler,
    InstrumentErrorrateDataHandler,
    InstrumentErrorratePlotHandler,
    InstrumentUnmatchedDataHandler,
    InstrumentUnmatchedPlotHandler,
    InstrumentYieldDataHandler,
    InstrumentYieldPlotHandler,
)
from status.statistics import (
    ApplicationOpenProjectsHandler,
    ApplicationOpenSamplesHandler,
    StatsAggregationHandler,
    WeekInstrumentTypeYieldHandler,
    YearAffiliationProjectsHandler,
    YearApplicationsProjectHandler,
    YearApplicationsSamplesHandler,
    YearDeliverytimeApplicationHandler,
    YearDeliverytimeProjectsHandler,
)
from status.suggestion_box import SuggestionBoxDataHandler, SuggestionBoxHandler
from status.testing import TestDataHandler
from status.user_management import UserManagementDataHandler, UserManagementHandler
from status.user_preferences import UserPrefPageHandler, UserPrefPageHandler_b5
from status.util import (
    BaseHandler,
    DataHandler,
    LastPSULRunHandler,
    MainHandler,
    UpdatedDocumentsDatahandler,
)
from status.worksets import (
    ClosedWorksetsHandler,
    WorksetDataHandler,
    WorksetHandler,
    WorksetLinksHandler,
    WorksetsDataHandler,
    WorksetSearchHandler,
    WorksetsHandler,
)

ONT_RUN_PATTERN = r"\d{8}_\d{4}_[0-9a-zA-Z]+_[0-9a-zA-Z]+_[0-9a-zA-Z]+"


class Application(tornado.web.Application):
    def __init__(self, settings):
        # Set up a set of globals to pass to every template
        self.gs_globals = {}

        # GENOMICS STATUS MAJOR VERSION NUMBER
        # Bump this with any change that requires an update to documentation
        self.gs_globals["gs_version"] = "1.0"

        # Get the latest git commit hash
        # This acts as a minor version number for small updates
        # It also forces javascript / CSS updates and solves caching problems
        try:
            self.gs_globals["git_commit"] = subprocess.check_output(
                ["git", "rev-parse", "--short=7", "HEAD"]
            ).strip()
            self.gs_globals["git_commit_full"] = subprocess.check_output(
                ["git", "rev-parse", "HEAD"]
            ).strip()
        except:
            self.gs_globals["git_commit"] = "unknown"
            self.gs_globals["git_commit_full"] = "unknown"

        self.gs_globals["font_awesome_url"] = settings.get("font_awesome_url", None)
        self.gs_globals["prod"] = True
        if "dev" in settings.get("couch_server"):
            self.gs_globals["prod"] = False

        handlers = [
            # The tuples are on the form ("URI regex", "Backend request handler")
            # The groups of the regex are the arguments of the handlers get() method
            ("/", MainHandler),
            ("/login", LoginHandler),
            ("/logout", LogoutHandler),
            ("/unauthorized", UnAuthorizedHandler),
            ("/api/v1", DataHandler),
            ("/api/v1/applications", ApplicationsDataHandler),
            ("/api/v1/application/([^/]*)$", ApplicationDataHandler),
            ("/api/v1/bioinfo_analysis", BioinfoAnalysisHandler),
            ("/api/v1/bioinfo_analysis/([^/]*)$", BioinfoAnalysisHandler),
            tornado.web.URLSpec(
                "/api/v1/caliper_image/(?P<project>[^/]+)/(?P<sample>[^/]+)/(?P<step>[^/]+)",
                CaliperImageHandler,
                name="CaliperImageHandler",
            ),
            ("/api/v1/charon_summary/([^/]*)$", CharonProjectHandler),
            ("/api/v1/configs/([^/]*)$", ConfigDataHandler),
            ("/api/v1/cost_calculator", PricingDataHandler),
            ("/api/v1/delete_invoice", DeleteInvoiceHandler),
            tornado.web.URLSpec(
                "/api/v1/download_images/(?P<project>[^/]+)/(?P<type>[^/]+)",
                ImagesDownloadHandler,
                name="ImagesDownloadHandler",
            ),
            ("/api/v1/draft_cost_calculator", PricingDraftDataHandler),
            ("/api/v1/draft_sample_requirements", SampleRequirementsDraftDataHandler),
            ("/api/v1/element_flowcell/([^/]*$)", ElementFlowcellDataHandler),
            ("/api/v1/flowcells", FlowcellsDataHandler),
            ("/api/v1/flowcell_info2/([^/]*)$", FlowcellsInfoDataHandler),
            ("/api/v1/flowcell_info/([^/]*)$", OldFlowcellsInfoDataHandler),
            ("/api/v1/flowcell_qc/([^/]*)$", FlowcellQCHandler),
            ("/api/v1/flowcell_demultiplex/([^/]*)$", FlowcellDemultiplexHandler),
            ("/api/v1/flowcell_q30/([^/]*)$", FlowcellQ30Handler),
            ("/api/v1/flowcell_links/([^/]*)$", FlowcellLinksDataHandler),
            ("/api/v1/flowcell_search/([^/]*)$", FlowcellSearchHandler),
            ("/api/v1/flowcell_yield/([^/]*)$", DataFlowcellYieldHandler),
            ("/api/v1/ont_plot/([^/]*)$", ONTFlowcellYieldHandler),
            tornado.web.URLSpec(
                "/api/v1/frag_an_image/(?P<project>[^/]+)/(?P<sample>[^/]+)/(?P<step>[^/]+)",
                FragAnImageHandler,
                name="FragAnImageHandler",
            ),
            ("/api/v1/get_agreement_doc/([^/]*)$", AgreementDataHandler),
            ("/api/v1/get_agreement_template_text", AgreementTemplateTextHandler),
            ("/api/v1/get_order_det_invoicing/([^/]*)", InvoicingOrderDetailsHandler),
            ("/api/v1/get_sent_invoices", SentInvoiceHandler),
            ("/api/v1/generate_invoice", GenerateInvoiceHandler),
            ("/api/v1/generate_invoice_spec", InvoiceSpecDateHandler),
            ("/api/v1/invoice_spec_list", InvoicingPageDataHandler),
            ("/api/v1/instrument_cluster_density", InstrumentClusterDensityDataHandler),
            (
                "/api/v1/instrument_cluster_density.png",
                InstrumentClusterDensityPlotHandler,
            ),
            ("/api/v1/instrument_error_rates", InstrumentErrorrateDataHandler),
            ("/api/v1/instrument_error_rates.png", InstrumentErrorratePlotHandler),
            ("/api/v1/instrument_logs", DataInstrumentLogsHandler),
            ("/api/v1/instrument_logs/([^/]*)/([^/]*)$", DataInstrumentLogsHandler),
            ("/api/v1/instrument_names", InstrumentNamesHandler),
            ("/api/v1/instrument_unmatched", InstrumentUnmatchedDataHandler),
            ("/api/v1/instrument_unmatched.png", InstrumentUnmatchedPlotHandler),
            ("/api/v1/instrument_yield", InstrumentYieldDataHandler),
            ("/api/v1/instrument_yield.png", InstrumentYieldPlotHandler),
            ("/api/v1/lanes_ordered", LanesOrderedDataHandler),
            ("/api/v1/last_updated", UpdatedDocumentsDatahandler),
            ("/api/v1/last_psul", LastPSULRunHandler),
            ("/api/v1/latest_sticky_run_note/([^/]*)", LatestStickyNoteHandler),
            ("/api/v1/latest_sticky_run_note", LatestStickyNotesMultipleHandler),
            ("/api/v1/libpooling_queues", LibraryPoolingQueuesDataHandler),
            ("/api/v1/lims_project_data/([^/]*)$", LIMSProjectCloningHandler),
            ("/api/v1/list_people_assignments", PeopleAssignmentsDataHandler),
            ("/api/v1/mark_agreement_signed", AgreementMarkSignHandler),
            ("/api/v1/pricing_date_to_version", PricingDateToVersionDataHandler),
            ("/api/v1/pricing_exchange_rates", PricingExchangeRatesDataHandler),
            ("/api/v1/pricing_publish_draft", PricingPublishDataHandler),
            ("/api/v1/pricing_reassign_lock", PricingReassignLockDataHandler),
            ("/api/v1/pricing_validate_draft", PricingValidateDraftDataHandler),
            ("/api/v1/prio_projects", PrioProjectsTableHandler),
            ("/api/v1/proj_staged/([^/]*)$", DataDeliveryHandler),
            ("/api/v1/projects", ProjectsDataHandler),
            ("/api/v1/project/([^/]*)$", ProjectSamplesDataHandler),
            ("/api/v1/project/([^/]*)/people", ProjectPeopleAssignmentDataHandler),
            (
                "/api/v1/project/([^/]*)/people/([^/]*)$",
                ProjectPeopleAssignmentDataHandler,
            ),
            ("/api/v1/project/([^/]*)/tickets", ProjectTicketsDataHandler),
            ("/api/v1/projects_fields", ProjectsFieldsDataHandler),
            ("/api/v1/project_summary/([^/]*)$", ProjectDataHandler),
            ("/api/v1/project_search/([^/]*)$", ProjectsSearchHandler),
            ("/api/v1/project_websocket", ProjectCardsWebSocket),
            ("/api/v1/presets", PresetsHandler),
            ("/api/v1/presets/onloadcheck", PresetsOnLoadHandler),
            ("/api/v1/qpcr_pools", qPCRPoolsDataHandler),
            ("/api/v1/rna_report/([^/]*$)", ProjectRNAMetaDataHandler),
            ("/api/v1/running_notes/([^/]*)$", RunningNotesDataHandler),
            ("/api/v1/links/([^/]*)$", LinksDataHandler),
            ("/api/v1/sample_requirements", SampleRequirementsDataHandler),
            (
                "/api/v1/sample_requirements_publish_draft",
                SampleRequirementsPublishDataHandler,
            ),
            (
                "/api/v1/sample_requirements_validate_draft",
                SampleRequirementsValidateDraftDataHandler,
            ),
            (
                "/api/v1/sample_requirements_reassign_lock",
                SampleRequirementsReassignLockDataHandler,
            ),
            ("/api/v1/save_quote", SaveQuoteHandler),
            ("/api/v1/sequencing_queues", SequencingQueuesDataHandler),
            ("/api/v1/sensorpush", SensorpushDataHandler),
            ("/api/v1/sensorpush_warnings", SensorpushWarningsDataHandler),
            ("/api/v1/smartseq3_progress", SmartSeq3ProgressPageDataHandler),
            ("/api/v1/stats", StatsAggregationHandler),
            ("/api/v1/stats/application_open_projects", ApplicationOpenProjectsHandler),
            ("/api/v1/stats/application_open_samples", ApplicationOpenSamplesHandler),
            ("/api/v1/stats/week_instr_yield", WeekInstrumentTypeYieldHandler),
            ("/api/v1/stats/year_application", YearApplicationsProjectHandler),
            ("/api/v1/stats/year_application_samples", YearApplicationsSamplesHandler),
            ("/api/v1/stats/year_affiliation_projects", YearAffiliationProjectsHandler),
            (
                "/api/v1/stats/year_deliverytime_projects",
                YearDeliverytimeProjectsHandler,
            ),
            (
                "/api/v1/stats/year_deliverytime_application",
                YearDeliverytimeApplicationHandler,
            ),
            ("/api/v1/deliveries/set_bioinfo_responsible$", DeliveriesPageHandler),
            ("/api/v1/suggestions", SuggestionBoxDataHandler),
            (r"/api/v1/test/(\w+)?", TestDataHandler),
            ("/api/v1/user_management/users", UserManagementDataHandler),
            ("/api/v1/workset/([^/]*)$", WorksetDataHandler),
            ("/api/v1/worksets", WorksetsDataHandler),
            ("/api/v1/workset_search/([^/]*)$", WorksetSearchHandler),
            ("/api/v1/workset_links/([^/]*)$", WorksetLinksHandler),
            ("/api/v1/workset_queues", WorksetQueuesDataHandler),
            ("/api/v1/closed_worksets", ClosedWorksetsHandler),
            ("/barcode", BarcodeHandler),
            ("/controls", ControlsHandler),
            ("/applications", ApplicationsHandler),
            ("/application/([^/]*)$", ApplicationHandler),
            ("/bioinfo/(P[^/]*)$", BioinfoAnalysisHandler),
            ("/clone_project", CloneProjectHandler),
            ("/deliveries", DeliveriesPageHandler),
            ("/flowcells", FlowcellsHandler),
            (r"/flowcells/(\d{6,8}_[^/]*)$", FlowcellHandler),
            (r"/flowcells_element/([^/]*)$", ElementFlowcellHandler),
            (rf"/flowcells_ont/({ONT_RUN_PATTERN})$", ONTFlowcellHandler),
            (
                rf"/flowcells_ont/({ONT_RUN_PATTERN})/minknow_report$",
                ONTMinKNOWReportHandler,
            ),
            (
                rf"/flowcells_ont/({ONT_RUN_PATTERN})/toulligqc_report$",
                ONTToulligQCReportHandler,
            ),
            ("/flowcells_plot", FlowcellPlotHandler),
            ("/10X_chromium_hashtag_csv", HashTagCSVHandler),
            ("/ont_flowcells_plot", ONTFlowcellPlotHandler),
            ("/data_delivered_plot", DeliveryPlotHandler),
            ("/generate_quote", GenerateQuoteHandler),
            ("/instrument_logs", InstrumentLogsHandler),
            ("/instrument_logs/([^/]*)$", InstrumentLogsHandler),
            ("/invoicing", InvoicingPageHandler),
            ("/lanes_ordered", LanesOrderedHandler),
            ("/libpooling_queues", LibraryPoolingQueuesHandler),
            ("/multiqc_report/([^/]*)$", MultiQCReportHandler),
            ("/ngisweden_stats", NGISwedenHandler),
            ("/pools_qpcr", qPCRPoolsHandler),
            ("/pricing_preview", PricingPreviewHandler),
            ("/pricing_quote", PricingQuoteHandler),
            ("/pricing_update", PricingUpdateHandler),
            ("/production/cronjobs", ProductionCronjobsHandler),
            ("/project/([^/]*)$", ProjectSamplesOldHandler),
            ("/project_new/([^/]*)$", ProjectSamplesHandler),
            ("/projects", ProjectsHandler),
            ("/project_cards", ProjectCardsHandler),
            ("/proj_meta", ProjMetaCompareHandler),
            ("/proj_summary_report/([^/]*)$", ProjectSummaryReportHandler),
            ("/reads_total/([^/]*)$", ReadsTotalHandler),
            ("/rec_ctrl_view/([^/]*)$", RecCtrlDataHandler),
            ("/sample_requirements", SampleRequirementsViewHandler),
            ("/sample_requirements_preview", SampleRequirementsPreviewHandler),
            ("/sample_requirements_update", SampleRequirementsUpdateHandler),
            ("/sensorpush", SensorpushHandler),
            ("/sequencing_queues", SequencingQueuesHandler),
            (
                "/singlecell_sample_summary_report/(P[^/]*)/([^/]*)/([^/]*)$",
                SingleCellSampleSummaryReportHandler,
            ),
            ("/smartseq3_progress", SmartSeq3ProgressPageHandler),
            ("/suggestion_box", SuggestionBoxHandler),
            ("/user_management", UserManagementHandler),
            ("/userpref", UserPrefPageHandler),
            ("/userpref_b5", UserPrefPageHandler_b5),
            ("/worksets", WorksetsHandler),
            ("/workset_queues", WorksetQueuesHandler),
            ("/workset/([^/]*)$", WorksetHandler),
            (r".*", BaseHandler),
        ]

        self.declared_handlers = handlers

        # Load templates
        self.loader = template.Loader("design")

        # Global connection to the database
        couch = Server(settings.get("couch_server", None))
        if couch:
            self.agreements_db = couch["agreements"]
            self.agreement_templates_db = couch["agreement_templates"]
            self.analysis_db = couch["analysis"]
            self.application_categories_db = couch["application_categories"]
            self.bioinfo_db = couch["bioinfo_analysis"]
            self.biomek_errs_db = couch["biomek_logs"]
            self.cost_calculator_db = couch["cost_calculator"]
            self.cronjobs_db = couch["cronjobs"]
            self.element_runs_db = couch["element_runs"]
            self.flowcells_db = couch["flowcells"]
            self.gs_users_db = couch["gs_users"]
            self.instruments_db = couch["instruments"]
            self.instrument_logs_db = couch["instrument_logs"]
            self.nanopore_runs_db = couch["nanopore_runs"]
            self.people_assignments_db = couch["people_assignments"]
            self.pricing_exchange_rates_db = couch["pricing_exchange_rates"]
            self.projects_db = couch["projects"]
            self.sample_requirements_db = couch["sample_requirements"]
            self.sensorpush_db = couch["sensorpush"]
            self.server_status_db = couch["server_status"]
            self.suggestions_db = couch["suggestion_box"]
            self.worksets_db = couch["worksets"]
            self.x_flowcells_db = couch["x_flowcells"]
            self.running_notes_db = couch["running_notes"]
        else:
            print(settings.get("couch_server", None))
            raise OSError("Cannot connect to couchdb")

        cloudant = cloudant_v1.CloudantV1(
            authenticator=CouchDbSessionAuthenticator(
                settings.get("username"), settings.get("password")
            )
        )
        cloudant.set_service_url(settings.get("couch_url"))
        if cloudant:
            self.cloudant = cloudant

        try:
            self.genstat_defaults = self.cloudant.get_document(
                db="gs_configs", doc_id="genstat_defaults"
            ).get_result()
        except ApiException as e:
            if e.status_code == 404:
                raise RuntimeError(
                    "genstat-defaults doc not found in gs_configs, please "
                    "make sure that the doc is available with the "
                    "corresponding defaults information."
                )

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
        self.zendesk = Zenpy(
            email=self.zendesk_user,
            token=self.zendesk_token,
            subdomain=urlsplit(self.zendesk_url).hostname.split(".")[0],
        )

        # Jira
        self.jira_url = settings["jira"]["url"]
        self.jira_user = settings["jira"]["user"]
        self.jira_api_token = settings["jira"]["api_token"]
        self.jira_project_key = settings["jira"]["project_key"]

        # Slack
        self.slack_token = settings["slack"]["token"]

        # Load password seed
        self.password_seed = settings.get("password_seed")

        # Location of the psul log
        self.psul_log = settings.get("psul_log")

        # to display instruments in the server status
        self.server_status = settings.get("server_status")

        # project summary - reports tab
        # Structure of the reports folder:
        # <reports_path>/
        # ├── other_reports/
        # │    └── toulligqc_reports/
        # ├── minknow_reports/
        # ├── mqc_reports/
        # └── yggdrasil/<project_id>/
        self.reports_path = settings.get("reports_path")
        self.report_path = {}
        self.report_path["minknow"] = Path(self.reports_path, "minknow_reports")
        self.report_path["multiqc"] = Path(self.reports_path, "mqc_reports")
        self.report_path["toulligqc"] = Path(
            self.reports_path, "other_reports", "toulligqc_reports"
        )
        self.report_path["yggdrasil"] = Path(self.reports_path, "yggdrasil")

        # lims backend credentials
        limsbackend_cred_loc = Path(
            settings["lims_backend_credential_location"]
        ).expanduser()
        with limsbackend_cred_loc.open() as cred_file:
            self.lims_conf = yaml.safe_load(cred_file)

        order_portal_cred_loc = Path(
            settings["order_portal_credential_location"]
        ).expanduser()
        with order_portal_cred_loc.open() as cred_file:
            self.order_portal_conf = yaml.safe_load(cred_file)["order_portal"]

        # Setup the Tornado Application

        settings["debug"] = True
        settings["static_path"] = "static"
        settings["login_url"] = "/login"

        if options["develop"]:
            tornado.autoreload.watch("design/application.html")
            tornado.autoreload.watch("design/applications.html")
            tornado.autoreload.watch("design/barcode.html")
            tornado.autoreload.watch("design/base.html")
            tornado.autoreload.watch("design/base_b5.html")
            tornado.autoreload.watch("design/bioinfo_tab.html")
            tornado.autoreload.watch("design/bioinfo_tab/run_lane_sample_view.html")
            tornado.autoreload.watch("design/bioinfo_tab/sample_run_lane_view.html")
            tornado.autoreload.watch("design/controls.html")
            tornado.autoreload.watch("design/cronjobs.html")
            tornado.autoreload.watch("design/clone_project.html")
            tornado.autoreload.watch("design/data_delivered_plot.html")
            tornado.autoreload.watch("design/deliveries.html")
            tornado.autoreload.watch("design/error_page.html")
            tornado.autoreload.watch("design/flowcell.html")
            tornado.autoreload.watch("design/flowcell_error.html")
            tornado.autoreload.watch("design/flowcell_trend_plot.html")
            tornado.autoreload.watch("design/flowcells.html")
            tornado.autoreload.watch("design/index.html")
            tornado.autoreload.watch("design/instrument_logs.html")
            tornado.autoreload.watch("design/invoicing.html")
            tornado.autoreload.watch("design/lanes_ordered.html")
            tornado.autoreload.watch("design/link_tab.html")
            tornado.autoreload.watch("design/ngisweden_stats.html")
            tornado.autoreload.watch("design/ont_trend_plot.html")
            tornado.autoreload.watch("design/qpcr_pools.html")
            tornado.autoreload.watch("design/pricing_products.html")
            tornado.autoreload.watch("design/pricing_quote.html")
            tornado.autoreload.watch("design/pricing_quote_tbody.html")
            tornado.autoreload.watch("design/proj_meta_compare.html")
            tornado.autoreload.watch("design/project_samples.html")
            tornado.autoreload.watch("design/project_samples_old.html")
            tornado.autoreload.watch("design/projects.html")
            tornado.autoreload.watch("design/project_cards.html")
            tornado.autoreload.watch("design/reads_total.html")
            tornado.autoreload.watch("design/rec_ctrl_view.html")
            tornado.autoreload.watch("design/running_notes_help.html")
            tornado.autoreload.watch("design/running_notes_tab.html")
            tornado.autoreload.watch("design/sensorpush.html")
            tornado.autoreload.watch("design/suggestion_box.html")
            tornado.autoreload.watch("design/unauthorized.html")
            tornado.autoreload.watch("design/user_management.html")
            tornado.autoreload.watch("design/user_preferences.html")
            tornado.autoreload.watch("design/workset_samples.html")
            tornado.autoreload.watch("design/worksets.html")

        tornado.web.Application.__init__(self, handlers, **settings)


if __name__ == "__main__":
    # Tornado built-in command line parsing. Auto configures logging
    define(
        "testing_mode",
        default=False,
        help=(
            "WARNING, this option disables "
            "all security measures, use only "
            "for testing purposes"
        ),
    )
    define(
        "develop",
        default=False,
        help=(
            "Define develop mode to look for changes "
            "in files and automatically reloading them"
        ),
    )

    define(
        "port", default=9761, type=int, help="The port that the server will listen to."
    )
    # After parsing the command line, the command line flags are stored in tornado.options
    tornado.options.parse_command_line()
    logging_format = f"%(color)s[%(levelname)1.1s %(asctime)s %(module)s:%(lineno)d] [port:{options['port']}]%(end_color)s %(message)s"
    log_formatter = LogFormatter(fmt=logging_format, color=True)
    logging.getLogger().handlers[0].setFormatter(log_formatter)

    # Load configuration file
    with open("settings.yaml") as settings_file:
        server_settings = yaml.full_load(settings_file)

    server_settings["Testing mode"] = options["testing_mode"]

    if "cookie_secret" not in server_settings:
        cookie_secret = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
        server_settings["cookie_secret"] = cookie_secret

    # Instantiate Application
    application = Application(server_settings)

    # Load ssl certificate and key files
    ssl_cert = server_settings.get("ssl_cert", None)
    ssl_key = server_settings.get("ssl_key", None)

    if ssl_cert and ssl_key:
        ssl_options = {"certfile": ssl_cert, "keyfile": ssl_key}
    else:
        ssl_options = None

    # Start HTTP Server
    http_server = tornado.httpserver.HTTPServer(application, ssl_options=ssl_options)

    http_server.listen(options["port"])

    # Get a handle to the instance of IOLoop
    ioloop = tornado.ioloop.IOLoop.instance()

    application.ioloop = ioloop

    # Start the IOLoop
    ioloop.start()
