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

        bp_list = self.calculate_fc_yield()
        plot_docs = [x.value for x in self.application.x_flowcells_db.view("plot/reads_yield")[first_term:second_term+'ZZZZ'].rows]

        for k in plot_docs:
            for fc, bp in bp_list:
                if k.get('id') == fc:
                    k['bp_yield'] = bp

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(plot_docs))

    def calculate_fc_yield(self):
        bp_list = []

        fc_sum_doc = [x for x in self.application.x_flowcells_db.view("info/summary2_full_id")]

        for d in fc_sum_doc:
            fc_yield = 0
            fc = d.get('key')
            values = d.get('value')

            if values:
                lanedata = values.get('lanedata')

                if lanedata and isinstance(lanedata, dict):
                    for k, v in lanedata.items():
                        bp = v.get('yield')
                        bp_no_float = float(bp.replace(',', '').replace('.', ''))
                        bp_no_int = int(bp_no_float) / 100000
                        round_bp_no = round(bp_no_int, 2)
                        fc_yield += round_bp_no
                        list_pair = (fc, fc_yield)
                        bp_list.append(list_pair)

        return bp_list


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
