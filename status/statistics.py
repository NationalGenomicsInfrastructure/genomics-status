import json
import yaml

from status.util import SafeHandler, UnsafeHandler

def get_default_stats_data(view):
    data={}
    for row in view:
        try:
            data[row.key[0]][row.key[1]]=row.value
        except (TypeError, KeyError):
            data[row.key[0]]={}
            data[row.key[0]][row.key[1]]=row.value
    return data

def get_stats_data(db,view,gl=None):
    data={}
    if gl==2:
        view=db.view(view, group_level=gl)
        data=get_default_stats_data(view)
    elif gl==1:
        for row in db.view(view, group_level=gl):
            data[row.key]=row.value
    return data

def clean_application_keys_y(raw_data):
    # Normalise Application names to approved list
    # Don't let Denis see this, it will make him cry
    with open('application_keys.yaml') as f:
        app_cats=yaml.load(f)
    data={}
    for year in raw_data:
        data[year] = {}
        for c in raw_data[year]:
            try:
                data[year][app_cats[c]] += raw_data[year][c]
            except KeyError:
                try:
                    data[year][app_cats[c]] = raw_data[year][c]
                except KeyError:
                    data[year][c] = raw_data[year][c]
    return data

def clean_application_keys(raw_data):
    # Normalise Application names to approved list
    # Don't let Denis see this, it will make him cry
    with open('application_keys.yaml') as f:
        app_cats=yaml.load(f)
    data={}
    for c in raw_data:
        try:
            data[app_cats[c]] += raw_data[c]
        except KeyError:
            try:
                data[app_cats[c]] = raw_data[c]
            except KeyError:
                data[c] = raw_data[c]
    return data


class YearApplicationsProjectHandler(SafeHandler):
    def get(self):
        raw_data={}
        raw_data=get_stats_data(self.application.projects_db, "genomics-dashboard/year_application_count", 2)
        data = clean_application_keys_y(raw_data)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class YearApplicationsSamplesHandler(SafeHandler):
    def get(self):
        raw_data={}
        raw_data=get_stats_data(self.application.projects_db, "genomics-dashboard/year_application_count_samples", 2)
        data = clean_application_keys_y(raw_data)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class YearAffiliationProjectsHandler(SafeHandler):
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/year_affiliation_count_projects", 2)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class YearDeliverytimeProjectsHandler(SafeHandler):
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/year_deliverytime_count_projects", 2)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class ApplicationOpenProjectsHandler(SafeHandler):
    def get(self):
        raw_data={}
        raw_data=get_stats_data(self.application.projects_db, "genomics-dashboard/open_application_count_projects", 1)
        data = clean_application_keys(raw_data)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class ApplicationOpenSamplesHandler(SafeHandler):
    def get(self):
        raw_data={}
        raw_data=get_stats_data(self.application.projects_db, "genomics-dashboard/open_application_count_samples", 1)
        data = clean_application_keys(raw_data)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class WeekInstrumentTypeYieldHandler(SafeHandler):
    def get(self):
        data={}
        data=get_stats_data(self.application.x_flowcells_db, "dashboard/week_instr_bp", 2)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class StatsAggregationHandler(UnsafeHandler):
    project_aggregates={
            "num_projects" : ("genomics-dashboard/year_application_count", 2),
            "num_samples" : ("genomics-dashboard/year_application_count_samples", 2),
            "project_user_affiliations" : ("genomics-dashboard/year_affiliation_count_projects", 2),
            "delivery_times" : ("genomics-dashboard/year_deliverytime_count_projects", 2),
            "open_projects" : ("genomics-dashboard/open_application_count_projects", 1),
            "open_project_samples" : ("genomics-dashboard/open_application_count_samples", 1)
            }
    flowcell_aggregates={
            "bp_seq_per_week" : ("dashboard/week_instr_bp", 2)
            }

    def get(self):
        clean_appkeys_y=['num_projects','num_samples']
        clean_appkeys=['open_projects','open_project_samples']
        data={}
        for pa in self.project_aggregates:
            data[pa]=get_stats_data(self.application.projects_db, self.project_aggregates[pa][0], self.project_aggregates[pa][1])
            if pa in clean_appkeys_y:
                data[pa] = clean_application_keys_y(data[pa])
            if pa in clean_appkeys:
                data[pa] = clean_application_keys(data[pa])
        for fa in self.flowcell_aggregates:
            data[fa]=get_stats_data(self.application.x_flowcells_db, self.flowcell_aggregates[fa][0], self.flowcell_aggregates[fa][1])
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))



