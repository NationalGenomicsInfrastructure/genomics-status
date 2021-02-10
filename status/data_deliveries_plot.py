import json
import datetime
from status.util import SafeHandler


class DataDeliveryHandler(SafeHandler):
    """ Handles the api call to proj_staged data
    Loaded through /api/v1/proj_staged/([^/]*)$
    """
    def get(self, search_string=None):
        staged_files_view = self.application.projects_db.view("project/staged_files_irma")
        summary_view = self.application.projects_db.view("project/summary")
        delivered_data = {}
        if not search_string:
            last_month = datetime.datetime.now()-datetime.timedelta(days=30)
            first_term = last_month.isoformat()[:10]
            second_term = datetime.datetime.now().isoformat()[:10]
            search_string = "{}--{}".format(first_term, second_term)
        searches = search_string.split('--')
        for row in staged_files_view.rows:
            filesize = 0
            for project,samples in row.value.items():
                for sample,filesizes in samples.items():
                    filesize += int(filesizes['size_in_bytes'])
            project_name = row.key[0]
            project_id_staged = row.key[1]
            for row in summary_view.rows:
                project_id_summary = row.key[1]
                if project_id_staged == project_id_summary: 
                    if 'project_summary' in row.value and 'details' in row.value  and 'all_raw_data_delivered' in row.value['project_summary']:
                        delivered = row.value['project_summary']['all_raw_data_delivered']
                        if searches[0] < delivered < searches[1]:
                            if 'sequencing_platform' in row.value['details'] and 'application' in row.value['details'] \
                              and 'type' in row.value['details'] and 'sample_type' in row.value['details'] and \
                              'best_practice_bioinformatics' in row.value['details'] and 'delivery_type' in row.value:
                                platform = row.value['details']['sequencing_platform']
                                app = row.value['details']['application']
                                typ = row.value['details']['type']
                                sample = row.value['details']['sample_type']
                                bp = row.value['details']['best_practice_bioinformatics']
                                delivery = row.value['delivery_type']
                                delivered_data[project_id_summary] = {'filesize': filesize, 'project_name': project_name, 'delivered': delivered, 'platform': platform, 'app': app, 'typ': typ, 'sample': sample, 'bp': bp, 'delivery': delivery}
                            else:
                                delivered_data[project_id_summary] = {'filesize': filesize, 'project_name': project_name, 'delivered': delivered}
        sorted_data = dict(sorted(delivered_data.items(), key=lambda t: t[1].get('delivered', '%Y-%m-%d')))
        self.set_header('Content-type', "application/json")
        self.write(json.dumps(sorted_data))

class  DeliveryPlotHandler(SafeHandler):
    """ Handles the delivery_plot page
    Loaded through /data_delivered_plot
    """
    def get(self):
        t = self.application.loader.load("data_delivered_plot.html")
        self.write(t.generate(gs_globals=self.application.gs_globals,
                              user=self.get_current_user()))
