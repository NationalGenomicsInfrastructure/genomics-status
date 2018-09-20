from status.util import SafeHandler
from datetime import datetime

thresholds = {
    'HiSeq X': 320,
    'RapidHighOutput': 188,
    'HighOutput': 143,
    'RapidRun': 114,
    'MiSeq Version3': 18,
    'MiSeq Version2': 10,
    'NovaSeq SP': 325,
    'NovaSeq S1': 650,
    'NovaSeq S2': 1650,
    'NovaSeq S4': 4000,
}

class FlowcellHandler(SafeHandler):
    """ Serves a page which shows information for a given flowcell.
    """
    def __init__(self, application, request, **kwargs):
        # to cache a list of project_names ->
        # then we don't query statusdb each time when accessing the flowcell page
        self._project_names = {}
        super(SafeHandler, self).__init__(application, request, **kwargs)

    def _get_project_id_by_name(self, project_name):
        if project_name not in self._project_names:
            view = self.application.projects_db.view('project/project_name')[project_name]
            # should be only one row, if not - will overwrite
            for row in view.rows:
                doc_id = row.value
                project_doc = self.application.projects_db.get(doc_id)
                project_id = project_doc.get('project_id')
                self._project_names[project_name] = project_id
        return self._project_names.get(project_name, '')

    def _get_project_list(self, flowcell):
        # replace '__' in project name
        replaced_plist = []
        if 'plist' in flowcell:
            for project in flowcell['plist']:
                if '__' in project:
                    project = project.replace('__', '.')
                else: # replace only the first one
                    project = project.replace('_', '.', 1)
                if project != 'default':
                    replaced_plist.append(project)
        return replaced_plist

    def find_DB_entry(self, flowcell_id):
        #Returns Runid (key), contents (complex)
        found = False
        view = self.application.x_flowcells_db.view('info/summary2_full_id')
        for entry in view:
            if entry.key == flowcell_id:
                found = True
            #Check for short name
            elif self.application.x_flowcells_db.get(entry.id)['name'] == flowcell_id:
                found = True

            if found:
                if 'Json_Stats' in self.application.x_flowcells_db.get(entry.id):
                    #Same entry from summary2_stats
                    return self.application.x_flowcells_db.view('info/summary2_stats')[entry.key].rows[0]
                return entry

        return False

    def get(self, flowcell_id):

        entry = self.find_DB_entry(flowcell_id)

        if not entry:
            extra_message=""
            flowcell_date = datetime.strptime(flowcell_id[0:6], "%y%m%d")
            first_xflowcell_record = datetime(2015,03,13)
            if first_xflowcell_record>flowcell_date:
                extra_message = "Your flowcell is in an older database. It can still be accessed, contact your administrator."

            self.set_status(200)
            t = self.application.loader.load("flowcell_error.html")
            self.write(t.generate(gs_globals=self.application.gs_globals,
                                  flowcell_id=flowcell_id,
                                  user=self.get_current_user_name(),
                                  extra_message=extra_message
                                  ))
            return
        else:
            # replace '__' in project name
            entry.value['plist'] = self._get_project_list(entry.value)
            # list of project_names -> to create links to project page and bioinfo tab
            project_names = {project_name: self._get_project_id_by_name(project_name) for project_name in entry.value['plist']}
            t = self.application.loader.load("flowcell.html")
            self.write(t.generate(gs_globals=self.application.gs_globals,
                                  flowcell=entry.value,
                                  flowcell_id=flowcell_id,
                                  thresholds=thresholds,
                                  project_names=project_names,
                                  user=self.get_current_user_name()))
