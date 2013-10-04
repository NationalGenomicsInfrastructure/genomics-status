import tornado.web
import json

import numpy as np


class PhixErrorRateHandler(tornado.web.RequestHandler):
    """ Serves a page which shows the distributions of phiX error rates.
    """
    def get(self):
        t = self.application.loader.load("phix_err_rate.html")
        self.write(t.generate())


class PhixErrorRateDataHandler(tornado.web.RequestHandler):
    """ Serves a histogram of yields and phiX error rates over all time.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.phix_err_rate()))

    def phix_err_rate(self):
        view = self.application.flowcells_db.view("lanes/err_rate_phix_yield")

        err_rates = []
        yields = []

        for row in view:
            err_rate = row.value["err_rate_phix"]
            read_yield = row.value["yield"]
            if err_rate and read_yield and err_rate > 0.0001:
                err_rates.append(err_rate)
                yields.append(float(read_yield))

        amount_yields, error_rate = np.histogram(err_rates,
                                                 bins=256,
                                                 weights=yields)

        fraction_yield = amount_yields / amount_yields.sum()

        return {"error_rate": list(error_rate),
                "yield_fraction": list(fraction_yield),
                "cum_yield_fraction": list(fraction_yield.cumsum())}
