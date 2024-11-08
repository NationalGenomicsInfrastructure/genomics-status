import datetime
import json

from status.util import SafeHandler


class ONTFlowcellYieldHandler(SafeHandler):
    """Handles the api call to ont data

    Loaded through /api/v1/ont_plot/([^/]*)$
    """

    def get(self, search_string=None):
        if search_string is None:
            last_month = datetime.datetime.now() - datetime.timedelta(days=30)
            first_term = last_month.isoformat()[2:10].replace("-", "")
            second_term = datetime.datetime.now().isoformat()[2:10].replace("-", "")
        else:
            first_term, second_term = search_string.split("-")

        docs = [
            x.value
            for x in self.application.nanopore_runs_db.view("info/all_stats")[
                "20" + first_term : "20" + second_term + "ZZZZ"
            ].rows
        ]

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(docs))


class ONTFlowcellPlotHandler(SafeHandler):
    """Handles the ONT flowcell plot page

    Loaded through /ont_flowcell_plot/([^/]*)$
    """

    def get(self):
        t = self.application.loader.load("ont_trend_plot.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )
