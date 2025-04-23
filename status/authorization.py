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
                "authorized/info", reduce=False
            )
            if user.authenticated and user.is_authorized(user_view):
                self.set_secure_cookie("user", user.display_name)

                self.check_and_update_statusdb_user_name(
                    user.emails[0], user.display_name
                )

                # It will have at least one email (otherwise she couldn't log in)
                self.set_secure_cookie("email", user.emails[0])
                user_info_row = user_roles[user.emails[0]].rows[0]
                if user_info_row.value and "roles" in user_info_row.value:
                    user_roles = [*user_info_row.value["roles"]]
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

    def check_and_update_statusdb_user_name(self, user_email: str, user_name: str):
        """
        Check if the user name is already in the status database and update it if necessary
        """

        gs_user_info = self.application.cloudant.post_view(
            db="gs_users",
            ddoc="authorized",
            view="info",
            key=user_email,
            include_docs=True,
        ).get_result()

        if len(gs_user_info["rows"]) == 1:
            row = gs_user_info["rows"][0]
            gs_user_name = row["value"].get("name", "")

            if gs_user_name != user_name:
                # Update the gs_user name, so that it's possible to change name in google and have it updated in statusdb
                current_doc = row["doc"]
                current_doc["name"] = user_name
                self.application.cloudant.put_document(
                    db="gs_users", doc_id=current_doc["_id"], document=current_doc
                )
        # We'll ignore the other cases


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
