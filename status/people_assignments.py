import datetime

import tornado
from ibm_cloud_sdk_core.api_exception import ApiException

from status.util import SafeHandler


class PeopleAssignmentFormatHelper:
    """Document structure is as follows:
    {
        "_id": "entity_id",
        "people": {
            "person_id": [
                {
                    "tags": {
                        #TBD
                    },
                    "added_timestamp_utc": "ISO8601",
                    "removed_timestamp_utc": "ISO8601",
                    "removed": true/false
                },
                {
                    "tags": {
                        #TBD
                    },
                    "added_timestamp_utc": "ISO8601",
                    "removed_timestamp_utc": "ISO8601",
                    "removed": true/false
                }
            ]
        }
    }
    Only the last entry in the list is the current assignment, so all others should have "removed": true.

    """

    def __init__(self, entity_id, cloudant, current_user):
        self.entity_id = entity_id
        self.doc = None
        self.cloudant = cloudant
        self.current_user = current_user

    def get_current_assignment(self):
        try:
            self.doc = self.cloudant.get_document(
                db="people_assignments", doc_id=self.entity_id
            ).get_result()
        except ApiException as e:
            if e.status_code == 404:
                self.doc = {
                    "_id": self.entity_id,
                    "people": {},
                }
        if "people" not in self.doc:
            # This should not happen, but just in case
            self.doc["people"] = {}

    def check_is_assigned(self, person_id) -> bool:
        if person_id not in self.doc["people"]:
            return False
        else:
            # A person is assigned if they have been assigned and not removed
            return (
                self.doc["people"][person_id] != []
                and not self.doc["people"][person_id][-1]["removed"]
            )

    def assign_person(self, person_id):
        if self.check_is_assigned(person_id):
            # Already assigned, do nothing
            return

        if person_id not in self.doc["people"]:
            self.doc["people"][person_id] = []

        entry = {
            "tags": {},
            "added_timestamp_utc": datetime.datetime.now().isoformat(),
            "added_by": self.current_user.email,
            "removed_by": None,
            "removed_timestamp_utc": None,
            "removed": False,
        }
        self.doc["people"][person_id].append(entry)
        self.save()

    def unassign_person(self, person_id):
        if not self.check_is_assigned(person_id):
            # Not assigned, do nothing
            return

        self.doc["people"][person_id][-1]["removed_timestamp_utc"] = (
            datetime.datetime.now().isoformat()
        )
        self.doc["people"][person_id][-1]["removed_by"] = self.current_user.email
        self.doc["people"][person_id][-1]["removed"] = True
        self.save()

    def save(self):
        self.cloudant.put_document(
            db="people_assignments", doc_id=self.entity_id, document=self.doc
        )

    def current_assignments(self):
        """Made to mimic the view results for the list of all people assignments"""
        assigned_people = [
            person for person in self.doc["people"] if self.check_is_assigned(person)
        ]
        return_dict = {}
        return_dict[self.doc["_id"]] = assigned_people

        return return_dict


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

        people_assignments_view_result = self.application.cloudant.post_view(
            db="people_assignments",
            ddoc="current",
            view="assignments",
            keys=project_ids,
        ).get_result()

        result_dict = {}
        for row in people_assignments_view_result.get("rows", []):
            result_dict[row["id"]] = row["value"]

        self.set_header("Content-type", "application/json")
        self.write(result_dict)


class ProjectPeopleAssignmentDataHandler(SafeHandler):
    def put(self, project_id, person_id):
        if not project_id:
            self.set_status(400)
            return self.write("Error: no project_id supplied")
        if not person_id:
            self.set_status(400)
            return self.write("Error: no person_id supplied")

        people_assignment = PeopleAssignmentFormatHelper(
            project_id,
            cloudant=self.application.cloudant,
            current_user=self.get_current_user(),
        )
        people_assignment.get_current_assignment()
        people_assignment.assign_person(person_id)

        self.set_header("Content-type", "application/json")
        self.write(people_assignment.current_assignments())

    def delete(self, project_id, person_id):
        if not project_id:
            self.set_status(400)
            return self.write("Error: no project_id supplied")
        if not person_id:
            self.set_status(400)
            return self.write("Error: no person_id supplied")

        people_assignment = PeopleAssignmentFormatHelper(
            project_id,
            cloudant=self.application.cloudant,
            current_user=self.get_current_user(),
        )
        people_assignment.get_current_assignment()
        people_assignment.unassign_person(person_id)

        self.set_header("Content-type", "application/json")
        self.write(people_assignment.current_assignments())
