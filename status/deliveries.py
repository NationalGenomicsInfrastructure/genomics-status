import json
from dateutil import parser as datetime_parser

from status.util import SafeHandler


class DeliveriesPageHandler(SafeHandler):
    def get(self):

        # get project summary data
        summary_view = self.application.projects_db.view('project/summary')
        summary_data = {}
        for project in summary_view:
            # todo: check if this one works
            if project.key[0] != 'closed':
                project_id = project.key[1]
                summary_data[project_id] = project.value

        # wtf don't they return json or anything normal
        bioinfo_data_view = self.application.bioinfo_db.view("latest_data/sample_id_open")
        bioinfo_data = {}

        ongoing_deliveries = {}
        # make a normal dict from the view result
        for row in bioinfo_data_view.rows:
            project_id = row.key[0]
            flowcell_id = row.key[1]
            lane_id = row.key[2]
            sample_id = row.key[3]
            if project_id not in ongoing_deliveries and project_id in summary_data:
                ongoing_deliveries[project_id] = {}
            # project_id, lane_id, sample_id, flowcell_id = row.key
            if project_id not in bioinfo_data:
                bioinfo_data[project_id] = {flowcell_id: {lane_id: {sample_id: row.value}}}
            elif flowcell_id not in bioinfo_data[project_id]:
                bioinfo_data[project_id][flowcell_id] = {lane_id: {sample_id: row.value}}
            elif lane_id not in bioinfo_data[project_id][flowcell_id]:
                bioinfo_data[project_id][flowcell_id][lane_id] = {sample_id: row.value}
            elif sample_id not in bioinfo_data[project_id][flowcell_id][lane_id]:
                bioinfo_data[project_id][flowcell_id][lane_id][sample_id] = row.value
            else:
                bioinfo_data[project_id][flowcell_id][lane_id].update({sample_id: row.value})

        all_running_notes = {}
        number_of_projects = 0
        number_of_flowcells = 0
        number_of_lanes = 0
        number_of_samples = 0
        for project_id in ongoing_deliveries:
            number_of_projects += 1
            if project_id in summary_data and project_id in bioinfo_data:
                project = summary_data[project_id]
                running_notes = json.loads(project['details']['running_notes'])
                flowcells = bioinfo_data[project_id]
                runs_bioinfo = {}
                for flowcell_id in flowcells:
                    number_of_flowcells += 1
                    flowcell_statuses = []
                    flowcell_checklists = {'total': 0, 'completed': 0}
                    for lane_id in flowcells[flowcell_id]:
                        number_of_lanes += 1
                        lane_statuses = []
                        lane_checklists = {'total': 0, 'completed': 0}
                        for sample_id in flowcells[flowcell_id][lane_id]:
                            number_of_samples += 1
                            # define bioinfo checklist
                            checklist = {
                                'passed': [],
                                'warnings': [],
                                'failed': [],
                                'total': [],
                            }
                            sample_data = flowcells[flowcell_id][lane_id][sample_id]
                            lane_statuses.append(sample_data['sample_status'])
                            qc_and_bp = {}
                            for key in sample_data.get('qc', {}).keys():
                                checklist['total'].append(key)
                                qc_and_bp[key] = sample_data['qc'][key]
                            for key in sample_data.get('bp', {}).keys():
                                checklist['total'].append(key)
                                qc_and_bp[key] = sample_data['bp'][key]
                            for key in qc_and_bp.keys():
                                if qc_and_bp[key] == 'Pass':
                                    checklist['passed'].append(key)
                                elif qc_and_bp[key] == 'Warning':
                                    checklist['warnings'].append(key)
                                elif qc_and_bp[key] == 'Fail':
                                    checklist['failed'].append(key)
                                # don't count 'N/A'
                                elif qc_and_bp[key] == 'N/A':
                                    checklist['total'].remove(key)
                                # else: do not do anything if '?' or anything else

                            if checklist['total'] and len(checklist['total']) == len(checklist['passed']) + len(checklist['warnings']) + len(checklist['failed']):
                                lane_checklists['completed'] += 1
                            lane_checklists['total'] += 1

                            if flowcell_id not in runs_bioinfo:
                                runs_bioinfo[flowcell_id] = {'lanes': {lane_id: {'samples': {sample_id: {'checklist': checklist, 'status': sample_data.get('sample_status', '?')}}}}}
                            elif lane_id not in runs_bioinfo[flowcell_id]['lanes']:
                                runs_bioinfo[flowcell_id]['lanes'][lane_id] = {'samples': {sample_id: {'checklist': checklist, 'status': sample_data.get('sample_status', '?')}}}
                            elif sample_id not in runs_bioinfo[flowcell_id]['lanes'][lane_id]['samples']:
                                runs_bioinfo[flowcell_id]['lanes'][lane_id]['samples'][sample_id] = {'checklist': checklist, 'status': sample_data.get('sample_status', '?')}
                            else:
                                runs_bioinfo[flowcell_id]['lanes'][lane_id]['samples'][sample_id].update(
                                    {'checklist': checklist, 'status': sample_data.get('sample_status', '?')})
                        if lane_checklists['total'] == lane_checklists['completed']:
                            flowcell_checklists['completed'] += 1
                        flowcell_checklists['total'] += 1

                        if len(set(lane_statuses)) == 1:
                            lane_status = lane_statuses[0]
                        elif 'New' in lane_statuses:
                            lane_status = 'New'
                        elif 'Sequencing' in lane_statuses:
                            lane_status = 'Sequencing'
                        elif 'Demultiplexing' in lane_statuses:
                            lane_status = 'Demultiplexing'
                        elif 'Transferring' in lane_statuses:
                            lane_status = 'Transferring'
                        elif 'QC-ongoing' in lane_statuses:
                            lane_status = 'QC-ongoing'
                        elif 'QC-done' in lane_statuses:
                            lane_status = 'QC-done'
                        elif 'BP-ongoing' in lane_statuses:
                            lane_status = 'BP-ongoing'
                        elif 'BP-done' in lane_statuses:
                            lane_status = 'BP-done'

                        runs_bioinfo[flowcell_id]['lanes'][lane_id]['lane_status'] = lane_status
                        runs_bioinfo[flowcell_id]['lanes'][lane_id]['checklist'] = lane_checklists
                        flowcell_statuses.append(lane_status)

                    # the same logic here -> agregate lane statuses
                    if len(set(flowcell_statuses)) == 1:
                        flowcell_status = flowcell_statuses[0]
                    elif 'New' in flowcell_statuses:
                        flowcell_status = 'New'
                    elif 'Sequencing' in flowcell_statuses:
                        flowcell_status = 'Sequencing'
                    elif 'Demultiplexing' in flowcell_statuses:
                        flowcell_status = 'Demultiplexing'
                    elif 'Transferring' in flowcell_statuses:
                        flowcell_status = 'Transferring'
                    elif 'QC-ongoing' in flowcell_statuses:
                        flowcell_status = 'QC-ongoing'
                    elif 'QC-done' in flowcell_statuses:
                        flowcell_status = 'QC-done'
                    elif 'BP-ongoing' in flowcell_statuses:
                        flowcell_status = 'BP-ongoing'
                    elif 'BP-done' in flowcell_statuses:
                        flowcell_status = 'BP-done'

                    runs_bioinfo[flowcell_id]['flowcell_status'] = flowcell_status
                    runs_bioinfo[flowcell_id]['checklist'] = flowcell_checklists
                # parse running notes
                for timestamp, running_note in running_notes.items():
                    # define the level of the running_note
                    note_level = [project_id]
                    # to remove run, lane and sample id from the running note
                    note = running_note['note']


                    # ':::' is added in js, when saving running note
                    # ':::' separates run_id, lane_id and sample_id from running note
                    if '::: ' in running_note['note']:
                        # in case if ':::' occurs more than 1 time (it must occur at least once, because of if)
                        note = ':::'.join([item for item in note.split(':::')[1:]])

                        run_lane_sample = running_note['note'].split(':::')[0]
                        run_lane_sample = run_lane_sample.split()

                        # the key becomes [project_id, run_id, lane, sample_id]
                        note_level += run_lane_sample

                    bioinfo_level = {}
                    try:
                        # can be ValueError -> if we are on the wrong level (too many values to unpack)
                        project_id, run_id, lane_id, sample_id = note_level
                        # or KeyError -> if we are trying to access a value which does not exist in runs_bioinfo
                        bioinfo_level = runs_bioinfo[run_id]['lanes'][lane_id]['samples'][sample_id]
                    except (KeyError, ValueError): # -> too many values
                        try:
                            project_id, run_id, lane_id = note_level
                            bioinfo_level = runs_bioinfo[run_id]['lanes'][lane_id]
                        except (KeyError, ValueError): # still too many values
                            try:
                                project_id, run_id = note_level
                                bioinfo_level = runs_bioinfo[run_id]
                            except (KeyError, ValueError): # again too many
                                # now whatever happens, we put the running note on the project level
                                pass

                    if bioinfo_level:
                        if not 'latest_running_note' in bioinfo_level or timestamp > bioinfo_level['latest_running_note']['timestamp']:
                            # .copy() is needed in order to modify running note without changing it on the project level
                            bioinfo_level['latest_running_note'] = running_note.copy()
                            # remove run, lane and sample id from the running_note
                            bioinfo_level['latest_running_note']['note'] = note
                            bioinfo_level['latest_running_note']['timestamp'] = timestamp

                    if project_id not in all_running_notes:
                        all_running_notes[project_id] = {}
                    all_running_notes[project_id][timestamp] = running_note

                latest_timestamp = max(running_notes.keys())
                latest_running_note = running_notes[latest_timestamp]
                project_data = {
                    'project_name': summary_data[project_id]['project_name'],
                    'application': summary_data[project_id].get('application', 'unknown'),
                    'type': summary_data[project_id]['details'].get('type'),
                    'bioinfo_responsible': summary_data[project_id].get('project_summary', {}).get('bioinfo_responsible', 'unknown'),
                    'runs': runs_bioinfo,
                    'latest_running_note': latest_running_note,
                }


            else:
                project_data = {
                    'error': 'could not find project information for {}'.format(project_id)
                }

            ongoing_deliveries[project_id].update(project_data)
        template = self.application.loader.load("deliveries.html")
        self.write(template.generate(gs_globals=self.application.gs_globals,
                                     deliveries=ongoing_deliveries,
                                     running_notes=all_running_notes,
                                     number_of_projects=number_of_projects,
                                     number_of_flowcells=number_of_flowcells,
                                     number_of_lanes=number_of_lanes,
                                     number_of_samples=number_of_samples
                                     ))
