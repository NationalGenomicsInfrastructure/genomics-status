"""Handlers related with samples
"""

import tornado.web
import json
from io import BytesIO

import matplotlib.gridspec as gridspec
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg

from status.util import dthandler, SafeHandler
from collections import OrderedDict

class SampleInfoDataHandler(SafeHandler):
    """ Serves the abbreviated sample info for a given sample.

    Loaded through /api/v1/sample_info/([^/]*)$
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_info(sample)))

    def sample_info(self, sample):
        for row in self.application.projects_db.view("samples/info")[sample]:
            return row.value

class SampleQCSummaryDataHandler(SafeHandler):
    """ Serves the QC Summary data of a given sample.

    Loaded through /api/v1/sample_summary/([^/]*)$
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/summary", reduce=False)[sample]

        return result.rows[0].value


class SampleRunDataHandler(SafeHandler):
    """ Serves a list of sample runs for a given sample.

    Loaded through /api/v1/samples/([^/]*)$
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


class SampleQCDataHandler(SafeHandler):
    """ Serves the QC data of a given sample.

    Loaded through /api/v1/qc/([^/]*)$
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/qc_summary")[sample]

        return result.rows[0].value


class SampleQCAlignmentDataHandler(SafeHandler):
    """ Serves alignment QC metrics for a given sample run.

    Loaded through /api/v1/sample_alignment/([^/]*)$
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/alignment_summary")[sample]

        return result.rows[0].value


class SampleQCInsertSizesDataHandler(SafeHandler):
    """ Serves insert size distribution for a given sample run.

    Loaded through /api/v1/sample_insert_sizes/([^/]*)$
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/insert_size_distribution")[sample]

        return result.rows[0].value


class SampleQCCoverageDataHandler(SafeHandler):
    """ Serves coverage for a given sample run.

    Loaded through /api/v1/sample_coverage/([^/]*)$
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/coverage", key=sample)

        return result.rows[0].value


class SampleReadCountDataHandler(SafeHandler):
    """ Serves the read counts of a given sample.

    Loaded through /api/v1/sample_readcount/(\w+)?
    """
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_read_count(sample), default=dthandler))

    def sample_read_count(self, sample):
        rc_view = self.application.samples_db.view("samples/read_counts",
                                                   group_level=1)
        for row in rc_view[[sample]:[sample, "Z"]]:
            return row.value["read_count"]


class SamplesPerLaneDataHandler(SafeHandler):
    """ Serves data for the number of samples loaded on a lane.

    Loaded through /api/v1/samples_per_lane
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


class SamplesPerLanePlotHandler(SamplesPerLaneDataHandler):
    """ Serves a plot for the number of samples loaded on a lane.

    Loaded through /api/v1/plot/samples_per_lane.png
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

        buf = BytesIO()
        fig.savefig(buf, format="png")
        data = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(data))
        self.write(data)


class SampleRunReadCountDataHandler(SafeHandler):
    """ Serves the read counts of a sample, for each run of the sample.

    Loaded through /api/v1/sample_run_counts/(\w+)?
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
