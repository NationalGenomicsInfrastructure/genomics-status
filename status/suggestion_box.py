from collections import OrderedDict
from datetime import datetime

from atlassian import Jira
from ibmcloudant.cloudant_v1 import Document

from status.util import SafeHandler

TITLE_TEMPLATE = "{deployment}{title} ({area})"

DESCRIPTION_TEMPLATE = """
* Created on: {date}
* Area: {area}
* System: {system}
* Importance: {importance}
* Difficulty: {difficulty}
* Reporter: {user}

*Description*
{description}

*Suggestion*
{suggestion}
"""


class SuggestionBoxHandler(SafeHandler):
    """Handles URL /suggestion_box"""

    def get(self):
        """Returns the Suggestion Box HTML template, as it is"""
        t = self.application.loader.load("suggestion_box.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )

    def post(self):
        """Collect data from the HTML form to fill in a Jira card.

        That card will be uploaded to the Suggestion Box status on the Stockholm developers project
        """
        # Get form data
        date = datetime.now()
        title = self.get_argument("title")
        area = self.get_argument("area")
        system = self.get_argument("system")
        importance = self.get_argument("importance")
        difficulty = self.get_argument("difficulty")
        user = self.get_current_user()
        description = self.get_argument("description")
        suggestion = self.get_argument("suggestion")
        deployment = "" if self.application.gs_globals["prod"] else "[STAGE] "

        jira = Jira(
            url=self.application.jira_url,
            username=self.application.jira_user,
            password=self.application.jira_api_token,
        )

        summary = TITLE_TEMPLATE.format(deployment=deployment, title=title, area=area)
        description = DESCRIPTION_TEMPLATE.format(
            date=date.ctime(),
            area=area,
            system=system,
            importance=importance,
            difficulty=difficulty,
            user=user.name,
            description=description,
            suggestion=suggestion,
        )
        new_card = jira.issue_create(
            fields={
                "project": {"key": self.application.jira_project_key},
                "summary": summary,
                "description": description,
                "issuetype": {"name": "Task"},
            }
        )
        if not new_card:
            self.set_status(500)
            return

        # Save the information of the card in the database
        doc = Document(
            date=date.isoformat(),
            card_id=new_card.get("id"),
            name=summary,
            url=f"{self.application.jira_url}/jira/core/projects/{self.application.jira_project_key}/board?selectedIssue={new_card.get('key')}",
            archived=False,
            source="jira",
        )

        response = self.application.cloudant.post_document(
            db="suggestion_box", document=doc
        ).get_result()

        if not response.get("ok"):
            self.set_status(500)
            return

        self.set_status(200)


class SuggestionBoxDataHandler(SafeHandler):
    """Handles URL /api/v1/suggestions"""

    def get(self):
        view = self.application.cloudant.post_view(
            db="suggestion_box",
            ddoc="date",
            view="info",
        ).get_result()["rows"]
        self.set_header("Content-type", "application/json")
        suggestions = OrderedDict()
        for row in sorted(view, key=lambda x: x["key"], reverse=True):
            suggestions[row["key"]] = row["value"]
        self.write(suggestions)
