import os

from status.util import SafeHandler


class MultiQCReportHandler(SafeHandler):
    def get(self, project):
        report_type = self.get_argument("type")
        multiqc_report = self.get_multiqc(self.application, project)
        if multiqc_report:
            self.write(multiqc_report[report_type])
        else:
            t = self.application.loader.load("error_page.html")
            self.write(
                t.generate(
                    gs_globals=self.application.gs_globals,
                    status="404",
                    reason="MultiQC Report Not Found",
                    user=self.get_current_user(),
                )
            )

    @staticmethod
    def get_multiqc(app, project_id, read_file=True):
        """
        Getting multiqc reports for requested project from the filesystem
        Returns a string containing html if report exists, otherwise None
        If read_file is false, the value of the dictionary will be the path to the file
        """

        project_name = ""
        multiqc_reports = {}
        query_res = app.cloudant.post_view(
            db="projects", ddoc="projects", view="id_to_name", key=project_id
        ).get_result()
        if query_res["rows"]:
            project_name = query_res["rows"][0]["value"]

        if project_name:
            multiqc_path = os.path.join(app.reports_path, "mqc_reports") or ""
            for report_type in ["_", "_qc_", "_pipeline_"]:
                multiqc_name = f"{project_name}{report_type}multiqc_report.html"
                multiqc_file_path = os.path.join(multiqc_path, multiqc_name)
                if os.path.exists(multiqc_file_path):
                    if read_file:
                        with open(multiqc_file_path, encoding="utf-8") as multiqc_file:
                            html = multiqc_file.read()
                            multiqc_reports[report_type] = html
                    else:
                        multiqc_reports[report_type] = multiqc_file_path
        return multiqc_reports


class ProjectSummaryReportHandler(SafeHandler):
    """Handler for project summary reports generated using yggdrasil"""

    def get(self, project_id):
        report = self.get_summary_report(self.application, project_id)
        if report:
            self.write(report)
        else:
            t = self.application.loader.load("error_page.html")
            self.write(
                t.generate(
                    gs_globals=self.application.gs_globals,
                    status="404",
                    reason="Project Summary Report Not Found",
                    user=self.get_current_user(),
                )
            )

    @staticmethod
    def get_summary_report(app, project_id, read_file=True):
        """If read_file is false, the function will return True if the file exists, otherwise None
        If read_file is True, it returns a string containing the report in html if it exists"""
        project_name = ""

        query_res = app.cloudant.post_view(
            db="projects", ddoc="projects", view="id_to_name", key=project_id
        ).get_result()

        if query_res["rows"]:
            project_name = query_res["rows"][0]["value"]

        if project_name:
            report_path = os.path.join(
                app.reports_path,
                "yggdrasil",
                project_id,
                f"{project_name}_project_summary.html",
            )
            if os.path.exists(report_path):
                if read_file:
                    with open(report_path, encoding="utf-8") as report_file:
                        return report_file.read()
                else:
                    return True
            else:
                return None


class SingleCellSampleSummaryReportHandler(SafeHandler):
    """Handler for Single Cell sample summary reports generated using yggdrasil"""

    def get(self, project_id, sample_id):
        report = self.get_sample_summary_report(
            self.application, project_id, sample_id=sample_id
        )
        if report:
            self.set_header("Content-Type", "application/pdf")
            self.set_header(
                "Content-Disposition",
                f"inline; filename={sample_id}_single_cell_sample_summary_report.pdf",
            )
            self.write(report)
        else:
            t = self.application.loader.load("error_page.html")
            self.write(
                t.generate(
                    gs_globals=self.application.gs_globals,
                    status="404",
                    reason="Single Cell Sample Summary Report Not Found",
                    user=self.get_current_user(),
                )
            )

    @staticmethod
    def get_sample_summary_report(app, project_id, sample_id=None):
        """Returns a list of sample summary reports for the requested project if sample_id is None,
        otherwise returns the report for the requested sample"""

        sample_summary_reports_path = os.path.join(
            app.reports_path, "yggdrasil", project_id
        )
        if sample_id:
            report_path = os.path.join(
                sample_summary_reports_path, sample_id, f"{sample_id}_report.pdf"
            )
            if os.path.exists(report_path):
                with open(report_path, "rb") as report_file:
                    return report_file.read()
            else:
                return None

        else:
            reports = []
            for item in os.listdir(sample_summary_reports_path):
                if os.path.isdir(
                    os.path.join(sample_summary_reports_path, item)
                ) and item.startswith(f"{project_id}_"):
                    if os.path.exists(
                        os.path.join(
                            sample_summary_reports_path, item, f"{item}_report.pdf"
                        )
                    ):
                        reports.append(item)

            return reports
