""" Main genomics-status web application.
"""
from collections import OrderedDict
from collections import defaultdict
import json
import time
from datetime import datetime

from couchdb import Server
from dateutil import parser
import numpy as np

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.autoreload
from tornado import template

import yaml

import cStringIO
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg

import matplotlib.pyplot as plt

import matplotlib.gridspec as gridspec
from matplotlib import cm

from status.amanita import AmanitaHandler
from status.amanita import AmanitaHomeDataHandler
from status.amanita import AmanitaHomeUserDataHandler
from status.amanita import AmanitaUsersDataHandler
from status.amanita import AmanitaBox2DataHandler
from status.amanita import AmanitaBox2ProjectDataHandler
from status.amanita import AmanitaBox2ProjectsDataHandler
from status.amanita import AmanitaHomeProjectsDataHandler
from status.amanita import AmanitaHomeProjectDataHandler

from status.production import DeliveredMonthlyDataHandler
from status.production import DeliveredMonthlyPlotHandler
from status.production import DeliveredQuarterlyDataHandler
from status.production import DeliveredQuarterlyPlotHandler
from status.production import ProducedMonthlyDataHandler
from status.production import ProducedMonthlyPlotHandler
from status.production import ProducedQuarterlyDataHandler
from status.production import ProducedQuarterlyPlotHandler

from status.applications import ApplicationsHandler
from status.applications import ApplicationsDataHandler
from status.applications import ApplicationsPlotHandler
from status.applications import SamplesApplicationsDataHandler
from status.applications import SamplesApplicationsPlotHandler

from status.projects import ProjectDataHandler
from status.projects import ProjectsDataHandler
from status.projects import ProjectSamplesDataHandler
from status.projects import ProjectSamplesHandler
from status.projects import ProjectsHandler

from status.sequencing import InstrumentClusterDensityDataHandler
from status.sequencing import InstrumentClusterDensityPlotHandler
from status.sequencing import InstrumentErrorrateDataHandler
from status.sequencing import InstrumentErrorratePlotHandler
from status.sequencing import SequencingStatsHandler
from status.sequencing import InstrumentUnmatchedDataHandler
from status.sequencing import InstrumentUnmatchedPlotHandler
from status.sequencing import InstrumentYieldDataHandler
from status.sequencing import InstrumentYieldPlotHandler

from status.testing import TestDataHandler
from status.util import dthandler


class MainHandler(tornado.web.RequestHandler):
    """ Serves the html front page upon request.
    """
    def get(self):
        t = self.application.loader.load("index.html")
        self.write(t.generate())


class DataHandler(tornado.web.RequestHandler):
    """ Serves a listing of all available URL's in the web service.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        handlers = [h[0] for h in self.application.declared_handlers]
        api = filter(lambda h: h.startswith("/api"), handlers)
        pages = list(set(handlers).difference(set(api)))
        pages = filter(lambda h: not (h.endswith("?") or h.endswith("$")), pages)
        pages.sort(reverse=True)
        api.sort(reverse=True)
        self.write(json.dumps({"api": api, "pages": pages}))


class QuotasHandler(tornado.web.RequestHandler):
    """ Serves a grid of time series plots for UPPNEX storage quotas.
    """
    def get(self):
        t = self.application.loader.load("quota_grid.html")
        self.write(t.generate())


class QuotaHandler(tornado.web.RequestHandler):
    """ Serves a page with a plot of a time series of used storage quota for
    a provided UPPNEX project.
    """
    def get(self, project):
        t = self.application.loader.load("quota.html")
        self.write(t.generate(project=project))


class QuotaDataHandler(tornado.web.RequestHandler):
    """ Serves a time series for storage quota usage of a given UPPNEX
    project.
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.project_storage_quota(project),
                              default=dthandler))

    def project_storage_quota(self, project):
        proj_getter = lambda row: row.key[0]
        proj_checker = lambda row: proj_getter(row) == project
        date_getter = lambda row: row.key[1]
        view = self.application.uppmax_db.view("status/project_quota_usage_over_time")
        r_list = filter(proj_checker, view)
        r_list = sorted(r_list, key=date_getter)

        # 1024 ** 3
        gb = 1073741824
        data = []
        for row in r_list:
            data.append({"x": int(time.mktime(parser.parse(date_getter(row)).timetuple())),
                         "y": row.value[0] * gb})

        d = dict()
        d["data"] = data
        d["name"] = "series"
        return [d]


class ProductionHandler(tornado.web.RequestHandler):
    """ Serves a page with statistics and plots about the amount of
    sequencing / data produced over time.
    """
    def get(self):
        t = self.application.loader.load("production.html")
        self.write(t.generate())


class UppmaxProjectsDataHandler(tornado.web.RequestHandler):
    """ Serves a list of UPPNEX projects where the storage quota have
    been logged.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_projects()))

    def list_projects(self):
        project_list = []
        view = self.application.uppmax_db.view("status/projects", group_level=1)
        for row in view:
            project_list.append(row.key)

        return project_list


class UpdatedDocumentsDatahandler(tornado.web.RequestHandler):
    """ Serves a list of references to the last updated documents in the
    databases Status gets data from.

    Specify to get the <n> latest items by ?items=<n>.
    """
    def get(self):
        num_items = int(self.get_argument("items", 25))
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_updated(num_items)))

    def list_updated(self, num_items=25):
        last = []

        view = self.application.uppmax_db.view("time/last_updated",
                                               limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'UPPNEX Quota usage'))

        view = self.application.samples_db.view("time/last_updated",
                                                limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Sample information'))

        view = self.application.projects_db.view("time/last_updated",
                                                 limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Project information'))

        view = self.application.flowcells_db.view("time/last_updated",
                                                  limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Flowcell information'))

        view = self.application.amanita_db.view("sizes/home_total",
                                                limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Amanita storage usage'))

        view = self.application.picea_db.view("sizes/home_total",
                                              limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Picea storage usage'))

        last = sorted(last, key=lambda tr: tr[0], reverse=True)
        return last[:num_items]


class ApplicationDataHandler(tornado.web.RequestHandler):
    """ Serves a list of projects which have the application provided as
    an argument.
    """
    def get(self, application):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_projects(application)))

    def list_projects(self, application):
        if application == 'null':
            application=None
        projects = []
        project_view = self.application.projects_db.view("project/applications", reduce=False)
        for row in project_view[application]:
            projects.append(row.value)

        return projects


class SampleInfoDataHandler(tornado.web.RequestHandler):
    """ Serves the abbreviated sample info for a given sample.
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_info(sample)))

    def sample_info(self, sample):
        for row in self.application.projects_db.view("samples/info")[sample]:
            return row.value


class PagedQCDataHandler(tornado.web.RequestHandler):
    """ Serves a list of 50 sample names following a given string
    in alhabetical order.
    """
    def get(self, startkey):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_samples(startkey)))

    def list_samples(self, startkey):
        sample_list = []
        view = self.application.samples_db.view("names/samplename_run",
                                                group_level=1,
                                                limit=50,
                                                startkey=startkey)
        for row in view:
            sample_list.append(row.key)

        return sample_list


class SampleQCSummaryDataHandler(tornado.web.RequestHandler):
    """ Serves the QC Summary data of a given sample.
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/summary", reduce=False)[sample]

        return result.rows[0].value


class SampleQCDataHandler(tornado.web.RequestHandler):
    """ Serves the QC data of a given sample.
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/qc_summary")[sample]

        return result.rows[0].value


class SampleQCSummaryHandler(tornado.web.RequestHandler):
    """ Serves a page which displays QC data with tables and plots for a
    given sample run.
    """
    def get(self, sample):
        t = self.application.loader.load("sample_run_qc.html")
        self.write(t.generate(sample=sample))


class SampleQCAlignmentDataHandler(tornado.web.RequestHandler):
    """ Serves alignment QC metrics for a given sample run.
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/alignment_summary")[sample]

        return result.rows[0].value


class SampleQCInsertSizesDataHandler(tornado.web.RequestHandler):
    """ Serves insert size distribution for a given sample run.
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/insert_size_distribution")[sample]

        return result.rows[0].value


class SampleQCCoverageDataHandler(tornado.web.RequestHandler):
    """ Serves coverage for a given sample run.
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/coverage", key=sample)

        return result.rows[0].value


class SampleReadCountDataHandler(tornado.web.RequestHandler):
    """ Serves the read counts of a given sample.
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_read_count(sample), default=dthandler))

    def sample_read_count(self, sample):
        rc_view = self.application.samples_db.view("samples/read_counts",
                                                   group_level=1)
        for row in rc_view[[sample]:[sample, "Z"]]:
            return row.value["read_count"]


class ReadsVsQvhandler(tornado.web.RequestHandler):
    """ Serves a page which shows plots of the amount of reads with certain
    quality values over a given date range.
    """
    def get(self):
        t = self.application.loader.load("reads_vs_qv.html")
        self.write(t.generate())


class ReadsVsQDataHandler(tornado.web.RequestHandler):
    """ Serves histogram data of reada over average quality values of reads.
    """
    def get(self):
        start = self.get_argument("start",  '2012-01-01T00:00:00')
        start_date = parser.parse(start)

        end = self.get_argument("end", None)
        if end:
            end_date = parser.parse(end)
        else:
            end_date = datetime.now()

        start = [start_date.year - 2000,
                 (start_date.month - 1) // 3 + 1,
                 start_date.month,
                 start_date.day]

        end = [end_date.year - 2000,
               (end_date.month - 1) // 3 + 1,
               end_date.month,
               end_date.day]

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.reads_q_data(start, end), default=dthandler))

    def reads_q_data(self, start, end):
        qv_view = self.application.samples_db.view("qc/date_reads_per_qv")
        quality_count = np.zeros(45)
        quality_integral = np.zeros(45)
        for row in qv_view[start:end]:
            quality = np.array(row.value["Quality"], dtype=int)
            integral = np.array(row.value["Cumulative count"], dtype=float)
            count = np.array(row.value["Count"], dtype=float)
            quality_count[quality] += count
            quality_integral[quality] += integral

        quality_count = quality_count / quality_count.sum()
        # 2 is the minimum quality value
        quality_integral = quality_integral / quality_integral[2]

        return {"quality": list(quality_count),
                "cumulative": list(quality_integral)}


class PhixErrorRateHandler(tornado.web.RequestHandler):
    """ Serves a page which shows the distributions of phiX error rates.
    """
    def get(self):
        t = self.application.loader.load("phix_err_rate.html")
        self.write(t.generate())


class PhixErrorRateDataHandler(tornado.web.RequestHandler):
    """ Serves a histogram of yields and phiX error rates over all time.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.phix_err_rate()))

    def phix_err_rate(self):
        view = self.application.flowcells_db.view("lanes/err_rate_phix_yield")

        err_rates = []
        yields = []

        for row in view:
            err_rate = row.value["err_rate_phix"]
            read_yield = row.value["yield"]
            if err_rate and read_yield and err_rate > 0.0001:
                err_rates.append(err_rate)
                yields.append(float(read_yield))

        amount_yields, error_rate = np.histogram(err_rates,
                                                 bins=256,
                                                 weights=yields)

        fraction_yield = amount_yields / amount_yields.sum()

        return {"error_rate": list(error_rate),
                "yield_fraction": list(fraction_yield),
                "cum_yield_fraction": list(fraction_yield.cumsum())}


class SamplesPerLaneDataHandler(tornado.web.RequestHandler):
    """ Serves data for the number of samples loaded on a lane.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_count_per_lane()))

    def sample_count_per_lane(self):
        # The number of samples per (flowcell,lane)
        n_samples_view = self.application.samples_db.view("lanes/count",
                                                          group_level=2)
        samples_per_lane = []
        for row in n_samples_view:
            samples_per_lane.append(row.value)

        return samples_per_lane


class SamplesPerLaneHandler(tornado.web.RequestHandler):
    """ Serves a page which displays a plot for the number of samples 
    loaded on a lane.
    """
    def get(self):
        t = self.application.loader.load("samples_per_lane.html")
        self.write(t.generate())


class SamplesPerLanePlotHandler(SamplesPerLaneDataHandler):
    """ Serves a plot for the number of samples loaded on a lane.
    """
    def get(self):
        samples_per_lane = self.sample_count_per_lane()

        max_no_samples_per_lane = max(samples_per_lane)
        gs = gridspec.GridSpec(1, 15)

        fig = Figure()
        ax = fig.add_subplot(gs[0, :-1])
        bp = ax.hist(samples_per_lane,bins=max_no_samples_per_lane)
        ax.set_xlabel("No of samples")
        ax.set_ylabel("No of lanes")

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        data = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(data))
        self.write(data)


class BarcodeVsExpectedDataHandler(tornado.web.RequestHandler):
    """ Serves series with number of matched reads to a barcode compared
    to the expected number of reads matched to a barcode.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.yield_difference(), default=dthandler))

    def yield_difference(self):
        fc_lanes_total_reads = {}
        for row in self.application.samples_db.view("barcodes/read_counts",
                                                    group_level=2):
            fc_lanes_total_reads[tuple(row.key)] = row.value

        fc_lanes_unmatched_reads = {}
        for row in self.application.flowcells_db.view("lanes/unmatched", reduce=False):
            fc_lanes_unmatched_reads[tuple(row.key)] = row.value

        fc_lanes_sample_count = {}
        for row in self.application.samples_db.view("lanes/count", group_level=2):
            fc_lanes_sample_count[tuple(row.key)] = max(row.value - 1, 1)

        fc_lane_expected_yield = {}
        for k in fc_lanes_total_reads.keys():
            fc_lane_expected_yield[k] = \
                ((fc_lanes_total_reads[k] - fc_lanes_unmatched_reads.get(k, 0))
                 / fc_lanes_sample_count[k])

        barcode_relation = defaultdict(list)
        for fc_lane, expected_yield in fc_lane_expected_yield.items():
            fc_l = list(fc_lane)
            rc_view = self.application.samples_db.view("barcodes/read_counts",
                                                       reduce=False)

            for row in rc_view[fc_l + [""]: fc_l + ["Z"]]:
                try:
                    barcode_relation[row.key[-1]].append(float(row.value) / expected_yield)

                except ZeroDivisionError:
                    pass

        processed_relation = barcode_relation.iteritems()
        processed_relation = filter(lambda l: len(l[1]) >= 50, processed_relation)
        processed_relation.sort(key=lambda l: np.median(l[1]))

        return processed_relation


class BarcodeVsExpectedPlotHandler(BarcodeVsExpectedDataHandler):
    """ Serves a boxplot of expected yields vs matched yields for top
    present barcodes.
    """
    def get(self):
        processed_relation = self.yield_difference()

        fig = Figure(figsize=[12, 6])
        ax = fig.add_axes([0.1, 0.2, 0.8, 0.7])

        ax.boxplot([l[1] for l in processed_relation], 0, '', 0)

        ax.set_xlabel("log((matched yield) / (expected yield))")
        ax.set_ylabel("Barcode")

        ax.set_yticklabels([l[0] for l in processed_relation], family='monospace')

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        data = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(data))
        self.write(data)


class SampleRunReadCountDataHandler(tornado.web.RequestHandler):
    """ Serves the read counts of a sample, for each run of the sample.
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_read_count(sample),
                              default=dthandler))

    def sample_read_count(self, sample):
        rc_view = self.application.samples_db.view("samples/read_counts",
                                                   reduce=False)
        sample_runs = OrderedDict()
        for row in rc_view[[sample, "", ""]:[sample, "Z", ""]]:
            sample_runs[row.key[1]] = row.value
            sample_runs[row.key[1]]["lane"] = row.key[-1]

        return sample_runs


class FlowcellsDataHandler(tornado.web.RequestHandler):
    """ Serves brief information for each flowcell in the database.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_flowcells()))

    def list_flowcells(self):
        flowcells = OrderedDict()
        fc_view = self.application.flowcells_db.view("info/summary",
                                                     descending=True)
        for row in fc_view:
            flowcells[row.key] = row.value

        return flowcells


class FlowcellsInfoDataHandler(tornado.web.RequestHandler):
    """ Serves brief information about a given flowcell.
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.flowcell_info(flowcell)))

    def flowcell_info(self, flowcell):
        fc_view = self.application.flowcells_db.view("info/summary",
                                                     descending=True)
        for row in fc_view[flowcell]:
            flowcell_info = row.value
            break

        return flowcell_info


class FlowcellDataHandler(tornado.web.RequestHandler):
    """ Serves a list of sample runs in a flowcell.
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_sample_runs(flowcell)))

    def list_sample_runs(self, flowcell):
        sample_run_list = []
        fc_view = self.application.samples_db.view("flowcell/name", reduce=False)
        for row in fc_view[flowcell]:
            sample_run_list.append(row.value)

        return sample_run_list


class FlowcellQCHandler(tornado.web.RequestHandler):
    """ Serves QC data for each lane in a given flowcell.
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_sample_runs(flowcell)))

    def list_sample_runs(self, flowcell):
        lane_qc = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/qc")
        for row in lane_view[[flowcell, ""]:[flowcell, "Z"]]:
            lane_qc[row.key[1]] = row.value

        return lane_qc


class FlowcellDemultiplexHandler(tornado.web.RequestHandler):
    """ Serves demultiplex yield data for each lane in a given flowcell.
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.lane_stats(flowcell)))

    def lane_stats(self, flowcell):
        lane_qc = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/demultiplex")
        for row in lane_view[[flowcell, ""]:[flowcell, "Z"]]:
            lane_qc[row.key[1]] = row.value

        return lane_qc


class Q30PlotHandler(tornado.web.RequestHandler):
    """ Serves a plot of the percentages of bases which are at least Q30 for
    each flowcell.
    """
    def get(self):

        view = self.application.flowcells_db.view("lanes/gtq30", group_level=2)

        flowcells = OrderedDict()
        instruments = set()

        for row in view:
            flowcells[tuple(row.key)] = {"q30": row.value["sum"] / row.value["count"],
                                         "instrument": row.value["instrument"]}
            instruments.add(row.value["instrument"])

        i_to_n = dict(zip(instruments, np.linspace(0., 1., len(instruments))))

        cmap = plt.cm.Dark2

        fig = Figure(figsize=[12, 8])
        ax = fig.add_axes([0.1, 0.2, 0.8, 0.7])

        locs, labels = [], []
        for instrument in instruments:
            color = cmap(i_to_n[instrument])
            X = [(k, i["q30"]) for k, i in flowcells.items() if "q30" in i and i["instrument"] == instrument]
            y = [x[1] for x in X]
            x = [parser.parse(x[0][0].split("_")[0]) for x in X]

            ax.scatter(x, y, c=color, s=150, marker='o', label=instrument)

            locs += x
            labels += [a[0][0].split("_")[0] for a in X]

        L = list(set(zip(locs, labels)))

        ax.set_xticks([l[0] for l in L])
        ax.set_xticklabels([l[1] for l in L], rotation=90)
        ax.set_xlabel("Run")
        ax.set_ylabel("%")
        ax.set_ylim([0, 100])

        ax.legend(loc="lower right", bbox_to_anchor=(1, 1), ncol=5)

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        data = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(data))
        self.write(data)


class Q30Handler(tornado.web.RequestHandler):
    """ Serves a page with a plot of the percentages of bases which are at
    least Q30 for each flowcell.
    """
    def get(self):
        t = self.application.loader.load("q30.html")
        self.write(t.generate())


class ReadsPerLanePlotHandler(tornado.web.RequestHandler):
    """ Serves a plot of distribution of lane read production for a provided
    time interval.
    """
    def get(self):
        start = self.get_argument("start", "")
        end = self.get_argument("end", "Z")

        lanes = self.application.flowcells_db.view("lanes/demultiplex")

        yields_per_lane = []
        for lane in lanes[[start, ""]:[end, "Z"]]:
            y = lane.value["yield"]
            if y:
                yields_per_lane.append(y)

        gs = gridspec.GridSpec(16, 1)

        fig = Figure(figsize=[10, 8])

        portion = 2

        ax = fig.add_subplot(gs[:-portion, 0])
        ax.hist(yields_per_lane, bins=32)
        ax.grid(b='on')
        ax.set_ylabel("Lanes")

        ax.spines["bottom"].set_color('none')

        ax.get_xaxis().set_visible(False)

        ax = fig.add_subplot(gs[-portion:, 0])
        ax.grid(b='on', axis='x')

        ax.boxplot(yields_per_lane, vert=False, patch_artist=True)

        ax.set_xlabel("Reads")
        ax.get_yaxis().set_visible(False)

        ax.spines["top"].set_linewidth(2)

        fig.subplots_adjust(hspace=0)

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        data = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(data))
        self.write(data)


class ReadsPerLaneHandler(tornado.web.RequestHandler):
    """ Serves a page with a plot of distribution of lane read production for a provided
    time interval.
    """
    def get(self):
        t = self.application.loader.load("reads_per_lane.html")
        self.write(t.generate())


class FlowcellQ30Handler(tornado.web.RequestHandler):
    """ Serves the percentage ofr reads over Q30 for each lane in the given
    flowcell.
    """
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.lane_q30(flowcell)))

    def lane_q30(self, flowcell):
        lane_q30 = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/gtq30", group_level=2)
        for row in lane_view[[flowcell, ""]:[flowcell, "Z"]]:
            lane_q30[row.key[1]] = row.value["sum"] / row.value["count"]

        return lane_q30


class ExpectedHandler(tornado.web.RequestHandler):
    """ Serves a page with a boxplots of expected yield compared to matched
    yields for all runs of top bar codes.
    """
    def get(self):
        t = self.application.loader.load("barcode_vs_expected.html")
        self.write(t.generate())


class ApplicationHandler(tornado.web.RequestHandler):
    """ Serves a page that list all the projects which has the application
    provided as a parameter.
    """
    def get(self, application):
        t = self.application.loader.load("application.html")
        self.write(t.generate(application=application))


class FlowcellsHandler(tornado.web.RequestHandler):
    """ Serves a page which lists all flowcells with some brief info.
    """
    def get(self):
        t = self.application.loader.load("flowcells.html")
        self.write(t.generate())


class FlowcellHandler(tornado.web.RequestHandler):
    """ Serves a page which shows information and QC stats for a given
    flowcell.
    """
    def get(self, flowcell):
        t = self.application.loader.load("flowcell_samples.html")
        self.write(t.generate(flowcell=flowcell))


class PiceaHandler(tornado.web.RequestHandler):
    """ Serves a page with time series of storage usage on Picea.
    """
    def get(self):
        t = self.application.loader.load("picea.html")
        self.write(t.generate())


class PiceaHomeDataHandler(tornado.web.RequestHandler):
    """ Serves a time seris for the total storage usage in HOME on Picea.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_usage()))

    def home_usage(self):
        sizes = []
        for row in self.application.picea_db.view("sizes/home_total"):
            obs_time = parser.parse(row.key)
            sizes.append({"x": int(time.mktime(obs_time.timetuple()) * 1000),
                          "y": row.value * 1024})

        return sizes


class PiceaHomeUserDataHandler(tornado.web.RequestHandler):
    """ Serves a time series for the storage used by as user in HOME on Picea.
    """
    def get(self, user):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_usage(user)))

    def home_usage(self, user):
        sizes = []
        view = self.application.picea_db.view("sizes/home_user", group=True)
        for row in view[[user, "0"], [user, "a"]]:
            obs_time = parser.parse(row.key[1])
            sizes.append({"x": int(time.mktime(obs_time.timetuple()) * 1000),
                          "y": row.value * 1024})

        return sizes


class PiceaUsersDataHandler(tornado.web.RequestHandler):
    """ Serves a list of users on Picea.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_users()))

    def home_users(self):
        users = []
        view = self.application.picea_db.view("sizes/home_user", group_level=1)
        for row in view:
            if "/" not in row.key[0]:
                users.append(row.key[0])

        return users


class SampleRunHandler(tornado.web.RequestHandler):
    """ Serves a page of brief statistics and sample runs of a given sample.
    """
    def get(self, sample):
        t = self.application.loader.load("sample_runs.html")
        self.write(t.generate(sample=sample))


class SampleRunDataHandler(tornado.web.RequestHandler):
    """ Serves a list of sample runs for a given sample.
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_runs(sample)))

    def sample_runs(self, sample):
        sample_run_list = []
        run_view = self.application.samples_db.view("names/runs", reduce=False)
        for row in run_view[sample]:
            sample_run_list.append(row.value)

        return sample_run_list


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

        # Setup the Tornado Application
        settings = {"debug": True,
                    "static_path": "static"}

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
