import datetime
import json

from dateutil import tz
from dateutil.relativedelta import relativedelta

from status.util import SafeHandler


def recover_logs(handler, search_string=None, inst_type="bravo"):
    if inst_type == "bravo":
        if not search_string:
            # by default, return one week of logs
            return [
                row["value"]
                for row in handler.application.cloudant.post_view(
                    db="instrument_logs",
                    ddoc="time",
                    view="last_week"
                ).get_result()["rows"]
            ]

        else:
            # assuming the search string is <timestamp1>-<timestamp2>
            ts1 = search_string.split("-")[0]
            ts2 = search_string.split("-")[1]
            d1 = datetime.datetime.fromtimestamp(int(ts1))
            d2 = datetime.datetime.fromtimestamp(int(ts2))

            valid_rows = []
            for row in handler.application.cloudant.post_view(
                db="instrument_logs",
                ddoc="time",
                view="timestamp",
                start_key=d1.strftime("%Y-%m-%dT%H:%M:%S.%f"),
                end_key=d2.strftime("%Y-%m-%dT%H:%M:%S.%f"),
            ).get_result()["rows"]:
                valid_rows.append(row["value"])

            return valid_rows
    elif inst_type == "biomek":
        instruments_list = {
            row["key"]: row["value"]
            for row in handler.application.cloudant.post_view(
                db="instruments",
                ddoc="info",
                view="id_to_name"
            ).get_result()["rows"]
        }
        # by default, return all logs from the last week
        date_earlier = (datetime.datetime.now() - relativedelta(weeks=1)).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )
        date_later = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        valid_rows = []
        if search_string:
            ts1 = search_string.split("-")[0]
            ts2 = search_string.split("-")[1]
            date_earlier = datetime.datetime.fromtimestamp(int(ts1)).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            )
            date_later = datetime.datetime.fromtimestamp(int(ts2)).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            )
        for row in handler.application.cloudant.post_view(
            db="biomek_logs",
            ddoc="dates",
            view="timestamp",
            start_key=date_earlier,
            end_key=date_later,
        ).get_result()["rows"]:
            date = (
                datetime.datetime.strptime(row["key"], "%Y-%m-%dT%H:%M:%S.%fZ")
                .replace(tzinfo=tz.tzutc())
                .astimezone(tz.tzlocal())
            )
            inst = f"{instruments_list[row['value']['inst_id']]}({row['value']['inst_id']})"
            method = row["value"].get("method", "diff")
            errs = row["value"]["errors"]
            valid_rows.append(
                {
                    "timestamp": f"{date}",
                    "instrument_name": inst,
                    "method": method,
                    "message": errs,
                }
            )
        return valid_rows


class DataInstrumentLogsHandler(SafeHandler):
    """Handles the instrument logs page

    Loaded through /api/v1/instrument_logs/([^/]*)/([^/]*)$
    where the first parameter is the instrument type (bravo or biomek) and the second is the search string
    """

    def get(self, inst_type="bravo", search_string=None):
        if inst_type in ["bravo", "biomek"]:
            docs = recover_logs(self, search_string, inst_type)
            self.set_header("Content-type", "application/json")
            self.write(json.dumps(docs))


class InstrumentLogsHandler(SafeHandler):
    """Handles the instrument logs page

    Loaded through /instrument_logs/([^/]*)$
    """

    def get(self, search_string=None):
        t = self.application.loader.load("instrument_logs.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
            )
        )


class InstrumentNamesHandler(SafeHandler):
    """Handles the api call to know the names of the instruments

    Loaded through /api/v1/instrument_names
    """

    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(
            json.dumps(self.application.cloudant.post_view(
                        db="instruments",
                        ddoc="info",
                        view="id_to_name"
                        ).get_result()["rows"]
            )
        )
