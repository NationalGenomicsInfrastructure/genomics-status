""" Handlers for sequencing project information.
"""
import json
import traceback

import tornado.web
import dateutil.parser
import datetime
import requests
import re
import base64
import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import markdown
import slack
import nest_asyncio
import itertools

from collections import defaultdict
from collections import OrderedDict
from status.util import dthandler, SafeHandler
from dateutil.relativedelta import relativedelta

from genologics import lims
from genologics.entities import Project
from genologics.entities import Sample
from genologics.entities import Process
from genologics.entities import Artifact
from genologics.entities import Protocol
from genologics.config import BASEURI, USERNAME, PASSWORD

from zenpy import Zenpy, ZenpyException


lims = lims.Lims(BASEURI, USERNAME, PASSWORD)
application_log=logging.getLogger("tornado.application")

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
        user_details=self.get_user_details(self.application, self.get_current_user().email)
        presets = {
            "default": self.application.genstat_defaults.get(presets_list),
            "user": user_details.get('userpreset')
        }
        self.write(json.dumps(presets))

    def post(self):
        """Save/Delete preset choices of columns into StatusDB
        """
        doc=self.get_user_details(self.application, self.get_current_user().email)
        if self.get_arguments('save'):
            preset_name = self.get_argument('save')
            data = json.loads(self.request.body)
            if 'userpreset' in doc:
                doc['userpreset'][preset_name]=data
            else:
                doc['userpreset']={ preset_name:data }

        if self.get_arguments('delete'):
            preset_name = self.get_argument('delete')
            del doc['userpreset'][preset_name]

        try:
            self.application.gs_users_db.save(doc)
        except Exception as e:
            self.set_status(400)
            self.write(e.message)

        self.set_status(201)
        self.write({'success': 'success!!'})

    @staticmethod
    def get_user_details(app, user_email):
        if user_email == 'Testing User!':
            user_email=app.settings.get("username", None)+'@scilifelab.se'
        user_details={}
        headers = {"Accept": "application/json",
                   "Authorization": "Basic " + "{}:{}".format(base64.b64encode(bytes(app.settings.get("username", None), 'ascii')),
                   base64.b64encode(bytes(app.settings.get("password", None), 'ascii')))}
        for row in app.gs_users_db.view('authorized/users'):
            if row.get('key') == user_email:
                user_url = "{}/gs_users/{}".format(app.settings.get("couch_server"), row.get('value'))
                r = requests.get(user_url, headers=headers).content.rstrip()
                user_details=json.loads(r);
        return user_details

class PresetsOnLoadHandler(PresetsHandler):
    """Handler to GET and POST/PUT personalized and default set of presets on loading

    project view.
    """
    def get(self):
        action = self.get_argument('action', '')
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.get_user_details(self.application, self.get_current_user().email).get('onload')))

    def post(self):
        doc=self.get_user_details(self.application, self.get_current_user().email)
        data = json.loads(self.request.body)
        action=self.get_argument('action')
        doc['onload']=data

        try:
            self.application.gs_users_db.save(doc)
        except Exception as e:
            self.set_status(400)
            self.write(e.message)

        self.set_status(201)
        self.write({'success': 'success!!'})


class ProjectsBaseDataHandler(SafeHandler):

    cached_search_list = None
    search_list_last_fetched = None

    def keys_to_names(self, columns):
        d = {}
        for column_category, column_tuples in columns.items():
            for key, value in column_tuples.items():
                d[value] = key
        return d

    def project_summary_data(self, row):
        # the details key gives values containing multiple udfs on project level
        # and project_summary key gives 'temporary' udfs that will move to 'details'.
        # Include these as normal key:value pairs
        if 'project_summary' in row.value:
            for summary_key, summary_value in row.value['project_summary'].items():
                row.value[summary_key] = summary_value
            row.value.pop("project_summary", None)

        # If key is in both project_summary and details, details has precedence
        if 'details' in row.value:
            for detail_key, detail_value in row.value['details'].items():
                row.value[detail_key] = detail_value
            row.value.pop("details", None)

        # Handle the pending reviews:
        if 'pending_reviews' in row.value:
            links = ', '.join(['<a class="text-decoration-none" href="{0}/clarity/work-complete/{1}">Review</a>'.format(BASEURI, rid) for rid in row.value['pending_reviews']])
            row.value['pending_reviews'] = links

        # Find the latest running note, return it as a separate field
        if 'running_notes' in row.value:
            try:
                notes = json.loads(row.value['running_notes'])
                # note_dates = {datetime obj: time string, ...}
                note_dates = dict(zip(map(dateutil.parser.parse, notes.keys()), notes.keys()))
                latest_date = note_dates[max(list(note_dates))]
                row.value['latest_running_note'] = json.dumps({latest_date: notes[latest_date]})
            except ValueError:
                pass

        if row.key[0] in ['need_review', 'ongoing', 'reception_control'] and 'queued' in row.value:
            #Add days ongoing in production field
            now = datetime.datetime.now()
            queued = row.value['queued']
            diff = now - dateutil.parser.parse(queued)
            row.value['days_in_production'] = diff.days
        elif row.key[0] in ['aborted', 'closed'] and 'close_date' and 'queued' in row.value:
            #Days project was in production
            close = dateutil.parser.parse(row.value['close_date'])
            diff = close - dateutil.parser.parse(row.value['queued'])
            row.value['days_in_production'] = diff.days

        if row.key[0] in ['need_review', 'ongoing', 'reception_control'] and 'open_date' in row.value:
            end_date = datetime.datetime.now()
            if 'queued' in row.value:
                end_date =  dateutil.parser.parse(row.value['queued'])
            diff = (end_date - dateutil.parser.parse(row.value['open_date'])).days
            if 'queued' not in row.value and diff > 14:
                row.value['days_in_reception_control'] = '<b class="text-error">{}</b>'.format(diff)
            else:
                row.value['days_in_reception_control'] = diff

        if 'order_details' in row.value and 'fields' in row.value['order_details'] and 'project_pi_name' in row.value['order_details']['fields']:
            row.value['project_pi_name'] = row.value['order_details']['fields']['project_pi_name']

        return row

    def _get_two_year_from(self, from_date):
        return (datetime.datetime.strptime(from_date, "%Y-%m-%d") - relativedelta(years=2)).strftime("%Y-%m-%d")

    def _calculate_days_in_status(self, start_date, end_date):
        days = 0
        if start_date:
            if end_date:
                delta = dateutil.parser.parse(end_date) - dateutil.parser.parse(start_date)
            else:
                delta = datetime.datetime.now() - dateutil.parser.parse(start_date)
            days = delta.days
        else:
            days = '-'
        return days

    def list_projects(self, filter_projects='all'):
        projects = OrderedDict()
        closedflag=False
        queuedflag=False
        openflag=False
        projtype=self.get_argument('type', 'all')

        def_dates_gen = { 'days_recep_ctrl' : ['open_date', 'queued'],
                          'days_analysis' : ['all_samples_sequenced', 'best_practice_analysis_completed'],
                          'days_data_delivery' : ['best_practice_analysis_completed', 'all_raw_data_delivered'],
                          'days_close' : ['all_raw_data_delivered', 'close_date']
                         }

        def_dates_summary = { 'days_prep_start' : ['queued', 'library_prep_start'],
                              'days_seq_start' : [['qc_library_finished', 'queued'], 'sequencing_start_date'],
                              'days_seq' : ['sequencing_start_date', 'all_samples_sequenced'],
                              'days_prep' : ['library_prep_start', 'qc_library_finished']
                             }

        if 'closed' in filter_projects or 'all' in filter_projects:
            closedflag=True
        if 'ongoing' in filter_projects or 'open' in filter_projects or 'review' in filter_projects or 'all' in filter_projects or 'closed' in filter_projects:
            queuedflag=True
        if 'ongoing' in filter_projects or 'open' in filter_projects or 'review' in filter_projects or 'reception_control' in filter_projects or 'all' in filter_projects or 'closed' in filter_projects:
            openflag=True

        default_start_date=(datetime.datetime.now() - relativedelta(years=2)).strftime("%Y-%m-%d")
        default_end_date=datetime.datetime.now().strftime("%Y-%m-%d")
        start_open_date, end_open_date, start_queue_date, end_queue_date, start_close_date, end_close_date = [None] * 6

        if closedflag:
            end_close_date = self.get_argument('youngest_close_date', default_end_date)
            start_close_date = self.get_argument('oldest_close_date', self._get_two_year_from(end_close_date))
        if queuedflag:
            end_queue_date = self.get_argument('youngest_queue_date', default_end_date)
            start_queue_date = self.get_argument('oldest_queue_date', self._get_two_year_from(end_queue_date))
        if openflag:
            end_open_date = self.get_argument('youngest_open_date', default_end_date)
            start_open_date = self.get_argument('oldest_open_date', self._get_two_year_from(end_open_date))

        summary_view = self.application.projects_db.view("project/summary_status", descending=True)

        # view_calls collects http requests to statusdb for each status requested
        view_calls = []
        if filter_projects[:1] != 'P':
            if 'all' in filter_projects:
                view_calls.append(summary_view)
            else:
                statusdb_statuses = set()
                # Need special treatment for these as they are not actual statuses
                if 'review' in filter_projects or 'open' in filter_projects:
                    statusdb_statuses.add('ongoing')
                    statusdb_statuses.add('reception control')
                for status in filter_projects.split(','):
                    status = status.replace('_', ' ')
                    if status in ['aborted', 'closed', 'ongoing', 'pending', 'reception control']:
                        statusdb_statuses.add(status)

                for status in statusdb_statuses:
                    view_calls.append(summary_view[[status, 'Z']:[status, '']])

        filtered_projects = []

        # Specific list of projects given
        if filter_projects[:1] == 'P':
            fprojs = filter_projects.split(',')
            for p_id, p_info in projects.items():
                if p_id in fprojs:
                    filtered_projects[p_id] = p_info

        # Filter aborted projects if not All projects requested: Aborted date has
        # priority over everything else.
        else:
            # Loop over each row from the different view calls
            for row in itertools.chain.from_iterable(view_calls):
                p_info=row.value
                ptype=p_info['details'].get('type')

                if not (projtype == 'All' or  ptype == projtype):
                    continue

                closed_condition, queued_condition, open_condition, queued_proj = [False] * 4

                if 'close_date' in p_info:
                    closed_condition = p_info['close_date'] >= str(start_close_date) and p_info['close_date'] <= str(end_close_date)

                if 'queued' in p_info['details']:
                    queued_proj = True
                    queued_condition = p_info['details'].get('queued') >= str(start_queue_date) and p_info['details'].get('queued') <= str(end_queue_date)

                elif 'project_summary' in p_info and 'queued' in p_info['project_summary']:
                    queued_proj =True
                    queued_condition = p_info['project_summary'].get('queued') >= str(start_queue_date) and p_info['project_summary'].get('queued') <= str(end_queue_date)

                if 'open_date' in p_info:
                    open_condition = p_info['open_date'] >= str(start_open_date) and p_info['open_date'] <= str(end_open_date)

                #Filtering projects
                #aborted projects
                if ('aborted' in filter_projects or filter_projects == 'all') and ('aborted' in p_info['details'] or ('project_summary' in p_info and 'aborted' in p_info['project_summary'])):
                        filtered_projects.append(row)
                #pending reviews projects
                elif ('review' in filter_projects or filter_projects == 'all') and 'pending_reviews' in p_info:
                    filtered_projects.append(row)
                #closed projects
                elif (closedflag or filter_projects == 'all') and closed_condition:
                    filtered_projects.append(row)
                #open projects
                elif openflag and open_condition:
                    if filter_projects == 'all':
                        filtered_projects.append(row)
                    elif 'open' in filter_projects:
                        filtered_projects.append(row)
                    #ongoing projects
                    elif 'ongoing' in filter_projects and queuedflag and queued_condition and not 'close_date' in p_info:
                        filtered_projects.append(row)
                    elif 'reception_control' in filter_projects and not queuedflag and not queued_proj:
                        #reception control projects
                        filtered_projects.append(row)
                #pending projects
                elif ('pending' in filter_projects or filter_projects == 'all') and not 'open_date' in p_info:
                    filtered_projects.append(row)

        final_projects = OrderedDict()
        for row in filtered_projects:
            row = self.project_summary_data(row)
            proj_id = row.key[1]

            final_projects[proj_id] = row.value
            for date_type, date in row.value['summary_dates'].items():
                final_projects[proj_id][date_type] = date

            for key, value in def_dates_gen.items():
                start_date = value[0]
                end_date = value[1]
                final_projects[proj_id][key] = self._calculate_days_in_status(final_projects[proj_id].get(start_date),
                                                                                    final_projects[proj_id].get(end_date))

            for key, value in def_dates_summary.items():
                if key == 'days_seq_start':

                    if 'Library, By user' in final_projects[proj_id].get('library_construction_method', '-'):
                        start_date = value[0][1]
                    else:
                        start_date = value[0][0]
                else:
                    start_date = value[0]
                end_date = value[1]
                if key in ['days_prep', 'days_prep_start'] and 'Library, By user' in final_projects[proj_id].get('library_construction_method', '-'):
                    final_projects[proj_id][key] = '-'
                else:
                    final_projects[proj_id][key] = self._calculate_days_in_status(final_projects[proj_id].get(start_date),
                                                                                            final_projects[proj_id].get(end_date))

        return final_projects

    def list_project_fields(self, undefined=False, project_list='all'):
        # If undefined=True is given, only return fields not in columns defined
        # in constants in StatusDB
        columns = self.application.genstat_defaults.get('pv_columns')
        project_list = self.list_projects(filter_projects=project_list)
        field_items = set()
        for project_id, value in project_list.items():
            for key, _ in value.items():
                field_items.add(key)
        if undefined:
            for column_category, column_dict in columns.items():
                field_items = field_items.difference(set(column_dict.values()))
        return field_items

    def search_project_names(self, search_string=''):
        if len(search_string) == 0:
            return ''
        projects = []

        # The list of projects is cached for speed improvement
        t_threshold = datetime.datetime.now() - relativedelta(minutes=3)
        if ProjectsBaseDataHandler.cached_search_list is None or \
                ProjectsBaseDataHandler.search_list_last_fetched < t_threshold:
            projects_view = self.application.projects_db.view("projects/name_to_id_cust_ref", descending=True)

            ProjectsBaseDataHandler.cached_search_list = [(row.key, row.value) for row in projects_view]
            ProjectsBaseDataHandler.search_list_last_fetched = datetime.datetime.now()

        search_string = search_string.lower().strip()

        for row_key, row_value in ProjectsBaseDataHandler.cached_search_list:
            if search_string in row_key.lower() or search_string in row_value[0].lower() or (row_value[1] and search_string in row_value[1].lower()):
                project = {
                    "url": '/project/'+row_value[0],
                    "name": "{} ({})".format(row_key, row_value[0])
                }
                projects.append(project)

        return projects


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
        undefined = (undefined.lower() == "true")
        project_list = self.get_argument("project_list", "all")
        field_items = self.list_project_fields(undefined=undefined, project_list=project_list)
        self.write(json.dumps(list(field_items)))


class ProjectsSearchHandler(ProjectsBaseDataHandler):
    """ Searches for projects matching the supplied search string

    Loaded through /api/v1/project_search/([^/]*)$
    """
    def get(self, search_string):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.search_project_names(search_string)))


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

        summary_row.value['_doc_id'] = summary_row.id

        if date_result.rows:
            for date_row in date_result.rows:
                for date_type, date in date_row.value.items():
                    summary_row.value[date_type] = date
        summary_row.value['sourcedb_url'] = 'http://' + self.settings['couch_server'].split('@')[1]
        return summary_row.value


class ProjectSamplesDataHandler(SafeHandler):
    """ Serves brief info about all samples in a given project.

    Loaded through /api/v1/project/([^/]*)$
    """
    def sample_data(self, sample_data,project, sample):
        sample_data["sample_run_metrics"] = []
        sample_data["prep_status"] = []
        sample_data["prep_finished_date"] = []
        sample_data["run_metrics_data"]={}
        if "library_prep" in sample_data:
            for lib_prep in sorted(sample_data["library_prep"]):
                content=sample_data["library_prep"][lib_prep]
                if "sample_run_metrics" in content:
                    for run, id in content["sample_run_metrics"].items():
                        sample_data["sample_run_metrics"].append(run)
                        sample_data["run_metrics_data"][run]=self.get_sample_run_metrics(run)
                if "prep_status" in content:
                    if content["prep_status"] == "PASSED":
                        sample_data["prep_status"].append(content["prep_status"])
                    else:
                        sample_data["prep_status"].append("FAILED")
                if "prep_finished_date" in content:
                    sample_data["prep_finished_date"].append(content["prep_finished_date"])
                if "library_validation" in content:
                    for agrId, libval in content["library_validation"].items():
                        if "caliper_image" in libval:
                            sample_data['library_prep'][lib_prep]['library_validation'][agrId]['caliper_image'] = self.reverse_url('CaliperImageHandler', project, sample, 'libval{0}'.format(lib_prep))

        if "details" in sample_data:
            for detail_key, detail_value in sample_data["details"].items():
                sample_data[detail_key] = detail_value
        if 'initial_qc' in sample_data:
            if "caliper_image" in sample_data['initial_qc']:
                #Go grab the image from the sftp server
                sample_data['initial_qc']['caliper_image'] = self.reverse_url('CaliperImageHandler', project, sample, 'initial_qc')
            if "frag_an_image" in sample_data['initial_qc']:
                #Go grab the image from the sftp server
                sample_data['initial_qc']['frag_an_image'] = self.reverse_url('FragAnImageHandler', project, sample, 'initial_qc')
        return sample_data

    def list_samples(self, project):
        samples = OrderedDict()
        sample_view = self.application.projects_db.view("project/samples")
        result = sample_view[project]
        # Not all projects (i.e Pending projects) have samples!
        samples = result.rows[0].value if result.rows[0].value else {}
        output = OrderedDict()
        for sample, sample_data in sorted(samples.items(), key=lambda x: x[0]):
            sample_data = self.sample_data(sample_data, project, sample)
            output[sample] = sample_data
        return output

    def get_sample_run_metrics(self, metrics_id):
        data={}
        metrics_view=self.application.samples_db.view('sample/INS_metrics')
        if len(metrics_view[metrics_id].rows)>1:
            application_log.warn("More than one metrics doc found for id {0}".format(metrics_id))

        for row in metrics_view[metrics_id]:
            data=row.value

        return data

    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_samples(project), default=dthandler))

    def sample_list(self, project):
        sample_view = self.application.projects_db.view("project/samples")
        result = sample_view[project]

        samples = result.rows[0].value
        samples = OrderedDict(sorted(samples.items(), key=lambda x: x[0]))
        return samples


class FragAnImageHandler(SafeHandler):
    """serves fragment_analyzer images based on their API uri"""

    def get(self, project, sample, step):
        self.set_header("Content-type", "application/json")
        sample_view = self.application.projects_db.view("project/frag_an_links")
        result = sample_view[project]
        try:
            data = result.rows[0].value
        except TypeError:
            #can be triggered by the data.get().get() calls.
            self.write("no Fragment Analyzer image found")
        else:
            self.write(self.get_frag_an_image(data.get(sample).get(step)))

    @staticmethod
    def get_frag_an_image(url):
        data = lims.get_file_contents(uri=url)
        encoded_string = base64.b64encode(data.read()).decode('utf-8')
        returnHTML=json.dumps(encoded_string)
        return returnHTML


class CaliperImageHandler(SafeHandler):
    """serves caliper images in img tags, with ice and a small umbrella.

    Called through /api/v1/caliper_images/PROJECT/SAMPLE/STEP"""

    def get(self, project, sample, step):
        self.set_header("Content-type", "application/json")
        sample_view = self.application.projects_db.view("project/caliper_links")
        result = sample_view[project]
        try:
            data = result.rows[0].value
        except TypeError:
            #can be triggered by the data.get().get() calls.
            raise tornado.web.HTTPError(404, reason='No caliper image found')
        else:
            self.write(self.get_caliper_image(data.get(sample).get(step)))

    @staticmethod
    def get_caliper_image(url):
        """returns a base64 string of the caliper image asked"""
        #url pattern: sftp://ngi-lims-prod.scilifelab.se/home/glsftp/clarity/year/month/processid/artifact-id-file-id.png
        artifact_attached_id= url.rsplit('.', 1)[0].rsplit('/', 1)[1].rsplit('-', 2)[0]
        #Couldn't use fileid in the url directly as it was sometimes wrong
        caliper_file_id = Artifact(lims=lims, id=artifact_attached_id).files[0].id
        try:
            my_file = lims.get_file_contents(id=caliper_file_id)
            encoded_string = base64.b64encode(my_file.read()).decode('utf-8')
            returnHTML=json.dumps(encoded_string)
            return returnHTML
        except Exception as message:
            print(message)
            raise tornado.web.HTTPError(404, reason='Error fetching caliper images')


class ImagesDownloadHandler(SafeHandler):
    """serves caliper/fragment_analyzer images in a zip archive.
    Called through /api/v1/download_images/PROJECT/[image_type]
    where image types are currently frag_an, caliper_libval or caliper_initial_qc
    """

    def post(self, project, type):
        from io import BytesIO
        import zipfile as zp

        name = ''
        if type == 'frag_an':
            view = 'project/frag_an_links'
            name = 'InitialQCFragmentAnalyser'
        else:
            view = 'project/caliper_links'
            if 'libval' in type:
                name = 'LibraryValidationCaliper'
            elif 'initial_qc' in type:
                name = 'InitialQCCaliper'

        sample_view = self.application.projects_db.view(view)
        result = sample_view[project]
        try:
            data = result.rows[0].value
        except TypeError:
            #can be triggered by the data.get().get() calls.
            raise tornado.web.HTTPError(404, reason='No caliper image found')

        fileName = '{}_{}_images.zip'.format(project, name)
        f = BytesIO()
        num_files = 0
        with zp.ZipFile(f, "w") as zf:
            for sample in data:
                if data[sample]:
                    num_files +=1
                    for key in data[sample]:
                        img_file_name = sample + '.'
                        if 'frag_an' in type and 'initial_qc' in key:
                            img_file_name = img_file_name + 'png'
                            zf.writestr(img_file_name, base64.b64decode(FragAnImageHandler.get_frag_an_image(data[sample][key])))
                        elif 'caliper' in type:
                            checktype = type.split('_',1)[1]
                            if 'libval' in checktype:
                                img_file_name = img_file_name + key + '.'
                            if checktype in key:
                                img_file_name = img_file_name + data[sample][key].rsplit('.')[-1]
                                zf.writestr(img_file_name, base64.b64decode(CaliperImageHandler.get_caliper_image(data[sample][key])))

        if num_files == 0:
            raise tornado.web.HTTPError(status_code=404, log_message='No files!', reason='No files to be downloaded!!')
        self.set_header('Content-Type', 'application/zip')
        self.set_header('Content-Disposition', 'attachment; filename={}'.format(fileName))
        self.write(f.getvalue())
        f.close()
        self.finish()

class ProjectSamplesHandler(SafeHandler):
    """ Serves a page which lists the samples of a given project, with some
    brief information for each sample.
    URL: /project/([^/]*)
    """

    def get(self, project):
        t = self.application.loader.load("project_samples.html")
        worksets_view = self.application.worksets_db.view("project/ws_name", descending=True)
        # to check if multiqc report exists (get_multiqc() is defined in util.BaseHandler)
        multiqc = self.get_multiqc(project) or ''
        self.write(t.generate(gs_globals=self.application.gs_globals, project=project,
                              user=self.get_current_user(),
                              columns = self.application.genstat_defaults.get('pv_columns'),
                              columns_sample = self.application.genstat_defaults.get('sample_columns'),
                              prettify = prettify_css_names,
                              worksets=worksets_view[project],
                              multiqc=multiqc,
                              lims_uri=BASEURI
                              ))



class ProjectsHandler(SafeHandler):
    """ Serves a page with project presets listed, along with some brief info.
    URL: /projects
    """
    def get(self, projects='all'):
    #def get(self):
        t = self.application.loader.load("projects.html")
        columns = self.application.genstat_defaults.get('pv_columns')
        self.write(t.generate(gs_globals=self.application.gs_globals, columns=columns, projects=projects, user=self.get_current_user()))




class RunningNotesDataHandler(SafeHandler):
    """Serves all running notes from a given project.
    It connects to LIMS to fetch and update Running Notes information.
    URL: /api/v1/running_notes/([^/]*)
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        v = self.application.projects_db.view("project/project_id")
        if len(v[project]) == 0:
            raise tornado.web.HTTPError(404, reason='Project not found: {}'.format(project))
        else:
            for row in v[project]:
                doc_id = row.value
            doc = self.application.projects_db.get(doc_id)
            # Sorted running notes, by date
            running_notes = json.loads(doc['details'].get('running_notes', '{}'))
            sorted_running_notes = OrderedDict()
            for k, v in sorted(running_notes.items(), key=lambda t: t[0], reverse=True):
                sorted_running_notes[k] = v
            self.write(sorted_running_notes)

    def post(self, project):
        note = self.get_argument('note', '')
        category = self.get_argument('category', '')
        user = self.get_current_user()
        if not note:
            self.set_status(400)
            self.finish('<html><body>No project id or note parameters found</body></html>')
        else:
            newNote = RunningNotesDataHandler.make_project_running_note(self.application, project, note, category, user.name, user.email)
            self.set_status(201)
            self.write(json.dumps(newNote))

    @staticmethod
    def make_project_running_note(application, project, note, category, user, email):
        timestamp = datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S')
        newNote = {'user': user, 'email': email, 'note': note, 'category' : category, 'timestamp': timestamp}

        #get and save running notes directly in genstat.
        v = application.projects_db.view("project/project_id")
        for row in v[project]:
            doc_id = row.value
        doc = application.projects_db.get(doc_id)

        running_notes = json.loads(doc['details'].get('running_notes', '{}'))
        running_notes.update({timestamp: newNote})
        project_name = doc['project_name']
        proj_ids = [project, project_name]
        doc['details']['running_notes'] = json.dumps(running_notes)
        application.projects_db.save(doc)

        #check if it was saved
        doc = application.projects_db.get(doc_id)
        assert (doc['details']['running_notes'] == json.dumps(running_notes)), "The Running note wasn't saved in StatusDB!"

        #### Check and send mail to tagged users
        pattern = re.compile("(@)([a-zA-Z0-9.-]+)")
        userTags = [x[1] for x in pattern.findall(note)]
        if userTags:
            RunningNotesDataHandler.notify_tagged_user(application, userTags, proj_ids, note, category, user, timestamp, 'userTag')
        ####
        ##Notify proj coordinators for all project running notes
        proj_coord = '.'.join(doc['details'].get('project_coordinator','').lower().split())
        if proj_coord and proj_coord not in userTags and proj_coord!=email.split('@')[0]:
            RunningNotesDataHandler.notify_tagged_user(application, [proj_coord], proj_ids, note, category, user, timestamp, 'creation')
        return newNote

    @staticmethod
    def notify_tagged_user(application, userTags, project, note, category, tagger, timestamp, tagtype):
        view_result = {}
        project_id = project[0]
        project_name = project[1]
        time_in_format = datetime.datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S').strftime("%a %b %d %Y, %I:%M:%S %p")
        note_id = 'running_note_' + project_id + '_' + \
                    str(int((datetime.datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S') -  datetime.datetime.utcfromtimestamp(0)).total_seconds()))
        for row in application.gs_users_db.view('authorized/users'):
            if row.key != 'genstat_defaults':
                view_result[row.key.split('@')[0]] = row.key
        if category:
            category = ' - ' + category

        if tagtype=='userTag':
            notf_text = 'tagged you'
            slack_notf_text = 'You have been tagged by *{}* in a running note'.format(tagger)
            email_text = 'You have been tagged by {} in a running note'.format(tagger)
        else:
            notf_text = 'created note'
            slack_notf_text = 'Running note created by *{}*'.format(tagger)
            email_text = 'Running note created by {}'.format(tagger)

        for user in userTags:
            if user in view_result:
                option = PresetsHandler.get_user_details(application, view_result[user]).get('notification_preferences', 'Both')
                #Adding a slack IM to the tagged user with the running note
                if option == 'Slack' or option == 'Both':
                    nest_asyncio.apply()
                    client = slack.WebClient(token=application.slack_token)
                    notification_text = '{} has {} in {}, {}!'.format(tagger, notf_text, project_id, project_name)
                    blocks = [
                        {
                        "type": "section",
		                "text": {
                            "type": "mrkdwn",
        		            "text": ("_{} for the project_ "
                                     "<{}/project/{}#{}|{}, {}>! :smile: \n_The note is as follows:_ \n\n\n")
                             .format(slack_notf_text, application.settings['redirect_uri'].rsplit('/',1)[0], project_id, note_id, project_id, project_name)
                             }
                        },
                        {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": ">*{} - {}{}*\n>{}\n\n\n\n _(Please do not respond to this message here in Slack."
                            " It will only be seen by you.)_".format(tagger, time_in_format, category, note.replace('\n', '\n>'))
         	                  }
                        }
                    ]


                    try:
                        userid = client.users_lookupByEmail(email=view_result[user])
                        channel = client.conversations_open(users=userid.data['user']['id'])
                        client.chat_postMessage(channel=channel.data['channel']['id'], text=notification_text, blocks=blocks)
                        client.conversations_close(channel=channel.data['channel']['id'])
                    except Exception:
                        #falling back to email
                        option = 'E-mail'

                #default is email
                if option == 'E-mail' or option == 'Both':
                    msg = MIMEMultipart('alternative')
                    msg['Subject']='[GenStat] Running Note:{}, {}'.format(project_id, project_name)
                    msg['From']='genomics-status'
                    msg['To'] = view_result[user]
                    text = '{} in the project {}, {}! The note is as follows\n\
                    >{} - {}{}\
                    >{}'.format(email_text, project_id, project_name, tagger, time_in_format, category, note)

                    html = '<html>\
                    <body>\
                    <p> \
                    {} in the project <a href="{}/project/{}#{}">{}, {}</a>! The note is as follows</p>\
                    <blockquote>\
                    <div class="panel panel-default" style="border: 1px solid #e4e0e0; border-radius: 4px;">\
                    <div class="panel-heading" style="background-color: #f5f5f5; padding: 10px 15px;">\
                        <a href="#">{}</a> - <span>{}</span> <span>{}</span>\
                    </div>\
                    <div class="panel-body" style="padding: 15px;">\
                        <p>{}</p>\
                    </div></div></blockquote></body></html>'.format(email_text, application.settings['redirect_uri'].rsplit('/',1)[0],
                    project_id, note_id, project_id, project_name, tagger, time_in_format, category, markdown.markdown(note))

                    msg.attach(MIMEText(text, 'plain'))
                    msg.attach(MIMEText(html, 'html'))

                    s = smtplib.SMTP('localhost')
                    s.sendmail('genomics-bioinfo@scilifelab.se', msg['To'], msg.as_string())
                    s.quit()

class LinksDataHandler(SafeHandler):
    """ Serves external links for each project
        Links are stored as JSON in LIMS / project
        URL: /api/v1/links/([^/]*)
    """

    def get(self, project):
        self.set_header("Content-type", "application/json")
        p = Project(lims, id=project)
        p.get(force=True)

        links = json.loads(p.udf['Links']) if 'Links' in p.udf else {}

        #Sort by descending date, then hopefully have deviations on top
        sorted_links = OrderedDict()
        for k, v in sorted(links.items(), key=lambda t: t[0], reverse=True):
            sorted_links[k] = v
        sorted_links = OrderedDict(sorted(sorted_links.items(), key=lambda k: k[1]['type']))
        self.write(sorted_links)

    def post(self, project):
        user = self.get_current_user()
        a_type = self.get_argument('type', '')
        title = self.get_argument('title', '')
        url = self.get_argument('url', '')
        desc = self.get_argument('desc','')

        if not a_type or not title:
            self.set_status(400)
            self.finish('<html><body>Link title and type is required</body></html>')
        else:
            p = Project(lims, id=project)
            p.get(force=True)
            links = json.loads(p.udf['Links']) if 'Links' in p.udf else {}
            links[str(datetime.datetime.now())] = {'user': user.name,
                                                   'email': user.email,
                                                   'type': a_type,
                                                   'title': title,
                                                   'url': url,
                                                   'desc': desc}
            p.udf['Links'] = json.dumps(links)
            p.put()
            self.set_status(200)
            #ajax cries if it does not get anything back
            self.set_header("Content-type", "application/json")
            self.finish(json.dumps(links))


class ProjectTicketsDataHandler(SafeHandler):
    """ Return a JSON file containing all the tickets in ZenDesk related to this project
    URL: /api/v1/project/([^/]*)/tickets
    """
    def get(self, p_id):
        self.set_header("Content-type", "application/json")
        p_name = self.get_argument('p_name', False)
        if not p_name:
            self.set_status(400)
            self.finish('<html><body>No project name specified!</body></html>')

        try:
            #Search for all tickets with the given project name
            total_tickets = OrderedDict()
            for ticket in self.application.zendesk.search(query='fieldvalue:"{}"'.format(p_name)):
                total_tickets[ticket.id] = ticket.to_dict()
                for comment in self.application.zendesk.tickets.comments(ticket=ticket.id):
                    if 'comments' not in total_tickets[ticket.id]:
                        total_tickets[ticket.id]['comments']=[{'author':comment.author.name, 'comment': comment.to_dict()}]
                    else:
                        total_tickets[ticket.id]['comments'].extend([{'author':comment.author.name, 'comment': comment.to_dict()}])
            # Return the most recent ticket first
            self.write(total_tickets)
        except ZenpyException:
            self.set_status(400)
            self.finish('<html><body>There was a problem with ZenDesk connection, please try it again later.</body></html>')

class ProjectQCDataHandler(SafeHandler):
    """Serves filenames in qc_reports
    URL: /api/v1/projectqc/([^/]*)
    """
    def get(self, projectname):
        paths={}
        prefix=os.path.join(os.getcwd(), 'qc_reports')
        #this should be run_dir
        if re.match("^[A-Z]{1,2}\.[A-Za-z0-9]+\_[0-9]{2}\_[0-9]{2,3}$", projectname):
            qc_location=os.path.join(prefix,projectname)
            cursample=''
            currun=''
            for root, subdirs, files in os.walk(qc_location):
                rootname=os.path.basename(root)
                if re.match("^P[0-9]{3,5}\_[0-9]{3,4}$",rootname):
                    paths[rootname]={}
                    cursample=rootname
                    currun=''

                elif re.match("^[0-9]+\_[A-Z0-9]+$",rootname):
                    paths[cursample][rootname]=[]
                    currun=rootname

                for f in files:
                    try:
                        paths[cursample][currun].append(os.path.relpath(os.path.join(root,f), prefix))
                    except KeyError:
                        print("cannot add {} to paths, one of these two keys does not exist: sample->{} run->{}".format(os.path.relpath(os.path.join(root,f), prefix), cursample, currun))
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(paths))


class CharonProjectHandler(SafeHandler):
    """queries charon about the current project"""
    def get(self, projectid):
        try:
            url="{}/api/v1/summary?projectid={}".format(self.application.settings['charon']['url'], projectid)
            headers = {'X-Charon-API-token': '{}'.format(self.application.settings['charon']['api_token'])}
            project_url="{}/api/v1/project/{}".format(self.application.settings['charon']['url'], projectid)
        except KeyError:
            url="https://charon.scilifelab.se/api/v1/summary?projectid={}".format(projectid)
            project_url="https://charon.scilifelab.se/api/v1/project/{}".format(projectid)
            headers={}
        r = requests.get(url, headers = headers )
        if r.status_code == requests.status_codes.codes.OK:
            self.write(r.json())
        else:
            self.set_status(400)
            self.finish('<html><body>There was a problem connecting to charon, please try it again later. {}</body></html>'.format(r.reason))


class RecCtrlDataHandler(SafeHandler):
    """Handler for the reception control view"""
    def get(self, project_id):
        sample_data={}
        #changed from projects due to view timing out with os_process_error
        v = self.application.projects_db.view("samples/rec_ctrl_view")
        for row in v[project_id]:
            sample_data.update(row.value)

        t = self.application.loader.load("rec_ctrl_view.html")
        self.write(t.generate(gs_globals=self.application.gs_globals,
                              project_id=project_id,
                              sample_data=sample_data,
                              json_data=json.dumps(sample_data),
                              user=self.get_current_user()))


class ProjMetaCompareHandler(SafeHandler):
    """Handler for the project meta comparison page view"""
    def get(self):
        pids = self.get_arguments("p")
        t = self.application.loader.load("proj_meta_compare.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, pids=pids,
                              user=self.get_current_user()))

class ProjectRNAMetaDataHandler(SafeHandler):
    """Handler to serve RNA metadata from project"""
    def get(self, project_id):
        data="{}"
        view=self.application.analysis_db.view("reports/RNA_report")
        for row in view[project_id]:
            data=json.dumps(row.value)

        self.set_status(200)
        self.set_header("Content-type", "application/json")
        self.write(data)


class ProjectInternalCostsHandler(SafeHandler):
    """Handler for the update of the project internal costs"""
    def post(self, project_id):
        try:
            data = json.loads(self.request.body)
            text = data.get('text', '')
            p = Project(lims, id=project_id)
            p.udf['Internal Costs'] = text
            p.put()
            view = self.application.projects_db.view("project/project_id")
            for row in view[project_id]:
                doc=self.application.projects_db.get(row.id)
                doc['details']['internal_costs']=text
                self.application.projects_db.save(doc)


        except Exception as e:
            self.set_status(400)
            self.finish('<html><body><p>could not update Entity {} :</p><pre>{}</pre></body></html>'.format( project_id, e))
        else:
            self.set_status(200)
            self.set_header("Content-type", "application/json")
            self.write(self.request.body)