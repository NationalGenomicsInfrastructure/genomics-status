import tornado.web
import json
import cStringIO

import matplotlib.gridspec as gridspec
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg


class ReadsPerLaneHandler(tornado.web.RequestHandler):
    """ Serves a page with a plot of distribution of lane read production for a provided
    time interval.
    """
    def get(self):
        t = self.application.loader.load("reads_per_lane.html")
        self.write(t.generate())


class ReadsPerLanePlotHandler(tornado.web.RequestHandler):
    """ Serves a plot of distribution of lane read production for a provided
    time interval.

    Loaded through /api/v1/plot/reads_per_lane.png
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
