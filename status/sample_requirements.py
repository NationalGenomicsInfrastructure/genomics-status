import datetime
import json

import tornado.web

from status.util import SafeHandler


class SampleRequirementsBaseHandler(SafeHandler):
    """Base class that other sample requirements handlers should inherit from.

    Implements most of the logic of the sample requirements that other classes should reuse
    """

    # _____________________________ HELPER METHODS ____________________________

    def _validate_version_param(self, version):
        try:
            int_version = int(version)
        except ValueError:
            raise tornado.web.HTTPError(
                400, reason="Bad request, version is not an integer"
            )
        return int_version

    def _validate_date_string(self, date):
        year, month, day = date.split("-")

        try:
            datetime_date = datetime.datetime(int(year), int(month), int(day))
        except ValueError:
            raise tornado.web.HTTPError(
                400, reason="Bad request, date format is not valid (YYYY-MM-DD)"
            )
        return datetime_date

    # _____________________________ FETCH METHODS _____________________________

    def fetch_published_doc_version(self, version=None):
        db = self.application.sample_requirements_db
        if version is not None:
            rows = db.view(
                "entire_document/published_by_version",
                descending=True,
                key=version,
                limit=1,
            ).rows
        else:
            rows = db.view(
                "entire_document/published_by_version", descending=True, limit=1
            ).rows
        doc = rows[0].value
        return doc

    def fetch_latest_doc(self):
        db = self.application.sample_requirements_db
        curr_rows = db.view("entire_document/by_version", descending=True, limit=1).rows
        curr_doc = curr_rows[0].value
        return curr_doc

    # ____________________________ UPDATE DOC HELPER METHODS ____________________

    def _update_last_modified(self, doc):
        user_name = self.get_current_user().name
        user_email = self.get_current_user().email

        doc["Last modified by user"] = user_name
        doc["Last modified by user email"] = user_email
        doc["Last modified"] = datetime.datetime.now().isoformat()

        return doc


class SampleRequirementsDateToVersionDataHandler(SampleRequirementsBaseHandler):
    """Serves a map of when each version of the sample requirements was issued.

    Loaded through:
        /api/v1/sample_requirements_date_to_version

    Use this to be able to look back in history of the sample requirements
    database at certain dates.
    """

    def get(self):
        cc_view = self.application.sample_requirements_db.view(
            "version_info/by_date", descending=False
        )

        self.write(json.dumps(cc_view.rows))


class SampleRequirementsReassignLockDataHandler(SampleRequirementsBaseHandler):
    """Available at /api/v1/sample_requirements_reassign_lock"""

    def post(self):
        doc = self.fetch_latest_doc()
        draft = doc["Draft"]
        if not draft:
            self.set_header("Content-type", "application/json")
            self.set_status(400)
            return self.write(
                "Error: Attempting to update a non-draft sample requirements."
            )

        current_user = self.get_current_user()
        # TODO add another role for this, for now reuse the sample-requirements-admin role
        if not current_user.is_sample_requirements_admin:
            self.set_status(400)
            return self.write(
                "Error: Cannot reassign lock to user that is not sample requirements admin."
            )
        user_email = current_user.email

        lock_info = {"Locked": True, "Locked by": user_email}

        doc["Lock Info"] = lock_info
        doc = self._update_last_modified(doc)

        sr_db = self.application.sample_requirements_db
        sr_db.save(doc)
        self.set_header("Content-type", "application/json")
        self.write({"message": "Lock info updated"})


class SampleRequirementsDraftDataHandler(SampleRequirementsBaseHandler):
    """Loaded through /api/v1/draft_sample_requirements"""

    def get(self):
        """Should return the specified version of the sample requirements."""
        doc = self.fetch_latest_doc()
        draft = doc["Draft"]

        response = dict()
        response["sample_requirements"] = None
        if draft:
            response["sample_requirements"] = doc

        current_user_email = self.get_current_user().email
        response["current_user_email"] = current_user_email

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))

    def post(self):
        """Create a new draft sample requirements based on the currently published

        will check that:
            - the latest version is not a draft (would return 400)
        """

        latest_doc = self.fetch_latest_doc()
        draft = latest_doc["Draft"]

        if draft:
            self.set_status(400)
            return self.write("Error: A draft already exists. There can only be one.")

        current_user = self.get_current_user()
        if not current_user.is_sample_requirements_admin:
            self.set_status(400)
            return self.write(
                "Error: Only sample requirements admin cannot create a new draft."
            )
        current_user_email = current_user.email

        # Create a new draft
        doc = latest_doc.copy()
        del doc["_id"]
        del doc["_rev"]
        version = latest_doc["Version"] + 1

        lock_info = {"Locked": True, "Locked by": current_user_email}

        doc["Draft"] = True
        doc["Version"] = version
        doc["Lock Info"] = lock_info

        # Should be set at the time of publication
        doc["Issued by user"] = None
        doc["Issued by user email"] = None
        doc["Issued at"] = None

        user_name = self.get_current_user().name
        user_email = self.get_current_user().email

        doc["Created by user"] = user_name
        doc["Created by user email"] = user_email
        doc["Created at"] = datetime.datetime.now().isoformat()

        self._update_last_modified(doc)

        cc_db = self.application.sample_requirements_db
        cc_db.save(doc)
        self.set_header("Content-type", "application/json")
        self.write({"message": "Draft created"})

    def put(self):
        """Update the current draft sample requirements.

        Will check that:
            - the most recent one is a draft
            - draft is not locked by other user
        otherwise return 400.
        """

        latest_doc = self.fetch_latest_doc()
        draft = latest_doc["Draft"]
        if not draft:
            self.set_status(400)
            return self.write(
                "Error: Attempting to update a non-draft sample requirements."
            )

        current_user = self.get_current_user()
        if not current_user.is_sample_requirements_admin:
            self.set_status(400)
            return self.write(
                "Error: Only sample requirements admin cannot update draft sample requirements."
            )
        user_email = current_user.email

        lock_info = latest_doc["Lock Info"]
        if lock_info["Locked"]:
            if lock_info["Locked by"] != user_email:
                self.set_status(400)
                return self.write(
                    "Error: Attempting to update a draft locked by someone else."
                )

        new_doc_content = tornado.escape.json_decode(self.request.body)
        if "sample_requirements" not in new_doc_content:
            self.set_status(400)
            return self.write("Error: Malformed request body.")

        latest_doc["sample_requirements"] = new_doc_content["sample_requirements"]

        self._update_last_modified(latest_doc)

        cc_db = self.application.sample_requirements_db
        cc_db.save(latest_doc)
        msg = "Draft successfully saved at {}".format(
            datetime.datetime.now().strftime("%H:%M:%S")
        )
        self.set_header("Content-type", "application/json")
        return self.write({"message": msg})

    def delete(self):
        """Delete the current draft sample requirements.abs

        Will check that:
            - the most recent one is a draft
            - draft is not locked by other user
        otherwise return 400.
        """
        latest_doc = self.fetch_latest_doc()
        draft = latest_doc["Draft"]
        if not draft:
            self.set_status(400)
            return self.write(
                "Error: There is no draft sample requirements that can be deleted."
            )

        current_user = self.get_current_user()
        if not current_user.is_sample_requirements_admin:
            self.set_status(400)
            return self.write(
                "Error: Only sample requirements admin cannot delete draft sample requirements."
            )
        user_email = current_user.email

        lock_info = latest_doc["Lock Info"]
        if lock_info["Locked"]:
            if lock_info["Locked by"] != user_email:
                self.set_status(400)
                return self.write(
                    "Error: Attempting to delete a draft locked by someone else."
                )

        cc_db = self.application.sample_requirements_db
        cc_db.delete(latest_doc)
        msg = "Draft successfully deleted at {}".format(
            datetime.datetime.now().strftime("%H:%M:%S")
        )
        self.set_header("Content-type", "application/json")
        return self.write({"message": msg})


class RequirementsValidator:
    """Helper object to store and handle the validation of a new version of the samples requirement"""

    # Which variables that shouldn't be changed while keeping the same _id_.
    # If an update of any of these fields is needed, a new id should be created.
    CONSERVED_KEY_SETS = ["Name"]

    # The combination of these 'columns' should be unique within the document.
    UNIQUE_KEY_SETS = ["Name"]

    # These keys are not allowed to be undefined for any item
    NOT_NULL_KEYS = ["Name"]

    def __init__(self, draft_doc, published_doc):
        self.draft_requirements = draft_doc["sample_requirements"]
        self.published_requirements = published_doc["sample_requirements"]
        self.validation_msgs = {}
        self.changes = {}
        self.validation_result = True

    def _add_validation_msg(self, id, error_type, msg):
        if id not in self.validation_msgs:
            self.validation_msgs[id] = dict()
        if error_type not in self.validation_msgs[id]:
            self.validation_msgs[id][error_type] = []

        self.validation_msgs[id][error_type].append(msg)

    def _add_change(self, id, key, draft_val, published_val):
        if id not in self.changes:
            self.changes[id] = dict()

        self.changes[id][key] = (draft_val, published_val)

    def _validate_unique(self, items):
        """Check all items to make sure they are 'unique'.

        The uniqueness criteria is decided according to the UNIQUE_KEY_SETS.
        Returns (True, []) if unique, and otherwise False wit h if not.
        """
        key_val_set = set()
        for id, item in items.items():
            keys = self.UNIQUE_KEY_SETS
            t = tuple(item[key] for key in keys)

            # Check that it is not already added
            if t in key_val_set:
                self._add_validation_msg(
                    id,
                    "unique",
                    (f"Key combination {keys}:{t} is included multiple " "times. "),
                )
                self.validation_result = False
            key_val_set.add(t)

    def _validate_not_null(self, items):
        """Make sure type specific columns (given by NOT_NULL_KEYS) are not null."""

        not_null_keys = self.NOT_NULL_KEYS
        for id, item in items.items():
            for not_null_key in not_null_keys:
                if item[not_null_key] is None or item[not_null_key] == "":
                    # Special case for discontinued components
                    if "Status" in item and item["Status"] == "Discontinued":
                        pass
                    else:
                        self._add_validation_msg(
                            id,
                            "not_null",
                            (
                                f"{not_null_key} cannot be empty."
                                f" Violated for item with id {id}."
                            ),
                        )
                        self.validation_result = False

    def _validate_conserved(self, new_items, current_items):
        """Ensures the keys in CONSERVED_KEY_SETS are conserved for each given id.

        Compares the new version against the currently active one.
        Params:
            new_items     - A dict of the items that are to be added
                            with ID attribute as the key.
            current_items - A dict of the items currently in the database
                            with ID attribute as the key.
        """
        conserved_keys = self.CONSERVED_KEY_SETS
        for id, new_item in new_items.items():
            if str(id) in current_items:
                for conserved_key in conserved_keys:
                    if conserved_key not in new_item:
                        self._add_validation_msg(
                            id,
                            "conserved",
                            (
                                f"{conserved_key} column not found in new row with "
                                f"id {id}. This column should be kept "
                                "conserved."
                            ),
                        )
                        self.validation_result = False
                    if new_item[conserved_key] != current_items[str(id)][conserved_key]:
                        self._add_validation_msg(
                            id,
                            "conserved",
                            (
                                f"{conserved_key} should be conserved. "
                                f"Violated for item with id {id}. "
                                f'Found "{new_item[conserved_key]}" for new and "{current_items[str(id)][conserved_key]}" for current. '
                            ),
                        )
                        self.validation_result = False

    def track_all_changes(self):
        # Check which ids have been added
        added_requirement_ids = set(self.draft_requirements.keys()) - set(
            self.published_requirements.keys()
        )
        for requirement_id in added_requirement_ids:
            self._add_change(
                requirement_id, "All", self.draft_requirements[requirement_id], None
            )

        for requirement_id, published_req in self.published_requirements.items():
            draft_req = self.draft_requirements[requirement_id]

            for requirement_key, published_val in published_req.items():
                draft_val = draft_req[requirement_key]
                if published_val != draft_val:
                    self._add_change(
                        requirement_id, requirement_key, draft_val, published_val
                    )

    def validate(self):
        self._validate_unique(self.draft_requirements)
        self._validate_not_null(self.draft_requirements)

        self._validate_conserved(self.draft_requirements, self.published_requirements)


class SampleRequirementsValidateDraftDataHandler(SampleRequirementsBaseHandler):
    """Loaded through /api/v1/sample_requirements_validate_draft"""

    def post(self):
        draft_content = tornado.escape.json_decode(self.request.body)
        published_doc = self.fetch_published_doc_version()

        validator = RequirementsValidator(draft_content, published_doc)
        validator.validate()
        validator.track_all_changes()

        response = dict()
        response["validation_msgs"] = validator.validation_msgs
        response["changes"] = validator.changes

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))


class SampleRequirementsDataHandler(SampleRequirementsBaseHandler):
    """Loaded through /api/v1/sample_requirements"""

    def get(self):
        """Should return the specified version of the sample requirements.

        if no version is specified, the most recent published one is returned.
        """
        version = self.get_argument("version", None)

        doc = self.fetch_published_doc_version(version)

        response = dict()
        response["sample_requirements"] = doc

        current_user_email = self.get_current_user().email
        response["current_user_email"] = current_user_email

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))


class SampleRequirementsPublishDataHandler(SampleRequirementsBaseHandler):
    """Accessed through
    /api/v1/sample_requirements_publish_draft
    """

    def post(self):
        """Publish a new sample requirements, from the current draft."""

        latest_doc = self.fetch_latest_doc()
        draft = latest_doc["Draft"]

        if not draft:
            self.set_status(400)
            return self.write("Error: No draft exists. Nothing to be published")

        current_user = self.get_current_user()
        if not current_user.is_sample_requirements_admin:
            self.set_status(400)
            return self.write(
                "Error: Only sample requirements admin cannot publish new sample requirements."
            )

        user_name = current_user.name
        user_email = current_user.email

        # Create a new draft
        doc = latest_doc.copy()
        doc["Draft"] = False

        self._update_last_modified(doc)

        # Should be set at the time of publication
        doc["Issued by user"] = user_name
        doc["Issued by user email"] = user_email
        doc["Issued at"] = datetime.datetime.now().isoformat()

        cc_db = self.application.sample_requirements_db
        cc_db.save(doc)
        self.write({"message": "New sample requirements published"})


class SampleRequirementsUpdateHandler(SampleRequirementsBaseHandler):
    """Serves a form where the draft sample requirements can be updated.

    Loaded through:
        /sample_requirements_update

    """

    def get(self):
        t = self.application.loader.load("sample_requirements_update.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class SampleRequirementsPreviewHandler(SampleRequirementsBaseHandler):
    """Serves a preview of the draft cost calculator.

    Loaded through:
        /sample_requirements_preview

    """

    def get(self):
        t = self.application.loader.load("sample_requirements_preview.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class SampleRequirementsViewHandler(SampleRequirementsBaseHandler):
    """Serves a form where the sample requirements can be viewed.

    Loaded through:
        /sample_requirements

    """

    def get(self):
        t = self.application.loader.load("sample_requirements.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )
