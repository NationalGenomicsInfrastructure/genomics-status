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
        self.write(t.generate(instrument_list = self.application.instrument_list))


class Q30PlotHandler(tornado.web.RequestHandler):
    """ Serves a plot of the percentages of bases which are at least Q30 for
    each flowcell.
    """
    def get(self):

        # Fetch all instruments, for stable color mapping
        instruments_view = self.application.flowcells_db.view("lanes/gtq30", group_level=1)
        all_instruments = set()
        for row in instruments_view:
            all_instruments.add(row.value["instrument"])

        all_instruments = sorted(list(all_instruments))
        i_to_n = dict(zip(all_instruments, np.linspace(0., 1., len(all_instruments))))
        cmap = plt.cm.Dark2
        instrument_color = {}
        for i in all_instruments:
            instrument_color[i] = cmap(i_to_n[i])

        instrument_names = {}
        instrument_types = {}
        for instrument_type,instruments in self.application.instrument_list.iteritems():
            for i_id, i_name in instruments.iteritems():
                instrument_names[i_id] = i_name
                instrument_types[i_id] = instrument_type

        view = self.application.flowcells_db.view("lanes/gtq30", group_level=3)

        flowcells = OrderedDict()
        instruments = set()
                                    
        start_date = self.get_argument("start", None)
        end_date = self.get_argument("end","z")
        runmodes = self.get_arguments("runmodes")
        print "Runmodes: "
        print runmodes

        # Special case for machines with null values in db,
        # will show up as python value None 
        if 'null' in runmodes:
            runmodes.append(None)
        for row in view[[start_date]:[end_date]]:
            runmode = row.key[1]
            if (runmodes == []) or (runmode in runmodes):
                flowcells[tuple(row.key)] = {"q30": row.value["sum"] / row.value["count"],
                                             "instrument": row.value["instrument"]}
                instruments.add(row.value["instrument"])

        fig = Figure(figsize=[12, 8])
        ax = fig.add_axes([0.1, 0.2, 0.8, 0.7])

        locs, labels = [], []
        for instrument in instruments:
            color = instrument_color[instrument]
            X = [(k, i["q30"]) for k, i in flowcells.items() if "q30" in i and i["instrument"] == instrument]
            y = [x[1] for x in X]
            x = [parser.parse(x[0][0].split("_")[0]) for x in X]

            label = (instrument_names.get(instrument,instrument),instrument_types.get(instrument))
            ax.scatter(x, y, c=color, s=150, marker='o', label=label)

            locs += x
            labels += [a[0][0].split("_")[0] for a in X]

        L = list(set(zip(locs, labels)))

        ax.set_xticks([l[0] for l in L])
        ax.set_xticklabels([l[1] for l in L], rotation=90)
        ax.set_xlabel("Run")
        ax.set_ylabel("%")
        ax.set_ylim([0, 100])

        ax.legend(loc="lower right", bbox_to_anchor=(1, 1), ncol=4)

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        data = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(data))
        self.write(data)

