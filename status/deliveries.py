import json
from dateutil import parser as datetime_parser

from status.util import SafeHandler

app_fields = {
  'core': ["undemultiplexedreads","unexpectedindexes","lowsampleyield","laneyield","sampleyield","phixerrorrate",
    "basesq30","fastq_screen","blast_wrapper","samplereport","projectreport","dataandreportstransferred","emailsenttouser"],
  'finished': [],
  'rnaseq': ["rnaseq_sequenceduplication","rnaseq_uniquemappingrate"],
  'exome': ["exome_sequenceduplication","exome_targets10xcoverage"],
  'customCap': ["customCap_enrichment"],
  'WGreseq': ["WGreseq_sequenceduplication","WGreseq_mappingrate"],
  'denovo': ["denovo_adaptertrimming","denovo_kmerprofile"],
  'applications': ["applications_datadelivered","applications_dataapproved"]}

class DeliveriesPageHandler(SafeHandler):
    def get(self):
        # wtf don't they return json or anything normal
        bioinfo_data_view = self.application.bioinfo_db.view("latest_data/sample_id")
        bioinfo_data = {}

        # make a normal dict from the view result
        for row in bioinfo_data_view.rows:
            project_id = row.key[0]
            flowcell_id = row.key[1]
            lane_id = row.key[2]
            sample_id = row.key[3]
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

        # get project summary data
        summary_view = self.application.projects_db.view('project/summary')
        summary_data = {}
        for project in summary_view:
            project_id = project.key[1]
            summary_data[project_id] = project.value

        # get ongoing deliveries
        ongoing_view = self.application.bioinfo_db.view("general/ongoing_projectids", group=True)
        ongoing_ids = [row.key for row in ongoing_view]

        # now the same thing again, but for incoming deliveries
        incoming_view = self.application.bioinfo_db.view("general/incoming_projectids", group=True)
        incoming_ids = [row.key for row in incoming_view]

        # merge incoming and ongoing deliveries into one dict
        all_deliveries = {project_id: {} for project_id in ongoing_ids + incoming_ids if project_id in summary_data and project_id in bioinfo_data}

        all_running_notes = {}
        for project_id in all_deliveries:
            if project_id in summary_data and project_id in bioinfo_data:
                project = summary_data[project_id]
                running_notes = json.loads(project['details']['running_notes'])
                flowcells = bioinfo_data[project_id]
                runs_bioinfo = {}

                for flowcell_id in flowcells:
                    flowcell_statuses = []
                    for lane_id in flowcells[flowcell_id]:
                        lane_statuses = []
                        for sample_id in flowcells[flowcell_id][lane_id]:
                            # define bioinfo checklist
                            checklist = {
                                'passed': [],
                                'warnings': [],
                                'failed': [],
                                'NAs': [],
                                'total': [],
                            }
                            sample_data = flowcells[flowcell_id][lane_id][sample_id]
                            lane_statuses.append(sample_data.get('sample_status', 'New'))
                            for key in sample_data.keys():
                                if key in app_fields['core'] or key in app_fields['applications']:
                                    checklist['total'].append(key)

                                    # parse() returns current date if string contains no date
                                    # fuzzy=True: to ignore strange symbols.
                                    timestamp = datetime_parser.parse(sample_data[key], fuzzy=True) != datetime_parser.parser('')
                                    # if timestamp -> passed
                                    if timestamp or sample_data[key] == 'Pass':
                                        checklist['passed'].append(key)
                                    elif sample_data[key] == 'Warning':
                                        checklist['warnings'].append(key)
                                    elif sample_data[key] == 'Fail':
                                        checklist['failed'].append(key)
                                    elif sample_data[key] == 'N/A' or '?':
                                        checklist['NAs'].append(key)
                                    else:
                                        del checklist['total'][key]
                                if flowcell_id not in runs_bioinfo:
                                    runs_bioinfo[flowcell_id] = {'lanes': {lane_id: {'samples': {sample_id: {'checklist': checklist, 'status': sample_data.get('sample_status', '?')}}}}}
                                elif lane_id not in runs_bioinfo[flowcell_id]['lanes']:
                                    runs_bioinfo[flowcell_id]['lanes'][lane_id] = {'samples': {sample_id: {'checklist': checklist, 'status': sample_data.get('sample_status', '?')}}}
                                elif sample_id not in runs_bioinfo[flowcell_id]['lanes'][lane_id]['samples']:
                                    runs_bioinfo[flowcell_id]['lanes'][lane_id]['samples'][sample_id] = {'checklist': checklist, 'status': sample_data.get('sample_status', '?')}
                                else:
                                    runs_bioinfo[flowcell_id]['lanes'][lane_id]['samples'][sample_id].update(
                                        {'checklist': checklist, 'status': sample_data.get('sample_status', '?')})

                        if len(set(lane_statuses)) == 1:
                            lane_status = lane_statuses[0]
                        # todo: figure out which statuses can be
                        lane_status = lane_statuses[0]

                        runs_bioinfo[flowcell_id]['lanes'][lane_id]['lane_status'] = lane_status
                        flowcell_statuses.append(lane_status)

                    # the same logic here -> agregate lane statuses
                    if len(set(flowcell_statuses)) == 1:
                        flowcell_status = flowcell_statuses[0]
                    else:
                        flowcell_status = 'Undefined'
                    runs_bioinfo[flowcell_id]['flowcell_status'] = flowcell_status

                # parse running notes
                for timestamp, running_note in running_notes.items():
                    # define the level of the running_note
                    note_level = [project_id]
                    # to remove run, lane and sample id from the running note
                    note = running_note['note']


                    # ':::' is added in js, when saving running note
                    # ':::' separates run_id, lane_id and sample_id from running note
                    if '::: ' in running_note['note']:
                        # import pdb
                        # pdb.set_trace()
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

                    # make a string because list is not hashable
                    note_level = '-'.join([key for key in note_level])
                    if note_level not in all_running_notes:
                        all_running_notes[note_level] = {}
                    all_running_notes[note_level][timestamp] = running_note

                latest_timestamp = max(running_notes.keys())
                latest_running_note = running_notes[latest_timestamp]
                project_data = {
                    'project_name': summary_data[project_id]['project_name'],
                    'application': summary_data[project_id].get('application', 'unknown'),
                    'type': summary_data[project_id]['details'].get('type'),
                    'bioinfo_responsible': summary_data[project_id]['project_summary'].get('bioinfo_responsible', 'unknown'),
                    'runs': runs_bioinfo,
                    'latest_running_note': latest_running_note,
                }


            else:
                project_data = {
                    'error': 'could not find project information for {}'.format(project_id)
                }

            all_deliveries[project_id].update(project_data)

        template = self.application.loader.load("deliveries.html")
        self.write(template.generate(gs_globals=self.application.gs_globals,
                                     deliveries=all_deliveries,
                                     running_notes=all_running_notes,
                                     ))
