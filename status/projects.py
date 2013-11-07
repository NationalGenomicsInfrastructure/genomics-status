""" Handlers for sequencing project information.
"""
from collections import OrderedDict
import json

import tornado.web

from status.util import dthandler

# Constant dictionary with Displayname:internalname pairs
DEFAULT_COLUMNS = OrderedDict([('Project', 'project'),
                               ('Project Name', 'project_name'),
                               ('Application', 'application'),
                               ('Sequencing progress', 'passed_samples'),
                               ('Number of Samples','no_samples'),
                               ('Type','type')])


OTHER_COLUMNS = OrderedDict([('Queue Date', 'queued'),
                             ('Ordered million reads per sample', 'ordered_reads'),
                             ('Source','source'),
                             ('Reference Genome', 'reference_genome'),
                             ('Sequencing Setup', 'sequencing_setup'),
                             ('Customer Reference', 'customer_reference'),
                             ('Sequencing Platform', 'sequencing_platform'),
                             ('Uppnex ID', 'uppnex_id'),
                             ('Portal ID', 'Portal_id')])


class ProjectsDataHandler(tornado.web.RequestHandler):
    """ Serves brief information for each project in the database.

    Loaded through /api/v1/projects
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_projects()))

    def list_projects(self):
        projects = OrderedDict()
        for row in self.application.projects_db.view("project/summary", descending=True):
            projects[row.key] = row.value

        return projects


class ProjectDataHandler(tornado.web.RequestHandler):
    """ Serves brief information of a given project.

    Loaded through /api/v1/project_summary/([^/]*)$
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.project_info(project)))

    def project_info(self, project):
        result = self.application.projects_db.view("project/summary")[project]

        return result.rows[0].value


class ProjectSamplesDataHandler(tornado.web.RequestHandler):
    """ Serves brief info about all samples in a given project.

    Loaded through /api/v1/projects/([^/]*)$
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_list(project), default=dthandler))

    def sample_list(self, project):
        sample_view = self.application.projects_db.view("project/samples")
        result = sample_view[project]

        samples = result.rows[0].value
        samples = OrderedDict(sorted(samples.iteritems(), key=lambda x: x[0]))
        return samples


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
        self.write(t.generate(other_columns = OTHER_COLUMNS, default_columns = DEFAULT_COLUMNS))
        

class UppmaxProjectsDataHandler(tornado.web.RequestHandler):
    """ Serves a list of UPPNEX projects where the storage quota have
    been logged. 

    Loaded through /api/v1/uppmax_projects
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_projects()))

    def list_projects(self):
        project_list = []
        view = self.application.uppmax_db.view("status/projects", group_level=1)
        for row in view:
            project_list.append(row.key)

        return project_list
