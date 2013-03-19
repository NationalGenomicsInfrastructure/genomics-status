""" Status Handlers used to test some functionalities while building layouts.
"""
import random
import json

import tornado.web

from status.util import dthandler


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


class TestGridHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("test_grid.html")
        self.write(t.generate())


class TestHandler(tornado.web.RequestHandler):
    def get(self):
        t = self.application.loader.load("test_grid.html")
        self.write(t.generate())
