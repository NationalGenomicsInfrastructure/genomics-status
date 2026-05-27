"""Handlers for time tracking statistics across project stages and methods."""

import datetime
import json
import logging

import dateutil.parser

from status.util import SafeHandler

application_log = logging.getLogger("tornado.application")


class TimeTrackingHandler(SafeHandler):
    """Serves the time tracking HTML page."""

    def get(self):
        t = self.application.loader.load("time_tracking.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user=self.get_current_user(),
            )
        )


class TimeTrackingDataHandler(SafeHandler):
    """Serves time tracking data for project duration analysis."""

    def get(self):
        """Fetch project data and calculate stage durations.

        Query parameters:
        - start_date: Filter projects by delivery date (YYYY-MM-DD)
        - end_date: Filter projects by delivery date (YYYY-MM-DD)
        - method: Filter by specific library prep method (only used for stages view)
        - project_type: Filter by project type
        """
        # Get query parameters with defaults (last 6 months)
        now = datetime.datetime.now()
        default_end = now.strftime("%Y-%m-%d")
        default_start = (now - datetime.timedelta(days=180)).strftime("%Y-%m-%d")

        start_date = self.get_argument("start_date", default_start)
        end_date = self.get_argument("end_date", default_end)
        selected_method = self.get_argument("method", None)
        selected_project_type = self.get_argument("project_type", None)

        # Validate date format
        try:
            datetime.datetime.strptime(start_date, "%Y-%m-%d")
            datetime.datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError as e:
            application_log.error(f"Invalid date format: {e}")
            start_date = default_start
            end_date = default_end

        # Initialize result structure
        result = {
            "Production": {"Finished": {}, "Other": {}},
            "Application": {"Finished": {}, "Other": {}},
            "_metadata": {
                "start_date": start_date,
                "end_date": end_date,
                "selected_method": selected_method,
                "selected_project_type": selected_project_type,
                "total_projects": 0,
                "query_timestamp": datetime.datetime.now().isoformat(),
            },
        }

        try:
            # Define stage mappings
            stage_definitions = {
                "Reception Control": ["open_date", "queued"],
                "Library Prep Queue": ["queued", "library_prep_start"],
                "Library Prep": ["library_prep_start", "qc_library_finished"],
                "Sequencing Queue": ["qc_library_finished", "sequencing_start_date"],
                "Sequencing": ["sequencing_start_date", "all_samples_sequenced"],
                "Data Delivery": ["all_samples_sequenced", "all_raw_data_delivered"],
                "Analysis": [
                    "all_samples_sequenced",
                    "best_practice_analysis_completed",
                ],
                "Processing Time": ["queued", "all_raw_data_delivered"],
                "Total Time": ["open_date", "all_raw_data_delivered"],
            }

            # Define finished library methods (by user)
            finished_by_user_methods = {
                "Finished library",
                "Finished library (by user)",
            }

            projects_examined = 0
            processed_projects = 0

            application_log.info(
                f"Starting time tracking query with date range {start_date} to {end_date}"
            )

            # Query the time_tracking_delivered view with date range
            # The view is keyed by [delivered_date, project_id]
            projects_view = self.application.cloudant.post_view(
                db="projects",
                ddoc="time",
                view="time_tracking_delivered",
                start_key=[start_date],
                end_key=[end_date, {}],
                include_docs=False,
            ).get_result()["rows"]

            projects_examined = len(projects_view)
            application_log.debug(
                f"Retrieved {projects_examined} projects from time_tracking_delivered view"
            )

            # Process each project
            for row in projects_view:
                # Get project ID from the key (second element: [delivered_date, project_id])
                key = row.get("key", [])
                project_id = key[1] if len(key) > 1 else "unknown"
                doc_id = row.get("id", "unknown")  # Keep document ID for quick access
                value = row.get("value", {})

                # Skip if no value
                if not value:
                    continue

                # Get project metadata from value
                library_construction_method = value.get(
                    "library_construction_method", "Unknown"
                )
                project_type = value.get(
                    "type", "Unknown"
                )  # Field is "type" in the view

                # Exclude Internal projects
                if project_type == "Internal":
                    continue

                # Filter by project type if specified
                if selected_project_type and project_type != selected_project_type:
                    continue

                # Determine category (Production vs Application) based on project_type
                category = "Application"
                if project_type == "Production":
                    category = "Production"

                # Determine subcategory (Finished vs Other)
                subcategory = "Other"
                if library_construction_method in finished_by_user_methods:
                    subcategory = "Finished"

                # Initialize method if not exists
                if library_construction_method not in result[category][subcategory]:
                    result[category][subcategory][library_construction_method] = {}

                method_data = result[category][subcategory][library_construction_method]

                # Calculate durations for each stage
                for stage_name, (start_field, end_field) in stage_definitions.items():
                    # Get date values directly from the value object
                    start_value = None
                    if isinstance(start_field, list):
                        # Try each field until we find one
                        for field in start_field:
                            start_value = value.get(field, None)
                            if start_value:
                                break
                    else:
                        start_value = value.get(start_field, None)

                    end_value = value.get(end_field, None)

                    # Calculate duration if both dates exist
                    if start_value and end_value:
                        try:
                            stage_start_dt = dateutil.parser.parse(start_value)
                            stage_end_dt = dateutil.parser.parse(end_value)
                            duration_days = (stage_end_dt - stage_start_dt).days

                            # Only include non-negative durations
                            if duration_days >= 0:
                                # Initialize stage if not exists
                                if stage_name not in method_data:
                                    method_data[stage_name] = {
                                        "durations": [],
                                        "projects": [],
                                    }

                                # Add duration and project info with all available fields
                                method_data[stage_name]["durations"].append(
                                    duration_days
                                )
                                method_data[stage_name]["projects"].append(
                                    {
                                        "project_id": project_id,
                                        "doc_id": doc_id,
                                        "project_name": value.get("project_name"),
                                        "duration": duration_days,
                                        "start_date": start_value,
                                        "end_date": end_value,
                                        "library_construction": library_construction_method,
                                        "sequencing_platform": value.get(
                                            "sequencing_platform"
                                        ),
                                        "sequence_units_ordered": value.get(
                                            "sequence_units_ordered"
                                        ),
                                        "open_date": value.get("open_date"),
                                        "queued": value.get("queued"),
                                        "library_prep_start": value.get(
                                            "library_prep_start"
                                        ),
                                        "qc_library_finished": value.get(
                                            "qc_library_finished"
                                        ),
                                        "sequencing_start_date": value.get(
                                            "sequencing_start_date"
                                        ),
                                        "all_samples_sequenced": value.get(
                                            "all_samples_sequenced"
                                        ),
                                        "all_raw_data_delivered": value.get(
                                            "all_raw_data_delivered"
                                        ),
                                        "best_practice_analysis_completed": value.get(
                                            "best_practice_analysis_completed"
                                        ),
                                    }
                                )
                        except (ValueError, TypeError) as e:
                            application_log.debug(
                                f"Error parsing dates for {project_id} stage {stage_name}: {e}"
                            )
                            continue

                processed_projects += 1

            application_log.info(
                f"Time tracking query complete. Total projects processed: {processed_projects}, "
                f"Examined: {projects_examined}"
            )

            result["_metadata"]["total_projects"] = processed_projects
            result["_metadata"]["projects_examined"] = projects_examined

        except Exception as e:
            application_log.error(f"Error fetching time tracking data: {e}")
            self.set_status(500)
            self.write({"error": str(e)})
            return

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(result, default=str))
