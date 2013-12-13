""" Handlers for sequencing project information.
"""
from collections import OrderedDict
import json
import string

import tornado.web
import dateutil.parser
import datetime

from status.util import dthandler, SafeHandler

# Constant dictionary with Displayname:internalname pairs
BASIC_COLUMNS = OrderedDict([('Project', 'project'),
                             ('Project Name', 'project_name'),
                             ('Application', 'application'),
                             ('Passed Samples', 'passed_samples'),
                             ('Number of Samples','no_samples'),
                             ('Type','type'),
                             ('Queue Date', 'queued'), 
                             ('Days in Production', 'days_in_production'),
                             ('Open Date', 'open_date')])

BIOINFO_COLUMNS = OrderedDict([('Source','source'),
                               ('Uppnex ID', 'uppnex_id'),
                               ('Reference Genome', 'reference_genome'),
                               ('Best Practice Bioinformatics', 'best_practice_bioinformatics'),
                               ('Bioinformatic QC', 'bioinformatic_qc'),
                               ('All Raw Data Delivered', 'all_raw_data_delivered'),
                               ('Best Practice Analysis Completed', 'best_practice_analysis_completed'),
                               ('Custom Capture Design', 'custom_capture_design_id'),
                               ('Uppmax Project Owner', 'uppmax_project_owner'),
                               ])
                           
SEQUENCING_COLUMNS = OrderedDict([('Sequencing Setup', 'sequencing_setup'),
                                  ('Sequencing Platform', 'sequencing_platform'),
                                  ('Sequencing Start', 'sequencing_start_date')
])

DETAILS_COLUMNS = OrderedDict([('Project Comment', 'project_comment'),
                               ('Customer Project Description', 'customer_project_description'),
                               ('Portal ID', 'portal_id'),
                               ('Ordered million reads per sample', 'ordered_reads'),
                               ('Customer Reference', 'customer_reference'),
                               ('Disposal of Samples', 'disposal_of_any_remaining_samples'),
                               ('All Samples Sequenced', 'all_samples_sequenced'),
                               ('Lanes', 'sequence_units_ordered_(lanes)'),
                               ('Aborted', 'aborted'),
                               ('Close Date', 'close_date'),
                               ('Final Number of Samples', 'final_number_of_samples'),
                               ('Customer Project Reference', 'customer_project_reference'),
                               ('Sample Type', 'sample_type'),
                               ('Customer Project Description', 'customer_project_description'),
                               ('Invoice Reference', 'invoice_reference'),
                               ('Organism', 'organism')
                               ])

LIBRARY_PREP_COLUMNS = OrderedDict([('Library Prep Start', 'library_prep_start'),
                                    ('QC Library Finished','qc_library_finished'),
                                    ('Library Construction Method', 'library_construction_method')
                                    ])

SETUP_PROJECT_COLUMNS = OrderedDict([('Sample Information Received', 'sample_information_received'),
                                     ('Order Received', 'order_received'),
                                     ('Contract Received', 'contract_received'),
                                     ('Contract Sent', 'contract_sent'),
                                     ('Samples Received', 'samples_received'),
                                     ('Plates Sent', 'plates_sent')
                                     ])

EXTRA_COLUMNS = OrderedDict([('Project Summary Comment', 'comment'),
                             ('First Initial QC Start Date', 'first_initial_qc_start_date')
                             ])


COLUMNS = dict([('BASIC_COLUMNS', BASIC_COLUMNS),
                ('BIOINFO_COLUMNS', BIOINFO_COLUMNS),
                ('SEQUENCING_COLUMNS', SEQUENCING_COLUMNS),
                ('DETAILS_COLUMNS', DETAILS_COLUMNS),
                ('LIBRARY_PREP_COLUMNS', LIBRARY_PREP_COLUMNS),
                ('SETUP_PROJECT_COLUMNS', SETUP_PROJECT_COLUMNS),
                ('EXTRA_COLUMNS', EXTRA_COLUMNS)])


class ProjectsBaseDataHandler(SafeHandler):
    def keys_to_names(self, columns):
        d = {}
        for column_category, column_tuples in columns.iteritems():
            for key, value in column_tuples.iteritems():
                d[value] = key
        return d

    def project_summary_data(self, row):
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

        if row.key[0] == 'open' and 'queued' in row.value:
            #Add days in production field
            now = datetime.datetime.now()
            queued = row.value['queued']
            diff = now - dateutil.parser.parse(queued)
            row.value['days_in_production'] = diff.days
        return row
        
    def list_projects(self, all_projects=True):
        projects = OrderedDict()

        summary_view = self.application.projects_db.view("project/summary", descending=True)
        if not all_projects:
            summary_view = summary_view[["open",'Z']:["open",'']]

        for row in summary_view:
            row = self.project_summary_data(row)
            projects[row.key[1]] = row.value
                
        # Include dates for each project:
        for row in self.application.projects_db.view("project/summary_dates", descending=True, group_level=1):
            if row.key[0] in projects:
                for date_type, date in row.value.iteritems():
                    projects[row.key[0]][date_type] = date

        return projects

    def list_project_fields(self, undefined=False, project_list=None, all_projects=True):
        # If undefined=True is given, only return fields not in columns defined 
        # in constants in this module
        if project_list is None:
            project_list = self.list_projects(all_projects=all_projects)
        field_items = set()
        for project_id, value in project_list.iteritems():
            for key, _ in value.iteritems():
                field_items.add(key)
        if undefined:
            for column_category, column_dict in COLUMNS.iteritems():
                field_items = field_items.difference(set(column_dict.values()))
        return field_items

def prettify_css_names(s):
    return s.replace("(","_").replace(")", "_")

class ProjectsDataHandler(ProjectsBaseDataHandler):
    """ Serves brief information for each open project in the database.

    Loaded through /api/v1/projects
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        all_projects = self.get_argument("all_projects", "True")
        all_projects = (str(all_projects).lower() == "true")

        self.write(json.dumps(self.list_projects(all_projects)))


class ProjectsFieldsDataHandler(ProjectsBaseDataHandler):
    """ Serves all fields occuring in the values of the ProjectsDataHandler 
    json object.

    Loaded through /api/v1/projects_fields
    """
    def get(self):
        undefined = self.get_argument("undefined", "False")
        undefined = (string.lower(undefined) == "true")
        all_projects = self.get_argument("all_projects", "True")
        all_projects = (str(all_projects).lower() == "true")
        field_items = self.list_project_fields(undefined=undefined, all_projects=all_projects)
        self.write(json.dumps(list(field_items)))

class ProjectDataHandler(ProjectsBaseDataHandler):
    """ Serves brief information of a given project.

    Loaded through /api/v1/project_summary/([^/]*)$
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.project_info(project)))

    def project_info(self, project):
        view = self.application.projects_db.view("project/summary")["open", project]
        if len(view.rows) == 0:
            view = self.application.projects_db.view("project/summary")["closed", project]
        if len(view.rows) != 1:
            return {}
        row = view.rows[0]
        row = self.project_summary_data(row)

        return row.value


class ProjectSamplesDataHandler(SafeHandler):
    """ Serves brief info about all samples in a given project.

    Loaded through /api/v1/projects/([^/]*)$
    """
    def sample_data(self, sample_data):
        sample_data["sample_run_metrics"] = []
        sample_data["prep_status"] = []
        sample_data["prep_finished_date"] = []
        if "library_prep" in sample_data:
            for lib_prep, content in sample_data["library_prep"].iteritems():
                if "sample_run_metrics" in content:
                    for run, id in content["sample_run_metrics"].iteritems():
                        sample_data["sample_run_metrics"].append(run)
                if "prep_status" in content:
                    if content["prep_status"] == "PASSED":
                        sample_data["prep_status"].append("P")
                    else:
                        sample_data["prep_status"].append("F")
                if "prep_finished_date" in content:
                    sample_data["prep_finished_date"].append(content["prep_finished_date"])
        
        if "details" in sample_data:
            for detail_key, detail_value in sample_data["details"].iteritems():
                sample_data[detail_key] = detail_value
        return sample_data

    def list_samples(self, project):
        samples = OrderedDict()
        sample_view = self.application.projects_db.view("project/samples")
        result = sample_view[project]
        samples = result.rows[0].value
        output = OrderedDict()
        for sample, sample_data in sorted(samples.iteritems(), key=lambda x: x[0]):
            sample_data = self.sample_data(sample_data)
            output[sample] = sample_data
        return output
        
    def get(self, project):
        self.set_header("Content-type", "application/json")
        # self.write(json.dumps(self.sample_list(project), default=dthandler))
        self.write(json.dumps(self.list_samples(project), default=dthandler))

    def sample_list(self, project):
        sample_view = self.application.projects_db.view("project/samples")
        result = sample_view[project]

        samples = result.rows[0].value
        samples = OrderedDict(sorted(samples.iteritems(), key=lambda x: x[0]))
        return samples


class ProjectSamplesHandler(SafeHandler):
    """ Serves a page which lists the samples of a given project, with some
    brief information for each sample.
    """
    def get(self, project):
        t = self.application.loader.load("project_samples.html")
        self.write(t.generate(project=project, 
                              user=self.get_current_user_name(), 
                              columns = COLUMNS,
                              prettify = prettify_css_names))


class ProjectsHandler(SafeHandler):
    """ Serves a page with all projects listed, along with some brief info.
    """
    def get(self):
        t = self.application.loader.load("projects.html")
        self.write(t.generate(columns = COLUMNS, all_projects=True, user=self.get_current_user_name()))


class OpenProjectsHandler(SafeHandler):
    """ Serves a page with all OPEN projects listed, along with some brief info.
    """
    def get(self):
        t = self.application.loader.load("projects.html")
        self.write(t.generate(columns = COLUMNS, all_projects=False, user=self.get_current_user_name()))
        


class UppmaxProjectsDataHandler(SafeHandler):
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
