"""Handlers for worksets"""


import datetime
import json
from collections import OrderedDict

from dateutil.parser import parse
from dateutil.relativedelta import relativedelta
from genologics import lims
from genologics.config import BASEURI, PASSWORD, USERNAME
from genologics.entities import Process

from status.running_notes import LatestRunningNoteHandler
from status.util import SafeHandler


class WorksetsDataHandler(SafeHandler):
    """returns basic worksets json
    Loaded through /api/v1/worksets
    """

    def get(self):
        self.set_header("Content-type", "application/json")
        ws_view = self.application.worksets_db.view("worksets/summary", descending=True)
        result = {}
        for row in ws_view:
            result[row.key] = row.value
            result[row.key].pop("_id", None)
            result[row.key].pop("_rev", None)
        self.write(json.dumps(result))


class WorksetsHandler(SafeHandler):
    """Loaded through /worksets
    By default shows only worksets form the last 6 months, use the parameter 'all' to show all worksets.
    """

    def worksets_data(self, all=False):
        result = {}
        half_a_year_ago = datetime.datetime.now() - relativedelta(months=6)
        ws_view = self.application.worksets_db.view("worksets/summary", descending=True)
        workset_keys = {}

        for row in ws_view:
            if all:
                result[row.key] = row.value
                result[row.key].pop("_id", None)
                result[row.key].pop("_rev", None)
                workset_keys[row.value["id"]] = row.key
            else:
                try:
                    if parse(row.value["date_run"]) >= half_a_year_ago:
                        result[row.key] = row.value
                        result[row.key].pop("_id", None)
                        result[row.key].pop("_rev", None)
                        workset_keys[row.value["id"]] = row.key
                # Exception that date_run is not available
                except TypeError:
                    continue

        # Get Latest running note
        notes = self.application.running_notes_db.view(
            "latest_note_previews/workset",
            reduce=True,
            group=True,
            keys=list(workset_keys.keys()),
        )
        for row in notes:
            result[workset_keys[row.key]]["latest_running_note"] = {
                row.value["created_at_utc"]: row.value
            }

        return result

    def get(self):
        # Default is to NOT show all worksets
        all = self.get_argument("all", False)
        t = self.application.loader.load("worksets.html")
        ws_data = self.worksets_data(all=all)
        headers = [
            ["Date Run", "date_run"],
            ["Workset Name", "workset_name"],
            ["Projects (samples)", "projects"],
            ["Sequencing Setup", "sequencing_setup"],
            ["Date finished", "finish date"],
            ["Operator", "technician"],
            ["Application", "application"],
            ["Library", "library_method"],
            ["Option", "library_option"],
            ["Samples Passed", "passed"],
            ["Samples Failed", "failed"],
            ["Pending Samples", "unknown"],
            ["Total samples", "total"],
            ["Latest workset note", "latest_running_note"],
            ["Closed Worksets", "closed_ws"],
        ]
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                worksets=all,
                user=self.get_current_user(),
                ws_data=ws_data,
                headers=headers,
                form_date=LatestRunningNoteHandler.formatDate,
                all=all,
            )
        )


class WorksetDataHandler(SafeHandler):
    """Loaded through /api/v1/workset/[workset]"""

    def get(self, workset):
        self.set_header("Content-type", "application/json")
        result = self.__class__.get_workset_data(self.application, workset)
        self.write(json.dumps(result))

    @staticmethod
    def get_workset_data(application, workset):
        ws_view = application.worksets_db.view("worksets/name", descending=True)
        result = {}
        for row in ws_view[workset]:
            result[row.key] = row.value
            result[row.key].pop("_id", None)
            result[row.key].pop("_rev", None)
        if not result:
            # Check if the lims id was used
            ws_view = application.worksets_db.view("worksets/lims_id")
            for row in ws_view[workset]:
                result[row.key] = row.value
                result[row.key].pop("_id", None)
                result[row.key].pop("_rev", None)
        for key in result:
            for project in result[key]["projects"]:
                result[key]["projects"][project]["samples"] = dict(
                    sorted(result[key]["projects"][project]["samples"].items())
                )
        return result


class ClosedWorksetsHandler(SafeHandler):
    """Handles all closed worksets for the closed ws tab
    URL: /api/v1/closed_worksets
    """

    def get(self):
        result = {}
        a_year_ago = datetime.datetime.now() - relativedelta(years=1)
        project_dates_view = self.application.projects_db.view("project/id_name_dates")
        project_dates = dict((row.key, row.value) for row in project_dates_view)
        ws_view = self.application.worksets_db.view("worksets/summary", descending=True)
        for row in ws_view:
            if row.value.get("date_run"):
                if parse(row.value["date_run"]) <= a_year_ago:
                    flag = True
                    for project in row.value["projects"]:
                        if project == "Control":
                            flag = False
                        else:
                            close_date_s = project_dates[project]["close_date"]
                            if close_date_s == "0000-00-00":
                                flag = False
                                break
                            close_date = datetime.datetime.strptime(
                                close_date_s, "%Y-%m-%d"
                            )
                            if close_date >= a_year_ago:
                                flag = False
                                break
                    if flag:
                        result[row.key] = row.value
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(result))


class WorksetHandler(SafeHandler):
    """Loaded through /workset/[workset]"""

    def get(self, workset):
        t = self.application.loader.load("workset_samples.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                workset_name=workset,
                lims_uri=BASEURI,
                user=self.get_current_user(),
            )
        )


class WorksetSearchHandler(SafeHandler):
    """Searches Worksetsfor text string
    Loaded through /api/v1/workset_search/([^/]*)$
    """

    last_fetched = None
    cached_list = None

    def get(self, search_string):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.search_workset_names(search_string)))

    def search_workset_names(self, search_string=""):
        if len(search_string) == 0:
            return ""
        worksets = []

        # The list of worksets is cached for speed improvement
        t_threshold = datetime.datetime.now() - relativedelta(minutes=3)
        if (
            WorksetSearchHandler.cached_list is None
            or WorksetSearchHandler.last_fetched < t_threshold
        ):
            ws_view = self.application.worksets_db.view(
                "worksets/only_name", descending=True
            )
            WorksetSearchHandler.cached_list = [row.key for row in ws_view]
            WorksetSearchHandler.last_fetched = datetime.datetime.now()

        search_string = search_string.lower()
        for row_key in WorksetSearchHandler.cached_list:
            if search_string in row_key.lower():
                fc = {"url": "/workset/" + row_key, "name": row_key}
                worksets.append(fc)

        return worksets


class WorksetLinksHandler(SafeHandler):
    """Serves external links for each project
    Links are stored as JSON in LIMS / project
    URL: /api/v1/workset_links/([^/]*)
    """

    lims = lims.Lims(BASEURI, USERNAME, PASSWORD)

    def get(self, lims_step):
        self.set_header("Content-type", "application/json")
        p = Process(self.lims, id=lims_step)
        p.get(force=True)

        links = json.loads(p.udf["Links"]) if "Links" in p.udf else {}

        # Sort by descending date, then hopefully have deviations on top
        sorted_links = OrderedDict()
        for k, v in sorted(links.items(), key=lambda t: t[0], reverse=True):
            sorted_links[k] = v
        sorted_links = OrderedDict(
            sorted(sorted_links.items(), key=lambda k: k[1]["type"])
        )
        self.write(sorted_links)

    def post(self, lims_step):
        user = self.get_current_user()
        a_type = self.get_argument("type", "")
        title = self.get_argument("title", "")
        url = self.get_argument("url", "")
        desc = self.get_argument("desc", "")

        if not a_type or not title:
            self.set_status(400)
            self.finish("<html><body>Link title and type is required</body></html>")
        else:
            p = Process(self.lims, id=lims_step)
            p.get(force=True)
            links = json.loads(p.udf["Links"]) if "Links" in p.udf else {}
            links[str(datetime.datetime.now())] = {
                "user": user.name,
                "email": user.email,
                "type": a_type,
                "title": title,
                "url": url,
                "desc": desc,
            }
            p.udf["Links"] = json.dumps(links)
            p.put()
            self.set_status(200)
            # ajax cries if it does not get anything back
            self.set_header("Content-type", "application/json")
            self.finish(json.dumps(links))
