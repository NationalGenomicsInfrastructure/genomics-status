import tornado.web
import json
import time
import copy

from dateutil import parser
from status.util import dthandler, SafeHandler


class NASQuotasHandler(SafeHandler):
    """ Serves a grid of time series plots for UPPNEX storage quotas.
    URL: /quotas
    """
    def get(self):
        view = self.application.server_status_db.view("nases/by_timestamp")
        nases = {}
        for row in view.rows:
            # convert to javascript format
            timestamp = int(time.mktime(parser.parse(row.key).timetuple())) * 1000
            nas_url = row.value.get('name')
            disk_limit = row.value.get('disk_size', '').replace('T', '')
            disk_usage = row.value.get('space_used', '').replace('T', '')
            if disk_limit == '' or disk_usage == '':
                continue
            elif disk_limit.lower() == 'nan' or disk_usage.lower() == 'nan':
                continue
            else:
                disk_limit = float(disk_limit)
                disk_usage = float(disk_usage)
            if nas_url not in nases:
                nases[nas_url] = {'min_time': timestamp, 'max_x_value': 0, 'plot_data': [], 'limit_data': []}
            nas = nases[nas_url]
            nas['min_time'] = min(nas['min_time'], timestamp)
            nas['max_x_value'] = max(nas['max_x_value'], disk_usage, disk_limit)
            nas['plot_data'].append([timestamp, disk_usage])
            nas['limit_data'].append([timestamp, disk_limit])

        t = self.application.loader.load("nas_quotas.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user_name(),
                              nases=nases))
