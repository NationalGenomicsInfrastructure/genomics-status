import json
import datetime

from status.util import dthandler, SafeHandler


def filter_data(data, search=None):
    if not search:
        last_month = datetime.datetime.now()-datetime.timedelta(days=30)
        first_term = last_month.isoformat()[2:10].replace('-','')
        second_term = datetime.datetime.now().isoformat()[2:10].replace('-','')
        search = "{}-{}".format(first_term, second_term)


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
        t = self.application.loader.load("flowcell_trend_plot.html")
        self.write(t.generate(gs_globals=self.application.gs_globals,
                              user=self.get_current_user()))


class FlowcellCountPlotHandler(SafeHandler):
    """ Handles the flowcell_count_plot page

    Loaded through /flowcell_count_plot/([^/]*)$
    """
    def get(self):
        t = self.application.loader.load("flowcell_count_plot.html")
        self.write(t.generate(gs_globals=self.application.gs_globals,
                              user=self.get_current_user()))


def filter_count_data(app, group_level, start_date, end_date, display_type):
    data = []
    group_level = int(group_level)
    start_date = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    end_date = datetime.datetime.strptime(end_date, "%Y-%m-%d")
    expected_format=["%Y", "%m", "%W", "%d"]
    view = app.application.x_flowcells_db.view("plot/count", reduce=True, group = True, group_level = group_level)
    for row in view:
        datestring = "-".join([str(x) for x in row.key[1:]])
        formatstring = "-".join(expected_format[0:group_level-1])
        if group_level == 4:#ugly hack to get weeks working
            datestring = "{}-0".format(datestring)
            formatstring = "{}-%w".format(formatstring)
        row_date = datetime.datetime.strptime(datestring, formatstring)
        if row_date <=end_date and row_date >=start_date :
            one_entry = row.key
            one_entry.append(row.value)
            data.append(one_entry)

    return data



class FlowcellCountApiHandler(SafeHandler):
    def get(self):
        group_level = self.get_argument('group_level', '4') #default is week number
        start_date = self.get_argument('start_date', '2014-01-01')
        end_date = self.get_argument('end_date', datetime.datetime.now().isoformat()[0:10])
        display_type = self.get_argument('display_type', 'instrument')
        data = filter_count_data(self, group_level, start_date, end_date, display_type)
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(data))
