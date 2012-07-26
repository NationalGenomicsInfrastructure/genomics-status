from datetime import datetime
from dateutil import parser
import time
import json

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.autoreload
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
    def get(self):
        # Send our main document
        t = self.application.loader.load("base.html")
        self.write(t.generate())


class TestHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("test_grid.html")
        self.write(t.generate())


class QuotasHandler(tornado.web.RequestHandler):
    def get(self):
        # TODO: Get projects list from database.
        t = self.application.loader.load("quota_grid.html")
        self.write(t.generate())


class TestGridHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("test_grid.html")
        self.write(t.generate())


class QuotaHandler(tornado.web.RequestHandler):
    def get(self, project):
        t = self.application.loader.load("quota.html")
        self.write(t.generate(project=project))


class ProductionHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("production.html")
        self.write(t.generate())


class QuotasDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write("TODO: Implement")


class QuotaDataHandler(tornado.web.RequestHandler):
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.project_storage_quota(project), default=dthandler))

    def project_storage_quota(self, project):
        proj_getter = lambda row: row.key[0]
        proj_checker = lambda row: proj_getter(row) == project

        date_getter = lambda row: row.key[1]

        r_list = filter(proj_checker, self.application.uppmax_db.view("status/project_quota_usage_over_time"))
        r_list = sorted(r_list, key=date_getter)

        gb = 1024 ** 3
        data = []
        for row in r_list:
            data.append({"x": int(time.mktime(parser.parse(date_getter(row)).timetuple())), \
                         "y": row.value[0] * gb})

        d = dict()
        d["data"] = data
        d["name"] = "series"
        return [d]


class ProjectsDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_projects()))

    def list_projects(self):
        project_list = []
        for row in self.application.uppmax_db.view("status/projects", group_level=1):
            project_list.append(row.key)

        return project_list


class TestDataHandler(tornado.web.RequestHandler):
    def get(self, n):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.random_series(int(n)), default=dthandler))

    def random_series(self, n):
        s = [{"y":random.randint(10, 99), "x":i} for i in xrange(int(n))]
        d = dict()
        d["data"] = s
        d["name"] = "series"
        return [d]


class ProductionDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.cum_flowcell_sizes(), default=dthandler))

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


class DataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        handlers = [h[0] for h in self.application.declared_handlers]
        api = filter(lambda h: h.startswith("/api"), handlers)
        pages = list(set(handlers).difference(set(api)))
        pages = filter(lambda h: not h.endswith("?"), pages)
        self.write(json.dumps({"api": api, "pages": pages}))


class QCDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_samples()))

    def list_samples(self):
        sample_list = []
        for row in self.application.qc_db.view("samples/names"):
            sample_list.append(row.key)

        return sample_list


class QCHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("samples.html")
        self.write(t.generate())


class SampleQCSummaryDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.qc_db.view("samples/summary", key=sample)

        return result.rows[0].value


class SampleQCDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.qc_db.view("samples/qc_summary", key=sample)

        return result.rows[0].value


class SampleQCSummaryHandler(tornado.web.RequestHandler):
    def get(self, sample):
        t = self.application.loader.load("sample_qc.html")
        self.write(t.generate(sample=sample))


class SampleQCAlignmentDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.qc_db.view("samples/alignment_summary", key=sample)

        return result.rows[0].value


class Application(tornado.web.Application):
    def __init__(self, settings):
        handlers = [
            ("/", MainHandler),
            ("/api/v1", DataHandler),
            ("/api/v1/production", ProductionDataHandler),
            ("/api/v1/qc", QCDataHandler),
            ("/api/v1/qc/(\w+)?", SampleQCDataHandler),
            ("/api/v1/quotas", QuotasDataHandler),
            ("/api/v1/quotas/(\w+)?", QuotaDataHandler),
            ("/api/v1/sample_summary/(\w+)?", SampleQCSummaryDataHandler),
            ("/api/v1/sample_alignment/(\w+)?", SampleQCAlignmentDataHandler),
            ("/api/v1/samples", QCDataHandler),
            ("/api/v1/test/(\w+)?", TestDataHandler),
            ("/api/v1/uppmax_projects", ProjectsDataHandler),
            ("/qc", QCHandler),
            ("/qc/(\w+)?", SampleQCSummaryHandler),
            ("/quotas", QuotasHandler),
            ("/quotas/test", TestGridHandler),
            ("/quotas/(\w+)?", QuotaHandler),
            ("/production", ProductionHandler),
            ("/samples", QCHandler)
        ]

        self.declared_handlers = handlers

        # Load templates
        self.loader = template.Loader("design")

        # Global connection to the log database
        couch = Server(settings.get("couch_server", None))
        if couch:
            self.illumina_db = couch["illumina_logs"]
            self.uppmax_db = couch["uppmax"]
            self.qc_db = couch["qc"]

        # Setup the Tornado Application
        settings = {
        "debug": True,
        "static_path": "static"
        }

        tornado.autoreload.watch("design/quota_grid.html")
        tornado.autoreload.watch("design/sample_qc.html")
        tornado.autoreload.watch("design/samples.html")
        tornado.autoreload.watch("design/base.html")
        tornado.autoreload.watch("design/production.html")

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
