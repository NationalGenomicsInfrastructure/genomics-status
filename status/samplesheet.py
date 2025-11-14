"""Handlers for samplesheet editor functionality."""

from status.util import SafeHandler


class SamplesheetEditorHandler(SafeHandler):
    """Serves the samplesheet editor page."""

    def get(self):
        t = self.application.loader.load("samplesheet_editor.html")
        self.write(
            t.generate(
                user=self.get_current_user(),
                gs_globals=self.application.gs_globals,
            )
        )


class SamplesheetDataHandler(SafeHandler):
    """Serves samplesheet data via API."""

    def get(self, project_id):
        # TODO: Implement actual data fetching from database
        # For now, return dummy data as a placeholder
        self.set_header("Content-type", "application/json")
        self.write(
            {
                "project_id": project_id,
                "samples": [
                    {"sample_id": "Sample1", "name": "Sample One", "lane": "1"},
                    {"sample_id": "Sample2", "name": "Sample Two", "lane": "1"},
                    {"sample_id": "Sample3", "name": "Sample Three", "lane": "2"},
                ],
            }
        )
