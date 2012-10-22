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

from collections import OrderedDict


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


class UppmaxProjectsDataHandler(tornado.web.RequestHandler):
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


class BPProductionDataHandler(tornado.web.RequestHandler):
    def get(self, start):
        self.set_header("Content-type", "application/json")
        strt = [12, 1, 1, 1]
        self.write(json.dumps(self.cum_date_bpcounts(strt), default=dthandler))

    def cum_date_bpcounts(self, start):
        view = self.application.samples_db.view("barcodes/date_read_counts", \
            group_level=4, startkey=start)
        row0 = view.rows[0]
        current = row0.value * 200
        y = row0.key[0]
        m = row0.key[2]
        d = row0.key[3]
        dt = datetime(y, m, d)
        bp_list = [{"x": int(time.mktime(dt.timetuple()) * 1000), \
                    "y": current}]
        for row in view.rows[1:]:
            current += row.value * 200
            y = row.key[0]
            m = row.key[2]
            d = row.key[3]
            dt = datetime(y, m, d)
            bp_list.append({"x": int(time.mktime(dt.timetuple()) * 1000), \
                            "y": current})

        d = {"data": bp_list, "name": "series"}
        return [d]


class BPMonthlyProductionDataHandler(tornado.web.RequestHandler):
    def get(self, start):
        self.set_header("Content-type", "application/json")
        strt = [12, 1, 1, 1]
        self.write(json.dumps(self.bpcounts(strt), default=dthandler))

    def bpcounts(self, start):
        view = self.application.samples_db.view("barcodes/date_read_counts", \
            group_level=3)

        bp_list = []
        for row in view[start:]:
            y = row.key[0]
            m = row.key[2]
            bp_list.append({"x": [y, m], "y": row.value})

        d = {"data": bp_list, "name": "series"}
        return [d]


class BPQuarterlyProductionDataHandler(tornado.web.RequestHandler):
    def get(self, start):
        self.set_header("Content-type", "application/json")
        strt = [12, 1, 1, 1]
        self.write(json.dumps(self.bpcounts(strt), default=dthandler))

    def bpcounts(self, start):
        view = self.application.samples_db.view("barcodes/date_read_counts", \
            group_level=2)

        bp_list = []
        for row in view[start:]:
            y = row.key[0]
            q = row.key[1]
            bp_list.append({"x": [y, q], "y": row.value})

        d = {"data": bp_list, "name": "series"}
        return [d]


class DataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        handlers = [h[0] for h in self.application.declared_handlers]
        api = filter(lambda h: h.startswith("/api"), handlers)
        pages = list(set(handlers).difference(set(api)))
        pages = filter(lambda h: not (h.endswith("?") or h.endswith("$")), pages)
        pages.sort(reverse=True)
        api.sort(reverse=True)
        self.write(json.dumps({"api": api, "pages": pages}))


class QCDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_samples()))

    def list_samples(self):
        sample_list = []
        for row in self.application.samples_db.view("names/samplename_run", group_level=1):
            sample_list.append(row.key)

        return sample_list


class ApplicationsDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_applications()))

    def list_applications(self):
        applications = OrderedDict()
        for row in self.application.projects_db.view("project/applications", group_level=1):
            applications[row.key] = row.value

        return applications


class PagedQCDataHandler(tornado.web.RequestHandler):
    def get(self, startkey):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_samples(startkey)))

    def list_samples(self, startkey):
        sample_list = []
        for row in self.application.samples_db.view("names/samplename_run", group_level=1, limit=50, startkey=startkey):
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
        result = self.application.samples_db.view("qc/summary", key=sample, reduce=False)

        return result.rows[0].value


class SampleQCDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/qc_summary", key=sample)

        return result.rows[0].value


class ProjectSamplesDataHandler(tornado.web.RequestHandler):
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_list(project), default=dthandler))

    def sample_list(self, project):
        sample_view = self.application.projects_db.view("project/samples")
        result = sample_view[project]

        return result.rows[0].value


class SampleQCSummaryHandler(tornado.web.RequestHandler):
    def get(self, sample):
        t = self.application.loader.load("sample_run_qc.html")
        self.write(t.generate(sample=sample))


class ProjectSamplesHandler(tornado.web.RequestHandler):
    def get(self, project):
        t = self.application.loader.load("project_samples.html")
        self.write(t.generate(project=project))


class SampleQCAlignmentDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/alignment_summary", key=sample)

        return result.rows[0].value


class SampleQCInsertSizesDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/insert_size_distribution", key=sample)

        return result.rows[0].value


class SampleQCCoverageDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_summary(sample), default=dthandler))

    def sample_summary(self, sample):
        result = self.application.samples_db.view("qc/coverage", key=sample)

        return result.rows[0].value


class SampleReadCountDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_read_count(sample), default=dthandler))

    def sample_read_count(self, sample):
        rc_view = self.application.samples_db.view("samples/read_counts",
                                                  group_level=1)
        for row in rc_view[[sample]:[sample, "Z"]]:
            return row.value["read_count"]


class SampleRunReadCountDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_read_count(sample), default=dthandler))

    def sample_read_count(self, sample):
        rc_view = self.application.samples_db.view("samples/read_counts",
                                                  reduce=False)
        sample_runs = OrderedDict()
        for row in rc_view[[sample, "", ""]:[sample, "Z", ""]]:
            sample_runs[row.key[1]] = row.value
            sample_runs[row.key[1]]["lane"] = row.key[-1]

        return sample_runs


class ProjectsDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_projects()))

    def list_projects(self):
        projects = OrderedDict()
        for row in self.application.projects_db.view("project/summary"):
            projects[row.key] = row.value

        return projects


class ProjectDataHandler(tornado.web.RequestHandler):
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.project_info(project)))

    def project_info(self, project):
        result = self.application.projects_db.view("project/summary")[project]

        return result.rows[0].value


class FlowcellsDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_flowcells()))

    def list_flowcells(self):
        flowcells = OrderedDict()
        fc_view = self.application.flowcells_db.view("info/summary", \
                                                     descending=True)
        for row in fc_view:
            flowcells[row.key] = row.value

        return flowcells


class FlowcellsInfoDataHandler(tornado.web.RequestHandler):
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.flowcell_info(flowcell)))

    def flowcell_info(self, flowcell):
        fc_view = self.application.flowcells_db.view("info/summary", \
                                                     descending=True)
        for row in fc_view[flowcell]:
            flowcell_info = row.value
            break

        return flowcell_info


class FlowcellDataHandler(tornado.web.RequestHandler):
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_sample_runs(flowcell)))

    def list_sample_runs(self, flowcell):
        sample_run_list = []
        fc_view = self.application.samples_db.view("flowcell/name", reduce=False)
        for row in fc_view[flowcell]:
            sample_run_list.append(row.value)

        return sample_run_list


class FlowcellQCHandler(tornado.web.RequestHandler):
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.list_sample_runs(flowcell)))

    def list_sample_runs(self, flowcell):
        lane_qc = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/qc")
        for row in lane_view[[flowcell, ""]:[flowcell, "Z"]]:
            lane_qc[row.key[1]] = row.value

        return lane_qc


class FlowcellDemultiplexHandler(tornado.web.RequestHandler):
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.lane_stats(flowcell)))

    def lane_stats(self, flowcell):
        lane_qc = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/demultiplex")
        for row in lane_view[[flowcell, ""]:[flowcell, "Z"]]:
            lane_qc[row.key[1]] = row.value

        return lane_qc


class FlowcellQ30Handler(tornado.web.RequestHandler):
    def get(self, flowcell):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.lane_q30(flowcell)))

    def lane_q30(self, flowcell):
        lane_q30 = OrderedDict()
        lane_view = self.application.flowcells_db.view("lanes/gtq30", group_level=2)
        for row in lane_view[[flowcell, ""]:[flowcell, "Z"]]:
            lane_q30[row.key[1]] = row.value["sum"] / row.value["count"]

        return lane_q30


class ProjectsHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("projects.html")
        self.write(t.generate())


class ApplicationsHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("applications.html")
        self.write(t.generate())


class FlowcellsHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("flowcells.html")
        self.write(t.generate())


class FlowcellHandler(tornado.web.RequestHandler):
    def get(self, flowcell):
        t = self.application.loader.load("flowcell_samples.html")
        self.write(t.generate(flowcell=flowcell))


class AmanitaHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("amanita.html")
        self.write(t.generate())


class AmanitaHomeDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_usage()))

    def home_usage(self):
        sizes = []
        for row in self.application.amanita_db.view("sizes/home_total"):
            sizes.append({"x": int(time.mktime(parser.parse(row.key).timetuple()) * 1000), \
                          "y": row.value * 1024})

        return sizes


class AmanitaHomeUserDataHandler(tornado.web.RequestHandler):
    def get(self, user):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_usage(user)))

    def home_usage(self, user):
        sizes = []
        for row in self.application.amanita_db.view("sizes/home_user", \
        startkey=[user, "0"], endkey=[user, "a"], group=True):
            sizes.append({"x": int(time.mktime(parser.parse(row.key[1]).timetuple()) * 1000), \
                          "y": row.value * 1024})

        return sizes


class AmanitaUsersDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_users()))

    def home_users(self):
        users = []
        for row in self.application.amanita_db.view("sizes/home_user", group_level=1):
            if "/" not in row.key[0]:
                users.append(row.key[0])

        return users


class PiceaHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("picea.html")
        self.write(t.generate())


class SampleRunHandler(tornado.web.RequestHandler):
    def get(self, sample):
        t = self.application.loader.load("sample_runs.html")
        self.write(t.generate(sample=sample))


class PiceaHomeDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_usage()))

    def home_usage(self):
        sizes = []
        for row in self.application.picea_db.view("sizes/home_total"):
            sizes.append({"x": int(time.mktime(parser.parse(row.key).timetuple()) * 1000), \
                          "y": row.value * 1024})

        return sizes


class PiceaHomeUserDataHandler(tornado.web.RequestHandler):
    def get(self, user):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_usage(user)))

    def home_usage(self, user):
        sizes = []
        for row in self.application.picea_db.view("sizes/home_user", \
        startkey=[user, "0"], endkey=[user, "a"], group=True):
            sizes.append({"x": int(time.mktime(parser.parse(row.key[1]).timetuple()) * 1000), \
                          "y": row.value * 1024})

        return sizes


class PiceaUsersDataHandler(tornado.web.RequestHandler):
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_users()))

    def home_users(self):
        users = []
        for row in self.application.picea_db.view("sizes/home_user", group_level=1):
            if "/" not in row.key[0]:
                users.append(row.key[0])

        return users


class SampleRunDataHandler(tornado.web.RequestHandler):
    def get(self, sample):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.sample_runs(sample)))

    def sample_runs(self, sample):
        sample_run_list = []
        run_view = self.application.samples_db.view("names/runs", reduce=False)
        for row in run_view[sample]:
            sample_run_list.append(row.value)

        return sample_run_list


class Application(tornado.web.Application):
    def __init__(self, settings):
        handlers = [
            ("/", MainHandler),
            ("/api/v1", DataHandler),
            ("/api/v1/applications", ApplicationsDataHandler),
            ("/api/v1/amanita_home", AmanitaHomeDataHandler),
            ("/api/v1/amanita_home/users/", AmanitaUsersDataHandler),
            ("/api/v1/amanita_home/([^/]*)$", AmanitaHomeUserDataHandler),
            ("/api/v1/flowcells", FlowcellsDataHandler),
            ("/api/v1/flowcell_info/([^/]*)$", FlowcellsInfoDataHandler),
            ("/api/v1/flowcell_qc/([^/]*)$", FlowcellQCHandler),
            ("/api/v1/flowcell_demultiplex/([^/]*)$",
                FlowcellDemultiplexHandler),
            ("/api/v1/flowcell_q30/([^/]*)$", FlowcellQ30Handler),
            ("/api/v1/flowcells/([^/]*)$", FlowcellDataHandler),
            ("/api/v1/picea_home", PiceaHomeDataHandler),
            ("/api/v1/picea_home/users/", PiceaUsersDataHandler),
            ("/api/v1/picea_home/([^/]*)$", PiceaHomeUserDataHandler),
            ("/api/v1/production/([^/]*)$", BPProductionDataHandler),
            ("/api/v1/m_production/([^/]*)$", BPMonthlyProductionDataHandler),
            ("/api/v1/q_production/([^/]*)$", \
                BPQuarterlyProductionDataHandler),
            ("/api/v1/projects", ProjectsDataHandler),
            ("/api/v1/project_summary/([^/]*)$", ProjectDataHandler),
            ("/api/v1/projects/([^/]*)$", ProjectSamplesDataHandler),
            ("/api/v1/qc", QCDataHandler),
            ("/api/v1/qc/(\w+)?", SampleQCDataHandler),
            ("/api/v1/quotas", QuotasDataHandler),
            ("/api/v1/quotas/(\w+)?", QuotaDataHandler),
            ("/api/v1/sample_readcount/(\w+)?", SampleReadCountDataHandler),
            ("/api/v1/sample_run_counts/(\w+)?",
                SampleRunReadCountDataHandler),
            ("/api/v1/sample_alignment/(\w+)?", SampleQCAlignmentDataHandler),
            ("/api/v1/sample_coverage/(\w+)?", SampleQCCoverageDataHandler),
            ("/api/v1/sample_summary/(\w+)?", SampleQCSummaryDataHandler),
            ("/api/v1/sample_insert_sizes/(\w+)?", \
                SampleQCInsertSizesDataHandler),
            ("/api/v1/samples", QCDataHandler),
            ("/api/v1/samples/start/([^/]*)$", PagedQCDataHandler),
            ("/api/v1/samples/([^/]*)$", SampleRunDataHandler),
            ("/api/v1/test/(\w+)?", TestDataHandler),
            ("/api/v1/uppmax_projects", UppmaxProjectsDataHandler),
            ("/amanita", AmanitaHandler),
            ("/applications", ApplicationsHandler),
            ("/flowcells", FlowcellsHandler),
            ("/flowcells/([^/]*)$", FlowcellHandler),
            ("/picea", PiceaHandler),
            ("/qc", QCHandler),
            ("/qc/(\w+)?", SampleQCSummaryHandler),
            ("/quotas", QuotasHandler),
            ("/quotas/(\w+)?", QuotaHandler),
            ("/production", ProductionHandler),
            ("/projects", ProjectsHandler),
            ("/projects/([^/]*)$", ProjectSamplesHandler),
            ("/samples", QCHandler),
            ("/samples/([^/]*)$", SampleRunHandler)
        ]

        self.declared_handlers = handlers

        # Load templates
        self.loader = template.Loader("design")

        # Global connection to the log database
        couch = Server(settings.get("couch_server", None))
        if couch:
            self.illumina_db = couch["illumina_logs"]
            self.uppmax_db = couch["uppmax"]
            self.samples_db = couch["samples"]
            self.projects_db = couch["projects"]
            self.flowcells_db = couch["flowcells"]
            self.amanita_db = couch["amanita"]
            self.picea_db = couch["picea"]

        # Setup the Tornado Application
        settings = {
        "debug": True,
        "static_path": "static"
        }

        tornado.autoreload.watch("design/quota_grid.html")
        tornado.autoreload.watch("design/quota.html")
        tornado.autoreload.watch("design/sample_run_qc.html")
        tornado.autoreload.watch("design/sample_runs.html")
        tornado.autoreload.watch("design/samples.html")
        tornado.autoreload.watch("design/projects.html")
        tornado.autoreload.watch("design/project_samples.html")
        tornado.autoreload.watch("design/base.html")
        tornado.autoreload.watch("design/production.html")
        tornado.autoreload.watch("design/flowcell_samples.html")
        tornado.autoreload.watch("design/applications.html")
        tornado.autoreload.watch("design/barcodes.html")
        tornado.autoreload.watch("design/amanita.html")
        tornado.autoreload.watch("design/flowcells.html")

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
