""" Handlers for sequencing project information.
"""
import json
import string

import tornado.web
import dateutil.parser
import datetime
import requests
import re
import paramiko
import base64

from itertools import ifilter
from collections import OrderedDict
from status.util import dthandler, SafeHandler

from genologics import lims
from genologics.entities import Project
from genologics.config import BASEURI, USERNAME, PASSWORD

from zendesk import Zendesk, ZendeskError, get_id_from_url

lims = lims.Lims(BASEURI, USERNAME, PASSWORD)

class PresetsHandler(SafeHandler):
    """Handler to GET and POST/PUT personalized and default set of presets in

    project view.
    """
    def get(self):
        """Get preset choices of columns from StatusDB

        It will return a JSON with two lists of presets, the default ones and the user defined
        presets.
        """
        presets_list = self.get_argument('presets_list', 'pv_presets')
        self.set_header("Content-type", "application/json")
        presets = {
            "default": self.application.genstat_defaults.get(presets_list),
            "user": {}
        }
        #Get user presets
        user_id = ''
        user = self.get_secure_cookie('email')
        for u in self.application.gs_users_db.view('authorized/users'):
            if u.get('key') == user:
                user_id = u.get('value')
                break
        presets['user'] = self.application.gs_users_db.get(user_id).get(presets_list, {})
        self.write(json.dumps(presets))


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

        # Find the latest running note, return it as a separate field
        if 'running_notes' in row.value:
            try:
                notes = json.loads(row.value['running_notes'])
                # note_dates = {datetime obj: time string, ...}
                note_dates = dict(zip(map(dateutil.parser.parse, notes.keys()), notes.keys()))
                latest_date = note_dates[max(note_dates.keys())]
                row.value['latest_running_note'] = json.dumps({latest_date: notes[latest_date]})
            except ValueError:
                pass

        if row.key[0] == 'open' and 'queued' in row.value:
            #Add days in production field
            now = datetime.datetime.now()
            queued = row.value['queued']
            diff = now - dateutil.parser.parse(queued)
            row.value['days_in_production'] = diff.days

        if row.key[0] == 'open' and 'open_date' in row.value:
            end_date = datetime.datetime.now()
            if 'queued' in row.value:
                end_date =  dateutil.parser.parse(row.value['queued'])
            diff = (end_date - dateutil.parser.parse(row.value['open_date'])).days
            if 'queued' not in row.value and diff > 14:
                row.value['days_in_reception_control'] = '<b class="text-error">{}</b>'.format(diff)
            else:
                row.value['days_in_reception_control'] = diff

        return row

    def list_projects(self, filter_projects='all'):
        projects = OrderedDict()

        summary_view = self.application.projects_db.view("project/summary", descending=True)
        if not filter_projects in ['all', 'aborted']:
            summary_view = summary_view[["open",'Z']:["open",'']]

        for row in summary_view:
            row = self.project_summary_data(row)
            projects[row.key[1]] = row.value

        # Include dates for each project:
        for row in self.application.projects_db.view("project/summary_dates", descending=True, group_level=1):
            if row.key[0] in projects:
                for date_type, date in row.value.iteritems():
                    projects[row.key[0]][date_type] = date

        # Filter aborted projects if not All projects requested: Aborted date has
        # priority over everything else.
        if not filter_projects == 'all':
            aborted_projects = OrderedDict()
            for p_id, p_info in projects.iteritems():
                if 'aborted' in p_info:
                    aborted_projects[p_id] = p_info
                    del projects[p_id]

        # Filter requested projects
        filtered_projects = OrderedDict()

        if filter_projects == 'aborted':
            return aborted_projects

        if filter_projects == 'pending':
            for p_id, p_info in projects.iteritems():
                if not 'open_date' in p_info:
                    filtered_projects[p_id] = p_info
            return filtered_projects

        elif filter_projects == 'open':
            for p_id, p_info in projects.iteritems():
                if 'open_date' in p_info:
                    filtered_projects[p_id] = p_info
            return filtered_projects

        elif filter_projects == 'reception_control':
            for p_id, p_info in projects.iteritems():
                if 'open_date' in p_info and not 'queued' in p_info:
                    filtered_projects[p_id] = p_info
            return filtered_projects

        elif filter_projects == 'ongoing':
            for p_id, p_info in projects.iteritems():
                if 'queued' in p_info and not 'close_date' in p_info:
                    filtered_projects[p_id] = p_info
            return filtered_projects

        elif filter_projects == 'closed':
            for p_id, p_info in projects.iteritems():
                if 'close_date' in p_info:
                    filtered_projects[p_id] = p_info
            # Old projects (google docs) will not have close_date field
            summary_view = self.application.projects_db.view("project/summary", descending=True)
            summary_view = summary_view[["closed",'Z']:["closed",'']]
            for row in summary_view:
                row = self.project_summary_data(row)
                filtered_projects[row.key[1]] = row.value

            return filtered_projects

        return projects

    def list_project_fields(self, undefined=False, project_list='all'):
        # If undefined=True is given, only return fields not in columns defined
        # in constants in StatusDB
        columns = self.application.genstat_defaults.get('pv_columns')
        project_list = self.list_projects(filter_projects=project_list)
        field_items = set()
        for project_id, value in project_list.iteritems():
            for key, _ in value.iteritems():
                field_items.add(key)
        if undefined:
            for column_category, column_dict in columns.iteritems():
                field_items = field_items.difference(set(column_dict.values()))
        return field_items


def prettify_css_names(s):
    return s.replace("(","_").replace(")", "_")

class ProjectsDataHandler(ProjectsBaseDataHandler):
    """ Serves brief information for project in the database.

    Loaded through /api/v1/projects
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_projects(self.get_argument('list', 'all'))))


class ProjectsFieldsDataHandler(ProjectsBaseDataHandler):
    """ Serves all fields occuring in the values of the ProjectsDataHandler
    json object.

    Loaded through /api/v1/projects_fields
    """
    def get(self):
        undefined = self.get_argument("undefined", "False")
        undefined = (string.lower(undefined) == "true")
        project_list = self.get_argument("project_list", "all")
        field_items = self.list_project_fields(undefined=undefined, project_list=project_list)
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
        if not view.rows:
            view = self.application.projects_db.view("project/summary")["closed", project]
        if not len(view.rows) == 1:
            return {}

        summary_row = view.rows[0]
        summary_row = self.project_summary_data(summary_row)

        date_view = self.application.projects_db.view("project/summary_dates",
                                                      descending=True,
                                                      group_level=1)
        date_result = date_view[[project + 'ZZZZ']:[project]]
        if date_result.rows:
            for date_row in date_result.rows:
                for date_type, date in date_row.value.iteritems():
                    summary_row.value[date_type] = date

        return summary_row.value


class ProjectSamplesDataHandler(SafeHandler):
    """ Serves brief info about all samples in a given project.

    Loaded through /api/v1/project/([^/]*)$
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
                        sample_data["prep_status"].append(content["prep_status"])
                    else:
                        sample_data["prep_status"].append("FAILED")
                if "prep_finished_date" in content:
                    sample_data["prep_finished_date"].append(content["prep_finished_date"])
                if "library_validation" in content:
                    for agrId, libval in content["library_validation"].iteritems():
                        if "caliper_image" in libval:
                            sample_data['library_prep'][lib_prep]['library_validation'][agrId]['caliper_image']=self.get_caliper_image(sample_data['library_prep'][lib_prep]['library_validation'][agrId]['caliper_image'])

        if "details" in sample_data:
            for detail_key, detail_value in sample_data["details"].iteritems():
                sample_data[detail_key] = detail_value
        if 'initial_qc' in sample_data and "caliper_image" in sample_data['initial_qc']:
            print "trying to grab caliper image"
            #Go grab the image from the sftp server
            sample_data['initial_qc']['caliper_image']=self.get_caliper_image(sample_data['initial_qc']['caliper_image'])
        else:
            print "no caliper image for "
        return sample_data

    def list_samples(self, project):
        samples = OrderedDict()
        sample_view = self.application.projects_db.view("project/samples")
        result = sample_view[project]
        # Not all projects (i.e Pending projects) have samples!
        samples = result.rows[0].value if result.rows[0].value else {}
        output = OrderedDict()
        for sample, sample_data in sorted(samples.iteritems(), key=lambda x: x[0]):
            sample_data = self.sample_data(sample_data)
            output[sample] = sample_data
        return output

    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_samples(project), default=dthandler))

    def sample_list(self, project):
        sample_view = self.application.projects_db.view("project/samples")
        result = sample_view[project]

        samples = result.rows[0].value
        samples = OrderedDict(sorted(samples.iteritems(), key=lambda x: x[0]))
        return samples

    def get_caliper_image(self,url):
        """returns a base64 string of the caliper image aksed"""
        pattern=re.compile("^sftp://([a-z\.]+)(.+)")
        host=pattern.search(url).group(1)
        uri=pattern.search(url).group(2)

        try:
            transport=paramiko.Transport(host)

            transport.connect(username = self.application.genologics_login, password = self.application.genologics_pw)
            sftp_client = transport.open_sftp_client()
            my_file = sftp_client.open(uri, 'r')
            encoded_string = base64.b64encode(my_file.read())
            returnHTML='<img src="data:image/png;base64,{}" />'.format(encoded_string)
            return returnHTML
        except Exception, message:
            return("Error : {0}".format(message))


class ProjectSamplesHandler(SafeHandler):
    """ Serves a page which lists the samples of a given project, with some
    brief information for each sample.
    """
    def get(self, project):
        t = self.application.loader.load("project_samples.html")
        self.write(t.generate(project=project,
                              user=self.get_current_user_name(),
                              columns = self.application.genstat_defaults.get('pv_columns'),
                              columns_sample = self.application.genstat_defaults.get('sample_columns'),
                              prettify = prettify_css_names))


class ProjectsHandler(SafeHandler):
    """ Serves a page with all projects listed, along with some brief info.
    """
    def get(self, projects='all'):
        t = self.application.loader.load("projects.html")
        columns = self.application.genstat_defaults.get('pv_columns')
        self.write(t.generate(columns=columns, projects=projects, user=self.get_current_user_name()))


class RunningNotesDataHandler(SafeHandler):
    """Serves all running notes from a given project.

    It connects to the genologics LIMS to fetch and update Running Notes information.
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        p = Project(lims, id=project)
        p.get(force=True)
        # Sorted running notes, by date
        running_notes = json.loads(p.udf['Running Notes']) if 'Running Notes' in p.udf else {}
        sorted_running_notes = OrderedDict()
        for k, v in sorted(running_notes.iteritems(), key=lambda t: t[0], reverse=True):
            sorted_running_notes[k] = v
        self.write(sorted_running_notes)

    def post(self, project):
        note = self.get_argument('note', '')
        user = self.get_secure_cookie('user')
        email = self.get_secure_cookie('email')
        if not note:
            self.set_status(400)
            self.finish('<html><body>No project id or note parameters found</body></html>')
        else:
            p = Project(lims, id=project)
            p.get(force=True)
            running_notes = json.loads(p.udf['Running Notes']) if 'Running Notes' in p.udf else {}
            running_notes[str(datetime.datetime.now())] = {'user': user,
                                                           'email': email,
                                                           'note': note}
            p.udf['Running Notes'] = json.dumps(running_notes)
            p.put()
            self.set_status(200)


class LinksDataHandler(SafeHandler):
    """ Serves external links for each project

        Links are stored as JSON in genologics LIMS / project
    """

    def get(self, project):
        self.set_header("Content-type", "application/json")
        p = Project(lims, id=project)
        p.get(force=True)

        links = json.loads(p.udf['Links']) if 'Links' in p.udf else {}

        #Sort by descending date, then hopefully have deviations on top
        sorted_links = OrderedDict()
        for k, v in sorted(links.iteritems(), key=lambda t: t[0], reverse=True):
            sorted_links[k] = v
        sorted_links = OrderedDict(sorted(sorted_links.iteritems(), key=lambda (k,v): v['type']))
        self.write(sorted_links)

    def post(self, project):
        user = self.get_secure_cookie('user')
        email = self.get_secure_cookie('email')
        a_type = self.get_argument('type', '')
        title = self.get_argument('title', '')
        url = self.get_argument('url', '')
        desc = self.get_argument('desc','')

        if not type or not title:
            self.set_status(400)
            self.finish('<html><body>Link title and type is required</body></html>')
        else:
            p = Project(lims, id=project)
            p.get(force=True)
            links = json.loads(p.udf['Links']) if 'Links' in p.udf else {}
            links[str(datetime.datetime.now())] = {'user': user,
                                                   'email': email,
                                                   'type': a_type,
                                                   'title': title,
                                                   'url': url,
                                                   'desc': desc}
            p.udf['Links'] = json.dumps(links)
            p.put()
            self.set_status(200)


class ProjectTicketsDataHandler(SafeHandler):
    """ Return a JSON file containing all the tickets in ZenDesk related to this project
    """
    def list_ticket_comments(self, ticket_id, page=1):
        """ Returns comments related to ticket_id

        This is a temporal method until the Python Zendesk module supports this
        functionality.
        """
        auth = (self.application.zendesk_user + '/token', self.application.zendesk_token)
        url = "{}/api/v2/tickets/{}/comments.json?page={}".format(self.application.zendesk_url, ticket_id, str(page))
        r = requests.get(url, auth=auth)
        if r.status_code == requests.status_codes.codes.OK:
            return r.json()
        else:
            self.set_status(400)
            self.finish('<html><body>There was a problem with ZenDesk connection, please try it again later.</body></html>')


    def get(self, p_id):
        self.set_header("Content-type", "application/json")
        p_name = self.get_argument('p_name', False)
        if not p_name:
            self.set_status(400)
            self.finish('<html><body>No project name specified!</body></html>')

        try:
            #Search for all tickets with the given project name
            tickets = self.application.zendesk.search(query="fieldvalue:{}".format(p_name))
            total_tickets = OrderedDict()
            if tickets['results']:
                for ticket in tickets['results']:
                    t_id = ticket['id']
                    total_tickets[t_id] = ticket
                    # Comments on the ticket (the actual thread) are on a different API call
                    request = self.list_ticket_comments(t_id)
                    total_tickets[t_id]['comments'] = request['comments']
                    page = 2
                    while request['next_page']:
                        request = self.list_ticket_comments(t_id, page=page)
                        total_tickets[t_id]['comments'].extend(request['comments'])
                        page += 1

            page = 2
            while tickets['next_page']:
                tickets = self.application.zendesk.search(query="fieldvalue:{}".format(p_name), page=page)
                for ticket in tickets['results']:
                    t_id = ticket['id']
                    total_tickets[t_id] = ticket
                    request = self.list_ticket_comments(t_id)
                    total_tickets[t_id]['comments'] = request['comments']
                    page_r = 2
                    while request['next_page']:
                        request = self.list_ticket_comments(t_id, page=page_r)
                        total_tickets[t_id]['comments'].extend(request['comments'])
                        page_r += 1
                page += 1
            # Return the most recent ticket first
            self.write(total_tickets)
        except ZendeskError:
            self.set_status(400)
            self.finish('<html><body>There was a problem with ZenDesk connection, please try it again later.</body></html>')

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
