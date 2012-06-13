import tornado.wsgi
from tornado import template

from status_app import MainHandler
from status_app import DataHandler

from couchdb import Server
import yaml


class Application(tornado.wsgi.WSGIApplication):
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

with open("settings.yaml") as settings_file:
    server_settings = yaml.load(settings_file)

application = Application(server_settings)
