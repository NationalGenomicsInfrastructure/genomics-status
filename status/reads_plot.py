
import json
import datetime

from status.util import dthandler, SafeHandler


def filter_data(data, search=None):
    if not search:
        last_month=datetime.datetime.now()-datetime.timedelta(days=30)
        search=last_month.isoformat()[2:10].replace('-','')


    searches=search.split('-')
    return [d for d in data if d['id'][:6] >= searches[0] and d['id'][:6] <= searches[1]]

class DataFlowcellYieldHandler(SafeHandler):
    """ Handles the api call to reads_plot data 

    Loaded through /api/v1/reads_plot/([^/]*)$
    """
    def get(self, search_string=None):
        docs=filter_data([x.value for x in self.application.x_flowcells_db.view("plot/reads_yield")], search_string)
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(docs))

class  FlowcellPlotHandler(SafeHandler):
    """ Handles the yield_plot page

    Loaded through /flowcell_plot/([^/]*)$
    """
    def get(self):
        t = self.application.loader.load("yield_plot.html")
        self.write(t.generate(gs_globals=self.application.gs_globals))


 
