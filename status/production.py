""" Handlers related to data production.
"""
import random
import json

import tornado.web

from status.util import dthandler

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

        d = {"data": bp_list, "name": "production"}
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

        d = {"data": bp_list, "name": "production"}
        return [d]
