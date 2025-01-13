import tornado

from status.util import SafeHandler


class PeopleAssignmentsDataHandler(SafeHandler):
    """Serves the people assignments for multiple projects.

    URL: /api/v1/people_assignments
    """

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        if "project_ids" not in data:
            self.set_status(400)
            return self.write("Error: no project_ids supplied")

        project_ids = data["project_ids"]

        people_assignments_rows = self.application.cloudant.post_bulk_get(
            db="people_assignments", docs=[{"id": doc_id} for doc_id in project_ids]
        ).get_result()

        people_assignments = {}
        for data in people_assignments_rows["results"]:
            for data_row in data["docs"]:
                # Filter out the "not found" documents
                if "ok" in data_row:
                    people_assignments[data_row["ok"]["_id"]] = data_row["ok"]["people"]

        self.set_header("Content-type", "application/json")
        self.write(people_assignments)
