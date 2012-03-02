from datetime import datetime
from random import randint
import json

import pika

exchange_name = 'tornado'
queue_name = 'tornado-test-app'

pika.log.info('Connecting to RabbitMQ on 0.0.0.0:5672')

credentials = pika.PlainCredentials('guest', 'guest')
param = pika.ConnectionParameters(host='0.0.0.0',
                                  port=5672,
                                  virtual_host="/",
                                  credentials=credentials)
connection = pika.BlockingConnection(param)
channel = connection.channel()

channel.queue_declare(queue=queue_name,
                      durable=True,
                      exclusive=False)

properties = pika.BasicProperties(content_type="application/json", \
    delivery_mode=1)

log_data = {"date": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
            "machine": "SN167",
            "project": "0302_AD07L0ACXX",
            "size": "%i000000" % (5 - randint(0, 4),)}
body = json.dumps(log_data)

channel.basic_publish(exchange=exchange_name,
                      routing_key='tornado.*',
                      body=body,
                      properties=properties)

pika.log.info("Sent %s" % body)

connection.close()
