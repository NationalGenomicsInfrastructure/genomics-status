import json
import datetime

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
                400, reason='Bad request, version is not an integer')
        return int_version

    def _validate_date_string(self, date):
        year, month, day = date.split('-')

        try:
            datetime_date = datetime.datetime(int(year), int(month), int(day))
        except ValueError:
            raise tornado.web.HTTPError(
                400,
                reason='Bad request, date format is not valid (YYYY-MM-DD)'
                )
        return datetime_date

    # _____________________________ FETCH METHODS _____________________________

    def fetch_published_doc_version(self, version=None):
        db = self.application.sample_requirements_db
        if version is not None:
            rows = db.view('entire_document/published_by_version', descending=True, key=version, limit=1).rows
        else:
            rows = db.view('entire_document/published_by_version', descending=True, limit=1).rows
        doc = rows[0].value
        return doc

    def fetch_latest_doc(self):
        db = self.application.sample_requirements_db
        curr_rows = db.view('entire_document/by_version', descending=True, limit=1).rows
        curr_doc = curr_rows[0].value
        return curr_doc

    # ____________________________ UPDATE DOC HELPER METHODS ____________________

    def _update_last_modified(self, doc):
        user_name = self.get_current_user().name
        user_email = self.get_current_user().email

        doc['Last modified by user'] = user_name
        doc['Last modified by user email'] = user_email
        doc['Last modified'] = datetime.datetime.now().isoformat()

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
                        'version_info/by_date',
                        descending=False
                        )

        self.write(json.dumps(cc_view.rows))


class SampleRequirementsReassignLockDataHandler(SampleRequirementsBaseHandler):
    """Available at /api/v1/sample_requirements_reassign_lock"""

    def post(self):
        doc = self.fetch_latest_doc()
        draft = doc['Draft']
        if not draft:
            self.set_header("Content-type", "application/json")
            self.set_status(400)
            return self.write("Error: Attempting to update a non-draft sample requirements.")

        current_user = self.get_current_user()
        # TODO add another role for this, for now reuse the pricing-admin role
        if not current_user.is_pricing_admin:
            self.set_status(400)
            return self.write("Error: Cannot reassign lock to non-pricing admin.")
        user_email = current_user.email

        lock_info = {'Locked': True,
                     'Locked by': user_email}

        doc['Lock Info'] = lock_info
        doc = self._update_last_modified(doc)

        sr_db = self.application.sample_requirements_db
        sr_db.save(doc)
        self.set_header("Content-type", "application/json")
        self.write({'message': 'Lock info updated'})


class SampleRequirementsDraftDataHandler(SampleRequirementsBaseHandler):
    """Loaded through /api/v1/draft_sample_requirements """

    def get(self):
        """ Should return the specified version of the sample requirements."""
        doc = self.fetch_latest_doc()
        draft = doc['Draft']

        response = dict()
        response['sample_requirements'] = None
        if draft:
            response['sample_requirements'] = doc

        current_user_email = self.get_current_user().email
        response['current_user_email'] = current_user_email

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))

    def post(self):
        """ Create a new draft sample requirements based on the currently published

        will check that:
            - the latest version is not a draft (would return 400)
        """

        latest_doc = self.fetch_latest_doc()
        draft = latest_doc['Draft']

        if draft:
            self.set_status(400)
            return self.write("Error: A draft already exists. There can only be one.")

        current_user = self.get_current_user()
        if not current_user.is_pricing_admin:
            self.set_status(400)
            return self.write("Error: Non-pricing admin cannot create a new draft.")
        current_user_email = current_user.email

        # Create a new draft
        doc = latest_doc.copy()
        del doc['_id']
        del doc['_rev']
        version = latest_doc['Version'] + 1

        lock_info = {'Locked': True,
                     'Locked by': current_user_email}

        doc['Draft'] = True
        doc['Version'] = version
        doc['Lock Info'] = lock_info

        # Should be set at the time of publication
        doc['Issued by user'] = None
        doc['Issued by user email'] = None
        doc['Issued at'] = None

        user_name = self.get_current_user().name
        user_email = self.get_current_user().email

        doc['Created by user'] = user_name
        doc['Created by user email'] = user_email
        doc['Created at'] = datetime.datetime.now().isoformat()

        self._update_last_modified(doc)

        cc_db = self.application.sample_requirements_db
        cc_db.save(doc)
        self.set_header("Content-type", "application/json")
        self.write({'message': 'Draft created'})

    def put(self):
        """ Update the current draft sample requirements.

        Will check that:
            - the most recent one is a draft
            - draft is not locked by other user
        otherwise return 400.
        """

        latest_doc = self.fetch_latest_doc()
        draft = latest_doc['Draft']
        if not draft:
            self.set_status(400)
            return self.write("Error: Attempting to update a non-draft sample requirements.")

        current_user = self.get_current_user()
        if not current_user.is_pricing_admin:
            self.set_status(400)
            return self.write("Error: Non-pricing admin cannot update draft sample requirements.")
        user_email = current_user.email

        lock_info = latest_doc['Lock Info']
        if lock_info['Locked']:
            if lock_info['Locked by'] != user_email:
                self.set_status(400)
                return self.write("Error: Attempting to update a draft locked by someone else.")

        new_doc_content = tornado.escape.json_decode(self.request.body)
        if 'sample_requirements' not in new_doc_content:
            self.set_status(400)
            return self.write("Error: Malformed request body.")

        latest_doc['components'] = new_doc_content['components']
        latest_doc['products'] = new_doc_content['products']

        self._update_last_modified(latest_doc)

        cc_db = self.application.sample_requirements_db
        cc_db.save(latest_doc)
        msg = "Draft successfully saved at {}".format(datetime.datetime.now().strftime("%H:%M:%S"))
        self.set_header("Content-type", "application/json")
        return self.write({'message': msg})

    def delete(self):
        """ Delete the current draft sample requirements.abs

            Will check that:
                - the most recent one is a draft
                - draft is not locked by other user
            otherwise return 400.
         """
        latest_doc = self.fetch_latest_doc()
        draft = latest_doc['Draft']
        if not draft:
            self.set_status(400)
            return self.write("Error: There is no draft sample requirements that can be deleted.")

        current_user = self.get_current_user()
        if not current_user.is_pricing_admin:
            self.set_status(400)
            return self.write("Error: Non-pricing admin cannot delete draft sample requirements.")
        user_email = current_user.email

        lock_info = latest_doc['Lock Info']
        if lock_info['Locked']:
            if lock_info['Locked by'] != user_email:
                self.set_status(400)
                return self.write("Error: Attempting to delete a draft locked by someone else.")

        cc_db = self.application.sample_requirements_db
        cc_db.delete(latest_doc)
        msg = "Draft successfully deleted at {}".format(datetime.datetime.now().strftime("%H:%M:%S"))
        self.set_header("Content-type", "application/json")
        return self.write({'message': msg})


class SampleRequirementsDataHandler(SampleRequirementsBaseHandler):
    """Loaded through /api/v1/sample_requirements """

    def get(self):
        """ Should return the specified version of the sample requirements.

        if no version is specified, the most recent published one is returned.
        """
        version = self.get_argument('version', None)

        doc = self.fetch_published_doc_version(version)

        response = dict()
        response['sample_requirements'] = doc

        current_user_email = self.get_current_user().email
        response['current_user_email'] = current_user_email

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))


class SampleRequirementsPublishDataHandler(SampleRequirementsBaseHandler):
    """ Accessed through
      /api/v1/sample_requirements_publish_draft
    """

    def post(self):
        """ Publish a new sample requirements, from the current draft. """

        latest_doc = self.fetch_latest_doc()
        draft = latest_doc['Draft']

        if not draft:
            self.set_status(400)
            return self.write("Error: No draft exists. Nothing to be published")

        current_user = self.get_current_user()
        if not current_user.is_pricing_admin:
            self.set_status(400)
            return self.write("Error: Non-pricing admin cannot publish new sample requirements.")

        user_name = current_user.name
        user_email = current_user.email

        # Create a new draft
        doc = latest_doc.copy()
        doc['Draft'] = False

        self._update_last_modified(doc)

        # Should be set at the time of publication
        doc['Issued by user'] = user_name
        doc['Issued by user email'] = user_email
        doc['Issued at'] = datetime.datetime.now().isoformat()

        cc_db = self.application.sample_requirements_db
        cc_db.save(doc)
        self.write({'message': 'New sample requirements published'})


class SampleRequirementsUpdateHandler(SampleRequirementsBaseHandler):
    """ Serves a form where the draft sample requirements can be updated.

    Loaded through:
        /sample_requirements_update

    """

    def get(self):
        t = self.application.loader.load('sample_requirements_update.html')
        self.write(t.generate(gs_globals=self.application.gs_globals,
                              user=self.get_current_user()))


class SampleRequirementsViewHandler(SampleRequirementsBaseHandler):
    """ Serves a form where the sample requirements can be viewed.

    Loaded through:
        /sample_requirements

    """

    def get(self):
        t = self.application.loader.load('sample_requirements.html')
        self.write(t.generate(gs_globals=self.application.gs_globals,
                              user=self.get_current_user()))
