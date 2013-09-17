"""Handlers related to applications
"""
import tornado.web
import json
import cStringIO
from datetime import datetime
from dateutil import parser

from collections import OrderedDict, Counter
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg

import matplotlib.pyplot as plt

import matplotlib.gridspec as gridspec
from matplotlib import cm
import numpy as np

class ApplicationsHandler(tornado.web.RequestHandler):
    """ Serves a page with stats about the different applications that have
    been performed for projects/samples.
    """
    def get(self):
        t = self.application.loader.load("applications.html")
        self.write(t.generate())


class ApplicationsDataHandler(tornado.web.RequestHandler):
    """ Serves the applications performed with the number of projects which
    have that application.
    """
    def get(self):
        start = self.get_argument("start", None)
        end = self.get_argument("end", "z")

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_applications(start=start,end=end)))

    def list_applications(self,start=None,end="z"):
        if start == '2012-01-01':
            # To include null values for open_date
            # a.k.a all data points not fetched from the LIMS
            start = None
        applications = Counter()
        view = self.application.projects_db.view("project/date_applications")
        for row in view[[start,""]:[end,"z"]]:
            applications[row.key[1]] += 1
        return applications


class ApplicationsPlotHandler(ApplicationsDataHandler):
    """ Serves a Pie chart of applications over projects.
    """
    def get(self):
        start = self.get_argument("start",None)
        end = self.get_argument("end","z")

        applications = self.list_applications(start=start,end=end)

        fig = plt.figure(figsize=[10, 8])
        ax = fig.add_subplot(111)

        cmap = plt.cm.prism
        colors = cmap(np.linspace(0., 1., len(applications)))

        #Sort the slices by size (so we know where the thin slices will end up)
        applications = sorted(applications.items(), key=lambda x: x[1])

        #Reorder the slices so not all small slices end up together (causing
        #label overlapping)
        reordered = []
        n_app = len(applications)
        for i in range(n_app/2):
            reordered.append(applications[i])
            reordered.append(applications[n_app - 1 - i])

        applications_labels = [a[0] for a in reordered]
        applications_values = [a[1] for a in reordered]

        #All small labels will be concentrated in the bottom right quarter, in
        #order to put these labels horitzontally (and thus avoid overlapping),
        #we can start the pie rotated 45.0 degrees
        pie_wedge_collection = ax.pie(applications_values,
                                      colors=colors,
                                      labels=applications_labels,
                                      labeldistance=1.05,
                                      startangle=45.0)

        #Set some style parameters
        for pie_wedge, pie_texts in zip(pie_wedge_collection[0], pie_wedge_collection[1]):
            pie_wedge.set_edgecolor('white')
            pie_wedge.set_linewidth(1)
            pie_texts.set_fontsize(8)

        fig.subplots_adjust(left=0.15, right=0.75, bottom=0.15)

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png", bbox_inches='tight', pad_inches=0)
        applications = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(applications))
        self.write(applications)


class SamplesApplicationsDataHandler(tornado.web.RequestHandler):
    """ Handler for getting per sample application information.
    """
    def get(self):
        start = self.get_argument("start", None)
        end = self.get_argument("end", "z")

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_applications(start=start,end=end)))

    def list_applications(self,start=None,end="z"):
        if start == '2012-01-01':
            # To include null values when slider is furthest to the left
            start = None
        applications = Counter()
        view = self.application.projects_db.view("project/date_samples_applications")
        for row in view[[start,""]:[end,"z"]]:
            applications[row.key[1]] += row.value
        return applications


class SamplesApplicationsPlotHandler(SamplesApplicationsDataHandler):
    """ Serves a Pie chart of applications over projects.
    """
    def get(self):
        start = self.get_argument("start",None)
        end = self.get_argument("end","z")

        applications = self.list_applications(start=start,end=end)

        fig = plt.figure(figsize=[10, 8])
        ax = fig.add_subplot(111)

        cmap = plt.cm.prism
        colors = cmap(np.linspace(0., 1., len(applications)))

        #Sort the slices by size (so we know where the thin slices will end up)
        applications = sorted(applications.items(), key=lambda x: x[1])

        #Reorder the slices so not all small slices end up together (causing
        #label overlapping)
        reordered = []
        n_app = len(applications)
        for i in range(n_app/2):
            reordered.append(applications[i])
            reordered.append(applications[n_app - 1 - i])

        applications_labels = ["{0} ({1})".format(a[0],a[1]) for a in reordered]
        applications_values = [a[1] for a in reordered]

        #All small labels will be concentrated in the bottom right quarter, in
        #order to put these labels horitzontally (and thus avoid overlapping),
        #we can start the pie rotated 45.0 degrees
        pie_wedge_collection = ax.pie(applications_values,
                                      colors=colors,
                                      labels=applications_labels,
                                      labeldistance=1.05,
                                      startangle=0)

        #Set some style parameters
        for pie_wedge, pie_texts in zip(pie_wedge_collection[0], pie_wedge_collection[1]):
            pie_wedge.set_edgecolor('white')
            pie_wedge.set_linewidth(1)
            pie_texts.set_fontsize(6)

        fig.subplots_adjust(left=0.15, right=0.75, bottom=0.15)

        FigureCanvasAgg(fig)

        buf = cStringIO.StringIO()
        fig.savefig(buf, format="png", bbox_inches='tight', pad_inches=0)
        applications = buf.getvalue()

        self.set_header("Content-Type", "image/png")
        self.set_header("Content-Length", len(applications))

        self.write(applications)
