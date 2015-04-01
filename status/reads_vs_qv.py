import tornado.web
import json

from dateutil import parser
from datetime import datetime
import numpy as np

from status.util import dthandler, SafeHandler


class ReadsVsQvhandler(SafeHandler):
    """ Serves a page which shows plots of the amount of reads with certain
    quality values over a given date range.
    """
    def get(self):
        t = self.application.loader.load("reads_vs_qv.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user_name(), deprecated=False))


class ReadsVsQDataHandler(SafeHandler):
    """ Serves histogram data of reada over average quality values of reads.

    Loaded through /api/v1/reads_vs_qualtiy
    """
    def get(self):
        start = self.get_argument("start",  '2012-01-01T00:00:00')
        start_date = parser.parse(start)

        end = self.get_argument("end", None)
        if end:
            end_date = parser.parse(end)
        else:
            end_date = datetime.now()

        start = [start_date.year - 2000,
                 (start_date.month - 1) // 3 + 1,
                 start_date.month,
                 start_date.day]

        end = [end_date.year - 2000,
               (end_date.month - 1) // 3 + 1,
               end_date.month,
               end_date.day]

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.reads_q_data(start, end), default=dthandler))

    def reads_q_data(self, start, end):
        qv_view = self.application.samples_db.view("qc/date_reads_per_qv")
        quality_count = np.zeros(45)
        quality_integral = np.zeros(45)
        for row in qv_view[start:end]:
            quality = np.array(row.value["Quality"], dtype=int)
            integral = np.array(row.value["Cumulative count"], dtype=float)
            count = np.array(row.value["Count"], dtype=float)
            quality_count[quality] += count
            quality_integral[quality] += integral

        quality_count = quality_count / quality_count.sum()
        # 2 is the minimum quality value
        quality_integral = quality_integral / quality_integral[2]

        return {"quality": list(quality_count),
                "cumulative": list(quality_integral)}
