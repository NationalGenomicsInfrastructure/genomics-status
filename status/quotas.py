import tornado.web
import json
import time
import copy

from dateutil import parser
from status.util import dthandler, SafeHandler
import datetime


class QuotasHandler(SafeHandler):
    """ Serves a grid of time series plots for UPPNEX storage quotas.
    URL: /quotas
    """

    def get(self):
        view = self.application.server_status_db.view("uppmax/by_timestamp")
        uppmax_projects = {}
        for row in view.rows:
            project_nobackup = row.value['project'].replace('/', '_')
            project_id = copy.copy(row.value['project'].split('/')[0])
#          # in javascript it has to be multiplied by 1000, no idea why
            timestamp = int(time.mktime(parser.parse(row.value.get('time')).timetuple())) * 1000
            if project_id not in uppmax_projects:
                uppmax_projects[project_id] = {
                    'cpu_hours':        {'plot_data': [], 'limit_data': [], 'max_x_value': 0, 'min_time': timestamp},
                    'disk_usage':       {'plot_data': [], 'limit_data': [], 'max_x_value': 0, 'min_time': timestamp},
                    'nobackup_usage':   {'plot_data': [], 'limit_data': [], 'max_x_value': 0, 'min_time': timestamp},
                    'quota_decrease': {},
                    'nobackup_quota_decrease': {},
                    'cpu_quota_decrease': {}}

            # get quota decrease
            quota_decrease = self.__extract_quota_decrease(row)
            if quota_decrease:
                if 'nobackup' in project_nobackup:
                    uppmax_projects[project_id]['nobackup_quota_decrease'] = quota_decrease
                else:
                    uppmax_projects[project_id]['quota_decrease'] = quota_decrease

            # get cpu quota decrease
            cpu_quota_decrease = self.__extract_cpu_quota_decrease(row)
            if cpu_quota_decrease:
                uppmax_projects[project_id]['cpu_quota_decrease'] = cpu_quota_decrease

            # get disk usage
            try:
                disk_usage = float(row.value['usage (GB)'])
                disk_limit = float(row.value['quota limit (GB)'])
            except:
                # if no usage, or if it's not a float
                pass
            else:
                usage_plot_data = [timestamp, disk_usage]
                limit_plot_data = [timestamp, disk_limit]
                if 'nobackup' in project_nobackup:
                    project_data = uppmax_projects[project_id]['nobackup_usage']
                else:
                    project_data = uppmax_projects[project_id]['disk_usage']

                project_data['plot_data'].append(usage_plot_data)
                project_data['limit_data'].append(limit_plot_data)
                project_data['max_x_value'] = max(project_data['max_x_value'], disk_usage, disk_limit)
                project_data['min_time'] = min(project_data['min_time'], timestamp)

            # get cpu hours
            try:
                cpu_usage = float(row.value['cpu hours'])
                cpu_limit = float(row.value['cpu limit'])
            except:
                pass
            else:
                usage_plot_data = [timestamp, cpu_usage]
                limit_plot_data = [timestamp, cpu_limit]
                project_data = uppmax_projects[project_id]['cpu_hours']
                project_data['plot_data'].append(usage_plot_data)
                project_data['limit_data'].append(limit_plot_data)
                project_data['max_x_value'] = max(project_data['max_x_value'], cpu_usage, cpu_limit)

        for project_id in uppmax_projects:
            description = self.application.uppmax_projects.get(project_id, '')
            uppmax_projects[project_id]['description'] = description

        t = self.application.loader.load("uppmax_quotas.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user_name(),
                              uppmax_projects=uppmax_projects))

    def __extract_quota_decrease(self, row):
        result = []
        quota_decrease = row.value.get('quota_decrease')
        # sometimes it is  '*', skip it
        if quota_decrease and '@' in quota_decrease:
            quota_decrease = quota_decrease.split(',')
            today = datetime.date.today()
            for value in quota_decrease:
                try:
                    quota, date = value.strip().split('@')
                except:
                    continue
                quota_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
                if quota_date < today:
                    continue
                days = (quota_date - today).days
                result.append({'date': date, 'quota': quota, 'days': days })

        next_decrease = min(result, key=lambda d:d['date']) if result else {}
        return next_decrease

    def __extract_cpu_quota_decrease(self, row):
        result = []
        quota_decrease = row.value.get('cpu_quota_decrease')
        if quota_decrease:
            today = datetime.date.today()
            for date, quota in quota_decrease.items():
                print date, quota
                quota_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
                if quota_date < today:
                    continue
                days = (quota_date - today).days
                result.append({'date': quota_date, 'quota': quota, 'days': days})
        next_decrease = min(result, key=lambda d:d['date']) if result else {}
        return next_decrease