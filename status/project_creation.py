from status.util import SafeHandler


class ProjectCreationHandler(SafeHandler):
    def get(self):
        t = self.application.loader.load("project_creation.html")

        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
            )
        )