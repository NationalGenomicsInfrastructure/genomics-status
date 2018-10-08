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
                    reason="Bad request, {} id is not "
                           "an integer".format(object_type)
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
                    reason="No such {}(s) was found".format(object_type)
                )
        if len(view.rows) > 1:
            raise tornado.web.HTTPError(
                    500,
                    reason="Internal Server Error: Multiple {} rows returned. "
                           "Expected only 1.".format(object_type)
                )

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
            int_key = self._validate_object_id(component_id, "component")

        if version is not None:  # Specified version
            int_version = self._validate_version_param(version)

            if component_id is None:  # All components
                view = self.application.pricing_components_db.view(
                            "entire_document/by_version",
                            key=int_version,
                            limit=1,
                            descending=True
                            )
            else:
                view = self.application.pricing_components_db.view(
                            "individual_components/by_id_and_version",
                            key=[int_key, int_version],
                            limit=1
                            )

        else:  # No specified version
            if component_id is None:  # All components
                view = self.application.pricing_components_db.view(
                            "entire_document/by_version",
                            limit=1,
                            descending=True
                            )
            else:
                view = self.application.pricing_components_db.view(
                            "individual_components/by_id_and_version",
                            startkey=[int_key, {}],
                            endkey=[int_key],
                            limit=1,
                            descending=True
                            )

        self._validate_single_row_result(view, "component")

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
            int_key = self._validate_object_id(product_id, "product")

        if version is not None:  # Specified version
            int_version = self._validate_version_param(version)

            if product_id is None:  # All products
                view = self.application.pricing_products_db.view(
                        "entire_document/by_version",
                        key=int_version,
                        limit=1,
                        descending=True
                    )
            else:  # Individual product
                view = self.application.pricing_products_db.view(
                        "individual_products/by_id_and_version",
                        key=[int_key, int_version],
                        limit=1,
                        descending=True
                    )
        else:  # No specified version
            if product_id is None:  # All products
                view = self.application.pricing_products_db.view(
                        "entire_document/by_version",
                        limit=1,
                        descending=True
                    )
            else:
                view = self.application.pricing_products_db.view(
                        "individual_products/by_id_and_version",
                        startkey=[int_key, {}],
                        endkey=[int_key],
                        limit=1,
                        descending=True
                    )
        self._validate_single_row_result(view, "product")

        if product_id is None:  # All products
            return view.rows[0].value['products']
        else:
            return {product_id: view.rows[0].value}

    def fetch_exchange_rates(self, date=None):
        """Internal method to fetch exchange rates from StatusDB

        :param date: string in format 'YYYY-MM-DD'
        :return: dictionary with keys 'USD_in_SEK' and 'EUR_in_SEK'.

        Returns the most recent rates prior to date given by parameter `date`
        If parameter `date` is not supplied, the current timestamp is used.
        """

        if date is not None:
            dt = self._validate_date_string(date)
        else:
            dt = datetime.datetime.now()

        str_format_date = dt.strftime("%Y-%m-%d")
        view = self.application.pricing_exchange_rates_db.view(
                'entire_document/by_date',
                startkey=str_format_date,
                descending=True,
                limit=1
            )

        result = {}
        result['USD_in_SEK'] = view.rows[0].value['USD_in_SEK']
        result['EUR_in_SEK'] = view.rows[0].value['EUR_in_SEK']
        return result

    # _____________________________ CALCULATION METHODS _______________________
    def _calculate_component_price(self, component, exch_rates):
        currency = component['Currency']
        if currency == 'SEK':
            sek_list_price = component['List price']
        else:
            currency_key = "{}_in_SEK".format(currency)
            sek_list_price = exch_rates[currency_key] * component['List price']

        sek_price = sek_list_price - sek_list_price * component['Discount']

        sek_price_per_unit = sek_price/float(component['Units'])

        return sek_price, sek_price_per_unit

    def _calculate_product_price(self, product, all_component_prices):
        price = 0
        # Fixed price trumps all component and reagent prices
        if 'fixed_price' in product:
            price = product['fixed_price']['price_in_sek']
            external_price = product['fixed_price']['external_price_in_sek']
            return price, external_price

        for component_id, info in product['Components'].items():
            component_price_d = all_component_prices[str(component_id)]
            quantity = int(info['quantity'])
            price += quantity * component_price_d['price_per_unit_in_sek']

        # Reagents are added to a special field, but are components as well.
        reagent = product['Reagent fee']
        if reagent:
            component_price_d = all_component_prices[str(reagent)]
            price += component_price_d['price_per_unit_in_sek']

        external_price = price + price * product['Re-run fee']
        return price, external_price

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

        for component_id, component in all_components.iteritems():

            price, price_per_unit = self._calculate_component_price(component,
                                                                    exch_rates)
            if pretty_strings:
                price = "{:.2f}".format(price)
                price_per_unit = "{:.2f}".format(price_per_unit)

            return_d[component_id]['price_in_sek'] = price
            return_d[component_id]['price_per_unit_in_sek'] = price_per_unit

        return return_d

    def get_product_prices(self, product_id, version=None, date=None,
                           pretty_strings=False):
        """Calculate the price for an individual or all products

        :param product_id: The id of the product to calculate price for.
                        If None, all product prices will be calculated.
        :param version: The version of product and components to use.
                        When not specified, the latest version will be used.
        :param date: The date for which the exchange rate will be fetched.
                        When not specified, the latest exchange rates will be
                        used.
        :param pretty_strings: Output prices as formatted strings instead
                        of float numbers.

        """

        exch_rates = self.fetch_exchange_rates(date)
        all_component_prices = self.get_component_prices(version=version, date=date)
        products = self.fetch_products(product_id, version)

        return_d = products.copy()

        for product_id, product in products.iteritems():
            price_int, price_ext = self._calculate_product_price(product, all_component_prices)

            if pretty_strings:
                price_int = "{:.2f}".format(price_int)
                price_ext = "{:.2f}".format(price_ext)

            return_d[product_id]['price_internal'] = price_int
            return_d[product_id]['price_external'] = price_ext

        return return_d


class PricingComponentsDataHandler(PricingBaseHandler):
    """ Serves price data of pricing components

    Loaded through:
        /api/v1/pricing_components
        /api/v1/pricing_components/([^/]*)$

    where the optional search string is a ref_id of a component.
    Use the optional parameter `version` to specify an exact version
    from the database. If omitted, the latest (highest number) version
    will be used.
    Use the optional parameter `date` to specify an exact date for which the
    exchange rate will be fetched. When not specified, the latest exchange
    rates will be used.
    Any information available for the component(s) will be returned.
    """

    def get(self, search_string=None):
        """Returns individual or all components from the database as json"""
        version = self.get_argument('version', None)
        date = self.get_argument('date', None)

        row = self.get_component_prices(component_id=search_string,
                                        version=version,
                                        date=date,
                                        pretty_strings=True)

        self.write(json.dumps(row))


class PricingProductsDataHandler(PricingBaseHandler):
    """ Serves data of pricing products

    Loaded through:
        /api/v1/pricing_products
        /api/v1/pricing_products/([^/]*)$

    where the optional search string is an id of a product.
    Use the optional parameter `version` to specify an exact version
    from the database. If omitted, the latest (highest number) version
    will be used.
    Any information available for the product(s) will be returned.
    """

    def get(self, search_string=None):
        """Returns individual or all products from the database as json"""

        version = self.get_argument('version', None)

        rows = self.get_product_prices(search_string, version=version,
                                       pretty_strings=True)

        self.write(json.dumps(rows))


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
                        "version_info/by_date",
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
