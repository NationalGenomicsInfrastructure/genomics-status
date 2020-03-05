import tornado.web
import json
import time
import copy
import base64
import requests

from status.util import SafeHandler
from status.projects import PresetsHandler as ph

class UserPrefPageHandler(SafeHandler):
    """ Serves a modal with user preferences and saves them
    URL: /userpref
    """
    def get(self):
        t = self.application.loader.load("user_preferences.html")
        notf_pref = ph.get_user_details(self.application, self.get_current_user().email).get('notification_preferences', 'Both')
        self.write(t.generate(pref=notf_pref))

    def post(self):
        option = json.loads(self.request.body)
        doc = ph.get_user_details(self.application, self.get_current_user().email)
        doc['notification_preferences'] = option['notification_preferences']
        try:
            self.application.gs_users_db.save(doc)
        except Exception as e:
            self.set_status(400)
            self.write(e.message)

        self.set_status(201)
        self.write({'success': 'success!!'})
