""" Handlers related to data production.
"""
from collections import OrderedDict
import cStringIO
from datetime import datetime
import json

from dateutil import parser
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg

import tornado.web

from status.util import dthandler


class ProductionHandler(tornado.web.RequestHandler):
    """ Serves a page with statistics and plots about the amount of
    sequencing / data produced over time.
    """
    def get(self):
        t = self.application.loader.load("production.html")
        self.write(t.generate())


class DeliveredMonthlyDataHandler(tornado.web.RequestHandler):
    """ Gives the data for monthly delivered amount of basepairs.
    """
    def get(self):
        start_date = self.get_argument('start', '2012-01-01T00:00:00')
        end_date = self.get_argument('end', None)

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.delivered(start_date, end_date), default=dthandler))

    def delivered(self, start_date=None, end_date=None):
        if start_date:
            start_date = parser.parse(start_date)

        if end_date:
            end_date = parser.parse(end_date)
        else:
            end_date = datetime.now()

        view = self.application.projects_db.view("date/m_bp_delivered",
                                                 group_level=3)

        delivered = OrderedDict()

        start = [start_date.year,
                 (start_date.month - 1) // 3 + 1,
                 start_date.month,
                 start_date.day]

        end = [end_date.year,
               (end_date.month - 1) // 3 + 1,
               end_date.month,
               end_date.day]

        for row in view[start:end]:
            y = row.key[0]
            m = row.key[2]
            delivered[dthandler(datetime(y, m, 1))] = int(row.value * 1e6)

        return delivered


class DeliveredMonthlyPlotHandler(DeliveredMonthlyDataHandler):
    """ Gives a bar plot for monthly delivered amount of basepairs.
    """
    def get(self):
        start_date = self.get_argument('start', '2012-01-01T00:00:00')
        end_date = self.get_argument('end', None)

        delivered = self.delivered(start_date, end_date)

        fig = plt.figure(figsize=[10, 8])
        ax = fig.add_subplot(111)

        dates = [parser.parse(d) for d in delivered.keys()]
        values = delivered.values()

        ax.bar(dates, values, width=10)

        ax.set_xticks(dates)
        ax.set_xticklabels([d.strftime("%Y\n%B") for d in dates])

        ax.set_title("Basepairs delivered per month")

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        delivered = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(delivered))
        self.write(delivered)


class DeliveredQuarterlyDataHandler(tornado.web.RequestHandler):
    """ Gives the data for quarterly delivered amount of basepairs.
    """
    def get(self):
        start_date = self.get_argument('start', '2012-01-01T00:00:00')
        end_date = self.get_argument('end', None)

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.delivered(start_date, end_date), default=dthandler))

    def delivered(self, start_date=None, end_date=None):
        if start_date:
            start_date = parser.parse(start_date)

        if end_date:
            end_date = parser.parse(end_date)
        else:
            end_date = datetime.now()

        view = self.application.projects_db.view("date/m_bp_delivered",
                                                 group_level=2)

        delivered = OrderedDict()

        start = [start_date.year,
                 (start_date.month - 1) // 3 + 1,
                 start_date.month,
                 start_date.day]

        end = [end_date.year,
               (end_date.month - 1) // 3 + 1,
               end_date.month,
               end_date.day]

        for row in view[start:end]:
            y = row.key[0]
            q = row.key[1]
            delivered[dthandler(datetime(y, (q - 1) * 3 + 1, 1))] = int(row.value * 1e6)

        return delivered


class DeliveredQuarterlyPlotHandler(DeliveredQuarterlyDataHandler):
    """ Gives a bar plot for quarterly delivered amount of basepairs.
    """
    def get(self):
        start_date = self.get_argument('start', '2012-01-01T00:00:00')
        end_date = self.get_argument('end', None)

        delivered = self.delivered(start_date, end_date)

        fig = plt.figure(figsize=[10, 8])
        ax = fig.add_subplot(111)

        dates = [parser.parse(d) for d in delivered.keys()]
        values = delivered.values()

        ax.bar(dates, values)

        ax.set_xticks(dates)
        labels = []
        for d in dates:
            labels.append("{}\nQ{}".format(d.year, (d.month - 1) // 3 + 1))

        ax.set_xticklabels(labels)

        ax.set_title("Basepairs delivered per quarter")

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        delivered = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(delivered))
        self.write(delivered)


class ProducedMonthlyDataHandler(tornado.web.RequestHandler):
    """ Serves the amount of data produced per month.
    """
    def get(self):
        start_date = self.get_argument('start', '2012-01-01T00:00:00')
        end_date = self.get_argument('end', None)

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.bpcounts(start_date, end_date), default=dthandler))

    def bpcounts(self, start_date=None, end_date=None):
        if start_date:
            start_date = parser.parse(start_date)

        if end_date:
            end_date = parser.parse(end_date)
        else:
            end_date = datetime.now()

        view = self.application.samples_db.view("barcodes/date_read_counts",
                                                group_level=3)

        produced = OrderedDict()

        start = [start_date.year - 2000,
                 (start_date.month - 1) // 3 + 1,
                 start_date.month,
                 start_date.day]

        end = [end_date.year - 2000,
               (end_date.month - 1) // 3 + 1,
               end_date.month,
               end_date.day]

        for row in view[start:end]:
            y = int("20" + str(row.key[0]))
            m = row.key[2]
            produced[dthandler(datetime(y, m, 1))] = row.value

        return produced


class ProducedMonthlyPlotHandler(ProducedMonthlyDataHandler):
    """ Serves a plot of amount of data produced per month.
    """
    def get(self):
        start_date = self.get_argument('start', '2012-01-01T00:00:00')
        end_date = self.get_argument('end', None)

        produced = self.bpcounts(start_date, end_date)

        fig = plt.figure(figsize=[10, 8])
        ax = fig.add_subplot(111)

        dates = [parser.parse(d) for d in produced.keys()]
        values = produced.values()

        ax.bar(dates, values, width=10)

        ax.set_xticks(dates)
        ax.set_xticklabels([d.strftime("%b-%Y") for d in dates], rotation=30)

        ax.set_title("Basepairs produced per month")

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        produced = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(produced))
        self.write(produced)


class ProducedQuarterlyDataHandler(tornado.web.RequestHandler):
    """ Gives the data for quarterly produced amount of basepairs.
    """
    def get(self):
        start_date = self.get_argument('start', '2012-01-01T00:00:00')
        end_date = self.get_argument('end', None)

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.produced(start_date, end_date), default=dthandler))

    def produced(self, start_date=None, end_date=None):
        if start_date:
            start_date = parser.parse(start_date)

        if end_date:
            end_date = parser.parse(end_date)
        else:
            end_date = datetime.now()

        view = self.application.samples_db.view("barcodes/date_read_counts",
                                                group_level=2)

        produced = OrderedDict()

        start = [start_date.year - 2000,
                 (start_date.month - 1) // 3 + 1,
                 start_date.month,
                 start_date.day]

        end = [end_date.year - 2000,
               (end_date.month - 1) // 3 + 1,
               end_date.month,
               end_date.day]

        for row in view[start:end]:
            y = int("20" + str(row.key[0]))
            q = row.key[1]
            produced[dthandler(datetime(y, (q - 1) * 3 + 1, 1))] = int(row.value)

        return produced


class ProducedQuarterlyPlotHandler(ProducedQuarterlyDataHandler):
    """ Gives a bar plot for quarterly produced amount of basepairs.
    """
    def get(self):
        start_date = self.get_argument('start', '2012-01-01T00:00:00')
        end_date = self.get_argument('end', None)

        produced = self.produced(start_date, end_date)

        fig = plt.figure(figsize=[10, 8])
        ax = fig.add_subplot(111)

        dates = [parser.parse(d) for d in produced.keys()]
        values = produced.values()
        quarters = [(d.month - 1) // 3 + 1 for d in dates]
        years = [d.year for d in dates]

        ax.bar(dates, values, width=10)

        ax.set_xticks(dates)
        ax.set_xticklabels(["{}\nQ{}".format(*t) for t in zip(years, quarters)])

        ax.set_title("Basepairs produced per quarter")

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        produced = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(produced))
        self.write(produced)
