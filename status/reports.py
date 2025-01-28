import os
from typing import Any, Optional, Union

from status.util import SafeHandler


class MultiQCReportHandler(SafeHandler):
    def get(self, project: str) -> None:
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
    def get_multiqc(
        app: Any, project_id: str, read_file: bool = True
    ) -> Union[str, dict, None]:
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
            multiqc_path = app.report_path["multiqc"] or ""
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

    def get(self, project_id: str) -> None:
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
    def get_summary_report(
        app: Any, project_id: str, read_file: bool = True
    ) -> Union[str, bool, None]:
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
                app.report_path["yggdrasil"],
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

    def get(self, project_id: str, sample_id: str, rep_name: str) -> None:
        report = self.get_sample_summary_report(
            self.application, project_id, sample_id=sample_id, rep_name=rep_name
        )
        if report:
            if "pdf" in rep_name:
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
    def get_sample_summary_report(
        app: Any,
        project_id: str,
        sample_id: Optional[str] = None,
        rep_name: Optional[str] = None,
    ) -> Union[bytes, list[str], None]:
        """Returns a list of sample summary reports for the requested project if sample_id is None,
        otherwise returns the report for the requested sample"""

        proj_path = os.path.join(app.report_path["yggdrasil"], project_id)
        if sample_id:
            file_type = rep_name.split(".")[-1]
            mode = "rb" if file_type == "pdf" else "r"
            encoding = None if file_type == "pdf" else "utf-8"
            report_path = os.path.join(proj_path, sample_id, rep_name)
            if os.path.exists(report_path):
                with open(report_path, mode, encoding=encoding) as report_file:
                    return report_file.read()
            else:
                return None

        else:
            reports = []

            if os.path.exists(proj_path):
                for item in os.listdir(proj_path):
                    if os.path.isdir(os.path.join(proj_path, item)) and item.startswith(
                        f"{project_id}_"
                    ):
                        sample_path = os.path.join(proj_path, item)
                        if os.path.exists(sample_path):
                            # Reports will be named as <sample_id>_<Method>_<(optional)>_report.html/pdf
                            reports = [
                                f
                                for f in os.listdir(sample_path)
                                if os.path.isfile(os.path.join(sample_path, f))
                                and (
                                    f.startswith(f"{item}_")
                                    and f.endswith(("_report.pdf", "_report.html"))
                                )
                            ]

            return reports
