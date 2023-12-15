import json
import datetime

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

        ont_list = self.fetch_ont_data()

        docs = [x.value for x in self.application.x_flowcells_db.view("plot/reads_yield")[first_term:second_term+'ZZZZ'].rows]

        for doc in docs:
            fc_yield = int(doc.get('total_yield')) / 1000000
            doc['total_yield'] = fc_yield

        docs.extend(ont_list)

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(docs))

    def fetch_ont_data(self):
        ont_list = []
        docs = [x for x in self.application.nanopore_runs_db.view("info/all_stats")]

        for doc in docs:
            fc_id = doc.get('key')
            value_dict = doc.get('value', {})
            instrument = value_dict.get('instrument')
            if instrument is None:
                continue
            yield_passed = int(value_dict.get('basecalled_pass_bases', 0))
            read_count_passed = int(value_dict.get('basecalled_pass_read_count', 0))
            if None in [yield_passed, read_count_passed]:
                continue
            if instrument == "PromethION 24":
                cver = '24'
            elif instrument == "MN19414":
                cver = '19414'
            ont_data = {'id': fc_id, 'instrument': instrument, 'cver': cver, 'yield_passed': yield_passed, 'read_count_passed': read_count_passed}
            ont_list.append(ont_data)

        return ont_list


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
