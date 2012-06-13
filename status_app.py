from datetime import datetime
from dateutil import parser
import time
import json

import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado import template

from couchdb import Server
import yaml

import random


def dthandler(obj):
    """ISO formatting for datetime to be used in JSON.
    """
    if isinstance(obj, datetime):
        return obj.isoformat()


class MainHandler(tornado.web.RequestHandler):
    def get(self, q):
        if q == None:
            q = "quotas"

        if q == "test":
            t = self.application.loader.load("test_grid.html")
            self.write(t.generate())

        elif q == "quotas":
            projects = ["a2010002", "a2010003", "a2012043", "b2010029", "b2010062"]
            # Above hardcoded list should be replaced by some sort of REST call,
            # either here or in the template, to */data/projects/.
            t = self.application.loader.load("quota_grid.html")
            self.write(t.generate(projects=projects))

        else:
            self.write(q)


class DataHandler(tornado.web.RequestHandler):
    def get(self, q1, q2):

        self.set_header("Content-type", "application/json")

        if q1 == "test":
            self.write(json.dumps(self.random_series(int(q2)), default=dthandler))

        elif q1 == "sizes":
            self.write(json.dumps(self.cum_flowcell_sizes(), default=dthandler))

        elif q1 == "quotas":
            self.write(json.dumps(self.project_storage_quota(q2), default=dthandler))

        elif q1 == "projects":
            self.write(json.dumps(self.list_projects()))

        else:
            # self.write(json.dumps(dates_and_sizes, default=dthandler))
            self.write(json.dumps((q1, q2), default=dthandler))

    def random_series(self, n):
        s = [{"y":random.randint(10, 99), "x":i} for i in xrange(int(n))]
        d = dict()
        d["data"] = s
        d["name"] = "series"
        return [d]

    def cum_flowcell_sizes(self):
        fc_list = []
        for row in self.application.illumina_db.view("status/final_flowcell_sizes", group_level=1):
            fc_list.append({"name": row.key, "time": row.value[0], "size": row.value[1]})

        fc_list = sorted(fc_list, key=lambda fc: fc["time"])

        fc = fc_list[0]
        cum_list = [{"x": int(time.mktime(parser.parse(fc["time"]).timetuple()) * 1000), \
                     "y": fc["size"]}]
        for fc in fc_list[1:]:
            cum_list.append({"x": int(time.mktime(parser.parse(fc["time"]).timetuple()) * 1000), \
                             "y": fc["size"] + cum_list[-1]["y"]})

        d = dict()
        d["data"] = cum_list
        d["name"] = "series"
        return [d]

    def project_storage_quota(self, project):
        proj_getter = lambda row: row.key[0]
        proj_checker = lambda row: proj_getter(row) == project

        date_getter = lambda row: row.key[1]

        r_list = filter(proj_checker, self.application.uppmax_db.view("status/project_quota_usage_over_time"))
        r_list = sorted(r_list, key=date_getter)

        data = []
        for row in r_list:
            data.append({"x": int(time.mktime(parser.parse(date_getter(row)).timetuple()) * 1000), \
                         "y": row.value[0]})

        d = dict()
        d["data"] = data
        d["name"] = "series"
        return [d]

    def list_projects(self):
        project_list = []
        for row in self.application.uppmax_db.view("status/projects", group_level=1):
            project_list.append(row.key)

        return project_list


class Application(tornado.web.Application):
    def __init__(self, settings):
        handlers = [
            ("/(\w+)?", MainHandler),
            ("/data/(\w+)?/(\w+)?", DataHandler)
        ]

        # Load templates
        self.loader = template.Loader("design")

        # Global connection to the log database
        couch = Server(settings.get("couch_server", None))
        self.illumina_db = couch["illumina_logs"]
        self.uppmax_db = couch["uppmax"]

        # Setup the Tornado Application
        settings = {"static_path": "static"}

        tornado.web.Application.__init__(self, handlers, **settings)


def main():
    with open("settings.yaml") as settings_file:
        server_settings = yaml.load(settings_file)

    # Instantiate Application
    application = Application(server_settings)

    # Start HTTP Server
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(server_settings.get("port", 8888))

    # Get a handle to the instance of IOLoop
    ioloop = tornado.ioloop.IOLoop.instance()

    # Start the IOLoop
    ioloop.start()


if __name__ == '__main__':
    main()
