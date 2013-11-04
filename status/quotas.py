import tornado.web
import json
import time

from dateutil import parser
from status.util import dthandler


class QuotasHandler(tornado.web.RequestHandler):
    """ Serves a grid of time series plots for UPPNEX storage quotas.
    """
    def get(self):
        t = self.application.loader.load("quota_grid.html")
        self.write(t.generate())


class QuotaHandler(tornado.web.RequestHandler):
    """ Serves a page with a plot of a time series of used storage quota for
    a provided UPPNEX project.
    """
    def get(self, project):
        t = self.application.loader.load("quota.html")
        self.write(t.generate(project=project))


class QuotaDataHandler(tornado.web.RequestHandler):
    """ Serves a time series for storage quota usage of a given UPPNEX
    project. 

    Handles url: /api/v1/quotas/([^/]*)$
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.project_storage_quota(project),
                              default=dthandler))

    def project_storage_quota(self, project):
        proj_getter = lambda row: row.key[0]
        proj_checker = lambda row: proj_getter(row) == project
        date_getter = lambda row: row.key[1]
        view = self.application.uppmax_db.view("status/project_quota_usage_over_time")
        r_list = filter(proj_checker, view)
        r_list = sorted(r_list, key=date_getter)

        # 1024 ** 3
        gb = 1073741824
        data = []
        for row in r_list:
            if row.value[0]:
                y = row.value[0]
            else:
                y = 0
            data.append({"x": int(time.mktime(parser.parse(date_getter(row)).timetuple())),
                         "y": y * gb})

        d = dict()
        d["data"] = data
        d["name"] = "series"
        return [d]
