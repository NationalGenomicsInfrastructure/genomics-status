import json

from status.util import SafeHandler, UnsafeHandler


def get_clean_application_keys(handler):
    categories_v = handler.application.cloudant.post_view(
        db="application_categories",
        ddoc="general",
        view="app_cat",
    ).get_result()["rows"]
    clean_keys = {}
    for row in categories_v:
        clean_keys[row["key"]] = row["value"]

    return clean_keys


def get_stats_data(db_conn, view, gl=0, cleaning=None, doreduce=True):
    if not cleaning:
        cleaning = {}
    data = {}

    def general_cleaning(meta_key):
        if meta_key in cleaning:
            return cleaning[meta_key]
        else:
            return meta_key

    # db_view = db.view(view, group_level=gl, reduce=doreduce)
    db_view = db_conn.post_view(
        **view,
        group_level=gl,
        reduce=doreduce,
    ).get_result()["rows"]
    if gl == 2:
        for row in db_view:
            meta_key1 = row["key"][1]
            if meta_key1 in cleaning:
                meta_key1 = cleaning[meta_key1]
            if row["key"][0] not in data:
                data[row["key"][0]] = {}
            if meta_key1 not in data[row["key"][0]]:
                data[row["key"][0]][meta_key1] = row["value"]
            else:
                data[row["key"][0]][meta_key1] += row["value"]

    elif gl == 1:
        for row in db_view:
            meta_key1 = row["key"]
            if meta_key1 in cleaning:
                meta_key1 = cleaning[meta_key1]

            if meta_key1 not in data:
                data[meta_key1] = row["value"]
            else:
                data[meta_key1] += row["value"]
    elif gl == 0:
        for row in db_view:
            new_key = list(map(general_cleaning, row["key"]))
            if new_key[0] not in data:
                data[new_key[0]] = {}
            if new_key[1] not in data[new_key[0]]:
                data[new_key[0]][new_key[1]] = [row["value"]]
            else:
                data[new_key[0]][new_key[1]].append(row["value"])

    return data


class YearApplicationsProjectHandler(SafeHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cleaning = get_clean_application_keys(self)

    def get(self):
        data = {}
        data = get_stats_data(
            self.application.cloudant,
            {
                "db": "projects",
                "ddoc": "genomics-dashboard",
                "view": "year_application_count",
            },
            2,
            self.cleaning,
        )
        self.set_header("Content-Type", "application/json")
        self.set_status(200)
        self.write(json.dumps(data))


class YearApplicationsSamplesHandler(SafeHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cleaning = get_clean_application_keys(self)

    def get(self):
        data = {}
        data = get_stats_data(
            self.application.cloudant,
            {
                "db": "projects",
                "ddoc": "genomics-dashboard",
                "view": "year_application_count_samples",
            },
            2,
            self.cleaning,
        )
        self.set_header("Content-Type", "application/json")
        self.set_status(200)
        self.write(json.dumps(data))


class YearAffiliationProjectsHandler(SafeHandler):
    def get(self):
        data = {}
        data = get_stats_data(
            self.application.cloudant,
            {
                "db": "projects",
                "ddoc": "genomics-dashboard",
                "view": "year_affiliation_count_projects",
            },
            2,
        )
        self.set_header("Content-Type", "application/json")
        self.set_status(200)
        self.write(json.dumps(data))


class YearDeliverytimeProjectsHandler(SafeHandler):
    def get(self):
        data = {}
        data = get_stats_data(
            self.application.cloudant,
            {
                "db": "projects",
                "ddoc": "genomics-dashboard",
                "view": "year_deliverytime_count_projects",
            },
            2,
        )
        self.set_header("Content-Type", "application/json")
        self.set_status(200)
        self.write(json.dumps(data))


class ApplicationOpenProjectsHandler(SafeHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cleaning = get_clean_application_keys(self)

    def get(self):
        data = {}
        data = get_stats_data(
            self.application.cloudant,
            {
                "db": "projects",
                "ddoc": "genomics-dashboard",
                "view": "open_application_count_projects",
            },
            1,
            self.cleaning,
        )
        self.set_header("Content-Type", "application/json")
        self.set_status(200)
        self.write(json.dumps(data))


class ApplicationOpenSamplesHandler(SafeHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cleaning = get_clean_application_keys(self)

    def get(self):
        data = {}
        data = get_stats_data(
            self.application.cloudant,
            {
                "db": "projects",
                "ddoc": "genomics-dashboard",
                "view": "open_application_count_samples",
            },
            1,
            cleaning=self.cleaning,
        )
        self.set_header("Content-Type", "application/json")
        self.set_status(200)
        self.write(json.dumps(data))


class WeekInstrumentTypeYieldHandler(SafeHandler):
    def get(self):
        data = {}
        data = get_stats_data(
            self.application.cloudant,
            {"db": "x_flowcells", "ddoc": "dashboard", "view": "week_instr_bp"},
            2,
        )
        self.set_header("Content-Type", "application/json")
        self.set_status(200)
        self.write(json.dumps(data))


class YearDeliverytimeApplicationHandler(UnsafeHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cleaning = get_clean_application_keys(self)

    def get(self):
        data = {}
        data = get_stats_data(
            self.application.cloudant,
            {
                "db": "projects",
                "ddoc": "genomics-dashboard",
                "view": "year_deliverytime_median_by_application",
            },
            cleaning=self.cleaning,
            doreduce=False,
        )
        self.set_header("Content-Type", "application/json")
        self.set_status(200)
        self.write(json.dumps(data))


class StatsAggregationHandler(UnsafeHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.aggregates = {
            "projects": {
                "num_projects": (
                    {"ddoc": "genomics-dashboard", "view": "year_application_count"},
                    2,
                ),
                "num_samples": (
                    {
                        "ddoc": "genomics-dashboard",
                        "view": "year_application_count_samples",
                    },
                    2,
                ),
                "num_seq_projects": (
                    {
                        "ddoc": "genomics-dashboard",
                        "view": "year_seq_application_count",
                    },
                    2,
                ),
                "num_seq_samples": (
                    {
                        "ddoc": "genomics-dashboard",
                        "view": "year_seq_application_count_samples",
                    },
                    2,
                ),
                "project_user_affiliations": (
                    {
                        "ddoc": "genomics-dashboard",
                        "view": "year_affiliation_count_projects",
                    },
                    2,
                ),
                "delivery_times": (
                    {
                        "ddoc": "genomics-dashboard",
                        "view": "year_deliverytime_count_projects",
                    },
                    2,
                ),
                "delivery_times_median": (
                    {
                        "ddoc": "genomics-dashboard",
                        "view": "year_deliverytime_median_by_application",
                    },
                    2,
                ),
                "open_projects": (
                    {
                        "ddoc": "genomics-dashboard",
                        "view": "open_application_count_projects",
                    },
                    1,
                ),
                "open_seq_projects": (
                    {
                        "ddoc": "genomics-dashboard",
                        "view": "open_application_count_seq_projects",
                    },
                    1,
                ),
                "open_project_samples": (
                    {
                        "ddoc": "genomics-dashboard",
                        "view": "open_application_count_samples",
                    },
                    1,
                ),
            },
            "x_flowcells": {
                "bp_seq_per_week": ({"ddoc": "dashboard", "view": "week_instr_bp"}, 2),
            },
            "nanopore_runs": {
                "bp_seq_per_week": ({"ddoc": "dashboard", "view": "week_instr_bp"}, 2),
            },
            "element_runs": {
                "bp_seq_per_week": ({"ddoc": "dashboard", "view": "week_instr_bp"}, 2),
            },
        }
        self.cleaning = get_clean_application_keys(self)

    def get(self):
        data = {}
        for db, pa in self.aggregates.items():
            for key, (view, gl) in pa.items():
                stats = get_stats_data(
                    self.application.cloudant,
                    {"db": db, **view},
                    gl,
                    self.cleaning,
                )
                # For nanopore and element runs, we want to merge the stats into the
                # flowcell aggregates
                if db in ("nanopore_runs", "element_runs"):
                    # Use |= to merge the resulting dictionary with what's already
                    # inside data[fa][key], | works as a union for dictionaries.
                    # Doesn't work recursively though, so we have to do it for the bottom level only
                    for sub_key, value in stats.items():
                        # key should always be bp_seq_per_week
                        if sub_key in data[key]:
                            data[key][sub_key] |= value
                        else:
                            data[key][sub_key] = value
                else:
                    data[key] = stats

        self.set_header("Content-Type", "application/json")
        self.set_status(200)
        self.write(json.dumps(data))
