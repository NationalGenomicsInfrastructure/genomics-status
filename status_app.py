import os
from datetime import datetime
import json
from collections import defaultdict

import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web

from pymongo import Connection

PORT = 8888


def dthandler(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()


class ExampleDataIterator(object):
    def __init__(self):
        self.i = 24

    def next(self):
        self.i += 1
        return {"date": "2011-12-%i" % (self.i,),
                "machine": "SN167",
                "project": "0302_AD07L0ACXX",
                "size": "%i000000" % (self.i % 4 + 1,)}


class MessageMixin(object):
    senders = set()
    message = None

    def register_sender(self, callback):
        cls = MessageMixin
        cls.senders.add(callback)

    def unregister_sender(self, callback):
        cls = MessageMixin
        cls.senders.remove(callback)

    def new_message(self, message):
        cls = MessageMixin
        cls.message = message

    def send_messages(self):
        cls = MessageMixin
        for send in cls.senders:
            send(cls.message)


class WebSocketMessenger(tornado.websocket.WebSocketHandler, MessageMixin):

    def open(self):
        self.data = ExampleDataIterator()
        self.register_sender(self.write_message)
        print("WebSocket opened")

    def on_message(self, message):
        print("Got message from client: %s" % message)

        if message == "total_over_time":
            total_over_time = self.get_sizes_over_time()
            self.write_message(json.dumps(total_over_time, default=dthandler))

        if message == "projects_over_time":
            projects_over_time = self.get_num_projects_over_time()
            self.write_message(json.dumps(projects_over_time, default=dthandler))

        if message == "storage_load_over_time":
            storage_load_over_time = self.get_storage_load_over_time()
            self.write_message(json.dumps(storage_load_over_time, default=dthandler))

    def on_close(self):
        self.unregister_sender(self.write_message)
        print("WebSocket closed")

    def get_sizes_over_time(self):
        all_projects = self.application.size_logs.distinct("project")
        final_entries = []
        for p in all_projects:
            entry = self.application.size_logs.find({"project": p}).sort("date", -1)[0]
            final_entries.append(entry)

        final_entries = sorted(final_entries, key=lambda e: e["date"])
        total = 0
        total_over_time = {}
        for entry in final_entries:
            total += entry["size"]
            total_over_time[datetime.strptime(entry["date"], \
                "%Y-%m-%dT%H:%M:%S")] = total

        items = total_over_time.items()
        items.sort()
        sizes_over_time = []
        for date, size in items:
            sizes_over_time.append({"date": date, "size": size})

        return sizes_over_time

    def get_num_projects_over_time(self):
        all_projects = self.application.size_logs.distinct("project")
        final_entries = []
        for p in all_projects:
            entry = self.application.size_logs.find({"project": p}).sort("date", -1)[0]
            final_entries.append(entry)

        final_entries = sorted(final_entries, key=lambda e: e["date"])
        total = 0
        total_over_time = {}
        for entry in final_entries:
            total += 1
            total_over_time[datetime.strptime(entry["date"], \
                "%Y-%m-%dT%H:%M:%S")] = total

        items = total_over_time.items()
        items.sort()
        projects_over_time = []
        for date, projects in items:
            projects_over_time.append({"date": date, "projects": projects})

        return projects_over_time

    def get_storage_load_over_time(self):
        all_entries = self.application.size_logs.find()
        date_size_dict = defaultdict(int)

        for entry in all_entries:
            date_size_dict[datetime.strptime(entry["date"], \
                "%Y-%m-%dT%H:%M:%S")] += entry["size"]

        items = date_size_dict.items()
        items.sort()
        storage_load_over_time = []

        for date, size in items:
            storage_load_over_time.append({"date": date, "size": size})

        return storage_load_over_time


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

    # Add the Pika connect to the IOLoop with a deadline in 0.1 seconds
    # ioloop.add_timeout(time.time() + 0.1, application.pika.connect)

    # Start the IOLoop
    ioloop.start()


if __name__ == '__main__':
    main()
