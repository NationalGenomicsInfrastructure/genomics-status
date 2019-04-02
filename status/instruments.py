
from status.util import dthandler, SafeHandler

import datetime
import json



def recover_logs(handler, search_string=None):
    if not search_string:
        #by default, return one week of logs
        return [row.value for row in handler.application.instrument_logs_db.view("time/last_week")]

    else:
        #assuming the search string is <timestamp1>-<timestamp2>
        ts1=search_string.split('-')[0]
        ts2=search_string.split('-')[1]
        d1=datetime.datetime.fromtimestamp(int(ts1))
        d2=datetime.datetime.fromtimestamp(int(ts2))

        valid_rows=[]
        for row in handler.application.instrument_logs_db.view("time/timestamp"):
            row_date=datetime.datetime.strptime(row.key, "%Y-%m-%dT%H:%M:%S.%f")
            if row_date >= d1 and row_date <= d2:
                valid_rows.append(row.value)

        return valid_rows



class DataInstrumentLogsHandler(SafeHandler):
    """ Handles the instrument logs page

    Loaded through /api/v1/instrument_logs/([^/]*)$
    """
    def get(self, search_string=None):
        docs=recover_logs(self, search_string)
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(docs))

class InstrumentLogsHandler(SafeHandler):
    """ Handles the instrument logs page

    Loaded through /instrument_logs/([^/]*)$
    """
    def get(self, search_string=None):
        docs=recover_logs(self, search_string)
        t = self.application.loader.load("instrument_logs.html")
        self.write(t.generate(docs=docs,gs_globals=self.application.gs_globals,
                              user=self.get_current_user_name()))


class InstrumentNamesHandler(SafeHandler):
   """ Handles the api call to know the names of the instruments

   Loaded through /api/v1/instrument_names
   """
   def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.application.instruments_db.view("info/id_to_name").rows))
