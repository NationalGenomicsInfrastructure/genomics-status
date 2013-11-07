import tornado.web
import json
import cStringIO

from collections import defaultdict
import numpy as np

from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg

from status.util import dthandler

class BarcodeVsExpectedDataHandler(tornado.web.RequestHandler):
    """ Serves series with number of matched reads to a barcode compared
    to the expected number of reads matched to a barcode.

    Loaded through /api/v1/expected url
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

    Loaded through /api/v1/plot/barcodes_vs_expected.png
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


class ExpectedHandler(tornado.web.RequestHandler):
    """ Serves a page with a boxplots of expected yield compared to matched
    yields for all runs of top bar codes.
    """
    def get(self):
        t = self.application.loader.load("barcode_vs_expected.html")
        self.write(t.generate())
