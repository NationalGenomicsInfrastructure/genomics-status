import datetime
import json

from genologics import lims
from genologics.config import BASEURI, PASSWORD, USERNAME
from genologics.entities import Researcher

from status.clone_project import LIMSProjectCloningHandler
from status.util import LIMSQueryBaseHandler, SafeHandler


class ProjectCreationFormUtils:
    """Utility class for project creation form operations."""

    @staticmethod
    def get_latest_proj_creation_form(cloudant_client):
        return cloudant_client.post_view(
            db="project_creation_forms",
            ddoc="by_creation_date",
            view="valid",
            limit=1,
            descending=True,
            include_docs=True,
        ).get_result()


class ProjectCreationHandler(SafeHandler):
    """Handler used to render the project creation page using the valid form."""

    def get(self):
        t = self.application.loader.load("project_creation/project_creation.html")

        edit_mode_arg = self.get_query_argument("edit_mode", default=None)

        edit_mode = False
        if edit_mode_arg:
            current_user = self.get_current_user()
            if current_user.is_proj_coord or current_user.is_admin:
                # Allow edit mode only for project coordinators and admins
                edit_mode = True

        version_id = self.get_query_argument("version_id", default=None)
        if not edit_mode:
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
            latest_form = ProjectCreationFormUtils.get_latest_proj_creation_form(
                self.application.cloudant
            )["rows"][0]["doc"]
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
    """API Handler to get the latest or specific version of the project creation form."""

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
            all_valid_docs = ProjectCreationFormUtils.get_latest_proj_creation_form(
                self.application.cloudant
            )

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

class ProjectCreationCountDetailsDataHandler(SafeHandler):
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

        # Filter detail_values based on the search string
        search_string = self.get_query_argument("search_string", default="")
        search_string_lower = search_string.lower()

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
