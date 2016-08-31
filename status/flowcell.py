from status.util import SafeHandler

tresholds = {
    'HiSeq X': 320,
    'RapidHighOutput': 188,
    'HighOutput': 143,
    'RapidRun': 114,
    'MiSeq Version3': 18,
    'MiSeq Version2': 10,
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

    def get(self, flowcell_id):
        view = self.application.x_flowcells_db.view('info/summary2')
        flowcell = [row.value for row in view[flowcell_id].rows]
        flowcell = flowcell[0] if len(flowcell) >= 1 else {}
        if not flowcell:
            # get by long name
            view = self.application.x_flowcells_db.view('info/summary2_full_id')
            flowcell = [row.value for row in view[flowcell_id].rows]
            flowcell = flowcell[0] if len(flowcell) >= 1 else {}
        # replace '__' in project name
        flowcell['plist'] = self._get_project_list(flowcell)
        # list of project_names -> to create links to project page and bioinfo tab
        project_names = {project_name: self._get_project_id_by_name(project_name) for project_name in flowcell['plist']}

        if not flowcell:
            self.set_status(200)
            t = self.application.loader.load("flowcell_error.html")
            self.write(t.generate(gs_globals=self.application.gs_globals,
                                  flowcell_id=flowcell_id,
                                  user=self.get_current_user_name(),
                                  ))
            return
        else:
            t = self.application.loader.load("flowcell.html")
            self.write(t.generate(gs_globals=self.application.gs_globals,
                                  flowcell=flowcell,
                                  flowcell_id=flowcell_id,
                                  tresholds=tresholds,
                                  project_names=project_names,
                                  user=self.get_current_user_name()))

