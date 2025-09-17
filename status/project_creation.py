import datetime
import json

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

class LocalCacheEntry:
    def __init__(self, data):
        self.data = data
        self.timestamp = datetime.datetime.now()

    def is_expired(self, expiry_hours=24):
        expiry_seconds = expiry_hours * 3600
        return (
            datetime.datetime.now() - self.timestamp
        ).total_seconds() > expiry_seconds


class ProjectCreationCountDetailsDataHandler(SafeHandler):
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
