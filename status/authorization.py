import tornado.web
import tornado.auth
import json

from status.util import UnsafeHandler

class LoginHandler(tornado.web.RequestHandler, tornado.auth.GoogleMixin):
    @tornado.web.asynchronous
    def get(self):
        if self.get_argument("openid.mode", None):
            self.get_authenticated_user(self.async_callback(self._on_auth))
            return
        self.authenticate_redirect()

    def _on_auth(self, user):
        if not user:
            raise tornado.web.HTTPError(500, "Google auth failed")
        user_view = self.application.gs_users_db.view("authorized/users", reduce=False)
        authorized = False
        for row in user_view[user['email']]:
            authorized = (row.key == user['email'])
            break
        if authorized:
            self.set_secure_cookie("user", tornado.escape.json_encode(user))
            self.set_secure_cookie("email", user['email'])
            url = self.get_argument('next', None)
            if url:
                self.redirect(url)
            else:
                self.redirect("/")
        else:
            url = "/unauthorized?email={0}".format(user['email'])
            if "name" in user:
                url += "&name={0}".format(user["name"])
            self.redirect(url)

class LogoutHandler(tornado.web.RequestHandler, tornado.auth.GoogleMixin):
    def get(self):
        self.clear_cookie("user")
        self.clear_cookie("email")
        self.redirect("/")


class UnAuthorizedHandler(UnsafeHandler):
    """ Serves a page with unauthorized notice and information about who to contact to get access. """ 
    def get(self):
        email = self.get_argument("email", None)
        name = self.get_argument("name", "Dave")
        t = self.application.loader.load("unauthorized.html")
        self.write(t.generate(user = name, email=email))
