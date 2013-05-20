""" Handlers for sequencing project information.
"""
from collections import OrderedDict
import json

import tornado.web

from status.util import dthandler


class ProjectsDataHandler(tornado.web.RequestHandler):
    """ Serves brief information for each project in the database.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_projects()))

    def list_projects(self):
        projects = OrderedDict()
        for row in self.application.projects_db.view("project/summary"):
            projects[row.key] = row.value

        return projects


class ProjectDataHandler(tornado.web.RequestHandler):
    """ Serves brief information of a given project.
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.project_info(project)))

    def project_info(self, project):
        result = self.application.projects_db.view("project/summary")[project]

        return result.rows[0].value


class ProjectSamplesDataHandler(tornado.web.RequestHandler):
    """ Serves brief info about all samples in a given project.
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_list(project), default=dthandler))

    def sample_list(self, project):
        sample_view = self.application.projects_db.view("project/samples")
        result = sample_view[project]

        return result.rows[0].value


class ProjectSamplesHandler(tornado.web.RequestHandler):
    """ Serves a page which lists the samples of a given project, with some
    brief information for each sample.
    """
    def get(self, project):
        t = self.application.loader.load("project_samples.html")
        self.write(t.generate(project=project))


class ProjectsHandler(tornado.web.RequestHandler):
    """ Serves a page with all projects listed, along with some brief info.
    """
    def get(self):
        t = self.application.loader.load("projects.html")
        self.write(t.generate())
