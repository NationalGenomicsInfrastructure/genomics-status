import tornado.web
import json
import cStringIO

from collections import defaultdict
import numpy as np

from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg

from status.util import dthandler, SafeHandler

#TODO - Have date slider to select range
#TODO - Ask if anyone uses it

class BarcodeVsExpectedDataHandler(SafeHandler):
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

    Loaded through /api/v1/plot/barcodes_vs_expected([^/]*)$ url
    """
    def get(self, graph_type):
        processed_relation = self.yield_difference()
        
        # Filter data
        plot_data = []
        plot_labels = []
        for l in processed_relation:
            if graph_type == "_single.png" and "-" not in l[0]:
                plot_data.append(l[1])
                plot_labels.append(l[0])
            elif graph_type == "_double.png" and "-" in l[0]:
                plot_data.append(l[1])
                plot_labels.append(l[0])
            elif graph_type == ".png":
                plot_data.append(l[1])
                plot_labels.append(l[0])

        if graph_type == "_single.png":
            fig = Figure(figsize=[12, 10])
        elif graph_type == "_double.png":
            fig = Figure(figsize=[12, 40])
        else:
            fig = Figure(figsize=[12, 50])
        ax = fig.add_axes([0.2, 0.1, 0.8, 0.9])

        ax.boxplot(plot_data, 0, '', 0)

        ax.set_xlabel("log(matched yield / expected yield)")
        ax.set_ylabel("Barcode")

        ax.set_yticklabels(plot_labels, family='monospace')

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        data = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(data))
        self.write(data)


class ExpectedHandler(SafeHandler):
    """ Serves a page with a boxplots of expected yield compared to matched
    yields for all runs of top bar codes.
    """
    def get(self):
        t = self.application.loader.load("barcode_vs_expected.html")
        self.write(t.generate(user=self.get_current_user_name(), deprecated=True))
