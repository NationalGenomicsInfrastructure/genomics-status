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


class ProjectPeopleAssignmentDataHandler(SafeHandler):
    def put(self, project_id, person_id):
        if not project_id:
            self.set_status(400)
            return self.write("Error: no project_id supplied")
        if not person_id:
            self.set_status(400)
            return self.write("Error: no person_id supplied")

        people_assignments = self.application.cloudant.get_document(
            db="people_assignments", doc_id=project_id
        ).get_result()

        # TODO Handle the case if the document doesn't exist here

        if "people" not in people_assignments:
            people_assignments["people"] = []

        if person_id in people_assignments["people"]:
            # Should be nice enough to tolerate double assignments
            pass
        else:
            people_assignments["people"].append(person_id)
            self.application.cloudant.put_document(
                db="people_assignments", doc_id=project_id, document=people_assignments
            )

        self.set_header("Content-type", "application/json")
        self.write(people_assignments)

    def delete(self, project_id, person_id):
        if not project_id:
            self.set_status(400)
            return self.write("Error: no project_id supplied")
        if not person_id:
            self.set_status(400)
            return self.write("Error: no person_id supplied")

        people_assignments = self.application.cloudant.get_document(
            db="people_assignments", doc_id=project_id
        ).get_result()

        # TODO handle the case if the document doesn't exist here

        if "people" not in people_assignments:
            people_assignments["people"] = []
        elif person_id not in people_assignments["people"]:
            # Should be nice enough to tolerate double assignments
            pass
        else:
            people_assignments["people"].remove(person_id)
            self.application.cloudant.put_document(
                db="people_assignments",
                doc_id=project_id,
                document=people_assignments,
            )

        self.set_header("Content-type", "application/json")
        self.write(people_assignments)