import json
import datetime

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
                400, reason='Bad request, version is not an integer')
        return int_version

    def _validate_object_id(self, id, object_type):
        try:
            int_key = int(id)
        except ValueError:
            raise tornado.web.HTTPError(
                    400,
                    reason='Bad request, {} id is not an integer'.format(object_type)
                )
        return int_key

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

    def _validate_single_row_result(self, view, object_type):
        if len(view.rows) == 0:
            raise tornado.web.HTTPError(
                    404,
                    reason='No such {}(s) was found'.format(object_type)
                )
        if len(view.rows) > 1:
            raise tornado.web.HTTPError(
                    500,
                    reason='Internal Server Error: Multiple {} rows returned. '
                           'Expected only 1.'.format(object_type)
                )

    def _current_user_email(self):
        current_user = self.get_current_user()
        if current_user.email != 'Testing User!':
            current_user_email = current_user.email
        else:  # testing_mode
            current_user_email = 'johannes.alneberg@scilifelab.se' # 'test@example.com'
        return current_user_email

    # _____________________________ FETCH METHODS _____________________________

    def fetch_components(self, component_id=None, version=None):
        """Fetch pricing component raw data from StatusDB.

        :param component_id: integer id of component to fetch. If None, all
                    components are fetched.
        :param version: optional integer specifying version to fetch,
                        if None, the latest is fetched
        :return: The rows fetched from the database
        """

        if component_id is not None:
            int_key = self._validate_object_id(component_id, 'component')

        if version is not None:  # Specified version
            int_version = self._validate_version_param(version)

            if component_id is None:  # All components
                view = self.application.pricing_components_db.view(
                            'entire_document/by_version',
                            key=int_version,
                            limit=1,
                            descending=True
                            )
            else:
                view = self.application.pricing_components_db.view(
                            'individual_components/by_id_and_version',
                            key=[int_key, int_version],
                            limit=1
                            )

        else:  # No specified version
            if component_id is None:  # All components
                view = self.application.pricing_components_db.view(
                            'entire_document/by_version',
                            limit=1,
                            descending=True
                            )
            else:
                view = self.application.pricing_components_db.view(
                            'individual_components/by_id_and_version',
                            startkey=[int_key, {}],
                            endkey=[int_key],
                            limit=1,
                            descending=True
                            )

        self._validate_single_row_result(view, 'component')

        if component_id is None:  # All components
            return view.rows[0].value['components']
        else:
            return {component_id: view.rows[0].value}

    def fetch_products(self, product_id, version=None):
        """Fetch pricing products raw data from StatusDB.

        :param product_id: integer id of product to fetch. If None, all
                    products are fetched.
        :param version: optional integer specifying version to fetch,
                        if None, the latest is fetched
        :return: The rows fetched from the database
        """
        if product_id is not None:
            int_key = self._validate_object_id(product_id, 'product')

        if version is not None:  # Specified version
            int_version = self._validate_version_param(version)

            if product_id is None:  # All products
                view = self.application.pricing_products_db.view(
                        'entire_document/by_version',
                        key=int_version,
                        limit=1,
                        descending=True
                    )
            else:  # Individual product
                view = self.application.pricing_products_db.view(
                        'individual_products/by_id_and_version',
                        key=[int_key, int_version],
                        limit=1,
                        descending=True
                    )
        else:  # No specified version
            if product_id is None:  # All products
                view = self.application.pricing_products_db.view(
                        'entire_document/by_version',
                        limit=1,
                        descending=True
                    )
            else:
                view = self.application.pricing_products_db.view(
                        'individual_products/by_id_and_version',
                        startkey=[int_key, {}],
                        endkey=[int_key],
                        limit=1,
                        descending=True
                    )
        self._validate_single_row_result(view, 'product')

        if product_id is None:  # All products
            return view.rows[0].value['products']
        else:
            return {product_id: view.rows[0].value}

    def fetch_exchange_rates(self, date=None):
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

        str_format_date = dt.strftime('%Y-%m-%d')
        view = self.application.pricing_exchange_rates_db.view(
                'entire_document/by_date',
                startkey=str_format_date,
                descending=True,
                limit=1
            )

        result = {}
        result['USD_in_SEK'] = view.rows[0].value['USD_in_SEK']
        result['EUR_in_SEK'] = view.rows[0].value['EUR_in_SEK']
        result['Issued at'] = view.rows[0].value['Issued at']
        return result

    # _____________________________ CALCULATION METHODS _______________________
    def _calculate_component_price(self, component, exch_rates):
        currency = component['Currency']
        if currency == 'SEK':
            sek_list_price = component['List price']
        else:
            currency_key = '{}_in_SEK'.format(currency)
            sek_list_price = exch_rates[currency_key] * component['List price']

        sek_price = sek_list_price - sek_list_price * component['Discount']

        sek_price_per_unit = sek_price/float(component['Units'])

        return sek_price, sek_price_per_unit

    def _calculate_product_price(self, product, all_component_prices):
        price = 0
        # Fixed price trumps all component and reagent prices
        if product['is_fixed_price']:
            price = product['fixed_price']['price_in_sek']
            price_academic = product['fixed_price']['price_for_academics_in_sek']
            full_cost = product['fixed_price']['full_cost_in_sek']
            return price, price_academic, full_cost

        for component_id, info in product['Components'].items():
            component_price_d = all_component_prices[str(component_id)]
            quantity = int(info['quantity'])
            price += quantity * component_price_d['price_per_unit_in_sek']

        price_academic = price + price * product['Re-run fee']

        full_cost_fee = product.get('Full cost fee', '')
        if full_cost_fee == '':
            full_cost_fee = '0.0'

        full_cost = price_academic + float(full_cost_fee)

        return price, price_academic, full_cost

    # _______________________________ GET METHODS _____________________________
    def get_component_prices(self, component_id=None, version=None, date=None,
                             pretty_strings=False):
        """Calculate prices for individual or all pricing components.

        :param component_id: The id of the component to calculate price for.
                        If None, all component prices will be calculated.
        :param version: The version of components to use.
                        When not specified, the latest version will be used.
        :param date: The date for which the exchange rate will be fetched.
                        When not specified, the latest exchange rates will be
                        used.
        :param pretty_strings: Output prices as formatted strings instead
                        of float numbers.

        """
        exch_rates = self.fetch_exchange_rates(date)
        all_components = self.fetch_components(component_id, version)

        return_d = all_components.copy()

        for component_id, component in all_components.items():
            if component['List price']:
                price, price_per_unit = self._calculate_component_price(component,
                                                                        exch_rates)
                if pretty_strings:
                    price = '{:.2f}'.format(price)
                    price_per_unit = '{:.2f}'.format(price_per_unit)
            elif component['Status'] != 'Discontinued':
                raise ValueError('Empty list price for non-discontinued component')
            else:
                price = ''
                price_per_unit = ''

            return_d[component_id]['price_in_sek'] = price
            return_d[component_id]['price_per_unit_in_sek'] = price_per_unit

        return return_d

    def get_product_prices(self, product_id, version=None, date=None,
                           discontinued=False, pretty_strings=False):
        """Calculate the price for an individual or all products

        :param product_id: The id of the product to calculate price for.
                        If None, all product prices will be calculated.
        :param version: The version of product and components to use.
                        When not specified, the latest version will be used.
        :param date: The date for which the exchange rate will be fetched.
                        When not specified, the latest exchange rates will be
                        used.
        :param discontinued: If evaluated to False, only products with status
                        'available' will be included.
        :param pretty_strings: Output prices as formatted strings instead
                        of float numbers.

        """

        all_component_prices = self.get_component_prices(version=version, date=date)
        products = self.fetch_products(product_id, version)

        return_d = products.copy()

        for product_id, product in products.items():
            if not discontinued and product['Status'] != 'Available':
                return_d.pop(product_id)
                continue

            price_int, price_acad, price_full = self._calculate_product_price(product, all_component_prices)

            if pretty_strings:
                price_int = '{:.2f}'.format(price_int)
                price_acad = '{:.2f}'.format(price_acad)
                price_full = '{:.2f}'.format(price_full)

            return_d[product_id]['price_internal'] = price_int
            return_d[product_id]['price_academic'] = price_acad
            return_d[product_id]['price_full'] = price_full

        return return_d


class PricingDateToVersionDataHandler(PricingBaseHandler):
    """Serves a map of when each version of pricing components and
    pricing products was issued.

    Loaded through:
        /api/v1/pricing_date_to_version

    Use this to be able to look back in history of the components and
    products database at certain dates.
    """

    def get(self):
        # The versions of products and components should match perfectly,
        # so we only need to fetch from one database.
        prod_view = self.application.pricing_products_db.view(
                        'version_info/by_date',
                        descending=False
                        )

        self.write(json.dumps(prod_view.rows))


class PricingExchangeRatesDataHandler(PricingBaseHandler):
    """ Serves data of exchange rates

    Loaded through:
        /api/v1/pricing_exchange_rates
        /api/v1/pricing_exchange_rates?date=YYYY-MM-DD

    Use the optional parameter `date` if anything else than the latest
    exchange rates are needed. The format should be as indicated above.
    The most recent exchange rates prior to the `date` will be served.

    If `date` is omitted, the most recent exchange rates will be served.
    """

    def get(self):
        date = self.get_argument('date', None)

        if date is not None:
            result = self.fetch_exchange_rates(date)
        else:
            result = self.fetch_exchange_rates(None)

        self.write(json.dumps(result))


class PricingQuoteHandler(PricingBaseHandler):
    """ Serves a view from where a project quote can be built

    Loaded through:
        /pricing_quote

    """

    def get(self):
        t = self.application.loader.load('pricing_quote.html')
        self.write(t.generate(gs_globals=self.application.gs_globals,
                              user=self.get_current_user()))


class PricingValidationError(Exception):
    pass


class PricingValidationDataHandler(PricingBaseHandler):
    """Handles the validation of a new version of the pricing

    """
    # Which variables that shouldn't be changed while keeping the same _id_.
    # If an update of any of these fields is needed, a new id should be created.
    CONSERVED_KEY_SETS = {'products': ['Category', 'Type', 'Name'],
                          'components': ['Category', 'Type', 'Product name']}

    # The combination of these 'columns' should be unique within the document.
    UNIQUE_KEY_SETS = {'products': ['Category', 'Type', 'Name'],
                       'components': ['Category', 'Type', 'Product name', 'Units']}

    # These keys are not allowed to be undefined for any item
    NOT_NULL_KEYS = {'products': ['REF_ID', 'Category', 'Type', 'Name', 'Re-run fee'],
                     'components': ['REF_ID', 'Category', 'Type', 'Status',
                                    'Product name', 'Units', 'Currency',
                                    'List price', 'Discount']}

    def initialize(self):
        self.validation_msgs = []

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
                self.validation_msgs.append('Key combination {}:{} is included multiple '
                                            'times in the {} sheet. '.format(keys, t, type))
                raise PricingValidationError
            key_val_set.add(t)
        return True

    def _validate_not_null(self, items, type):
        """Make sure type specific columns (given by NOT_NULL_KEYS) are not null."""

        not_null_keys = self.NOT_NULL_KEYS[type]

        for id, item in items.items():
            for not_null_key in not_null_keys:
                if item[not_null_key] is None or item[not_null_key] == '':
                    # Special case for discontinued components
                    if 'Status' in item and item['Status'] == 'Discontinued':
                        pass
                    else:
                        self.validation_msgs.append('{} cannot be empty for {}.'
                                                    ' Violated for item with id {}.'.
                                                    format(not_null_key, type, id))
                        raise PricingValidationError
        return True

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
                        self.validation_msgs.append('{} column not found in new {} row with '
                                                    'id {}. This column should be kept '
                                                    'conserved.'.format(conserved_key, type, id))
                        raise PricingValidationError
                    if new_item[conserved_key] != current_items[str(id)][conserved_key]:
                        self.validation_msgs.append('{} should be conserved for {}. '
                                                    'Violated for item with id {}. '
                                                    'Found "{}" for new and "{}" for current. '.format(
                                                        conserved_key, type,
                                                        id, new_item[conserved_key],
                                                        current_items[str(id)][conserved_key]))
                        raise PricingValidationError
        return True

    def _validate_discontinued(self, components, products):
        """Make sure no discontinued components are used for enabled products."""

        for product_id, product in products.items():
            component_ids = []

            if product['Status'] == 'Available':
                if product['Components']:
                    component_ids += product['Components'].keys()

                for component_id in component_ids:
                    if components[component_id]['Status'] == 'Discontinued':
                        self.validation_msgs.append(('Product {}:"{}" uses the discontinued component '
                                                     '{}:"{}", changing product status to "discontinued"').
                                                    format(product_id, products[product_id]['Name'],
                                                           component_id, components[component_id]['Product name']))
                        product['Status'] = 'Discontinued'
                        raise PricingValidationError

                if product['Alternative Components']:
                    for component_id in product['Alternative Components'].keys():
                        if components[component_id]['Status'] == 'Discontinued':
                            self.validation_msgs.append(('Product {}:"{}" uses the discontinued alternative component '
                                                         '{}:"{}", please check whether product status should be "discontinued"').
                                                        format(product_id, products[product_id]['Name'],
                                                               component_id, components[component_id]['Product name']))
            return True

    def validate(self, components, products):
        self._validate_unique(components, 'components')
        self._validate_not_null(components, 'components')

        current_components = self.fetch_components()

        if current_components:
            self._validate_conserved(components, current_components, 'components')

        self._validate_unique(products, 'products')
        self._validate_not_null(products, 'products')

        current_products = self.fetch_products(None)

        if current_products:
            self._validate_conserved(products, current_products, 'products')

        # Verify no discontinued components are used for enabled products
        self._validate_discontinued(components, products)

    def get(self):
        components = self.fetch_components()
        products = self.fetch_products(None)
        try:
            self.validate(components, products)
        except PricingValidationError:
            raise tornado.web.HTTPError(
                400, reason='\n'.join(self.validation_msgs))
        except Exception:
            raise # Maybe this is the default?

        self.write(json.dumps('Sucess!'))

    def save(self):
        """
        # Save it but push it only if products are also parsed correctly
        comp_doc = doc.copy()
        comp_doc['components'] = components

        current_version = get_current_version(comp_db)
        comp_doc['Version'] = current_version + 1

        # Modify the `last updated`-field of each item
        components = set_last_updated_field(components,
                                            current_components,
                                            'component')
        # Modify the `last updated`-field of each item
        products = set_last_updated_field(products,
                                          current_products,
                                          'product')

        prod_doc = doc.copy()
        prod_doc['products'] = products

        current_version = get_current_version(prod_db)
        prod_doc['Version'] = current_version + 1
        """
        pass


class PricingDraftDataHandler(PricingBaseHandler):
    """Loaded through /api/v1/draft_cost_calculator """

    def _get_latest_doc(self, db):
        curr_rows = db.view('entire_document/by_version', descending=True, limit=1).rows
        curr_doc = curr_rows[0].value
        return curr_doc

    def get(self):
        """ Should return the specified version of the cost calculator."""
        cc_db = self.application.cost_calculator_db
        doc = self._get_latest_doc(cc_db)
        draft = doc['Draft']

        response = dict()
        if draft:
            response['cost_calculator'] = doc
        if not draft:
            response['cost_calculator'] = None


        current_user_email = self._current_user_email()
        response['current_user_email'] = current_user_email

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))

    def post(self):
        """ Create a new draft cost calculator.

        will check that:
            - the latest version is not a draft (would return 400)
        """
        cc_db = self.application.cost_calculator_db

        latest_doc = self._get_latest_doc(cc_db)
        draft = latest_doc['Draft']

        if draft:
            self.set_status(400)
            return self.write("Error: A draft already exists. There can only be one.")

        # Create a new draft
        doc = latest_doc.copy()
        del doc['_id']
        del doc['_rev']
        version = latest_doc['Version'] + 1

        current_user_email = self._current_user_email()

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
        user_email = self._current_user_email()

        doc['Created by user'] = user_name
        doc['Created by user email'] = user_email
        doc['Created at'] = datetime.datetime.now().isoformat()

        doc['Last modified by user'] = user_name
        doc['Last modified by user email'] = user_email
        doc['Last modified'] = datetime.datetime.now().isoformat()

        cc_db.save(doc)
        self.write({'message': 'Draft created'})

    def put(self):
        """ Update the current draft cost calculator.

        Only updates the components and products section of the document.
        Expects a json blob with the keys 'components' and 'products'.
        Will check that:
            - the most recent one is a draft
            - draft is not locked by other user
        otherwise return 400.
        """
        cc_db = self.application.cost_calculator_db

        latest_doc = self._get_latest_doc(cc_db)
        draft = latest_doc['Draft']
        if not draft:
            self.set_status(400)
            return self.write("Error: Attempting to update a non-draft cost calculator.")

        user_name = self.get_current_user().name
        user_email = self._current_user_email()

        lock_info = latest_doc['Lock Info']
        if lock_info['Locked']:
            if lock_info['Locked by'] != user_email:
                self.set_status(400)
                return self.write("Error: Attempting to update a draft locked by someone else.")

        new_doc_content = tornado.escape.json_decode(self.request.body)
        if ('components' not in new_doc_content) or ('products' not in new_doc_content):
            self.set_status(400)
            return self.write("Error: Malformed request body.")

        ## TODO: Validate the data?
        latest_doc['components'] = new_doc_content['components']
        latest_doc['products'] = new_doc_content['products']

        latest_doc['Last modified by user'] = user_name
        latest_doc['Last modified by user email'] = user_email
        latest_doc['Last modified'] = datetime.datetime.now().isoformat()

        cc_db.save(latest_doc)
        msg = "Draft successfully saved at {}".format(datetime.datetime.now().strftime("%H:%M:%S"))
        return self.write({'message': msg})

class PricingDataHandler(PricingBaseHandler):
    """Loaded through /api/v1/cost_calculator """

    def _get_latest_doc(self, db):
        curr_rows = db.view('entire_document/published_by_version', descending=True, limit=1).rows
        curr_doc = curr_rows[0].value
        return curr_doc

    def _get_doc_version(self, version, db):
        rows = db.view('entire_document/published_by_version', descending=True, key=version, limit=1).rows
        doc = rows[0].value
        return doc

    def get(self):
        """ Should return the specified version of the cost calculator."""
        version = self.get_argument('version', None)
        cc_db = self.application.cost_calculator_db

        if version is None:
            doc = self._get_latest_doc(cc_db)
        else:
            doc = self._get_doc_version(version, cc_db)

        response = dict()
        response['cost_calculator'] = doc

        current_user_email = self._current_user_email()
        response['current_user_email'] = current_user_email

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(response))


class PricingPublishDataHandler(PricingBaseHandler):
    """ Accessed through
      /api/v1/pricing_publish_draft
    """

    def _get_latest_doc(self, db):
        curr_rows = db.view('entire_document/by_version', descending=True, limit=1).rows
        curr_doc = curr_rows[0].value
        return curr_doc

    def post(self):
        """ Publish a new cost calculator, from the current draft. """

        cc_db = self.application.cost_calculator_db

        latest_doc = self._get_latest_doc(cc_db)
        draft = latest_doc['Draft']

        if not draft:
            self.set_status(400)
            return self.write("Error: No draft exists. Nothing to be published")

        # Create a new draft
        doc = latest_doc.copy()

        user_name = self.get_current_user().name
        user_email = self._current_user_email()

        doc['Draft'] = False

        doc['Last modified by user'] = user_name
        doc['Last modified by user email'] = user_email
        doc['Last modified'] = datetime.datetime.now().isoformat()

        # Should be set at the time of publication
        doc['Issued by user'] = user_name
        doc['Issued by user email'] = user_email
        doc['Issued at'] = datetime.datetime.now().isoformat()

        print("Warning: draft being published without validation!")
        cc_db.save(doc)
        self.write({'message': 'New cost calculator published'})

class PricingUpdateHandler(PricingBaseHandler):
    """ Serves a form where the draft cost calculator can be updated.

    If there is a current draft (version nr higher than the last published) this will be
    served as the basis. Otherwise a new draft will be created.
    Also makes sure that the draft is not locked by another user, otherwise redirect to preview page.

    Loaded through:
        /pricing_update

    """
    def _get_latest_doc(self, db):
        curr_rows = db.view('entire_document/by_version', descending=True, limit=1).rows
        curr_doc = curr_rows[0].value
        return curr_doc

    def get(self):
        """ Serves the page where draft cost calculators can be updated.

            Will check that:
                - the most recent one is a draft
                - draft is not locked by other user
            otherwise return 400.
        """

        cc_db = self.application.cost_calculator_db

        latest_doc = self._get_latest_doc(cc_db)
        draft = latest_doc['Draft']
        if not draft:
            self.set_status(400)
            self.write("Error: Attempting to update a non-draft cost calculator.")

        current_user_email = self._current_user_email()

        lock_info = latest_doc['Lock Info']
        if lock_info['Locked']:
            if lock_info['Locked by'] != current_user_email:
                self.set_status(400)
                self.write("Error: Attempting to update a draft locked by someone else.")

        t = self.application.loader.load('pricing_update.html')
        self.write(t.generate(gs_globals=self.application.gs_globals,
                              user=self.get_current_user()))


class PricingPreviewHandler(PricingBaseHandler):
    """ Serves a preview of the draft cost calculator.

    Loaded through:
        /pricing_preview

    """

    def get(self):
        t = self.application.loader.load('pricing_preview.html')
        self.write(t.generate(gs_globals=self.application.gs_globals,
                              user=self.get_current_user()))
