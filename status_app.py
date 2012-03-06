import time
import os

import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web

import pika
from pika.adapters.tornado_connection import TornadoConnection

from pymongo import Connection

PORT = 8888


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
        print("Requested more log data")
        # self.write_message(json.dumps(self.data.next()))
        self.send_messages()

    def on_close(self):
        self.unregister_sender(self.write_message)
        print("WebSocket closed")


class PikaClient(MessageMixin):

    def __init__(self):
        self.queue_name = 'tornado-test-app'

        # Default values
        self.connected = False
        self.connecting = False
        self.connection = None
        self.channel = None

        # A place for us to keep messages sent to us by Rabbitmq
        self.messages = list()

        # A place for us to put pending messages while we're waiting to connect
        self.pending = list()

    def connect(self):
        if self.connecting:
            pika.log.info('PikaClient: Already connecting to RabbitMQ')
            return
        pika.log.info('PikaClient: Connecting to RabbitMQ on 0.0.0.0:5672')
        self.connecting = True

        credentials = pika.PlainCredentials('guest', 'guest')
        param = pika.ConnectionParameters(host='0.0.0.0',
                                          port=5672,
                                          virtual_host="/",
                                          credentials=credentials)
        self.connection = TornadoConnection(param,
                                            on_open_callback=self.on_connected)
        self.connection.add_on_close_callback(self.on_closed)

    def on_connected(self, connection):
        pika.log.info('PikaClient: Connected to RabbitMQ on 0.0.0.0:5672')
        self.connected = True
        self.connection = connection
        self.connection.channel(self.on_channel_open)

    def on_channel_open(self, channel):
        pika.log.info('PikaClient: Channel Open, Declaring Exchange')
        self.channel = channel
        self.channel.exchange_declare(exchange='tornado',
                                      type="direct",
                                      durable=True,
                                      callback=self.on_exchange_declared)

    def on_exchange_declared(self, frame):
        pika.log.info('PikaClient: Exchange Declared, Declaring Queue')
        self.channel.queue_declare(queue=self.queue_name,
                                   durable=True,
                                   exclusive=False,
                                   callback=self.on_queue_declared)

    def on_queue_declared(self, frame):
        pika.log.info('PikaClient: Queue Declared, Binding Queue')
        self.channel.queue_bind(exchange='tornado',
                                queue=self.queue_name,
                                routing_key='tornado.*',
                                callback=self.on_queue_bound)

    def on_queue_bound(self, frame):
        pika.log.info('PikaClient: Queue Bound, Issuing Basic Consume')
        self.channel.basic_consume(consumer_callback=self.on_pika_message,
                                   queue=self.queue_name,
                                   no_ack=True)
        # Send any messages pending
        for properties, body in self.pending:
            self.channel.basic_publish(exchange='tornado',
                                       routing_key='tornado.*',
                                       body=body,
                                       properties=properties)

    def on_pika_message(self, channel, method, header, body):
        pika.log.info('PikaClient: Message receive, delivery tag #%i' % \
                     method.delivery_tag)
        # Append it to our messages list
        self.messages.append(body)
        self.new_message(body)
        self.send_messages()

    def on_basic_cancel(self, frame):
        pika.log.info('PikaClient: Basic Cancel Ok')
        # If we don't have any more consumer processes running close
        self.connection.close()

    def on_closed(self, connection):
        # We've closed our pika connection so stop the demo
        tornado.ioloop.IOLoop.instance().stop()

    def sample_message(self, tornado_request):
        # Build a message to publish to RabbitMQ

        body = "This is a test message."

        # Send the message
        properties = pika.BasicProperties(content_type="text/plain",
                                          delivery_mode=1)
        self.channel.basic_publish(exchange='tornado',
                                   routing_key='tornado.*',
                                   body=body,
                                   properties=properties)

    def get_messages(self):
        # Get the messages to return, then empty the list
        output = self.messages
        self.messages = list()
        return output


class MainHandler(tornado.web.RequestHandler):

    @tornado.web.asynchronous
    def get(self):
        # Send our main document
        self.render("status.html",
                    connected=self.application.pika.connected)


class AjaxHandler(tornado.web.RequestHandler):

    @tornado.web.asynchronous
    def get(self):
        # Send our output
        self.set_header("Content-type", "application/json")
        # self.write(json.dumps(self.application.pika.get_messages()))
        self.finish()


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/ajax", AjaxHandler),
            (r"/websocket", WebSocketMessenger)
        ]
        # Setup the Tornado Application
        settings = {
        "debug": True,
        "static_path": os.path.join(os.path.dirname(__file__), "static")
        }

        tornado.web.Application.__init__(self, handlers, **settings)

        # Helper class PikaClient makes coding async Pika apps in tornado easy
        pc = PikaClient()
        self.pika = pc  # We want a shortcut for below for easier typing

        # Global connection to the log database
        connection = Connection()
        self.db = connection.logs
        self.size_logs = self.db.size_logs


def main():
    # Set pika.log options
    pika.log.setup(color=True)

    # Instantiate Application
    application = Application()

    # Start HTTP Server
    pika.log.info("Starting Tornado HTTPServer on port %i" % PORT)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT)

    # Get a handle to the instance of IOLoop
    ioloop = tornado.ioloop.IOLoop.instance()

    # Add the Pika connect to the IOLoop with a deadline in 0.1 seconds
    ioloop.add_timeout(time.time() + 0.1, application.pika.connect)

    # Start the IOLoop
    ioloop.start()


if __name__ == '__main__':
    main()
