import json

from status.util import SafeHandler

class LanesOrderedHandler(SafeHandler):
    """Serves a page with statistics over lanes ordered"""
    
    def get(self):
        t = self.application.loader.load("lanes_ordered.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )

class LanesOrderedDataHandler(SafeHandler):
    """Delivers data for the Lanes Ordered statistics page"""

    def get(self):
        view = self.application.projects_db.view("project/status_lanes_ordered", group_level=3, reduce=True)
        self.write(json.dumps(view.rows))