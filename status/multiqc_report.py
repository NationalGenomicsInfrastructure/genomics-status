from status.util import SafeHandler
import os

class MultiQCReportHandler(SafeHandler):

    def get_multiqc(self, project):
        view = self.application.projects_db.view('project/id_name_dates')
        rows = view[project].rows
        project_name = ''
        # get only the first one
        for row in rows:
            project_name = row.value.get('project_name', '')
            break

        if project_name:
            multiqc_name = '{}_multiqc_report.html'.format(project_name)
            multiqc_path = self.application.multiqc_path or ''
            multiqc_path = os.path.join(multiqc_path, multiqc_name)
            if os.path.exists(multiqc_path):
                with open(multiqc_path, 'r') as multiqc_file:
                    html = multiqc_file.read()
                    return html

    def get(self, project):
        multiqc_report = self.get_multiqc(project)
        if multiqc_report:
            self.write(multiqc_report)
        else:
            self.write("<div class='alert alert-warning'>No MultiQC reports available</div>")