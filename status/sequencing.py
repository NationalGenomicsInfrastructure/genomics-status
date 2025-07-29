"""Handlers related to data sequencing statistics."""

# TODO Delete this file in future, as it does not seem to be used anymore.
import json
from collections import defaultdict
from datetime import datetime
from io import BytesIO

import matplotlib.pyplot as plt
import numpy as np
from dateutil import parser
from matplotlib.backends.backend_agg import FigureCanvasAgg

from status.util import SafeHandler, dthandler


def make_instrument_series_handler(couchdb_view_name):
    """Create a handler for a flowcell-instrument series of data for the
    given couchdb view.

    Loaded through:
    /api/v1/instrument_* urls
    """

    class InstrumentSeriesDataHandler(SafeHandler):
        def get(self):
            self.set_header("Content-type", "application/json")
            self.write(json.dumps(self.data(), default=dthandler))

        def data(self):
            view = self.application.flowcells_db.view(couchdb_view_name)

            data = defaultdict(lambda: defaultdict(list))
            for row in view:
                date = row.key[0]
                if not date:  # Handles null values
                    continue
                instrument = row.key[1].upper()
                data[instrument][date] += row.value

            return data

    return InstrumentSeriesDataHandler


InstrumentClusterDensityDataHandler = make_instrument_series_handler(
    "instrument/clusters_raw"
)


class InstrumentClusterDensityPlotHandler(InstrumentClusterDensityDataHandler):
    """Gives a plot for series of cluster densities for instruments, over time.
    Loaded through /api/v1/instrument_cluster_density.png url
    """

    def get(self):
        data = self.data()
        data = [n for n in list(data.items()) if n[0] != "NA"]

        fig, ax = plt.subplots(len(data), 1, sharex=True, sharey=True, figsize=(8, 16))

        for i, (name, instrument) in enumerate(data):
            dts = []
            means = []
            upper = []
            lower = []

            instrument = [n for n in list(instrument.items()) if None not in n[1]]

            for date, errors in sorted(instrument):
                try:
                    dts.append(parser.parse(date))
                    means.append(np.median(errors))
                    upper.append(np.percentile(errors, 25))
                    lower.append(np.percentile(errors, 75))

                except IndexError:  # Empty list
                    continue

            c_ax = ax[i]
            c_ax.set_title(name)
            try:
                c_ax.fill_between(dts, lower, upper, alpha=0.33, edgecolor="none")
                c_ax.plot(
                    dts, means, "k-o", markerfacecolor="none", markersize=10, lw=2
                )

            except ValueError:
                continue

        fig.tight_layout()

        FigureCanvasAgg(fig)
        buf = BytesIO()
        fig.savefig(buf, format="png")
        image_data = buf.getvalue()
        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(image_data))
        self.write(image_data)


InstrumentErrorrateDataHandler = make_instrument_series_handler(
    "instrument/error_rates"
)


class InstrumentErrorratePlotHandler(InstrumentErrorrateDataHandler):
    """Gives series for phiX error rates for instruments, over time.

    Loaded through /api/v1/instrument_error_rates.png url
    """

    def get(self):
        data = self.data()
        data = [n for n in list(data.items()) if n[0] != "NA"]

        fig, ax = plt.subplots(len(data), 1, sharex=True, sharey=True, figsize=(8, 16))

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
                c_ax.fill_between(dts, lower, upper, alpha=0.33, edgecolor="none")
                c_ax.plot(
                    dts, means, "k-o", markerfacecolor="none", markersize=10, lw=2
                )

            except ValueError:
                continue

        fig.tight_layout()

        FigureCanvasAgg(fig)
        buf = BytesIO()
        fig.savefig(buf, format="png")
        image_data = buf.getvalue()
        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(image_data))
        self.write(image_data)


InstrumentUnmatchedDataHandler = make_instrument_series_handler("instrument/unmatched")


class InstrumentUnmatchedPlotHandler(InstrumentUnmatchedDataHandler):
    """Gives series for unmatched reads for flowcell per instrument, over time.

    Loaded through /api/v1/instrument_unmatched.png
    """

    def get(self):
        data = self.data()
        data = [n for n in list(data.items()) if n[0] != "NA"]

        fig, ax = plt.subplots(len(data), 1, sharex=True, sharey=True, figsize=(8, 16))

        for i, (name, instrument) in enumerate(data):
            dts = []
            means = []
            upper = []
            lower = []

            instrument = [n for n in list(instrument.items()) if None not in n[1]]

            for date, unmatched in sorted(instrument):
                if len(unmatched) > 0:
                    dts.append(parser.parse(date))
                    means.append(np.median(unmatched))
                    upper.append(np.percentile(unmatched, 25))
                    lower.append(np.percentile(unmatched, 75))

            c_ax = ax[i]
            c_ax.set_title(name)
            if len(dts) < 2:
                two_dates = [datetime(2012, 8, 29, 0, 0), datetime(2012, 8, 30, 0, 0)]
                c_ax.plot(two_dates, [0, 0])

            else:
                c_ax.fill_between(dts, lower, upper, alpha=0.33, edgecolor="none")
                c_ax.plot(
                    dts, means, "k-o", markerfacecolor="none", markersize=10, lw=2
                )

        fig.tight_layout()

        FigureCanvasAgg(fig)
        buf = BytesIO()
        fig.savefig(buf, format="png")
        image_data = buf.getvalue()
        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(image_data))
        self.write(image_data)


InstrumentYieldDataHandler = make_instrument_series_handler("instrument/yield")


class InstrumentYieldPlotHandler(InstrumentYieldDataHandler):
    """Gives series for lane yields over instruments, by time.

    Loaded through /api/v1/instrument_yield.png
    """

    def get(self):
        data = self.data()
        data = [n for n in list(data.items()) if n[0] != "NA"]

        fig, ax = plt.subplots(len(data), 1, sharex=True, sharey=True, figsize=(8, 16))

        for i, (name, instrument) in enumerate(data):
            dts = []
            means = []
            upper = []
            lower = []

            instrument = [n for n in list(instrument.items()) if None not in n[1]]

            for date, errors in sorted(instrument):
                dts.append(parser.parse(date))
                means.append(np.median(errors))
                upper.append(np.percentile(errors, 25))
                lower.append(np.percentile(errors, 75))

            c_ax = ax[i]
            c_ax.set_title(name)

            if len(dts) < 2:
                two_dates = [datetime(2012, 8, 29, 0, 0), datetime(2012, 8, 30, 0, 0)]
                c_ax.plot(two_dates, [0, 0])
            else:
                c_ax.fill_between(dts, lower, upper, alpha=0.33, edgecolor="none")
                c_ax.plot(
                    dts, means, "k-o", markerfacecolor="none", markersize=10, lw=2
                )

        fig.tight_layout()

        FigureCanvasAgg(fig)
        buf = BytesIO()
        fig.savefig(buf, format="png")
        image_data = buf.getvalue()
        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(image_data))
        self.write(image_data)
