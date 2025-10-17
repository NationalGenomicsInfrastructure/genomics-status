import datetime
import json

from status.util import SafeHandler


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


class ProjectCreationFormDataHandler(SafeHandler):
    """API Handler to get the latest or specific version of the project creation form."""

    def get(self):
        # If version argument is provided, return that specific form
        version = self.get_query_argument("version", default=None)
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
