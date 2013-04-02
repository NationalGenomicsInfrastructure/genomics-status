""" Handlers related to data sequencing statistics.
"""
from collections import defaultdict
from collections import OrderedDict
import cStringIO
from datetime import datetime
import json
import random

from dateutil import parser
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg

import numpy as np

import tornado.web

from status.util import dthandler


class InstrumentClusterDensityDataHandler(tornado.web.RequestHandler):
    """ Gives series for cluster densities for instruments, over time.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.clusters(), default=dthandler))

    def clusters(self):
        view = self.application.flowcells_db.view("instrument/clusters_raw")

        raw_clusters = defaultdict(lambda :defaultdict(list))
        for row in view:
            date = row.key[0]
            instrument = row.key[1].upper()
            raw_clusters[instrument][date] += row.value

        return raw_clusters


class InstrumentClusterDensityPlotHandler(InstrumentClusterDensityDataHandler):
    """ Gives a plot for series of cluster densities for instruments, over time.
    """
    def get(self):
        data = self.clusters()
        data = filter(lambda n: n[0] != "NA", data.iteritems())

        fig, ax = plt.subplots(len(data), 1, sharex=True, sharey=True, \
                               figsize=(8, 16))

        for i, (name, instrument) in enumerate(data):
            dts = []
            means = []
            upper = []
            lower = []

            instrument = filter(lambda n: len(n[1]), instrument.items())

            for date, errors in sorted(instrument):
                try:
                    dts.append(parser.parse(date))
                    means.append(np.median(errors))
                    upper.append(np.percentile(errors, 25))
                    lower.append(np.percentile(errors, 75))
                except ValueError:
                    continue

            c_ax = ax[i]
            c_ax.set_title(name)
            try:
                c_ax.fill_between(dts, lower, upper, alpha=0.33, edgecolor='none');
                c_ax.plot(dts, means, 'k-o', markerfacecolor='none', markersize=10, lw=2);
            except ValueError:
                continue

        fig.tight_layout()

        FigureCanvasAgg(fig)
        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        image_data = buf.getvalue()
        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(image_data))
        self.write(image_data)


class InstrumentErrorrateDataHandler(tornado.web.RequestHandler):
    """ Gives series for phiX error rates for instruments, over time.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.error_rates(), default=dthandler))

    def error_rates(self):
        view = self.application.flowcells_db.view("instrument/error_rates")

        error_rates = defaultdict(lambda :defaultdict(list))
        for row in view:
            date = row.key[0]
            instrument = row.key[1].upper()
            error_rates[instrument][date] += row.value

        return error_rates


class InstrumentErrorratePlotHandler(InstrumentErrorrateDataHandler):
    """ Gives series for phiX error rates for instruments, over time.
    """
    def get(self):
        data = self.error_rates()
        data = filter(lambda n: n[0] != "NA", data.iteritems())

        fig, ax = plt.subplots(len(data), 1, sharex=True, sharey=True, \
                               figsize=(8, 16))

        for i, (name, instrument) in enumerate(data):
            dts = []
            means = []
            upper = []
            lower = []

            for date, errors in sorted(instrument.items()):
                try:
                    dts.append(parser.parse(date))
                    means.append(np.median(errors))
                    upper.append(np.percentile(errors, 25))
                    lower.append(np.percentile(errors, 75))
                except ValueError:
                    continue

            c_ax = ax[i]
            c_ax.set_title(name)
            try:
                c_ax.fill_between(dts, lower, upper, alpha=0.33, edgecolor='none');
                c_ax.plot(dts, means, 'k-o', markerfacecolor='none', markersize=10, lw=2);
            except ValueError:
                continue

        fig.tight_layout()

        FigureCanvasAgg(fig)
        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        image_data = buf.getvalue()
        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(image_data))
        self.write(image_data)


class InstrumentUnmatchedDataHandler(tornado.web.RequestHandler):
    """ Gives series for unmatched reads per instrument, over time.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.yields(), default=dthandler))

    def yields(self):
        view = self.application.flowcells_db.view("instrument/unmatched")

        yields = defaultdict(lambda :defaultdict(list))
        for row in view:
            date = row.key[0]
            instrument = row.key[1].upper()
            yields[instrument][date] += row.value

        return yields


class InstrumentYieldDataHandler(tornado.web.RequestHandler):
    """ Gives series for yields per instrument, over time.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.yields(), default=dthandler))

    def yields(self):
        view = self.application.flowcells_db.view("instrument/yield")

        yields = defaultdict(lambda :defaultdict(list))
        for row in view:
            date = row.key[0]
            instrument = row.key[1].upper()
            yields[instrument][date] += row.value

        return yields


class InstrumentYieldPlotHandler(InstrumentYieldDataHandler):
    """ Gives series for lane yields over instruments, by time.
    """
    def get(self):
        data = self.yields()
        data = filter(lambda n: n[0] != "NA", data.iteritems())

        fig, ax = plt.subplots(len(data), 1, sharex=True, sharey=True, \
                               figsize=(8, 16))

        for i, (name, instrument) in enumerate(data):
            dts = []
            means = []
            upper = []
            lower = []

            instrument = filter(lambda n: None not in n[1], instrument.items())

            for date, errors in sorted(instrument):
                dts.append(parser.parse(date))
                means.append(np.median(errors))
                upper.append(np.percentile(errors, 25))
                lower.append(np.percentile(errors, 75))

            c_ax = ax[i]
            c_ax.set_title(name)

            if len(dts) < 2:
                c_ax.plot([datetime(2012, 8, 29, 0, 0), datetime(2012, 8, 30, 0, 0)], [0, 0])
            else:
                c_ax.fill_between(dts, lower, upper, alpha=0.33, edgecolor='none');
                c_ax.plot(dts, means, 'k-o', markerfacecolor='none', markersize=10, lw=2);

        fig.tight_layout()

        FigureCanvasAgg(fig)
        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        image_data = buf.getvalue()
        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(image_data))
        self.write(image_data)


class SequencingStatsHandler(tornado.web.RequestHandler):
    """ Handler for serving up the sequencing stats page.
    """
    def get(self):
        t = self.application.loader.load("sequencing_stats.html")
        self.write(t.generate())