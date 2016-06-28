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
                uppmax_projects[project_id] = {'cpu_hours': {'plot_data': [], 'limit_data': [], 'max_x_value': 0, 'min_time': timestamp},
                    'disk_usage': {'plot_data': [], 'limit_data': [], 'max_x_value': 0, 'min_time': timestamp},
                    'nobackup_usage': {'plot_data': [], 'limit_data': [], 'max_x_value': 0, 'min_time': timestamp},
                    'quota_decrease': {},
                    'nobackup_quota_decrease': {}}

            quota_decrease = row.value.get('quota_decrease')
            # sometimes it is  '*', skip it
            if quota_decrease and '@' in quota_decrease:
                quota_decrease = quota_decrease.split(',')
                for value in quota_decrease:
                    try:
                        quota, date = value.strip().split('@')
                    except:
                        continue
                    today = datetime.date.today()
                    quota_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
                    if quota_date < today:
                        continue
                    days = (quota_date - today).days
                    if 'nobackup' in project_nobackup:
                        uppmax_projects[project_id]['nobackup_quota_decrease'] = {'date': date, 'quota': quota, 'days': days }
                    else:
                        uppmax_projects[project_id]['quota_decrease'] = {'date': date, 'quota': quota, 'days': days }
            if project_id == project_nobackup: # project_nobackup = 'a2010002_nobackup'
                try:
                    disk_usage = [timestamp, float(row.value['usage (GB)'])]
                    disk_limit = [timestamp, float(row.value['quota limit (GB)'])]
                except:
                    # if we have only cpu hours values (or just nothing)
                    continue
                uppmax_projects[project_id]['disk_usage']['plot_data'].append(disk_usage)
                uppmax_projects[project_id]['disk_usage']['limit_data'].append(disk_limit)
                min_time = uppmax_projects[project_id]['disk_usage']['min_time']
                uppmax_projects[project_id]['disk_usage']['min_time'] = min(min_time, timestamp)
                max_x_value = uppmax_projects[project_id]['disk_usage']['max_x_value']
                uppmax_projects[project_id]['disk_usage']['max_x_value'] = max(max_x_value, disk_limit[1], disk_usage[1])

                try:
                    cpu_usage = [timestamp, float(row.value['cpu hours'])]
                    cpu_limit = [timestamp, float(row.value['cpu limit'])]
                except:
                    continue
                uppmax_projects[project_id]['cpu_hours']['plot_data'].append(cpu_usage)
                uppmax_projects[project_id]['cpu_hours']['limit_data'].append(cpu_limit)
                min_time = uppmax_projects[project_id]['cpu_hours']['min_time']
                uppmax_projects[project_id]['cpu_hours']['min_time'] = min(min_time, timestamp)
                max_x_value = uppmax_projects[project_id]['cpu_hours']['max_x_value']
                uppmax_projects[project_id]['cpu_hours']['max_x_value'] = max(max_x_value, cpu_limit[1], cpu_usage[1])
            else:
                try:
                    nobackup_usage = [timestamp, float(row.value['usage (GB)'])]
                    nobackup_limit = [timestamp, float(row.value['quota limit (GB)'])]
                except:
                    continue
                uppmax_projects[project_id]['nobackup_usage']['plot_data'].append(nobackup_usage)
                uppmax_projects[project_id]['nobackup_usage']['limit_data'].append(nobackup_limit)
                min_time = uppmax_projects[project_id]['nobackup_usage']['min_time']
                uppmax_projects[project_id]['nobackup_usage']['min_time'] = min(min_time, timestamp)
                max_x_value = uppmax_projects[project_id]['nobackup_usage']['max_x_value']
                uppmax_projects[project_id]['nobackup_usage']['max_x_value'] = max(max_x_value, nobackup_limit[1], nobackup_usage[1])

        for project_id in uppmax_projects:
            description = self.application.uppmax_projects.get(project_id, '')
            uppmax_projects[project_id]['description'] = description

        t = self.application.loader.load("uppmax_quotas.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user_name(),
                              uppmax_projects=uppmax_projects))
