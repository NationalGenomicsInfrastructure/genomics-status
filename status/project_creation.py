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


class ProjectCreationFormDataHandler(SafeHandler):
    def get(self):
        # Fetch latest form from couchdb using cloudant

        all_valid_docs = self.application.cloudant.post_view(
            db="project_creation_forms",
            ddoc="by_creation_date",
            view="valid",
            limit=1,
            descending=True,
            include_docs=True,
        ).get_result()

        self.set_header("Content-type", "application/json")

        if not all_valid_docs or "rows" not in all_valid_docs:
            self.set_status(400)
            return self.write("Error: no valid forms found")

        if len(all_valid_docs["rows"]) == 0:
            self.set_status(400)
            return self.write("Error: no valid forms found")

        if "doc" not in all_valid_docs["rows"][0]:
            self.set_status(400)
            return self.write("Error: no valid forms found. Doc is missing")

        return self.write({"form": all_valid_docs["rows"][0]["doc"]})