""" Handlers for sequencing project information.
"""
from collections import OrderedDict
import json
import string

import tornado.web

from status.util import dthandler

# Constant dictionary with Displayname:internalname pairs
DEFAULT_COLUMNS = OrderedDict([('Project', 'project'),
                               ('Project Name', 'project_name'),
                               ('Application', 'application'),
                               ('Sequencing progress', 'passed_samples'),
                               ('Number of Samples','no_samples'),
                               ('Type','type')])

EXTRA_COLUMNS = OrderedDict([('Queue Date', 'queued'),
                             ('Ordered million reads per sample', 'ordered_reads'),
                             ('Source','source'),
                             ('Reference Genome', 'reference_genome'),
                             ('Sequencing Setup', 'sequencing_setup'),
                             ('Customer Reference', 'customer_reference'),
                             ('Sequencing Platform', 'sequencing_platform'),
                             ('Uppnex ID', 'uppnex_id'),
                             ('Open Date', 'open_date'),
                             ('Disposal of Samples', 'disposal_of_any_remaining_samples'),
                             ('All Samples Sequenced', 'all_samples_sequenced'),
                             ('Portal ID (somewhere else)', 'Portal_id'),
                             ('Portal ID (Details)', 'portal_id'),
                             ('Lanes', 'sequence_units_ordered_(lanes)'),
                             ('Best Practice Bioinformatics', 'best_practice_bioinformatics'),
                             ('Bioinformatic QC', 'bioinformatic_qc'),
                             ('Comment', 'comment'),
                             ('Aborted', 'aborted')])

COLUMNS = dict([('DEFAULT_COLUMNS', DEFAULT_COLUMNS),('EXTRA_COLUMNS', EXTRA_COLUMNS)])

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
            # the details key gives values containing multiple udfs on project level
            # and project_summary key gives 'temporary' udfs that will move to 'details'.
            # Include these as normal key:value pairs
            if 'project_summary' in row.value:
                for summary_key, summary_value in row.value['project_summary'].iteritems():
                    row.value[summary_key] = summary_value
                row.value.pop("project_summary", None)
            # If key is in both project_summary and details, details has precedence
            if 'details' in row.value:
                for detail_key, detail_value in row.value['details'].iteritems():
                    row.value[detail_key] = detail_value
                row.value.pop("details", None)
            projects[row.key] = row.value

        return projects

    def list_project_fields(self, undefined=False, project_list=None):
        # If undefined=True is given, only return fields not in columns defined 
        # in constants in this module
        if project_list is None:
            project_list = self.list_projects()
        field_items = set()
        for project_id, value in project_list.iteritems():
            for key, _ in value.iteritems():
                field_items.add(key)
        if undefined:
            field_items = field_items.difference(set(DEFAULT_COLUMNS.values()))
            field_items = field_items.difference(set(EXTRA_COLUMNS.values()))
        return field_items

class ProjectsFieldsDataHandler(ProjectsDataHandler):
    """ Serves all fields occuring in the values of the ProjectsDataHandler 
    json object.

    Loaded through /api/v1/projects_fields
    """
    def get(self):
        undefined = self.get_argument("undefined", "False")
        undefined = (string.lower(undefined) == "true")
        field_items = self.list_project_fields(undefined)
        self.write(json.dumps(list(field_items)))

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
        self.write(t.generate(columns = COLUMNS))
        

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
