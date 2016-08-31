import json

from status.util import SafeHandler

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


class YearApplicationsProjectHandler(SafeHandler):
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/year_application_count", 2)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class YearApplicationsSamplesHandler(SafeHandler):
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/year_application_count_samples", 2)
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
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/open_application_count_projects", 1)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class ApplicationOpenSamplesHandler(SafeHandler):
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/open_application_count_samples", 1)
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

class StatsAggregationHandler(SafeHandler):
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
        data={}
        for pa in self.project_aggregates:
            data[pa]=get_stats_data(self.application.projects_db, self.project_aggregates[pa][0], self.project_aggregates[pa][1])
        for fa in self.flowcell_aggregates:
            data[pa]=get_stats_data(self.application.x_flowcells_db, self.flowcell_aggregates[fa][0], self.flowcell_aggregates[fa][1])
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))



