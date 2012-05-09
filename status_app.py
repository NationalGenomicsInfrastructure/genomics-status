import os
from datetime import datetime
import dateutil.parser
import json

import tornado.httpserver
import tornado.ioloop
import tornado.web

from couchdb import Server
import yaml

PORT = 9999


def dthandler(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()


class MainHandler(tornado.web.RequestHandler):

    def get(self):
        # Send our main document
        self.render("index.html")


class DataHandler(tornado.web.RequestHandler):

    def get(self):
        dates_and_sizes = []
        for i in self.application.illumina_db.view("status/final_sizes_tmp", group_level=1):
            dates_and_sizes.append({"time": dateutil.parser.parse(i.value[0]), "size": i.value[1]})
        dates_and_sizes = sorted(dates_and_sizes, key=lambda entry: entry["time"])

        self.set_header("Content-type", "application/json")
        print(self.application.illumina_db)

        self.write(json.dumps(dates_and_sizes, default=dthandler))


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/data.json", DataHandler),
        ]
        # Setup the Tornado Application
        settings = {
        "debug": True,
        "static_path": os.path.join(os.path.dirname(__file__), "static")
        }

        tornado.web.Application.__init__(self, handlers, **settings)

        with open("settings.yaml") as settings_file:
            server_settings = yaml.load(settings_file)

        # Global connection to the log database
        couch = Server(server_settings["couch_server"])
        self.illumina_db = couch["illumina_logs"]


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
