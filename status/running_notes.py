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
from ibmcloudant.cloudant_v1 import Document

from status.util import SafeHandler


class RunningNotesDataHandler(SafeHandler):
    """Serves all running notes from a given project, flowcell or other.
    URL: /api/v1/running_notes/([^/]*)
    """

    def get(self, partitionid):
        self.set_header("Content-type", "application/json")
        running_notes_json = {}
        running_notes_docs = self.application.cloudant.post_partition_all_docs(
            db="running_notes", partition_key=partitionid, include_docs=True
        ).get_result()["rows"]
        for row in running_notes_docs:
            running_note = row["doc"]
            note_contents = {}
            for item in [
                "user",
                "email",
                "note",
                "categories",
                "created_at_utc",
                "updated_at_utc",
            ]:
                note_contents[item] = running_note[item]
            running_notes_json[note_contents["created_at_utc"]] = note_contents

        # Sorted running notes, by date
        sorted_running_notes = OrderedDict()
        for k, v in sorted(
            running_notes_json.items(), key=lambda t: t[0], reverse=True
        ):
            sorted_running_notes[k] = v
        self.write(sorted_running_notes)

    def post(self, partition_id):
        data = tornado.escape.json_decode(self.request.body)
        note = data.get("note", "")
        category = data.get("categories", [])
        note_type = data.get("note_type", "")
        user = self.get_current_user()
        if not note:
            self.set_status(400)
            self.finish(
                "<html><body>No project id or note parameters found</body></html>"
            )
        else:
            newNote = RunningNotesDataHandler.make_running_note(
                self.application,
                partition_id,
                note,
                category,
                user.name,
                user.email,
                note_type,
            )
            self.set_status(201)
            self.write(json.dumps(newNote))

    @staticmethod
    def make_running_note(
        application,
        partition_id,
        note,
        categories,
        user,
        email,
        note_type,
        created_time=None,
    ):
        gen_log = logging.getLogger("tornado.general")
        if not created_time:
            created_time = datetime.datetime.now(datetime.timezone.utc)
        if note_type == "project":
            connected_projects = [partition_id]
            doc = application.cloudant.post_view(
                db="projects",
                ddoc="project",
                view="project_id",
                key=partition_id,
                include_docs=True,
            ).get_result()["rows"][0]["doc"]
            project_name = doc["project_name"]
            library_method = doc["details"].get("library_construction_method", "")
            proj_details = [partition_id, project_name, library_method]
            proj_coord_with_accents = ".".join(
                doc["details"].get("project_coordinator", "").lower().split()
            )
        elif note_type == "workset":
            values = application.cloudant.post_view(
                db="worksets",
                ddoc="worksets",
                view="project_list",
                key=partition_id,
            ).get_result()["rows"][0]["value"]
            connected_projects = values["project_list"]
            workset_name = values["name"]
        else:
            if note_type == "flowcell":
                # get connected projects from fc db
                flowcell_date, flowcell_id = partition_id.split("_")
                # If the date has 8 digits, use only the last 6 for lookup
                if len(flowcell_date) == 8:
                    flowcell_date = flowcell_date[2:]

                flowcell_lookup_id = flowcell_date + "_" + flowcell_id
                lookup_db = "x_flowcells"
                lookup_key = flowcell_lookup_id
            elif note_type == "flowcell_ont":
                lookup_db = "nanopore_runs"
                lookup_key = partition_id
            elif note_type == "flowcell_element":
                lookup_db = "element_runs"
                lookup_key = partition_id
            connected_projects = application.cloudant.post_view(
                db=lookup_db,
                ddoc="names",
                view="project_ids_list",
                key=lookup_key,
            ).get_result()["rows"][0]["value"]

        newNote = {
            "_id": f"{partition_id}:{datetime.datetime.timestamp(created_time)}",
            "user": user,
            "email": email,
            "note": note,
            "categories": categories,
            "projects": connected_projects,
            "parent": partition_id,
            "note_type": note_type,
            "created_at_utc": created_time.isoformat(),
            "updated_at_utc": created_time.isoformat(),
        }
        # Save in running notes db
        gen_log.info(
            f"Running note to be created with id {newNote['_id']} by {user} at {created_time.isoformat()}"
        )

        doc = Document().from_dict(newNote)

        response = application.cloudant.post_document(
            db="running_notes", document=doc
        ).get_result()

        if not response.get("ok"):
            gen_log.error(
                f"Failed to create running note with id {newNote['_id']} by {user} at {created_time.isoformat()}"
            )
            raise Exception(f"Failed to create running note for {partition_id}")

        #### Check and send mail to tagged users (for project running notes as flowcell and workset notes are copied over)
        if note_type == "project":
            pattern = re.compile("(@)([a-zA-Z0-9.-]+)")
            userTags = [x[1] for x in pattern.findall(note)]
            if userTags:
                RunningNotesDataHandler.notify_tagged_user(
                    application,
                    userTags,
                    proj_details,
                    note,
                    categories,
                    user,
                    created_time,
                    "userTag",
                )
            ####
            ##Notify proj coordinators for all project running notes
            proj_coord = (
                unicodedata.normalize("NFKD", proj_coord_with_accents)
                .encode("ASCII", "ignore")
                .decode("utf-8")
            )
            if (
                proj_coord
                and proj_coord not in userTags
                and proj_coord != email.split("@")[0]
            ):
                RunningNotesDataHandler.notify_tagged_user(
                    application,
                    [proj_coord],
                    proj_details,
                    note,
                    categories,
                    user,
                    created_time,
                    "creation",
                )
        if note_type in ["flowcell", "workset", "flowcell_ont", "flowcell_element"]:
            choose_link = {
                "flowcell": "flowcells",
                "workset": "workset",
                "flowcell_ont": "flowcells_ont",
                "flowcell_element": "flowcells_element",
            }
            link_id = partition_id
            if note_type == "workset":
                link_id = workset_name
            link = f"<a class='text-decoration-none' href='/{choose_link[note_type]}/{link_id}'>{link_id}</a>"
            project_note = (
                f"#####*Running note posted on {note_type.split('_')[0]} {link}:*\n"
            )
            project_note += note
            for proj_id in connected_projects:
                _ = RunningNotesDataHandler.make_running_note(
                    application,
                    proj_id,
                    project_note,
                    categories,
                    user,
                    email,
                    "project",
                    created_time,
                )
        created_note = application.cloudant.get_document(
            db="running_notes", doc_id=newNote["_id"]
        ).get_result()
        return created_note

    @staticmethod
    def notify_tagged_user(
        application, userTags, project, note, categories, tagger, timestamp, tagtype
    ):
        view_result = {}
        project_id = project[0]
        project_name = project[1]
        library_method = project[2]
        time_in_format = timestamp.astimezone().strftime("%a %b %d %Y, %I:%M:%S %p")
        note_id = (
            "running_note_"
            + project_id
            + "_"
            + str(
                int(
                    (
                        timestamp
                        - datetime.datetime.fromtimestamp(0, datetime.timezone.utc)
                    ).total_seconds()
                )
            )
        )
        for row in application.cloudant.post_view(
            db="gs_users", ddoc="authorized", view="users"
        ).get_result()["rows"]:
            view_result[row["key"].split("@")[0]] = row["key"]
        category = ""
        if categories:
            category = " - " + ", ".join(categories)

        if tagtype == "userTag":
            notf_text = "tagged you"
            slack_notf_text = f"You have been tagged by *{tagger}* in a running note"
            email_text = f"You have been tagged by {tagger} in a running note"
        else:
            notf_text = "created note"
            slack_notf_text = f"Running note created by *{tagger}*"
            email_text = f"Running note created by {tagger}"

        for user in userTags:
            if user in view_result:
                option = SafeHandler.get_user_details(
                    application, view_result[user]
                ).get("notification_preferences", "Both")
                # Adding a slack IM to the tagged user with the running note
                if option == "Slack" or option == "Both":
                    nest_asyncio.apply()
                    client = slack_sdk.WebClient(token=application.slack_token)
                    notification_text = (
                        f"{tagger} has {notf_text} in {project_id}, {project_name}!"
                    )
                    blocks = [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": (
                                    "_{} for the project_ "
                                    "<{}/project/{}#{}|{}, {}> [{}]! :smile: \n_The note is as follows:_ \n\n\n"
                                ).format(
                                    slack_notf_text,
                                    application.settings["redirect_uri"].rsplit("/", 1)[
                                        0
                                    ],
                                    project_id,
                                    note_id,
                                    project_id,
                                    project_name,
                                    library_method,
                                ),
                            },
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": ">*{} - {}{}*\n>{}\n\n\n\n _(Please do not respond to this message here in Slack."
                                " It will only be seen by you.)_".format(
                                    tagger,
                                    time_in_format,
                                    category,
                                    note.replace("\n", "\n>"),
                                ),
                            },
                        },
                    ]

                    try:
                        userid = client.users_lookupByEmail(email=view_result[user])
                        channel = client.conversations_open(
                            users=userid.data["user"]["id"]
                        )
                        client.chat_postMessage(
                            channel=channel.data["channel"]["id"],
                            text=notification_text,
                            blocks=blocks,
                        )
                        client.conversations_close(
                            channel=channel.data["channel"]["id"]
                        )
                    except Exception:
                        # falling back to email
                        option = "E-mail"

                # default is email
                if option == "E-mail" or option == "Both":
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = (
                        f"[GenStat] Running Note:{project_id}, {project_name}"
                    )
                    msg["From"] = "genomics-status"
                    msg["To"] = view_result[user]
                    text = f"{email_text} in the project {project_id}, {project_name} [{library_method}]! The note is as follows\n\
                    >{tagger} - {time_in_format}{category}\
                    >{note}"

                    html = '<html>\
                    <body>\
                    <p> \
                    {} in the project <a href="{}/project/{}#{}">{}, {}</a> [{}]<br>The note is as follows</p>\
                    <blockquote>\
                    <div class="panel panel-default" style="border: 1px solid #e4e0e0; border-radius: 4px;">\
                    <div class="panel-heading" style="background-color: #f5f5f5; padding: 10px 15px;">\
                        <a href="#">{}</a> - <span>{}</span> <span>{}</span>\
                    </div>\
                    <div class="panel-body" style="padding: 15px;">\
                        <p>{}</p>\
                    </div></div></blockquote></body></html>'.format(
                        email_text,
                        application.settings["redirect_uri"].rsplit("/", 1)[0],
                        project_id,
                        note_id,
                        project_id,
                        project_name,
                        library_method,
                        tagger,
                        time_in_format,
                        category,
                        markdown.markdown(note),
                    )

                    msg.attach(MIMEText(text, "plain"))
                    msg.attach(MIMEText(html, "html"))

                    s = smtplib.SMTP("localhost")
                    s.sendmail(
                        "genomics-bioinfo@scilifelab.se", msg["To"], msg.as_string()
                    )
                    s.quit()


class LatestStickyNoteHandler(SafeHandler):
    """Serves the latest sticky running note for a given project.
    URL: /api/v1/latest_sticky_run_note/([^/]*)
    """

    def get(self, partitionid):
        self.set_header("Content-type", "application/json")
        latest_sticky_doc = self.application.cloudant.post_partition_view(
            db="running_notes",
            ddoc="note_types",
            view="sticky_notes",
            partition_key=partitionid,
            descending=True,
            limit=1,
        ).get_result()["rows"]
        if latest_sticky_doc:
            latest_sticky_note = latest_sticky_doc[0]["value"]
            self.write({latest_sticky_note["created_at_utc"]: latest_sticky_note})


class LatestStickyNotesMultipleHandler(SafeHandler):
    """Serves the latest sticky running note for multiple projects.

    URL: /api/v1/latest_sticky_run_note
    """

    def post(self):
        data = tornado.escape.json_decode(self.request.body)
        if "project_ids" not in data:
            self.set_status(400)
            return self.write("Error: no project_ids supplied")

        project_ids = data["project_ids"]
        latest_sticky_notes = self.application.cloudant.post_view(
            db="running_notes",
            ddoc="latest_sticky_note_previews",
            view="project",
            keys=project_ids,
            reduce=True,
            group=True,
        ).get_result()["rows"]
        latest_sticky_notes = {
            row["key"]: row["value"] for row in latest_sticky_notes if row["value"]
        }
        self.set_header("Content-type", "application/json")
        self.write(latest_sticky_notes)


class LatestRunningNoteHandler(SafeHandler):
    """Handler for methods related to running notes which are used in other classes"""

    @staticmethod
    def get_latest_running_note(app, note_type, partition_id):
        latest_note = {}
        view = app.cloudant.post_view(
            db="running_notes",
            ddoc="latest_note_previews",
            view=note_type,
            start_key=partition_id,
            end_key=partition_id,
            reduce=True,
        ).get_result()
        if view["rows"]:
            note = view["rows"][0]["value"]
            latest_note = {note["created_at_utc"]: note}
        return latest_note

    @staticmethod
    def formatDate(date):
        datestr = datetime.datetime.fromisoformat(date).astimezone()
        return datestr.strftime("%a %b %d %Y, %H:%M:%S")


class InvoicingNotesHandler(SafeHandler):
    """Serves the invoicing running notes for a given project.
    URL: /api/v1/invoicing_notes/([^/]*)
    """

    def get(self, partitionid):
        self.set_header("Content-type", "application/json")
        result_rows = self.application.cloudant.post_partition_view(
            db="running_notes",
            ddoc="note_types",
            view="invoicing_notes",
            partition_key=partitionid,
            descending=True,
        ).get_result()["rows"]
        if result_rows:
            invoicing_notes = []
            for note in result_rows:
                invoicing_notes.append(note["value"])
            self.write({"invoicing_notes": invoicing_notes})
