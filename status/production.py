""" Handlers related to data production.
"""
from datetime import datetime

from dateutil import parser

from status.util import SafeHandler


class ProductionCronjobsHandler(SafeHandler):
    """Returns a JSON document with the Cronjobs database information"""

    def get(self):
        cronjobs = {}
        servers = self.application.cronjobs_db.view("server/alias")
        for server in servers.rows:
            doc = self.application.cronjobs_db.get(server.value)
            cronjobs[server.key] = {
                "last_updated": datetime.strftime(
                    parser.parse(doc["Last updated"]), "%Y-%m-%d %H:%M"
                ),
                "users": doc["users"],
                "server": server.key,
            }
        template = self.application.loader.load("cronjobs.html")
        self.write(
            template.generate(
                gs_globals=self.application.gs_globals,
                cronjobs=cronjobs,
                user=self.get_current_user(),
            )
        )

