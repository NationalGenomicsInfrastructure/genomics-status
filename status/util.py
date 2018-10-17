import tornado.web
import tornado.auth
import json
import requests
import os
import sys
import time
import copy
from datetime import datetime, timedelta, date
from dateutil import parser


#########################
#  Useful misc handlers #
#########################

ERROR_CODES = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Page Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    414: 'Request-URI Too Long',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    511: 'Network Authentication Required'
}

class BaseHandler(tornado.web.RequestHandler):
    """Base Handler. Handlers should not inherit from this
    class directly but from either SafeHandler or UnsafeHandler
    to make security status explicit.

    """
    def get(self):
        """ The GET method on this handler will be overwritten by all other handler.

        As it is the default handler used to match any request that is not mapped
        in the main app, a 404 error will be raised in that case (because the get method
        won't be overwritten in that case)
        """
        raise tornado.web.HTTPError(404, reason='Page not found')

    def get_current_user(self):
        # Disables authentication if test mode to ease integration testing
        if self.application.test_mode:
            return 'Testing User!'
        else:
            return self.get_secure_cookie("user")

    def get_current_user_name(self):
        # Fix ridiculous bug with quotation marks showing on the web
        user = self.get_current_user()
        if user:
            if (user[0] == '"') and (user[-1] == '"'):
                return user[1:-1]
            else:
                return user
        return user

    def get_current_user_email(self):
        # Disables authentication if test mode to ease integration testing
        if self.application.test_mode:
            return 'Testing User!'
        else:
            return self.get_secure_cookie("email")

    def write_error(self, status_code, **kwargs):
        """ Overwrites write_error method to have custom error pages.

        http://tornado.readthedocs.org/en/latest/web.html#tornado.web.RequestHandler.write_error
        """
        reason = 'Unknown Error'

        # Get information about the triggered exception
        self.application.gs_globals['exception_fulltext'] = repr(sys.exc_info())

        # Get the status code and error reason
        if status_code in ERROR_CODES.keys():
            reason = ERROR_CODES[status_code]
        try:
            if 'exc_info' in kwargs:
                _, error, _ = kwargs['exc_info']
                reason = error.reason
        except AttributeError:
            pass

        # Return JSON if this is an API call
        if '/api/v1/' in self.request.uri:
            jsondict = {
                'page_title': "Error {}: {}".format(status_code, reason),
                'error_status': status_code,
                'error_reason': reason,
                'error_exception': self.application.gs_globals['exception_fulltext']
            }
            self.set_header("Content-type", "application/json")
            self.write(json.dumps(jsondict))

        # Render the error template
        else:
            t = self.application.loader.load("error_page.html")
            self.write(t.generate(gs_globals=self.application.gs_globals, status=status_code, reason=reason, user=self.get_current_user_name()))

    def get_multiqc(self, project_id):
        """
        Getting multiqc reports for requested project from the filesystem
        Returns a string containing html if report exists, otherwise None
        """
        view = self.application.projects_db.view('project/id_name_dates')
        rows = view[project_id].rows
        project_name = ''
        # get only the first one
        for row in rows:
            project_name = row.value.get('project_name', '')
            break

        if project_name:
            multiqc_name = '{}_multiqc_report.html'.format(project_name)
            multiqc_path = self.application.multiqc_path or ''
            multiqc_path = os.path.join(multiqc_path, multiqc_name)
            if os.path.exists(multiqc_path):
                with open(multiqc_path, 'r') as multiqc_file:
                    html = multiqc_file.read()
                    return html
        return None


class SafeHandler(BaseHandler):
    """ All handlers that need authentication and authorization should inherit
    from this class.
    """
    @tornado.web.authenticated
    def prepare(self):
        """This method is called before any other method.

        Having the decorator @tornado.web.authenticated here implies that all
        the Handlers that inherit from this one are going to require
        authentication in all their methods.
        """
        pass


class UnsafeHandler(BaseHandler):
    pass


class MainHandler(UnsafeHandler):
    """ Serves the html front page upon request.
    """

    def get(self):
        t = self.application.loader.load("index.html")
        user = self.get_current_user_name()
        # Avoids pulling all historic data by assuming we have less than 30 NAS:es
        view = self.application.server_status_db.view('nases/by_timestamp', descending=True, limit=30)
        latest = max([parser.parse(row.key) for row in view.rows])
        # assuming that status db is not being updated more often than every 5 minutes
        reduced_rows = [row for row in view.rows if latest - parser.parse(row.key) <= timedelta(minutes=5)]
        instruments = self.application.server_status['instruments']
        server_status = {}
        for row in reduced_rows:
            server = row.value.get('name')
            if server is None:
                continue
            if server not in server_status:
                server_status[server] = row.value
                server_status[server]['instrument'] = instruments[server] or '-'
                used_percentage = float(row.value.get('used_percentage', '0').replace('%',''))
                if used_percentage > 60:
                    server_status[server]['css_class'] = 'q-warning'
                elif used_percentage > 80:
                    server_status[server]['css_class'] = 'q-danger'
                else:
                    server_status[server]['css_class'] = ''
        # sort by used space
        server_status = sorted(server_status.items(), key = lambda item: item[1].get('used_percentage'), reverse=True)

        self.write(t.generate(gs_globals=self.application.gs_globals,
                              user=user, server_status=server_status))

def dthandler(obj):
    """ISO formatting for datetime to be used in JSON.
    """
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    else:
        raise TypeError, "Object can not be isoformatted."


################################
# Useful data-serving handlers #
################################

class DataHandler(UnsafeHandler):
    """ Serves a listing of all available URL's in the web service.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        handlers = [h[0] for h in self.application.declared_handlers]
        api = filter(lambda h: h.startswith("/api"), handlers)
        utils = filter(lambda h: h == "/login" or h == "/logout", handlers)
        pages = list(set(handlers).difference(set(api)).difference(set(utils)))
        pages = filter(lambda h: not (h.endswith("?") or h.endswith("$")), pages)
        pages.sort(reverse=True)
        api.sort(reverse=True)
        self.write(json.dumps({"api": api, "pages": pages}))


class UpdatedDocumentsDatahandler(SafeHandler):
    """ Serves a list of references to the last updated documents in the
    databases Status gets data from.

    Specify to get the <n> latest items by ?items=<n>.

    Loaded through /api/v1/last_updated
    """
    def get(self):
        num_items = int(self.get_argument("items", 25))
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_updated(num_items)))

    def list_updated(self, num_items=25):
        last = []

        view = self.application.samples_db.view("time/last_updated",
                                                limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Sample information'))

        view = self.application.projects_db.view("time/last_updated",
                                                 limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Project information'))

        view = self.application.flowcells_db.view("time/last_updated",
                                                  limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Flowcell information'))

        last = sorted(last, key=lambda tr: tr[0], reverse=True)
        return last[:num_items]

class PagedQCDataHandler(SafeHandler):
    """ Serves a list of 50 sample names following a given string
    in alhabetical order.

    loaded through /api/v1/samples/start/([^/]*)$
    """
    def get(self, startkey):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_samples(startkey)))

    def list_samples(self, startkey):
        sample_list = []
        view = self.application.samples_db.view("names/samplename_run",
                                                group_level=1,
                                                limit=50,
                                                startkey=startkey)
        for row in view:
            sample_list.append(row.key)

        return sample_list

class SafeStaticFileHandler(SafeHandler, tornado.web.StaticFileHandler):
    """ Serve static files for authenticated users
    """
    pass


class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
    """ Serves up static files without any tornado caching.
    https://gist.github.com/omarish/5499385
    """
    def set_extra_headers(self, path):
        self.set_header("Cache-control", "no-cache")

class LastPSULRunHandler(SafeHandler):
    """Gives the date of the last PSUL run, assumin the logfile is where we expect it"""
    def get(self):
        logfile=self.application.psul_log
        response = {}
        try:
            text_timestamp = os.stat(logfile).st_mtime
            delta = datetime.now() - datetime.fromtimestamp(int(text_timestamp))
        except (OSError, KeyError, TypeError):
            response['status'] = "Log File '{}' not found.".format(logfile)
        else:
            response['status'] = "Success"
            response['hours'] = int(delta.seconds/3600)
            response['minutes'] = int((delta.seconds%3600)/60)
            response['seconds'] = int(delta.seconds%60)

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))


########################
# Other useful classes #
########################

class GoogleUser(object):
    """Stores the information that google returns from a user throuhgh its secured API.
    """
    def __init__(self, user_token):
        assert user_token.has_key('access_token')

        self.user_token = user_token
        self._google_plus_api = "https://www.googleapis.com/plus/v1/people/me"

        #Fetch actual information from Google API
        params = {'access_token': self.user_token.get('access_token')}
        r = requests.get(self._google_plus_api, params=params)
        if not r.status_code == requests.status_codes.codes.OK:
            self.authenticated = False
        else:
            self.authenticated = True
            info = json.loads(r.text)
            self.display_name = info.get('displayName', '')
            self.emails = [email['value'] for email in info.get('emails')]

    def is_authorized(self, user_view):
        """Checks that the user is actually authorised to use genomics-status.
        """
        authenticated = False
        for email in self.emails:
            if user_view[email]:
                self.valid_email = email
                authenticated = True
        return authenticated
