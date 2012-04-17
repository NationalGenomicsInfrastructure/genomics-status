import os
from datetime import datetime
import json
from collections import defaultdict

import tornado.httpserver
import tornado.ioloop
import tornado.web

from pymongo import Connection

PORT = 8888


def dthandler(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()


class MainHandler(tornado.web.RequestHandler):

    @tornado.web.asynchronous
    def get(self):
        # Send our main document
        self.render("index.html")


class AjaxHandler(tornado.web.RequestHandler):

    @tornado.web.asynchronous
    def get(self):
        # Send our output
        self.set_header("Content-type", "application/json")
        self.finish()


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/ajax", AjaxHandler),
        ]
        # Setup the Tornado Application
        settings = {
        "debug": True,
        "static_path": os.path.join(os.path.dirname(__file__), "static")
        }

        tornado.web.Application.__init__(self, handlers, **settings)

        # Global connection to the log database
        connection = Connection()
        self.db = connection.logs
        self.size_logs = self.db.size_logs


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
