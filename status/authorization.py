import tornado.web
import tornado.auth
import json
import requests

from status.util import UnsafeHandler, GoogleUser

class LoginHandler(tornado.web.RequestHandler, tornado.auth.GoogleOAuth2Mixin):
    @tornado.gen.coroutine
    def get(self):
        if self.get_argument("code", False):
            user_token =  yield self.get_authenticated_user(
                    redirect_uri='https://genomics-status.scilifelab.se/login',
                code=self.get_argument('code')
                )
            user = GoogleUser(user_token)
            user_view = self.application.gs_users_db.view("authorized/users", reduce=False)
            if user.authenticated and user.is_authorized(user_view):
                self.set_secure_cookie('user', user.display_name)
                url = '/'
            else:
                url = "/unauthorized?email={0}&contact={1}".format(user.emails[0],
                        self.application.settings['contact_person'])
            self.redirect(url)

        else:
            self.authorize_redirect(
                    redirect_uri='https://genomics-status.scilifelab.se/login',
                        client_id=self.application.oauth_key,
                        scope=['profile', 'email'],
                        response_type='code',
                        extra_params={'approval_prompt': 'auto'})

class LogoutHandler(tornado.web.RequestHandler, tornado.auth.GoogleMixin):
    def get(self):
        self.clear_cookie("user")
        self.clear_cookie("email")
        self.redirect("/")


class UnAuthorizedHandler(UnsafeHandler):
    """ Serves a page with unauthorized notice and information about who to contact to get access. """
    def get(self):
        # The parameters email and name can contain anything,
        # be careful not to evaluate them as code
        email = self.get_argument("email", '')
        name = self.get_argument("name", '')
        contact = self.get_argument("contact", "contact@example.com")
        t = self.application.loader.load("unauthorized.html")
        self.write(t.generate(user = name, email=email, contact=contact))
