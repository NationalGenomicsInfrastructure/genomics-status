import datetime
import json

import markdown
import tornado.web

from status.util import SafeHandler


class PricingBaseHandler(SafeHandler):
    """Base class that other pricing handlers should inherit from.

    Implements most of the logic of the pricing that other classes should reuse
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
        db = self.application.cost_calculator_db
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
        db = self.application.cost_calculator_db
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


class PricingDateToVersionDataHandler(PricingBaseHandler):
    """Serves a map of when each version of the cost calculator was issued.

    Loaded through:
        /api/v1/pricing_date_to_version

    Use this to be able to look back in history of the cost calculator
    database at certain dates.
    """

    def get(self):
        cc_view = self.application.cost_calculator_db.view(
            "version_info/by_date", descending=False
        )

        self.write(json.dumps(cc_view.rows))


class PricingExchangeRatesDataHandler(PricingBaseHandler):
    """Serves data of exchange rates

    Loaded through:
        /api/v1/pricing_exchange_rates
        /api/v1/pricing_exchange_rates?date=YYYY-MM-DD

    Use the optional parameter `date` if anything else than the latest
    exchange rates are needed. The format should be as indicated above.
    The most recent exchange rates prior to the `date` will be served.

    If `date` is omitted, the most recent exchange rates will be served.
    """

    def _fetch_exchange_rates(self, date=None):
        """Internal method to fetch exchange rates from StatusDB

        :param date: string in format 'YYYY-MM-DD'
        :return: dictionary with keys 'USD_in_SEK', 'EUR_in_SEK' and
        'Issued at'.

        Returns the most recent rates prior to date given by parameter `date`
        If parameter `date` is not supplied, the current timestamp is used.
        """

        if date is not None:
            dt = self._validate_date_string(date)
        else:
            dt = datetime.datetime.now()

        str_format_date = dt.strftime("%Y-%m-%d")
        view = self.application.pricing_exchange_rates_db.view(
            "entire_document/by_date",
            startkey=str_format_date,
            descending=True,
            limit=1,
        )

        result = {}
        result["USD_in_SEK"] = view.rows[0].value["USD_in_SEK"]
        result["EUR_in_SEK"] = view.rows[0].value["EUR_in_SEK"]
        result["Issued at"] = view.rows[0].value["Issued at"]
        return result

    def get(self):
        date = self.get_argument("date", None)

        result = self._fetch_exchange_rates(date)

        self.write(json.dumps(result))


class PricingValidator:
    """Helper object to store and handle the validation of a new version of the pricing"""

    # Which variables that shouldn't be changed while keeping the same _id_.
    # If an update of any of these fields is needed, a new id should be created.
    CONSERVED_KEY_SETS = {
        "products": ["Category", "Type", "Name"],
        "components": ["Category", "Type", "Product name"],
    }

    # The combination of these 'columns' should be unique within the document.
    UNIQUE_KEY_SETS = {
        "products": ["Category", "Type", "Name"],
        "components": ["Category", "Type", "Product name", "Units"],
    }

    # These keys are not allowed to be undefined for any item
    NOT_NULL_KEYS = {
        "products": ["REF_ID", "Category", "Type", "Name", "Overhead"],
        "components": [
            "REF_ID",
            "Category",
            "Type",
            "Status",
            "Product name",
            "Units",
            "Currency",
            "List price",
            "Discount",
        ],
    }

    def __init__(self, draft_doc, published_doc):
        self.draft_components = draft_doc["components"]
        self.draft_products = draft_doc["products"]
        self.published_components = published_doc["components"]
        self.published_products = published_doc["products"]
        self.validation_msgs = {"components": dict(), "products": dict()}
        self.changes = {"components": dict(), "products": dict()}
        self.validation_result = True

    def _add_validation_msg(self, type, id, error_type, msg):
        if id not in self.validation_msgs[type]:
            self.validation_msgs[type][id] = dict()
        if error_type not in self.validation_msgs[type][id]:
            self.validation_msgs[type][id][error_type] = []

        self.validation_msgs[type][id][error_type].append(msg)

    def _add_change(self, type, id, key, draft_val, published_val):
        if id not in self.changes[type]:
            self.changes[type][id] = dict()

        self.changes[type][id][key] = (draft_val, published_val)

    def _validate_unique(self, items, type):
        """Check all items to make sure they are 'unique'.

        The uniqueness criteria is decided according to the UNIQUE_KEY_SETS.
        Returns (True, []) if unique, and otherwise False wit h if not.
        """
        key_val_set = set()
        for id, item in items.items():
            keys = self.UNIQUE_KEY_SETS[type]
            t = tuple(item[key] for key in keys)

            # Check that it is not already added
            if t in key_val_set:
                self._add_validation_msg(
                    type,
                    id,
                    "unique",
                    (
                        f"Key combination {keys}:{t} is included multiple "
                        f"times in the {type} sheet. "
                    ),
                )
                self.validation_result = False
            key_val_set.add(t)

    def _validate_not_null(self, items, type):
        """Make sure type specific columns (given by NOT_NULL_KEYS) are not null."""

        not_null_keys = self.NOT_NULL_KEYS[type]
        for id, item in items.items():
            for not_null_key in not_null_keys:
                if item[not_null_key] is None or item[not_null_key] == "":
                    # Special case for discontinued components
                    if "Status" in item and item["Status"] == "Discontinued":
                        pass
                    else:
                        self._add_validation_msg(
                            type,
                            id,
                            "not_null",
                            (
                                f"{not_null_key} cannot be empty for {type}."
                                f" Violated for item with id {id}."
                            ),
                        )
                        self.validation_result = False

    def _validate_conserved(self, new_items, current_items, type):
        """Ensures the keys in CONSERVED_KEY_SETS are conserved for each given id.

        Compares the new version against the currently active one.
        Params:
            new_items     - A dict of the items that are to be added
                            with ID attribute as the key.
            current_items - A dict of the items currently in the database
                            with ID attribute as the key.
            type          - Either 'components' or 'products'
        """
        conserved_keys = self.CONSERVED_KEY_SETS[type]
        for id, new_item in new_items.items():
            if str(id) in current_items:
                for conserved_key in conserved_keys:
                    if conserved_key not in new_item:
                        self._add_validation_msg(
                            type,
                            id,
                            "conserved",
                            (
                                f"{conserved_key} column not found in new {type} row with "
                                f"id {id}. This column should be kept "
                                "conserved."
                            ),
                        )
                        self.validation_result = False
                    if new_item[conserved_key] != current_items[str(id)][conserved_key]:
                        self._add_validation_msg(
                            type,
                            id,
                            "conserved",
                            (
                                f"{conserved_key} should be conserved for {type}. "
                                f"Violated for item with id {id}. "
                                f'Found "{new_item[conserved_key]}" for new and "{current_items[str(id)][conserved_key]}" for current. '
                            ),
                        )
                        self.validation_result = False

    def _validate_discontinued(self, components, products):
        """Make sure no discontinued components are used for enabled products."""

        for product_id, product in products.items():
            component_ids = []

            if product["Status"] == "Available":
                if product["Components"]:
                    component_ids += product["Components"].keys()

                for component_id in component_ids:
                    if components[component_id]["Status"] == "Discontinued":
                        self._add_validation_msg(
                            "products",
                            product_id,
                            "discontinued",
                            (
                                'Product {}:"{}" uses the discontinued component '
                                '{}:"{}", while product status is not "discontinued"'
                            ).format(
                                product_id,
                                products[product_id]["Name"],
                                component_id,
                                components[component_id]["Product name"],
                            ),
                        )
                        self.validation_result = False

                if product["Alternative Components"]:
                    for component_id in product["Alternative Components"].keys():
                        if components[component_id]["Status"] == "Discontinued":
                            self._add_validation_msg(
                                "products",
                                product_id,
                                "discontinued",
                                (
                                    'Product {}:"{}" uses the discontinued alternative component '
                                    '{}:"{}", please check whether product status should be "discontinued"'
                                ).format(
                                    product_id,
                                    products[product_id]["Name"],
                                    component_id,
                                    components[component_id]["Product name"],
                                ),
                            )

    def track_all_changes(self):
        # Check which ids have been added
        added_product_ids = set(self.draft_products.keys()) - set(
            self.published_products.keys()
        )
        added_component_ids = set(self.draft_components.keys()) - set(
            self.published_components.keys()
        )
        for product_id in added_product_ids:
            self._add_change(
                "products", product_id, "All", self.draft_products[product_id], None
            )

        for component_id in added_component_ids:
            self._add_change(
                "components",
                component_id,
                "All",
                self.draft_components[component_id],
                None,
            )

        for product_id, published_prod in self.published_products.items():
            draft_prod = self.draft_products[product_id]

            for product_key, published_val in published_prod.items():
                draft_val = draft_prod[product_key]
                if published_val != draft_val:
                    self._add_change(
                        "products", product_id, product_key, draft_val, published_val
                    )

        for component_id, published_comp in self.published_components.items():
            draft_comp = self.draft_components[component_id]
            for component_key, published_val in published_comp.items():
                draft_val = draft_comp[component_key]
                if published_val != draft_val:
                    self._add_change(
                        "components",
                        component_id,
                        component_key,
                        draft_val,
                        published_val,
                    )

    def validate(self):
        self._validate_unique(self.draft_components, "components")
        self._validate_not_null(self.draft_components, "components")

        self._validate_conserved(
            self.draft_components, self.published_components, "components"
        )

        self._validate_unique(self.draft_products, "products")
        self._validate_not_null(self.draft_products, "products")

        self._validate_conserved(
            self.draft_products, self.published_products, "products"
        )

        # Verify no discontinued components are used for enabled products
        self._validate_discontinued(self.draft_components, self.draft_products)


class PricingValidateDraftDataHandler(PricingBaseHandler):
    """Loaded through /api/v1/pricing_validate_unsaved_draft"""

    def post(self):
        draft_content = tornado.escape.json_decode(self.request.body)
        version = draft_content.get("version", None)
        published_doc = self.fetch_published_doc_version(version=version)

        validator = PricingValidator(draft_content, published_doc)
        validator.validate()
        validator.track_all_changes()

        response = dict()
        response["validation_msgs"] = validator.validation_msgs
        response["changes"] = validator.changes

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))


class PricingReassignLockDataHandler(PricingBaseHandler):
    """Available at /api/v1/pricing_reassign_lock"""

    def post(self):
        doc = self.fetch_latest_doc()
        draft = doc["Draft"]
        if not draft:
            self.set_header("Content-type", "application/json")
            self.set_status(400)
            return self.write(
                "Error: Attempting to update a non-draft cost calculator."
            )

        current_user = self.get_current_user()
        if not current_user.is_pricing_admin:
            self.set_status(400)
            return self.write("Error: Cannot reassign lock to non-pricing admin.")
        user_email = current_user.email

        lock_info = {"Locked": True, "Locked by": user_email}

        doc["Lock Info"] = lock_info
        doc = self._update_last_modified(doc)

        cc_db = self.application.cost_calculator_db
        cc_db.save(doc)
        self.set_header("Content-type", "application/json")
        self.write({"message": "Lock info updated"})


class PricingDraftDataHandler(PricingBaseHandler):
    """Loaded through /api/v1/draft_cost_calculator"""

    def get(self):
        """Should return the specified version of the cost calculator."""
        doc = self.fetch_latest_doc()
        draft = doc["Draft"]

        response = dict()
        response["cost_calculator"] = None
        if draft:
            response["cost_calculator"] = doc

        current_user_email = self.get_current_user().email
        response["current_user_email"] = current_user_email

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))

    def post(self):
        """Create a new draft cost calculator based on the currently published

        will check that:
            - the latest version is not a draft (would return 400)
        """

        latest_doc = self.fetch_latest_doc()
        draft = latest_doc["Draft"]

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

        cc_db = self.application.cost_calculator_db
        cc_db.save(doc)
        self.set_header("Content-type", "application/json")
        self.write({"message": "Draft created"})

    def put(self):
        """Update the current draft cost calculator.

        Only updates the components and products section of the document.
        Expects a json blob with the keys 'components' and 'products'.
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
                "Error: Attempting to update a non-draft cost calculator."
            )

        current_user = self.get_current_user()
        if not current_user.is_pricing_admin:
            self.set_status(400)
            return self.write(
                "Error: Non-pricing admin cannot update draft cost calculator."
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
        if ("components" not in new_doc_content) or ("products" not in new_doc_content):
            self.set_status(400)
            return self.write("Error: Malformed request body.")

        latest_doc["components"] = new_doc_content["components"]
        latest_doc["products"] = new_doc_content["products"]

        self._update_last_modified(latest_doc)

        cc_db = self.application.cost_calculator_db
        cc_db.save(latest_doc)
        msg = "Draft successfully saved at {}".format(
            datetime.datetime.now().strftime("%H:%M:%S")
        )
        self.set_header("Content-type", "application/json")
        return self.write({"message": msg})

    def delete(self):
        """Delete the current draft cost calculator.abs

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
                "Error: There is no draft cost calculator that can be deleted."
            )

        current_user = self.get_current_user()
        if not current_user.is_pricing_admin:
            self.set_status(400)
            return self.write(
                "Error: Non-pricing admin cannot delete draft cost calculator."
            )
        user_email = current_user.email

        lock_info = latest_doc["Lock Info"]
        if lock_info["Locked"]:
            if lock_info["Locked by"] != user_email:
                self.set_status(400)
                return self.write(
                    "Error: Attempting to delete a draft locked by someone else."
                )

        cc_db = self.application.cost_calculator_db
        cc_db.delete(latest_doc)
        msg = "Draft successfully deleted at {}".format(
            datetime.datetime.now().strftime("%H:%M:%S")
        )
        self.set_header("Content-type", "application/json")
        return self.write({"message": msg})


class PricingDataHandler(PricingBaseHandler):
    """Loaded through /api/v1/cost_calculator"""

    def get(self):
        """Should return the specified version of the cost calculator.

        if no version is specified, the most recent published one is returned.
        """
        version = None
        if self.request.query:
            version = int(self.request.query.split("version=")[1])

        doc = self.fetch_published_doc_version(version)

        response = dict()
        response["cost_calculator"] = doc

        current_user_email = self.get_current_user().email
        response["current_user_email"] = current_user_email

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))


class PricingPublishDataHandler(PricingBaseHandler):
    """Accessed through
    /api/v1/pricing_publish_draft
    """

    def post(self):
        """Publish a new cost calculator, from the current draft."""

        latest_doc = self.fetch_latest_doc()
        draft = latest_doc["Draft"]

        if not draft:
            self.set_status(400)
            return self.write("Error: No draft exists. Nothing to be published")

        current_user = self.get_current_user()
        if not current_user.is_pricing_admin:
            self.set_status(400)
            return self.write(
                "Error: Non-pricing admin cannot publish new cost calculator."
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

        cc_db = self.application.cost_calculator_db
        cc_db.save(doc)
        self.write({"message": "New cost calculator published"})


class PricingUpdateHandler(PricingBaseHandler):
    """Serves a form where the draft cost calculator can be updated.

    Loaded through:
        /pricing_update

    """

    def get(self):
        t = self.application.loader.load("pricing_update.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class PricingPreviewHandler(PricingBaseHandler):
    """Serves a preview of the draft cost calculator.

    Loaded through:
        /pricing_preview

    """

    def get(self):
        t = self.application.loader.load("pricing_preview.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class PricingQuoteHandler(PricingBaseHandler):
    """Serves a view from where a project quote can be built

    Loaded through:
        /pricing_quote

    """

    def get(self):
        t = self.application.loader.load("pricing_quote.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class AgreementsDBHandler(SafeHandler):
    """Base class that other handlers can inherit from to access the Agreements DB.

    Implements logic that other classes can reuse
    """

    # _____________________________ FETCH METHODS _____________________________

    def fetch_agreement(self, project_id):
        db = self.application.agreements_db
        rows = db.view(
            "entire_document/project_id", descending=True, key=project_id, limit=1
        ).rows
        doc = {}
        if len(rows) > 0:
            doc = rows[0].value
        return doc

    # ____________________________ UPDATE DOC METHODS ____________________

    def update_agreementdoc(self, project_id, timestamp, save_info=None):
        doc = self.fetch_agreement(project_id)
        # for saving agreement info
        if save_info:
            if not doc:
                doc["project_id"] = project_id
            if "saved_agreements" in doc:
                doc["saved_agreements"][timestamp] = save_info
            else:
                doc["saved_agreements"] = {timestamp: save_info}
        # for marking a saved agreement signed
        else:
            doc["signed"] = timestamp
            doc["signed_by"] = self.get_current_user().name
            doc["signed_at"] = int(datetime.datetime.now().timestamp() * 1000)

        db = self.application.agreements_db
        # probably add a try-except here in the future
        db.save(doc)


class GenerateQuoteHandler(AgreementsDBHandler):
    """Serves a built pricing quote page

    Loaded through:
        /generate_quote

    """

    def post(self):
        quote_input = tornado.escape.json_decode(
            self.request.body.decode("utf-8").split("=")[1]
        )
        current_user = self.get_current_user()
        user_name = current_user.name
        if quote_input["type"] == "preview" and "project_data" not in quote_input:
            quote_input["date"] = datetime.datetime.now().date().isoformat()
        else:
            agreement_timestamp = quote_input["project_data"]["agreement_number"].split(
                "_"
            )[1]
            quote_input["date"] = (
                datetime.datetime.fromtimestamp(int(agreement_timestamp) / 1000)
                .date()
                .isoformat()
            )
            if quote_input["type"] == "display":
                if not current_user.is_proj_coord:
                    self.set_status(401)
                    return self.write(
                        "Error: You do not have the permissions for this operation!"
                    )
                agreement_to_display = self.fetch_agreement(
                    quote_input["project_data"]["project_id"]
                )["saved_agreements"][agreement_timestamp]
                user_name = agreement_to_display["created_by"]
                for key in [
                    "price_breakup",
                    "total_cost",
                    "total_cost_discount",
                    "price_type",
                    "agreement_summary",
                    "agreement_conditions",
                    "template_text",
                ]:
                    quote_input[key] = agreement_to_display[key]

        template_text = quote_input.pop("template_text")
        template_text["appendices"] = markdown.markdown(
            template_text["appendices"], extensions=["sane_lists"]
        )
        for condition in template_text["first_page_text"]["specific_conditions"]:
            template_text["first_page_text"]["specific_conditions"][condition] = (
                markdown.markdown(
                    template_text["first_page_text"]["specific_conditions"][condition]
                )
            )

        if "agreement_summary" not in quote_input.keys():
            default_agreement_summary = (
                AgreementTemplateTextHandler.fetch_latest_agreement_doc(
                    self.application.agreement_templates_db
                )
            )
            quote_input["agreement_summary"] = default_agreement_summary[
                "first_page_text"
            ]["agreement_summary"]
        quote_input["agreement_summary"] = markdown.markdown(
            quote_input["agreement_summary"], extensions=["sane_lists"]
        )

        t = self.application.loader.load("agreement.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals,
                user_name=user_name,
                data=quote_input,
                template_text=template_text,
            )
        )


class SaveQuoteHandler(AgreementsDBHandler):
    """Serves a built pricing quote page

    Loaded through:
        /api/v1/save_quote

    """

    def post(self):
        if not self.get_current_user().is_proj_coord:
            self.set_status(401)
            return self.write(
                "Error: You do not have the permissions for this operation!"
            )
        quote_input = tornado.escape.json_decode(self.request.body)["data"]
        if quote_input["type"] == "save":
            save_info = {}
            save_info["price_type"] = quote_input["price_type"]
            save_info["agreement_summary"] = quote_input["agreement_summary"]
            save_info["agreement_conditions"] = quote_input["agreement_conditions"]
            save_info["created_by"] = self.get_current_user().name
            save_info["created_by_email"] = self.get_current_user().email
            save_info["products_included"] = quote_input["products_included"]
            if "special_addition" in quote_input:
                save_info["special_addition"] = quote_input["special_addition"]
            if "special_percentage" in quote_input:
                save_info["special_percentage"] = quote_input["special_percentage"]
            save_info["exchange_rate_issued_date"] = quote_input[
                "exchange_rate_issued_date"
            ]
            save_info["cost_calculator_version"] = quote_input[
                "cost_calculator_version"
            ]
            save_info["price_breakup"] = quote_input["price_breakup"]
            save_info["total_cost"] = quote_input["total_cost"]
            save_info["total_cost_discount"] = quote_input["total_cost_discount"]
            save_info["template_text"] = quote_input["template_text"]

            proj_id = quote_input["project_data"]["project_id"]
            timestamp = quote_input["project_data"]["agreement_number"].split("_")[1]
            self.update_agreementdoc(proj_id, timestamp, save_info)
            self.set_header("Content-type", "application/json")
            self.write({"message": "Agreement Doc saved"})
            self.finish()


class AgreementTemplateTextHandler(SafeHandler):
    """Serves the agreement template text from statusdb

    Loaded through:
        /api/v1/get_agreement_template_text

    """

    def get(self):
        response = AgreementTemplateTextHandler.fetch_latest_agreement_doc(
            self.application.agreement_templates_db
        )
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))

    def fetch_latest_agreement_doc(db):
        curr_rows = db.view("entire_document/by_version", descending=True, limit=1).rows
        curr_doc = curr_rows[0].value
        curr_doc.pop("_id")
        curr_doc.pop("_rev")
        return curr_doc


class AgreementDataHandler(AgreementsDBHandler):
    """Serves the agreement data from statusdb

    Loaded through:
        /api/v1/get_agreement_doc/([^/]*)$

    """

    def get(self, project_id):
        response = self.fetch_agreement(project_id)
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))


class AgreementMarkSignHandler(AgreementsDBHandler):
    """Marks a saved agreement signed

    Loaded through:
        /api/v1/mark_agreement_signed

    """

    def post(self):
        if not self.get_current_user().is_proj_coord:
            self.set_status(401)
            return self.write(
                "Error: You do not have the permissions for this operation!"
            )
        post_data = tornado.escape.json_decode(self.request.body)
        self.update_agreementdoc(post_data["proj_id"], post_data["timestamp"])
        self.set_header("Content-type", "application/json")
        self.write({"message": "Agreement Doc updated"})
