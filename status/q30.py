import tornado.web
import json
import cStringIO

import numpy as np
import matplotlib.pyplot as plt

from collections import OrderedDict
from dateutil import parser
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg

class Q30Handler(tornado.web.RequestHandler):
    """ Serves a page with a plot of the percentages of bases which are at
    least Q30 for each flowcell.
    """
    def get(self):
        t = self.application.loader.load("q30.html")
        self.write(t.generate())


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

        fig = Figure(figsize=[12, 6])
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
