import datetime
import json
import re

import requests
from genologics import lims
from genologics.config import BASEURI, PASSWORD, USERNAME
from genologics.entities import Lab, Project, Researcher
from ibm_cloud_sdk_core.api_exception import ApiException
from requests import exceptions as requests_exceptions

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
    def get_project_creation_form_by_version(cloudant_client, version_id):
        form_doc = cloudant_client.get_document(
            db="project_creation_forms", doc_id=version_id
        ).get_result()

        if not form_doc:
            raise ValueError(f"Error: no valid form found for version {version_id}")

        return form_doc

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


class ProjectCreationUtils:
    """Utility class for project creation operations."""

    @staticmethod
    def get_udf_list(cloudant_client, form_id=None):
        if form_id:
            form = ProjectCreationFormUtils.get_project_creation_form_by_version(
                cloudant_client, form_id
            )
        else:
            form = ProjectCreationFormUtils.get_valid_proj_creation_form(
                cloudant_client
            )
        udf_list = []
        for _, property_info in (
            form.get("json_schema", {}).get("properties", {}).items()
        ):
            if "ngi_form_lims_udf" in property_info:
                udf_name = property_info["ngi_form_lims_udf"]
                if udf_name not in udf_list:
                    udf_list.append(udf_name)
        return udf_list, form.get("_id")


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
                get_project_id=None,  # No project ID for creation
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
            researcher_id = request_data["form_data"].get("researcher_id")
            researcher = None
            if researcher_id:
                researcher = Researcher(lims_instance, id=researcher_id)
            try:
                researcher.name  # Trigger a fetch to check if researcher exists
            except requests_exceptions.HTTPError:
                researcher = None
            if not researcher:
                # Create Lab
                researcher_name = request_data["form_data"].get("researcher_name")
                if not researcher_name:
                    self.set_status(400)
                    return self.write(
                        json.dumps({"error": "Researcher nameis invalid or missing."})
                    )
                researcher_name_parts = researcher_name.strip().split(" ", 1)
                user_account = Lab.create(
                    lims_instance,
                    name=request_data["form_data"].get("user_account").strip(),
                )
                # Create Researcher
                researcher = Researcher.create(
                    lims_instance,
                    first_name=researcher_name_parts[0],
                    last_name=researcher_name_parts[1]
                    if len(researcher_name_parts) > 1
                    else "",
                    lab=user_account,
                    email="autogenerated@auto.generated",  # Placeholder email, not used in LIMS
                )

            project_values["name"] = request_data["form_data"].get("project_name")
            project_values["researcher"] = researcher
            project_values["udfs"] = {}
            project_values["udfs"]["Project coordinator"] = current_user.name
            project_values["udfs"]["Project Form Id"] = request_data[
                "form_metadata"
            ].get("version_id")
            udf_list, _ = ProjectCreationUtils.get_udf_list(self.application.cloudant)
            for udf in udf_list:
                if udf not in project_values["udfs"]:
                    project_values["udfs"][udf] = request_data["form_data"].get(udf)

            created_project = self.create_project_in_lims(project_values)
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

    @staticmethod
    def create_project_in_lims(proj_values):
        """Create a new project in LIMS and return the project id and name"""
        lims_instance = lims.Lims(BASEURI, USERNAME, PASSWORD)

        try:
            new_project = Project.create(
                lims_instance,
                udfs=proj_values["udfs"],
                name=proj_values["name"],
                researcher=proj_values["researcher"],
            )
        except requests.exceptions.HTTPError as e:
            return {"error": e.response.text}

        return {"project_id": new_project.id, "project_name": new_project.name}


class ProjectCreationFormDataHandler(SafeHandler):
    """API Handler to get or update the project creation form.
    URL: /api/v1/project_creation_form
    """

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
        draft -> discarded (this will discard the draft)

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
            data_to_be_submitted.pop(
                "event_log", None
            )  # Remove event log for new draft

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
            if new_status not in ["draft", "valid", "retired", "discarded"]:
                self.set_status(400)
                return self.write(
                    f"Error: invalid status transition: {form_doc.get('status')} -> {new_status}"
                )
            if new_status == "discarded":
                # Draft -> discarded transition
                try:
                    return_val = self.application.cloudant.delete_document(
                        db="project_creation_forms",
                        doc_id=form_doc["_id"],
                        rev=form_doc["_rev"],
                    ).get_result()
                except ApiException as e:
                    self.set_status(400)
                    self.finish(e.message)
                self.set_status(200)
                return self.write({"message": "Draft discarded successfully"})
            else:
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
        self.write(
            {"form": data_to_be_submitted, "message": "Form updated successfully"}
        )

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
        if rows:
            next_bookmark = rows[-1]["key"]
        else:
            next_bookmark = None

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


class ProjectEditingHandler(SafeHandler):
    """API Handler to fetch data from LIMS for project editing based on provided field and value.
    URL: /project_creation_edit/([^/]*)$
    """

    def get(self, project_id):
        t = self.application.loader.load("project_creation/project_creation.html")

        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
                edit_mode=False,
                version_id=None,
                get_project_id=project_id,
            )
        )


class ProjectEditingDataHandler(SafeHandler):
    """API Handler to fetch data from LIMS based on provided field and value for project editing
    URL: /api/v1/project_creation_form_edit
    """

    def get(self):
        project_identifier = self.get_query_argument("project_id", default=None)
        project_id = self.get_project_id(self.application.cloudant, project_identifier)
        if not project_id:
            self.set_status(404)
            return self.write({"error": "Project not found"})

        lims_instance = lims.Lims(BASEURI, USERNAME, PASSWORD)
        project_data = self.retrieve_project_data_from_lims(lims_instance, project_id)
        project_data["project_id"] = (
            project_id  # Include the project ID in the response
        )

        if not project_data:
            self.set_status(404)
            return self.write({"error": "Error retrieving project data from LIMS"})
        return self.write({"result": project_data})

    def post(self):
        current_user = self.get_current_user()
        if not (current_user.is_proj_coord or current_user.is_admin):
            self.set_status(401)
            return self.write(
                "Error: You do not have the permissions for this operation!"
            )
        request_data = json.loads(self.request.body)
        project_values = request_data["form_data"].get("project_values", {})
        researcher_id = request_data["form_data"].get("researcher_id")
        project_form_id = request_data["form_metadata"].get("version_id")

        project_id = self.get_query_argument("project_id", default=None)

        if not project_id:
            self.set_status(404)
            return self.write({"error": "Project not found"})

        lims_instance = lims.Lims(BASEURI, USERNAME, PASSWORD)
        existing_project = Project(lims=lims_instance, id=project_id)
        udf_list, _ = ProjectCreationUtils.get_udf_list(
            self.application.cloudant, form_id=project_form_id
        )
        for udf in udf_list:
            if udf in project_values["udfs"]:
                existing_project.udf[udf] = project_values["udfs"][udf]

        existing_project.udf["Project Form Id"] = project_form_id
        existing_project.researcher = Researcher(lims_instance, id=researcher_id)
        try:
            existing_project.put()
        except requests.exceptions.HTTPError as e:
            self.set_status(500)
            return self.write({"error": f"Error updating project: {str(e)}"})

        return self.write({"result": "Project updated successfully"})

    def retrieve_project_data_from_lims(self, lims_instance, projectid):
        existing_project = Project(lims=lims_instance, id=projectid)
        proj_values = {}
        try:
            proj_values["name"] = existing_project.name
        except requests.exceptions.HTTPError:
            return {}

        proj_values["researcher_id"] = existing_project.researcher.id
        proj_values["Client"] = existing_project.researcher.name
        proj_values["Account"] = existing_project.researcher.lab.name

        udfs = {}
        # Fetch all UDFs from the project form used
        saved_form_id = existing_project.udf.get("Project Form Id", None)
        udf_list, used_form_id = ProjectCreationUtils.get_udf_list(
            self.application.cloudant, form_id=saved_form_id
        )
        for udf in udf_list:
            if udf in existing_project.udf:
                udfs[udf] = existing_project.udf[udf]
        proj_values["udfs"] = udfs
        proj_values["form_version_id"] = used_form_id

        return proj_values

    @staticmethod
    def get_project_id(cloudant, project_identifier):
        """Return projectid for the provided identifier"""
        # Check if the project_identifier matches a project id.
        # If not, assuming it's a project name, try to get the project id from the project name,
        # since the LIMS API only accepts project ids
        projectid = None
        if re.match(r"^(P\d{3,})", project_identifier):
            projectid = project_identifier
        else:
            try:
                projectid = cloudant.post_view(
                    db="projects",
                    ddoc="projects",
                    view="name_to_id",
                    key=project_identifier,
                ).get_result()["rows"][0]["value"]
            except IndexError:
                pass
        return projectid
