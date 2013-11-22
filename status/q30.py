import tornado.web
import json
import cStringIO

import numpy as np
import matplotlib.pyplot as plt

from collections import OrderedDict
from dateutil import parser
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg

RUNMODES = ['RapidRun', 'HighOutput', 'Undefined']
SETUPS = ['51','101','151','251','301']

class Q30Handler(tornado.web.RequestHandler):
    """ Serves a page with a plot of the percentages of bases which are at
    least Q30 for each flowcell.
    """
    def get(self):
        t = self.application.loader.load("q30.html")
        self.write(t.generate(instrument_list = self.application.instrument_list, 
                              runmodes = RUNMODES,
                              setups = SETUPS))


class Q30PlotHandler(tornado.web.RequestHandler):
    """ Serves a plot of the percentages of bases which are at least Q30 for
    each flowcell.
    
    Loaded through /api/v1/plot/q30.png
    """
    def get(self):
        instrument_color = self._instrument_colors()
        instrument_names, instrument_types = self._instrument_info()

        view = self.application.flowcells_db.view("lanes/gtq30", group_level=3)

        flowcells = OrderedDict()
        instruments = set()

        # Filtering arguments
        start_date = self.get_argument("start", None)
        end_date = self.get_argument("end","z")

        runmodes = self._empty_or_split(self.get_argument("runmodes",default=''),',')
        instrument_args = self._empty_or_split(self.get_argument("instruments",default=''),',')
        setups = set(self._empty_or_split(self.get_argument("setups", default=''),','))
        include_other_setups = 'Other' in setups

        all_setups = set(SETUPS)

        # Special case for machines with null values in db,
        # will show up as python value None 
        if 'null' in runmodes or 'Undefined' in runmodes:
            runmodes.append(None)

        for row in view[[start_date]:[end_date]]:
            runmode = row.key[1]
            instrument_id = row.value["instrument"]
            setup =  set(map(str, row.value["setup"]))

            if (runmodes == []) or (runmode in runmodes):
                if (instrument_args == []) or (instrument_id in instrument_args):
                    # Other qualified if the setup is not listed in constant SETUPS
                    # and Other is included in the filter.
                    other_qualified = (include_other_setups and (len(setup - all_setups) > 0))
                    setup_in_args = not setups.isdisjoint(setup)
                    if (len(setups) == 0) or setup_in_args or other_qualified:
                        flowcells[tuple(row.key)] = {"q30": row.value["sum"] / row.value["count"],
                                                     "instrument": row.value["instrument"]}
                        instruments.add(instrument_id)

        fig = self._figure(instruments, instrument_color, instrument_names, flowcells)
        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        data = buf.getvalue()
        
        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(data))
        self.write(data)

    def _empty_or_split(self, string, splitter):
        if string == '':
            return []
        return string.split(splitter)

    def _instrument_info(self):
        instrument_names = {}
        instrument_types = {}
        for instrument_type,instruments in self.application.instrument_list.iteritems():
            for i_id, i_name in instruments.iteritems():
                instrument_names[i_id] = i_name
                instrument_types[i_id] = instrument_type

        return instrument_names,instrument_types
    
    def _instrument_colors(self):
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

        return instrument_color

    def _figure(self,instruments, instrument_color, instrument_names, flowcells):
        fig = Figure(figsize=[12, 8])
        ax = fig.add_axes([0.1, 0.2, 0.8, 0.7])
        
        locs, labels = [], []
        for instrument in instruments:
            color = instrument_color[instrument]
            X = [(k, i["q30"]) for k, i in flowcells.items() if "q30" in i and i["instrument"] == instrument]
            y = [x[1] for x in X]
            x = [parser.parse(x[0][0].split("_")[0]) for x in X]
            
            label = instrument_names.get(instrument,instrument)
            ax.scatter(x, y, c=color, s=100, marker='o', label=label)
            
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
        
        return fig
