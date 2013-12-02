import tornado.web
import tornado.auth
import json
import hashlib

from status.util import UnsafeHandler

class LoginHandler(tornado.web.RequestHandler, tornado.auth.GoogleMixin):
    def get(self):
        error = self.get_argument("error", None)
        t = self.application.loader.load("login.html")
        self.write(t.generate(user = None, error=error))

    def post(self):
        user = self.get_argument("inputEmail", None)
        password = self.get_argument("inputPassword", None)

        # Secret password seed makes it more difficult for a hacker 
        # to log in even if the hashed password is obtained.
        seed = self.application.password_seed
        hashed_password = None
        
        if password and seed:
            # There exists safer hashing algorithms for passwords, 
            # should be considered if a higher security level is needed.
            hashed_password = hashlib.sha256(seed + password).hexdigest()

        authorized = False
        if user and hashed_password:
            user_view = self.application.gs_users_db.view("authorized/users", reduce=False)[user]
            rows = user_view.rows
            if len(rows) == 1:
                row = rows[0]
                authorized = (hashed_password == row.value)
        
        if authorized:
            self.set_secure_cookie("user", tornado.escape.json_encode(user))
            url = self.get_argument('next', None)
            if url:
                self.redirect(url)
            else:
                self.redirect("/")
        else:
            error_msg = u"?error=" + tornado.escape.url_escape("Login incorrect.")
            self.redirect(self.get_login_url() + error_msg)

class LogoutHandler(tornado.web.RequestHandler, tornado.auth.GoogleMixin):
    def get(self):
        self.clear_cookie("user")
        self.redirect("/")


class UnAuthorizedHandler(UnsafeHandler):
    """ Serves a page with unauthorized notice and information about who to contact to get access. """ 
    def get(self):
        # The parameters email and name can contain anything, 
        # be careful not to evaluate them as code
        email = self.get_argument("email", "user@example.com")
        name = self.get_argument("name", "Dave")
        t = self.application.loader.load("unauthorized.html")
        self.write(t.generate(user = name, email=email))
