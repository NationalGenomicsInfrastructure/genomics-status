import datetime
import json

from status.util import SafeHandler


class DataFlowcellYieldHandler(SafeHandler):
    """Handles the api call to reads_plot data

    Loaded through /api/v1/reads_plot/([^/]*)$
    """

    def get(self, search_string=None):
        if search_string is None:
            last_month = datetime.datetime.now() - datetime.timedelta(days=30)
            first_term = last_month.isoformat()[2:10].replace("-", "")
            second_term = datetime.datetime.now().isoformat()[2:10].replace("-", "")
        else:
            first_term, second_term = search_string.split('-')

        docs = [x.value for x in self.application.x_flowcells_db.view("plot/reads_yield")[first_term:second_term+'ZZZZ'].rows]

        for doc in docs:
            fc_yield = int(doc.get('total_yield')) / 1000000
            doc['total_yield'] = fc_yield

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(docs))


class FlowcellPlotHandler(SafeHandler):
    """Handles the yield_plot page

    Loaded through /flowcell_plot/([^/]*)$
    """

    def get(self):
        t = self.application.loader.load("flowcell_trend_plot.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )
