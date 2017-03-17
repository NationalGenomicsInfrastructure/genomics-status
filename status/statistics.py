import json

from status.util import SafeHandler, UnsafeHandler

def get_clean_application_keys(handler):
    categories_v=handler.application.application_categories_db.view("general/app_cat")
    clean_keys={}
    category=None
    for row in categories_v:
        clean_keys[row.key]=row.value

    return clean_keys

def get_stats_data(db,view,gl=None, cleaning=None):
    if not cleaning:
        cleaning={} 
    data={}
    db_view=db.view(view, group_level=gl)
    if gl==2:
        for row in db_view:
            meta_key1 = row.key[1] 
            if meta_key1 in cleaning:
                meta_key1=cleaning[meta_key1]
            if row.key[0] not in data:
                data[row.key[0]]={}
            if meta_key1 not in data[row.key[0]]:
                 data[row.key[0]][meta_key1]=row.value
            else:
                 data[row.key[0]][meta_key1]+=row.value

    elif gl==1:
        for row in db_view:
            meta_key1 = row.key 
            if meta_key1 in cleaning:
                meta_key1=cleaning[meta_key1]

            if meta_key1 not in data:
                data[meta_key1]=row.value
            else:
                data[meta_key1]+=row.value

    return data


class YearApplicationsProjectHandler(SafeHandler):
    def __init__(self, *args, **kwargs):
        super(YearApplicationsProjectHandler, self).__init__(*args, **kwargs)
        self.cleaning=get_clean_application_keys(self)
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/year_application_count", 2, self.cleaning)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class YearApplicationsSamplesHandler(SafeHandler):
    def __init__(self, *args, **kwargs):
        super(YearApplicationsSamplesHandler, self).__init__(*args, **kwargs)
        self.cleaning=get_clean_application_keys(self)
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/year_application_count_samples", 2, self.cleaning)
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

class YearAffiliationProjectsFinishedLibHandler(SafeHandler):
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/year_affiliation_count_projects_finlib", 2)
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
    def __init__(self, *args, **kwargs):
        super(ApplicationOpenProjectsHandler, self).__init__(*args, **kwargs)
        self.cleaning=get_clean_application_keys(self)
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/open_application_count_projects", 1, self.cleaning)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))

class ApplicationOpenSamplesHandler(SafeHandler):
    def __init__(self, *args, **kwargs):
        super(ApplicationOpenSamplesHandler, self).__init__(*args, **kwargs)
        self.cleaning=get_clean_application_keys(self)
    def get(self):
        data={}
        data=get_stats_data(self.application.projects_db, "genomics-dashboard/open_application_count_samples", 1, cleaning=self.cleaning)
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
    def __init__(self, *args, **kwargs):
        super(StatsAggregationHandler, self).__init__(*args, **kwargs)
        self.project_aggregates={
            "num_projects" : ("genomics-dashboard/year_application_count", 2),
            "num_samples" : ("genomics-dashboard/year_application_count_samples", 2),
            "project_user_affiliations" : ("genomics-dashboard/year_affiliation_count_projects", 2),
            "delivery_times" : ("genomics-dashboard/year_deliverytime_count_projects", 2),
            "delivery_times_finishedlib" :  ("genomics-dashboard/year_deliverytime_count_projects_finlib", 2),
            "open_projects" : ("genomics-dashboard/open_application_count_projects", 1),
            "open_project_samples" : ("genomics-dashboard/open_application_count_samples", 1)
            }
        self.flowcell_aggregates={
            "bp_seq_per_week" : ("dashboard/week_instr_bp", 2)
            }
        self.cleaning=get_clean_application_keys(self)

    def get(self):
        data={}
        for pa in self.project_aggregates:
            data[pa]=get_stats_data(self.application.projects_db, self.project_aggregates[pa][0], self.project_aggregates[pa][1], self.cleaning)
        for fa in self.flowcell_aggregates:
            data[fa]=get_stats_data(self.application.x_flowcells_db, self.flowcell_aggregates[fa][0], self.flowcell_aggregates[fa][1], self.cleaning)
        self.set_header('Content-Type', 'application/json')
        self.set_status(200)
        self.write(json.dumps(data))



