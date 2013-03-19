""" Handlers related to data production.
"""
from collections import OrderedDict
import cStringIO
from datetime import datetime
import json
import random

from dateutil import parser
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg

import tornado.web

from status.util import dthandler


class DeliveredMonthlyDataHandler(tornado.web.RequestHandler):
    """ Gives the data for monthly delivered amount of basepairs.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.delivered(), default=dthandler))

    def delivered(self):
        view = self.application.projects_db.view("date/m_bp_delivered", \
                                                 group_level=3)

        delivered = OrderedDict()
        for row in view:
            y = row.key[0]
            m = row.key[2]
            delivered[dthandler(datetime(y, m, 1))] = int(row.value * 1e6)

        return delivered


class DeliveredMonthlyPlotHandler(DeliveredMonthlyDataHandler):
    """ Gives a bar plot for monthly delivered amount of basepairs.
    """
    def get(self):
        delivered = self.delivered()

        fig = plt.figure(figsize=[10, 8])
        ax = fig.add_subplot(111)

        dates = [parser.parse(d) for d in delivered.keys()]
        values = delivered.values()
        months = [d.month for d in dates]

        ax.bar(dates, values)

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
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.delivered(), default=dthandler))

    def delivered(self):
        view = self.application.projects_db.view("date/m_bp_delivered", \
                                                 group_level=2)

        delivered = OrderedDict()
        for row in view:
            y = row.key[0]
            q = row.key[1]
            delivered[dthandler(datetime(y, q*4 - 3, 1))] = int(row.value * 1e6)

        return delivered


class DeliveredQuarterlyPlotHandler(DeliveredQuarterlyDataHandler):
    """ Gives a bar plot for quarterly delivered amount of basepairs.
    """
    def get(self):
        delivered = self.delivered()

        fig = plt.figure(figsize=[10, 8])
        ax = fig.add_subplot(111)

        dates = [parser.parse(d) for d in delivered.keys()]
        values = delivered.values()
        months = [d.month for d in dates]

        ax.bar(dates, values)

        ax.set_xticks(dates)
        ax.set_xticklabels([d.strftime("%Y\nQ%m") for d in dates])

        ax.set_title("Basepairs delivered per quarter")

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png")
        delivered = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(delivered))
        self.write(delivered)


class BPProductionDataHandler(tornado.web.RequestHandler):
    def get(self, start):
        self.set_header("Content-type", "application/json")
        strt = [12, 1, 1, 1]
        self.write(json.dumps(self.cum_date_bpcounts(strt), default=dthandler))

    def cum_date_bpcounts(self, start):
        view = self.application.samples_db.view("barcodes/date_read_counts", \
            group_level=4, startkey=start)
        row0 = view.rows[0]
        current = row0.value * 200
        y = row0.key[0]
        m = row0.key[2]
        d = row0.key[3]
        dt = datetime(y, m, d)
        bp_list = [{"x": int(time.mktime(dt.timetuple()) * 1000), \
                    "y": current}]
        for row in view.rows[1:]:
            current += row.value * 200
            y = row.key[0]
            m = row.key[2]
            d = row.key[3]
            dt = datetime(y, m, d)
            bp_list.append({"x": int(time.mktime(dt.timetuple()) * 1000), \
                            "y": current})

        d = {"data": bp_list, "name": "series"}
        return [d]


class ProducedMonthlyDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.bpcounts(), default=dthandler))

    def bpcounts(self):
        view = self.application.samples_db.view("barcodes/date_read_counts", \
            group_level=3)

        produced = OrderedDict()
        for row in view[[12, 1, 1, 1]:]:
            y = int("20" + str(row.key[0]))
            m = row.key[2]
            produced[dthandler(datetime(y, m, 1))] = row.value

        return produced


class ProducedMonthlyPlotHandler(ProducedMonthlyDataHandler):
    def get(self):
        produced = self.bpcounts()

        fig = plt.figure(figsize=[10, 8])
        ax = fig.add_subplot(111)

        dates = [parser.parse(d) for d in produced.keys()]
        values = produced.values()
        months = [d.month for d in dates]

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


class BPQuarterlyProductionDataHandler(tornado.web.RequestHandler):
    def get(self, start):
        self.set_header("Content-type", "application/json")
        strt = [12, 1, 1, 1]
        self.write(json.dumps(self.bpcounts(strt), default=dthandler))

    def bpcounts(self, start):
        view = self.application.samples_db.view("barcodes/date_read_counts", \
            group_level=2)

        bp_list = []
        for row in view[start:]:
            y = row.key[0]
            q = row.key[1]
            bp_list.append({"x": [y, q], "y": row.value})

        d = {"data": bp_list, "name": "production"}
        return [d]
