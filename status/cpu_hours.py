import tornado.web
import json
import time

from dateutil import parser
from status.util import dthandler, SafeHandler


class CPUHoursDataHandler(SafeHandler):
    """ Serves a time series for CPU hours usage of a given UPPNEX
    project.

    Loaded through /api/v1/cpu_hours/(\w+)?
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.cpu_hours_usage(project),
                              default=dthandler))

    def cpu_hours_usage(self, project):

        proj_getter = lambda row: row.key[0] if row.key is not None else None
        proj_checker = lambda row: proj_getter(row) == project
        date_getter = lambda row: row.key[1] if row.key is not None else None

        view = self.application.uppmax_db.view("status/project_cpu_usage_over_time")

        r_list = filter(proj_checker, view)
        r_list = sorted(r_list, key=date_getter)

        data = []
        for row in r_list:
            try:
                if row.value:
                    data.append({"x": int(time.mktime(parser.parse(date_getter(row)).timetuple())),
                                 "y": row.value[0],
                                 "limit": row.value[1]})
            except TypeError:
                # Some nobackup areas were not accessible in Uppmax at some point,
                # and that caused the usage value to be None. Skip those.
                pass

        d = dict()
        d["data"] = data
        d["name"] = "series"
        return [d]
