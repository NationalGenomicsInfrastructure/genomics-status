import os
from datetime import datetime
import dateutil.parser
import json

import tornado.httpserver
import tornado.ioloop
import tornado.web

from couchdb import Server
import yaml

import random

PORT = 9999


def dthandler(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()


class MainHandler(tornado.web.RequestHandler):

    def get(self):
        # Send our main document
        self.render("/Users/vale/html/ajax.html")


class DataHandler(tornado.web.RequestHandler):

    def options(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET', 'OPTIONS')

    def get(self, q1, q2):
        # dates_and_sizes = []
        # for i in self.application.illumina_db.view("status/final_sizes_tmp", group_level=1):
        #     dates_and_sizes.append({"time": dateutil.parser.parse(i.value[0]), "size": i.value[1]})
        # dates_and_sizes = sorted(dates_and_sizes, key=lambda entry: entry["time"])

        self.set_header("Content-type", "application/json")
        # print(self.application.illumina_db)

        if q1 == "test":
            self.write(json.dumps(self.random_series(int(q2)), default=dthandler))

        else:
            # self.write(json.dumps(dates_and_sizes, default=dthandler))
            self.write(json.dumps((q1, q2), default=dthandler))

    def random_series(self, n):
        s = [{"y":random.randint(10, 99), "x":i} for i in xrange(int(n))]
        d = dict()
        d["data"] = s
        d["name"] = "series"
        return [d]


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            ("/data/(\w+)?/(\w+)?", DataHandler)
        ]

        with open("settings.yaml") as settings_file:
            server_settings = yaml.load(settings_file)

        # Global connection to the log database
        couch = Server(server_settings["couch_server"])
        self.illumina_db = couch["illumina_logs"]

        # Setup the Tornado Application
        settings = {
        "debug": True,
        "static_path": server_settings["static_path"]
        }

        tornado.web.Application.__init__(self, handlers, **settings)


def main():
    # Instantiate Application
    application = Application()

    # Start HTTP Server
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT)

    # Get a handle to the instance of IOLoop
    ioloop = tornado.ioloop.IOLoop.instance()

    # Start the IOLoop
    ioloop.start()


if __name__ == '__main__':
    main()
