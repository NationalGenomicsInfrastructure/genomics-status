import json

import tornado.auth
import tornado.web

from status.util import GoogleUser, UnsafeHandler


class LoginHandler(tornado.web.RequestHandler, tornado.auth.GoogleOAuth2Mixin):
    @tornado.gen.coroutine
    def get(self):
        if self.get_argument("code", False):
            user_token = yield self.get_authenticated_user(
                redirect_uri=self.application.settings["redirect_uri"],
                code=self.get_argument("code"),
            )
            user = GoogleUser(user_token)
            user_view = self.application.gs_users_db.view(
                "authorized/users", reduce=False
            )
            user_roles = self.application.gs_users_db.view(
                "authorized/roles", reduce=False
            )
            if user.authenticated and user.is_authorized(user_view):
                self.set_secure_cookie("user", user.display_name)
                # It will have at least one email (otherwise she couldn't log in)
                self.set_secure_cookie("email", user.emails[0])
                if user_roles[user.emails[0]].rows[0].value:
                    user_roles = [*user_roles[user.emails[0]].rows[0].value]
                else:
                    user_roles = ["user"]
                self.set_secure_cookie("roles", json.dumps(user_roles))
                url = self.get_secure_cookie("login_redirect")
                self.clear_cookie("login_redirect")
                if url is None:
                    url = "/"
            else:
                url = f"/unauthorized?email={user.emails[0]}&contact={self.application.settings['contact_person']}"
            self.redirect(url)

        else:
            self.set_secure_cookie("login_redirect", self.get_argument("next", "/"), 1)
            self.authorize_redirect(
                redirect_uri=self.application.settings["redirect_uri"],
                client_id=self.application.oauth_key,
                scope=["profile", "email"],
                response_type="code",
            )


class LogoutHandler(tornado.web.RequestHandler, tornado.auth.GoogleOAuth2Mixin):
    def get(self):
        self.clear_cookie("user")
        self.clear_cookie("email")
        self.redirect("/")


class UnAuthorizedHandler(UnsafeHandler):
    """Serves a page with unauthorized notice and information about who to contact to get access."""

    def get(self):
        # The parameters email and name can contain anything,
        # be careful not to evaluate them as code
        email = self.get_argument("email", "")
        name = self.get_argument("name", "")
        contact = self.get_argument("contact", "contact@example.com")
        t = self.application.loader.load("unauthorized.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=name,
                email=email,
                contact=contact,
            )
        )
