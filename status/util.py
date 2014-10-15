import tornado.web
import tornado.auth
import json
import requests
import os
import time

from datetime import datetime


#########################
#  Useful misc handlers #
#########################

class BaseHandler(tornado.web.RequestHandler):
    """Base Handler. Handlers should not inherit from this
    class directly but from either SafeHandler or UnsafeHandler
    to make security status explicit.

    """
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
        self.write(t.generate(user=self.get_current_user_name()))



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

        view = self.application.uppmax_db.view("time/last_updated",
                                               limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'UPPNEX Quota usage'))

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
        logfile="/home/hiseq.bioinfo/lims2db_projects.log"
        response = {}
        try:
            delta=datetime.now()-datetime.fromtimestamp(int(os.stat(logfile).st_mtime))
        except OSError:
            response['status'] = "File not found"
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

