from status.util import SafeHandler
import os

class MultiQCReportHandler(SafeHandler):

    def get(self, project):
        # get_multiqc() is defined in BaseHandler
        multiqc_report = self.get_multiqc(project)
        if multiqc_report:
            self.write(multiqc_report)
        else:
            t = self.application.loader.load("error_page.html")
            self.write(t.generate(gs_globals=self.application.gs_globals,
                                  status="404",
                                  reason="MultiQC Report Not Found",
                                  user=self.get_current_user_name(),
                                  ))