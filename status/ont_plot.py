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
            first_term = last_month.strftime("%Y%m%d")
            second_term = datetime.datetime.now().strftime("%Y%m%d")
        else:
            first_term, second_term = [
                datetime.datetime.strptime(date_str, "%y%m%d").strftime("%Y%m%d")
                for date_str in search_string.split("-")
            ]

        docs = [
            x["value"]
            for x in self.application.cloudant.post_view(
                db="nanopore_runs",
                ddoc="info",
                view="all_stats",
                start_key=first_term,
                end_key=second_term,
            ).get_result()["rows"]
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
