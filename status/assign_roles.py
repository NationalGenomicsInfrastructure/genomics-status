import tornado.web
import json
import time
import copy
import base64
import requests

from dateutil import parser
from status.util import SafeHandler, UnsafeHandler
from status.authorization import UnAuthorizedHandler


class AssignRolesHandler(SafeHandler):
    """ Serves a page with users and roles listed, with the option to create new users
    URL: /assign_roles
    """
    def get(self):
        t = self.application.loader.load("assign_roles.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user(),
        roles=self.application.genstat_defaults['roles']))


class AssignRolesUsersHandler(SafeHandler):
    """Serves the data for populating user roles table and also methods to modify user roles
    URL: /api/v1/assign_roles/users
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        view_result={}
        for row in self.application.gs_users_db.view('authorized/roles'):
            view_result[row.key]=row.value
        self.write(view_result)

    def post(self):
        data = json.loads(self.request.body)
        userToChange = data['username']
        headers = {"Accept": "application/json",
                   "Authorization": "Basic " + "{}:{}".format(base64.b64encode(bytes(self.application.settings.get("username", None), 'ascii')),
                   base64.b64encode(bytes(self.application.settings.get("password", None), 'ascii')))}

        idtoChange=''
        for row in self.application.gs_users_db.view('authorized/users'):
            if row.get('key') == userToChange:
                idtoChange = row.get('value')
        action = self.get_argument('action')
        if self.get_current_user().role == 'admin':
            if action == 'create':
                if idtoChange:
                    self.set_status(409)
                    self.write('User already exists!')
                else:
                    try:
                        self.application.gs_users_db.save(data)
                    except Exception as e:
                        self.set_status(400)
                        self.write(e.message)

                    self.set_status(201)
                    self.write({'success': 'success!!'})
            else:
                user_url = "{}/gs_users/{}".format(self.application.settings.get("couch_server"), idtoChange)
                r = requests.get(user_url, headers=headers).content.rstrip()
                user_doc=json.loads(r)
                if action=='modify' and idtoChange:
                    user_doc['role'] = data['role']
                    try:
                        self.application.gs_users_db.save(user_doc)
                    except Exception as e:
                        self.set_status(400)
                        self.write(e.message)

                    self.set_status(201)
                    self.write({'success': 'success!!'})

                elif action=='delete' and idtoChange:
                    try:
                        self.application.gs_users_db.delete(user_doc)
                    except Exception as e:
                        self.set_status(400)
                        self.write(e.message)

                    self.set_status(201)
                    self.write({'success': 'success!!'})
                else:
                    self.set_status(400)
                    self.write('User not selected!')
        else:
            self.set_status(401)
            self.finish('<html><body>Your user does not have permission to perform this operation!</body></html>')
