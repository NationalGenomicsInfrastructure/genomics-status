import datetime
import json
import re

from genologics import lims
from genologics.config import BASEURI, PASSWORD, USERNAME
from genologics.entities import Researcher

from status.clone_project import LIMSProjectCloningHandler
from status.projects import ProjectsBaseDataHandler
from status.util import LIMSQueryBaseHandler, SafeHandler


class ProjectCreationFormUtils:
    """Utility class for project creation form operations."""

    @staticmethod
    def get_valid_proj_creation_form(cloudant_client):
        all_valid_docs = cloudant_client.post_view(
            db="project_creation_forms",
            ddoc="by_creation_date",
            view="valid",
            limit=1,
            descending=True,
            include_docs=True,
        ).get_result()

        if not all_valid_docs or "rows" not in all_valid_docs:
            raise ValueError("Error: no valid forms found")

        if len(all_valid_docs["rows"]) == 0:
            raise ValueError("Error: no valid forms found")

        if "doc" not in all_valid_docs["rows"][0]:
            raise ValueError("Error: no valid forms found. Doc is missing")

        return all_valid_docs["rows"][0]["doc"]

    @staticmethod
    def get_other_active_forms(cloudant_client):
        """Fetch forms which are valid or drafts. This is useful to
        limit the number of drafts to 1 and to disable editing of non-drafts.
        """
        all_active_docs = cloudant_client.post_view(
            db="project_creation_forms",
            ddoc="by_creation_date",
            view="not_retired",
            descending=True,
            include_docs=False,
        ).get_result()

        if not all_active_docs or "rows" not in all_active_docs:
            raise ValueError("Error: no active forms found")

        return dict((row["id"], row["key"][0]) for row in all_active_docs["rows"])

    @staticmethod
    def can_edit_form(active_forms, version_id):
        # If the requested version is the only thing in active_forms, it's fine
        if version_id not in active_forms:
            return False
        # If the requested version is not in active_forms, it's not fine
        if len(active_forms) == 1:
            return True
        # If there are multiple active forms, the requested one needs to be a draft
        doc_status = active_forms[version_id]
        if doc_status != "draft":
            return False
        return True


class ProjectCreationHandler(SafeHandler):
    """Handler used to render the project creation page using the valid form."""

    def get(self):
        t = self.application.loader.load("project_creation/project_creation.html")

        edit_mode_arg = self.get_query_argument("edit_mode", default=None)

        if edit_mode_arg:
            current_user = self.get_current_user()
            if current_user.is_proj_coord or current_user.is_admin:
                edit_mode = True

            active_forms = ProjectCreationFormUtils.get_other_active_forms(
                self.application.cloudant
            )
            version_id = self.get_query_argument("version_id", default=None)
            if not version_id:
                self.set_status(400)
                return self.write(
                    "Error: version_id is required if attempting to edit."
                )

            if not ProjectCreationFormUtils.can_edit_form(active_forms, version_id):
                self.set_status(400)
                return self.write("Error: this form is not editable.")
        else:
            edit_mode = False
            version_id = None

        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
                edit_mode=edit_mode,
                version_id=version_id,
            )
        )


class ProjectCreationDataHandler(SafeHandler):
    """
    Handles the api call to submit project creation form data
    Loaded through /api/v1/submit_project_creation_form
    """

    def post(self):
        lims_instance = lims.Lims(BASEURI, USERNAME, PASSWORD)
        current_user = self.get_current_user()
        if not (current_user.is_proj_coord or current_user.is_admin):
            self.set_status(401)
            return self.write(
                "Error: You do not have the permissions for this operation!"
            )
        try:
            request_data = json.loads(self.request.body)
            # TODO: Find a place to save request_data["form_metadata"]
            project_values = {}
            researcher_name = request_data["form_data"].get("researcher_name")
            researchers = (
                request_data["form_data"].get("fetched_data").get("researcher_name")
            )
            researcher_id = next(
                item["id"]
                for item in researchers
                if item["researcher_name"] == researcher_name
            )
            researcher = Researcher(lims_instance, id=researcher_id)

            project_values["name"] = request_data["form_data"].get("project_name")
            project_values["researcher"] = researcher
            project_values["udfs"] = {}
            project_values["udfs"]["Project coordinator"] = current_user.name
            latest_form = ProjectCreationFormUtils.get_valid_proj_creation_form(
                self.application.cloudant
            )
            properties = latest_form.get("json_schema", {}).get("properties", {})
            for property_name, property_info in properties.items():
                if "ngi_form_lims_udf" in property_info:
                    udf_name = property_info["ngi_form_lims_udf"]
                    project_values["udfs"][udf_name] = request_data["form_data"].get(
                        property_name
                    )

            created_project = LIMSProjectCloningHandler.create_project_in_lims(
                project_values
            )
            if "error" in created_project:
                self.set_status(400)
                return self.write(json.dumps({"error": created_project["error"]}))
            self.set_status(201)
            return self.write(
                json.dumps(
                    {"success": True, "project_id": created_project["project_id"]}
                )
            )
        except json.JSONDecodeError:
            self.set_status(400)
            return self.write("Error: Invalid JSON data")


class ProjectCreationFormDataHandler(SafeHandler):
    """API Handler to get or update the project creation form."""

    def get(self):
        # If version argument is provided, return that specific form
        version = self.get_query_argument("version", default=None)

        if version == "None":
            version = None
        if version:
            form_doc = self.application.cloudant.get_document(
                db="project_creation_forms", doc_id=version
            ).get_result()

            self.set_header("Content-type", "application/json")

            if not form_doc:
                self.set_status(400)
                return self.write("Error: no valid form found for the given version")

            return self.write({"form": form_doc})
        else:
            # Fetch latest form from couchdb using cloudant
            try:
                valid_doc = ProjectCreationFormUtils.get_valid_proj_creation_form(
                    self.application.cloudant
                )
            except ValueError as e:
                self.set_status(400)
                return self.write({"error": str(e)})

            self.set_header("Content-type", "application/json")

            return self.write({"form": valid_doc})

    def post(self):
        """An endpoint to handle all updates of drafts and valid forms.

        The only allowed transitions are:
        draft -> draft
        draft -> valid (this will change the currently valid one into retired)
        draft -> retired

        valid -> draft (this will create a new draft based on the current valid form)
        """

        # Get json form data
        request_data = json.loads(self.request.body)
        submitted_form_data = request_data.get("form", {})
        doc_id = submitted_form_data.get("_id")

        if not doc_id:
            self.set_status(400)
            return self.write("Error: no valid form ID found")

        # Fetch corresponding document from database
        form_doc = self.application.cloudant.get_document(
            db="project_creation_forms", doc_id=doc_id
        ).get_result()

        # If no corresponding document, return an error
        if not form_doc:
            self.set_status(400)
            return self.write("Error: no valid form found in the database")

        # Check that the form is editable and that the current user has permissions to edit it
        active_forms = ProjectCreationFormUtils.get_other_active_forms(
            self.application.cloudant
        )

        if not ProjectCreationFormUtils.can_edit_form(active_forms, doc_id):
            self.set_status(400)
            return self.write("Error: this form is not editable.")

        if form_doc.get("status") == "valid":
            # valid -> draft "transition"

            # Make sure to remove the _id and _rev from the submitted form data
            submitted_form_data.pop("_id", None)
            submitted_form_data.pop("_rev", None)
            # make sure that the new status is set to valid
            if submitted_form_data.get("status") != "valid":
                self.set_status(400)
                return self.write(
                    f"Error: invalid status transition: {form_doc.get('status')} -> {submitted_form_data.get('status')}"
                )
            # Got this far, should be fine.
            data_to_be_submitted = submitted_form_data
            data_to_be_submitted["status"] = "draft"
            data_to_be_submitted["created"] = datetime.datetime.now().isoformat()
            data_to_be_submitted["owner"] = {"email": self.current_user.email}

            data_to_be_submitted = self._update_doc_data(
                data_to_be_submitted, "create_draft"
            )
        elif form_doc.get("status") != "draft":
            self.set_status(400)
            return self.write(
                f"Error: invalid status transition: {form_doc.get('status')} -> {submitted_form_data.get('status')}"
            )
        else:
            new_status = submitted_form_data.get("status")
            if new_status not in ["draft", "valid", "retired"]:
                self.set_status(400)
                return self.write(
                    f"Error: invalid status transition: {form_doc.get('status')} -> {new_status}"
                )
            if new_status == "draft":
                # Draft -> draft "transition"
                data_to_be_submitted = submitted_form_data
                data_to_be_submitted = self._update_doc_data(
                    data_to_be_submitted, "update"
                )
            elif new_status == "valid":
                # draft -> valid transition
                data_to_be_submitted = submitted_form_data
                data_to_be_submitted["status"] = "valid"
                data_to_be_submitted = self._update_doc_data(
                    data_to_be_submitted, "publish"
                )

                # Make request to retire the currently valid form

                # Fetch currently valid document
                current_valid_form_doc = None
                try:
                    current_valid_form_doc = (
                        ProjectCreationFormUtils.get_valid_proj_creation_form(
                            self.application.cloudant
                        )
                    )
                except ValueError:
                    # If there is no valid one, we don't have to retire anything
                    pass

                if current_valid_form_doc is not None:
                    current_valid_form_doc["status"] = "retired"
                    current_valid_form_doc = self._update_doc_data(
                        current_valid_form_doc, "retire"
                    )
                    self.application.cloudant.post_document(
                        db="project_creation_forms",
                        document=current_valid_form_doc,
                    )
            else:
                # Draft -> retired transition
                data_to_be_submitted = submitted_form_data
                data_to_be_submitted["status"] = "retired"
                data_to_be_submitted = self._update_doc_data(
                    data_to_be_submitted, "retire"
                )

            form_doc["status"] = new_status

        return_val = self.application.cloudant.post_document(
            db="project_creation_forms",
            document=data_to_be_submitted,
        )

        if return_val:
            if return_val.result:
                new_id = return_val.result.get("id")
                # To make sure the new draft version is loaded
                if new_id and form_doc["_id"] != new_id:
                    data_to_be_submitted["_id"] = new_id

        self.set_status(200)
        self.write({"form": data_to_be_submitted})

    def _update_doc_data(self, form_doc, action_string):
        # Update the document data with the new status
        timestamp = datetime.datetime.now().isoformat()
        current_user = self.get_current_user().email

        form_doc["last_updated_at"] = timestamp
        form_doc["last_updated_by"] = current_user
        form_doc["event_log"] = form_doc.get("event_log", [])
        form_doc["event_log"].append(
            {
                "timestamp": timestamp,
                "user": current_user,
                "action": action_string,
                "status": form_doc["status"],
            }
        )
        return form_doc


class ProjectCreationListFormsDataHandler(SafeHandler):
    """API Handler to get a list of all project creation forms."""

    def get(self):
        # Fetch list of all forms from couchdb using cloudant
        forms_view = self.application.cloudant.post_view(
            db="project_creation_forms",
            ddoc="summary",
            view="all",
            include_docs=False,
        ).get_result()

        self.set_header("Content-type", "application/json")

        if not forms_view or "rows" not in forms_view:
            self.set_status(400)
            return self.write("Error: no valid forms found")

        if len(forms_view["rows"]) == 0:
            self.set_status(400)
            return self.write("Error: no valid forms found")

        forms = forms_view["rows"]

        return self.write({"forms": forms})


class ProjectCreationListFormsHandler(SafeHandler):
    """Handler to render a list of all project creation forms."""

    def get(self):
        # Render the template with the list of forms
        t = self.application.loader.load("project_creation/list_forms.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class LocalCacheEntry:
    """Class to hold cached data with a timestamp."""

    def __init__(self, data):
        self.data = data
        self.timestamp = datetime.datetime.now()

    def is_expired(self, expiry_hours=24):
        expiry_seconds = expiry_hours * 3600
        return (
            datetime.datetime.now() - self.timestamp
        ).total_seconds() > expiry_seconds


class ProjectCreationCountDetailsDataHandler(ProjectsBaseDataHandler):
    """API Handler to get the count of projects created per detail value for a given detail key."""

    LocalCache = {}

    def collect_results_from_db(
        self, project_detail, year, page_size=1000, bookmark=None
    ):
        start_key = [project_detail, str(year)]
        if bookmark:
            # If there's a bookmark, start just after the last key of the previous page
            start_key = bookmark

        # Query the view with the specific detail_key and year
        rows = self.application.cloudant.post_view(
            db="projects",
            ddoc="project",
            view="details_count",
            reduce=True,
            group=True,
            start_key=start_key,
            end_key=[project_detail, str(year), {}],
            limit=page_size + 1,  # Fetch one extra to check if there's a next page
            include_docs=False,
        ).get_result()["rows"]

        has_next = len(rows) > page_size
        if has_next:
            rows = rows[:-1]

        # The bookmark for the next page is the last key of the current page
        next_bookmark = rows[-1]["key"]

        return {"rows": rows, "next_bookmark": next_bookmark, "has_next": has_next}

    def get(self):
        # Calculate the years
        current_year = datetime.datetime.now().year
        years = [current_year, current_year - 1, current_year - 2]

        # Prepare the results dictionary
        results = {}

        project_detail = self.get_query_argument("detail_key", default=None)
        if project_detail is None:
            return json.dumps(dict())

        # Filter detail_values based on the search string
        search_string = self.get_query_argument("search_string", default="")
        search_string_lower = search_string.lower()

        if project_detail == "user_account":
            if not self.cached_search_list:
                self.update_projects_cache()
            for project in self.cached_search_list:
                if not re.match(r"^[A-Z]\.[A-Za-z]+_\d{2}_\d{2}$", project[0]):
                    continue

                name, year, ordinal = project[0].split("_")
                if name not in results:
                    results[name] = {"year": year, "latest_ordinal": ordinal}
                else:
                    if year > results[name]["year"]:
                        results[name]["year"] = year
                        results[name]["latest_ordinal"] = ordinal
                    elif year == results[name]["year"]:
                        if ordinal > results[name]["latest_ordinal"]:
                            results[name]["latest_ordinal"] = ordinal
        else:
            result_per_year_cache = self.LocalCache.get(project_detail)
            if (
                result_per_year_cache is None
                or LocalCacheEntry(project_detail).is_expired()
            ):
                result_per_year = []
                # Iterate over the years and fetch data from the view
                for year in years:
                    keep_iterating = True
                    bookmark = None
                    while keep_iterating:
                        page = self.collect_results_from_db(
                            project_detail,
                            year,
                            page_size=1000,
                            bookmark=bookmark,
                        )
                        result_per_year.append(page["rows"])
                        bookmark = page["next_bookmark"]
                        keep_iterating = page["has_next"]
                # Save cache for later requests
                self.LocalCache[project_detail] = LocalCacheEntry(result_per_year)
            else:
                result_per_year = result_per_year_cache.data

            # Process the result
            for result in result_per_year:
                for row in result:
                    detail_key, year, detail_value = row["key"]
                    count = row["value"]

                    if search_string_lower in detail_value.lower():
                        if detail_key not in results:
                            results[detail_value] = 0
                        results[detail_value] += count

        # Return the results as JSON
        self.write(json.dumps(results))


class ProjectCreationIndividualDataFetchHandler(LIMSQueryBaseHandler):
    """API Handler to fetch data from LIMS based on provided field and value."""

    def post(self):
        data = json.loads(self.request.body)
        field, value = next(iter(data.items()))

        if field == "user_account":
            try:
                researchers = self.get_researchers_in_account(value)
            except ValueError:
                self.set_status(400)
                return self.write(
                    json.dumps(
                        {
                            "error": "Account name not found in LIMS",
                            "code": "MISSING_ACCOUNT_NAME",
                        }
                    )
                )
            return self.write({"result": researchers, "field": "researcher_name"})

    def get_researchers_in_account(self, account_name: str) -> list[dict]:
        """
        Retrieve a list of researchers associated with a given lab account.

        Args:
            account_name (str): The name of the lab account.

        Returns:
            list[dict]: A list of dictionaries containing researcher names and IDs.

        Raises:
            ValueError: If no lab is found with the given name.
        """
        lims_instance = lims.Lims(BASEURI, USERNAME, PASSWORD)
        labs = lims_instance.get_labs(name=account_name)
        if not labs:
            raise ValueError(f"No lab found with name {account_name}")

        lab_id = labs[0].id
        query = (
            "select researcherid, firstname, lastname from researcher where labid=%s"
        )
        rows = self.get_query_result(query, (lab_id,))

        researchers = []
        for row in rows:
            researcher_name = f"{row[1]} {row[2]}"
            researchers.append({"researcher_name": researcher_name, "id": f"{row[0]}"})

        return researchers
