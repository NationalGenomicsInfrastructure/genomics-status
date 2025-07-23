import datetime
import json

from status.util import SafeHandler


class DataDeliveryHandler(SafeHandler):
    """Handles the api call to proj_staged data
    Loaded through /api/v1/proj_staged/([^/]*)$
    """

    def get(self, search_string=None):
        today = datetime.date.today()
        if search_string:
            start_date, end_date = search_string.split("--")
        else:
            last_month = today - datetime.timedelta(days=30)
            start_date = last_month.isoformat()
            end_date = today.isoformat()

        docs = self.application.cloudant.post_view(
            db="projects",
            ddoc="project",
            view="staged_files_sum"
        ).get_result()["rows"]
        # Projects without close date are filtered out
        data = [
            (d["key"], d["value"])
            for d in docs
            if start_date <= d["value"].get("close_date", "ZZZZ-ZZ-ZZ") < end_date
        ]
        data = sorted(data, key=lambda d: d[1].get("close_date"))

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(data))


class DeliveryPlotHandler(SafeHandler):
    """Handles the delivery_plot page
    Loaded through /data_delivered_plot
    """

    def get(self):
        t = self.application.loader.load("data_delivered_plot.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )
