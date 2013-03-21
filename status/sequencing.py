""" Handlers related to data sequencing statistics.
"""
from collections import defaultdict
from collections import OrderedDict
import cStringIO
from datetime import datetime
import json
import random

from dateutil import parser
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg

import tornado.web

from status.util import dthandler

class InstrumentErrorrateDataHandler(tornado.web.RequestHandler):
    """ Gives series for phiX error rates for instruments, over time.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.error_rates(), default=dthandler))

    def error_rates(self):
        view = self.application.flowcells_db.view("instrument/error_rates")

        error_rates = defaultdict(lambda :defaultdict(list))
        for row in view:
            date = row.key[0]
            instrument = row.key[1]
            error_rates[instrument][date] += row.value

        return error_rates
