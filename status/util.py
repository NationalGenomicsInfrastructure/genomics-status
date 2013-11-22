import tornado.web
import tornado.auth
import json

from datetime import datetime


#########################
#  Useful misc handlers #
#########################

class AuthHandler(tornado.web.RequestHandler, tornado.auth.GoogleMixin):
    @tornado.web.asynchronous
    def get(self):
        if self.get_argument("openid.mode", None):
            self.get_authenticated_user(self.async_callback(self._on_auth))
            return
        self.authenticate_redirect()

    def _on_auth(self, user):
        if not user:
            raise tornado.web.HTTPError(500, "Google auth failed")
        self.set_secure_cookie("user", tornado.escape.json_encode(user))
        self.set_secure_cookie("email", user['email'])
        self.redirect("/")


class BaseHandler(tornado.web.RequestHandler):
    """Base Handler.

    Ease the authentication process.
    """
    def get_current_user(self):
        return self.get_secure_cookie("user")

    @tornado.web.authenticated
    def prepare(self):
        """This method is called before any other method.

        Having the decorator @tornado.web.authenticated here implies that all
        the Handlers that inherit from this one are going to require
        authentication in all their methods.
        """
        pass


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

class DataHandler(tornado.web.RequestHandler):
    """ Serves a listing of all available URL's in the web service.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        handlers = [h[0] for h in self.application.declared_handlers]
        api = filter(lambda h: h.startswith("/api"), handlers)
        pages = list(set(handlers).difference(set(api)))
        pages = filter(lambda h: not (h.endswith("?") or h.endswith("$")), pages)
        pages.sort(reverse=True)
        api.sort(reverse=True)
        self.write(json.dumps({"api": api, "pages": pages}))


class UpdatedDocumentsDatahandler(tornado.web.RequestHandler):
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

        view = self.application.amanita_db.view("sizes/home_total",
                                                limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Amanita storage usage'))

        view = self.application.picea_db.view("sizes/home_total",
                                              limit=num_items, descending=True)
        for doc in view:
            last.append((doc.key, doc.value, 'Picea storage usage'))

        last = sorted(last, key=lambda tr: tr[0], reverse=True)
        return last[:num_items]


class PagedQCDataHandler(tornado.web.RequestHandler):
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
