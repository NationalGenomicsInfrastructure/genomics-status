import json
import datetime

import tornado.web
from status.util import SafeHandler

class PricingBaseHandler(SafeHandler):
    def fetch_exchange_rates(self, date=None):
        """Internal method to fetch exchange rates from StatusDB

        Returns the most recent rates prior to date given by parameter `date`
        If parameter `date` is not supplied, the current timestamp is used.

        returns: dictionary with keys 'USD_in_SEK' and 'EUR_in_SEK'.
        """
        if not date:
            date = datetime.datetime.now()

        str_format_date = date.strftime("%Y-%m-%d")
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

    def fetch_individual_component(self, component_id, version=None):
        """Fetch individual pricing component from StatusDB.

        :param component_id: integer id of component to fetch
        :param version: optional integer specifying version to fetch
        :return: The row fetched from the database
        """

        int_key = self._validate_object_id(component_id, "component")

        if version is not None:
            int_version = self._validate_version_param(version)

            view = self.application.pricing_components_db.view(
                        "individual_components/by_id_and_version",
                        key=[int_key, int_version],
                        limit=1
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

        return view.rows[0]

    def fetch_all_components(self, version=None):
        """Fetch all pricing component from StatusDB.

        :param version: optional integer specifying version to fetch
        :return: The row fetched from the database
        """
        if version is not None:
            int_version = self._validate_version_param(version)

            view = self.application.pricing_components_db.view(
                        "entire_document/by_version",
                        key=int_version,
                        limit=1,
                        descending=True
                        )
        else:
            view = self.application.pricing_components_db.view(
                        "entire_document/by_version",
                        limit=1,
                        descending=True
                        )

        self._validate_single_row_result(view, "component")

        return view.rows[0]

    def fetch_individual_product(self, product_id, version=None):
        """Fetch individual pricing products from StatusDB.

        :param product_id: integer id of product to fetch
        :param version: optional integer specifying version to fetch
        :return: The row fetched from the database
        """
        int_key = self._validate_object_id(product_id, "product")

        if version is not None:
            int_version = self._validate_version_param(version)

            view = self.application.pricing_products_db.view(
                        "individual_products/by_id_and_version",
                        key=[int_key, int_version],
                        limit=1
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

        return view.rows[0]

    def fetch_all_products(self, version=None):
        """Fetch all pricing product from StatusDB.

        :param version: optional integer specifying version to fetch
        :return: The row fetched from the database
        """
        if version is not None:
            int_version = self._validate_version_param(version)
            view = self.application.pricing_products_db.view(
                        "entire_document/by_version",
                        key=int_version,
                        limit=1,
                        descending=True
                    )
        else:
            view = self.application.pricing_products_db.view(
                        "entire_document/by_version",
                        limit=1,
                        descending=True
                    )

        self._validate_single_row_result(view, "product")

        return view.rows[0]


class PricingComponentsHandler(PricingBaseHandler):
    """ Serves data of pricing components

    Loaded through:
        /api/v1/pricing_components
        /api/v1/pricing_components/([^/]*)$

    where the optional search string is a ref_id of a component.
    Use the optional parameter `version` to specify an exact version
    from the database. If omitted, the latest (highest number) version
    will be used.
    """

    def get(self, search_string=None):
        """Returns individual or all components from the database as json"""

        version = self.get_argument('version', None)

        if search_string is not None:
            row = self.fetch_individual_component(search_string, version)
        else:
            row = self.fetch_all_components(version)

        self.write(json.dumps(row))


class PricingProductsHandler(PricingBaseHandler):
    """ Serves data of pricing products

    Loaded through:
        /api/v1/pricing_products
        /api/v1/pricing_products/([^/]*)$

    where the optional search string is an id of a product.
    Use the optional parameter `version` to specify an exact version
    from the database. If omitted, the latest (highest number) version
    will be used.
    """

    def get(self, search_string=None):
        """Returns individual or all products from the database as json"""

        version = self.get_argument('version', None)

        if search_string is not None:
            row = self.fetch_individual_product(search_string, version)
        else:
            row = self.fetch_all_products(version)

        self.write(json.dumps(row))


class PricingDateToVersionHandler(PricingBaseHandler):
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


class PricingExchangeRatesHandler(PricingBaseHandler):
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
            year, month, day = date.split('-')

            try:
                dt = datetime.datetime(int(year), int(month), int(day))
            except ValueError:
                raise tornado.web.HTTPError(
                    400,
                    reason='Bad request, date format is not valid (YYYY-MM-DD)'
                    )
            result = self.fetch_exchange_rates(dt)
        else:
            result = self.fetch_exchange_rates(None)

        self.write(json.dumps(result))
