import datetime
import json
import logging
import re
import smtplib
import unicodedata
from collections import OrderedDict
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import markdown
import nest_asyncio
import slack_sdk
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

        # TODO Switch to cloudant instead
        people_assignments_rows = self.application.people_assignments_db.get(
            id=project_ids, include_docs=True
        ).rows

        people_assignments = {
            row.key: row.people for row in people_assignments_rows if row.value
        }
        self.set_header("Content-type", "application/json")
        self.write(people_assignments)
