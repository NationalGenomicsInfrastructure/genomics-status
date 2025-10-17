"""Handlers related to data production."""

from datetime import datetime

from dateutil import parser

from status.util import SafeHandler


class ProductionCronjobsHandler(SafeHandler):
    """Returns a JSON document with the Cronjobs database information"""

    def get(self):
        cronjobs = {}
        servers = self.application.cloudant.post_view(
            db="cronjobs",
            ddoc="server",
            view="alias",
            include_docs=True,
        ).get_result()["rows"]
        for server in servers:
            doc = server["doc"]
            cronjobs[server["key"]] = {
                "last_updated": datetime.strftime(
                    parser.parse(doc["Last updated"]), "%Y-%m-%d %H:%M"
                ),
                "users": doc["users"],
                "server": server["key"],
            }
        template = self.application.loader.load("cronjobs.html")
        self.write(
            template.generate(
                gs_globals=self.application.gs_globals,
                cronjobs=cronjobs,
                user=self.get_current_user(),
            )
        )
