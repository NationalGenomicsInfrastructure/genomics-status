import json

import tornado.web
from status.util import SafeHandler


class PricingComponentsHandler(SafeHandler):
    """ Serves data of pricing components

    Loaded through:
        /api/v1/pricing_components
        /api/v1/pricing_components/([^/]*)$

    where the optional search string is a ref_id of a component.
    Use the optional parameter `version` to specify an exact version
    from the database. If ommitted, the latest (highest number) version
    will be used.
    """

    def get(self, search_string=None):
        """Returns individual or all components from the database as json"""

        version = self.get_argument('version', None)
        if version is not None:
            try:
                version = int(version)
            except ValueError:
                raise tornado.web.HTTPError(
                    400, reason='Bad request, version is not an integer')

        if search_string is not None:
            try:
                int_key = int(search_string)
            except ValueError:
                raise tornado.web.HTTPError(
                    400, reason='Bad request, component id is not an integer')

            if version is not None:
                view = self.application.pricing_components_db.view(
                            "individual_components/by_id_and_version",
                            key=[int_key, version],
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

        # Without search string
        else:
            if version is not None:
                view = self.application.pricing_components_db.view(
                            "entire_document/by_version",
                            key=version,
                            limit=1,
                            descending=True
                            )
            else:
                view = self.application.pricing_components_db.view(
                            "entire_document/by_version",
                            limit=1,
                            descending=True
                            )

        if len(view.rows) == 0:
            raise tornado.web.HTTPError(
                404, reason='No such component(s) was found'
            )
        self.write(json.dumps(view.rows[0]))


class PricingProductsHandler(SafeHandler):
    """ Serves data of pricing products

    Loaded through:
        /api/v1/pricing_products
        /api/v1/pricing_products/([^/]*)$

    where the optional search string is an id of a product.
    Use the optional parameter `version` to specify an exact version
    from the database. If ommitted, the latest (highest number) version
    will be used.
    """

    def get(self, search_string=None):
        """Returns individual or all products from the database as json"""

        version = self.get_argument('version', None)
        if version is not None:
            try:
                version = int(version)
            except ValueError:
                raise tornado.web.HTTPError(
                    400, reason='Bad request, version is not an integer')

        if search_string is not None:
            try:
                int_key = int(search_string)
            except ValueError:
                raise tornado.web.HTTPError(
                    400, reason='Bad request, product id is not an integer')

            if version is not None:
                view = self.application.pricing_products_db.view(
                            "individual_products/by_id_and_version",
                            key=[int_key, version],
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

        # Without search string
        else:
            if version is not None:
                view = self.application.pricing_products_db.view(
                            "entire_document/by_version",
                            key=version,
                            limit=1,
                            descending=True
                            )
            else:
                view = self.application.pricing_products_db.view(
                            "entire_document/by_version",
                            limit=1,
                            descending=True
                            )

        if len(view.rows) == 0:
            raise tornado.web.HTTPError(
                404, reason='No such product(s) was found'
            )
        self.write(json.dumps(view.rows[0]))
