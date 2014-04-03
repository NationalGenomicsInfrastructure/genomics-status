"""Handlers related to applications
"""
import tornado.web
import json
import cStringIO
from datetime import datetime
from dateutil import parser
from collections import Counter
from status.util import SafeHandler

class ApplicationsHandler(SafeHandler):
    """ Serves a page with stats about the different applications that have
    been performed for projects/samples.
    """
    def get(self):
        t = self.application.loader.load("applications.html")
        self.write(t.generate(user=self.get_current_user_name()))


class ApplicationHandler(SafeHandler):
    """ Serves a page that list all the projects which has the application
    provided as a parameter.
    """
    def get(self, application):
        t = self.application.loader.load("application.html")
        self.write(t.generate(application=application,
                              user=self.get_current_user_name()))


class ApplicationDataHandler(SafeHandler):
    """ Serves a list of projects which have the application provided as
    an argument.

    Loaded through /api/v1/application/([^/]*)$ url
    """
    def get(self, application):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_projects(application)))

    def list_projects(self, application):
        if application == 'null':
            application=None
        projects = []
        project_view = self.application.projects_db.view("project/applications", reduce=False)
        for row in project_view[application]:
            projects.append(row.value)

        return projects


class ApplicationsDataHandler(SafeHandler):
    """ Serves the applications performed with the number of projects which
    have that application.

    Loaded through /api/v1/applications url
    """
    def get(self):
        start = self.get_argument("start", None)
        end = self.get_argument("end", "z")

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_applications(start=start,end=end)))

    def list_applications(self,start=None,end="z"):
        applications = Counter()
        view = self.application.projects_db.view("project/date_applications")
        for row in view[[start,""]:[end,"z"]]:                
            if row.key[1] is None:
                # This corresponds to StatusDB:s notation
                # and avoids conflict with 'None'.
                applications['null'] += 1
            else:
                applications[row.key[1]] += 1
        return applications


class SamplesApplicationsDataHandler(SafeHandler):
    """ Handler for getting per sample application information.

    Loaded through /api/v1/samples_applications
    """
    def get(self):
        start = self.get_argument("start", None)
        end = self.get_argument("end", "z")

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_applications(start=start,end=end)))

    def list_applications(self,start=None,end="z"):
        applications = Counter()
        view = self.application.projects_db.view("project/date_samples_applications")
        for row in view[[start,""]:[end,"z"]]:
            if row.key[1] is None:
                applications['null'] += row.value
            else:
                applications[row.key[1]] += row.value
        return applications
