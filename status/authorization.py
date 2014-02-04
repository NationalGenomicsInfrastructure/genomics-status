import tornado.web
import tornado.auth
import json

from status.util import UnsafeHandler

class LoginHandler(tornado.web.RequestHandler, tornado.auth.GoogleOAuth2Mixin):
    @tornado.gen.coroutine
    def get(self):
        if self.get_argument("code", False):
            user = yield self.get_authenticated_user(
                        redirect_uri='https://genomics-status.scilifelab.se/login',
                        code=self.get_argument('code'))
            self.set_secure_cookie("user", tornado.escape.json_encode(user))    
        else:
            self.authorize_redirect(
                        redirect_uri='https://genomics-status.scilifelab.se/login',
                        client_id=self.application.ouath_key,
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
        email = self.get_argument("email", "user@example.com")
        name = self.get_argument("name", "Dave")
        t = self.application.loader.load("unauthorized.html")
        self.write(t.generate(user = name, email=email))
