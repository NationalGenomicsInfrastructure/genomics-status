import json
import time
import unittest

import requests
from selenium import webdriver
from selenium.common.exceptions import (
    ElementClickInterceptedException,
    ElementNotInteractableException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class TestPricingQuote(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.get("http://localhost:9761/pricing_quote")
        self.driver.set_window_size(1400, 1080)
        self.wait = WebDriverWait(self.driver, 10)
        time.sleep(1)

    def tearDown(self):
        self.driver.quit()

    def _wait_and_click(self, by_statement, selector, scrollLocation=None):
        element = (by_statement, selector)
        self.wait.until(EC.element_to_be_clickable(element))
        try:
            self.driver.find_element(*element).click()
        except (ElementNotInteractableException, ElementClickInterceptedException):
            if scrollLocation:
                self.driver.execute_script(
                    "window.scrollTo({},{})".format(*scrollLocation)
                )
            time.sleep(2.5)  # Backup solution/hack
            self.driver.find_element(*element).click()

    def _change_date(self, date):
        self.driver.execute_script("window.scrollTo(0, 0)")
        self.driver.find_element(By.LINK_TEXT, "(Change)").click()
        time.sleep(0.5)

        self.driver.find_element(By.ID, "datepicker").click()
        self.driver.find_element(By.ID, "datepicker").clear()

        for date_part in date.split("-"):
            self.driver.find_element(By.ID, "datepicker").send_keys(date_part)
            self.driver.find_element(By.ID, "datepicker").send_keys(Keys.RIGHT)

        self.driver.find_element(By.CSS_SELECTOR, ".modal-body > p").click()
        self.driver.find_element(By.ID, "datepicker-btn").click()
        time.sleep(1.5)

    def test_addproduct(self):
        """Adding and removing product items to the quote, checking the counts in the input box."""
        self.driver.find_element(
            By.CSS_SELECTOR, ".status_available:nth-child(2) .add-to-quote i"
        ).click()
        self.driver.execute_script("window.scrollBy(0, 600)")
        self._wait_and_click(
            By.CSS_SELECTOR, ".status_available:nth-child(5) .add-to-quote i"
        )

        # Fetch the ref_id of the product added
        e = self.driver.find_element(
            By.CSS_SELECTOR, ".status_available:nth-child(5) .add-to-quote"
        )
        id = e.get_attribute("data-product-id")

        e = self.driver.find_element(
            By.CSS_SELECTOR,
            f".quote-product-list input[data-product-id='{id}']",
        )
        self.assertEqual(
            e.get_attribute("value"), "1", msg="One item of this product is added"
        )

        elements = self.driver.find_elements(
            By.CSS_SELECTOR, ".quote-product-list li > .quote_product_name"
        )
        self.assertEqual(len(elements), 2, msg="Two products added to the quote")

        e = self.driver.find_element(
            By.CSS_SELECTOR,
            f".quote-product-list input[data-product-id='{id}']",
        )
        self.assertEqual(
            e.get_attribute("value"), "1", msg="Two items of this product are added"
        )

        self.driver.execute_script("window.scrollBy(0, 600)")
        self.driver.find_element(
            By.CSS_SELECTOR, ".status_available:nth-child(5) i"
        ).click()
        elements = self.driver.find_elements(
            By.CSS_SELECTOR, ".quote-product-list li > .quote_product_name"
        )
        self.assertEqual(len(elements), 2, msg="Two products (2+1) added to the quote")

        self._wait_and_click(
            By.CSS_SELECTOR,
            ".quote-product-list li:nth-child(2) i",
            scrollLocation=(0, 0),
        )
        elements = self.driver.find_elements(
            By.CSS_SELECTOR, ".quote-product-list li > .quote_product_name"
        )
        self.assertEqual(
            len(elements),
            1,
            msg="Removing one product should leave just one in the quote",
        )

        self.driver.find_element(
            By.CSS_SELECTOR, ".quote-product-list li:nth-child(1) i"
        ).click()
        elements = self.driver.find_elements(
            By.CSS_SELECTOR, ".quote-product-list li > .quote_product_name"
        )
        self.assertEqual(
            len(elements),
            0,
            msg="Removing the last product should leave no product in the quote",
        )

    def test_exchangerates(self):
        """Switching between two known exchange rate dates from _statusdb_dev_"""
        self._change_date("2020-09-15")

        usd_rate = self.driver.find_element_by_id("exch_rate_usd").text
        self.assertEqual(usd_rate, "8.75", msg="Matching the known rate")

        # Add bunch of products
        for i in range(6):
            self.driver.execute_script("window.scrollTo(0, 400)")
            time.sleep(1.0)
            self.driver.find_element(
                By.CSS_SELECTOR,
                f".status_available:nth-child({i + 1}) td:nth-child(1) > a > i",
            ).click()
        time.sleep(1.0)

        current_price = self.driver.find_elements(
            By.CSS_SELECTOR, ".quote_totals .quote_totals_val.quote_sweac"
        )[0].text
        current_price_int = round(
            float(current_price.split(" ")[0])
        )  # Get number from e.g. '8421 SEK'

        self.driver.execute_script("window.scrollTo(0, 0)")
        time.sleep(1)
        self._change_date("2020-07-01")

        usd_rate = self.driver.find_element_by_id("exch_rate_usd").text
        self.assertEqual(usd_rate, "9.63", msg="Matching the known rate")

        new_price = self.driver.find_elements(
            By.CSS_SELECTOR, ".quote_totals .quote_totals_val.quote_sweac"
        )[0].text
        new_price_int = round(
            float(new_price.split(" ")[0])
        )  # Get number from e.g. '8421 SEK'

        self.assertGreater(
            new_price_int,
            current_price_int,
            msg="Weaker SEK should lead to higher price",
        )

    def test_discontinued_products(self):
        """Discontinued products should not be shown only by opt-in"""

        products = self.driver.find_elements(
            By.CSS_SELECTOR, "#pricing_products_tbody tr"
        )
        self._change_date("2020-07-01")
        products_new_date = self.driver.find_elements(
            By.CSS_SELECTOR, "#pricing_products_tbody tr"
        )
        self.assertEqual(
            len(products),
            len(products_new_date),
            msg="Changing date should not change discontinued",
        )
        usd_rate = self.driver.find_element_by_id("exch_rate_usd").text

        # Enable discontinued products
        self.driver.find_element(By.ID, "more_options_btn").click()
        time.sleep(0.5)
        self.driver.find_element(By.ID, "toggle_discontinued").click()
        time.sleep(1.5)
        all_products = self.driver.find_elements(
            By.CSS_SELECTOR, "#pricing_products_tbody tr"
        )
        self.assertGreater(
            len(all_products),
            len(products),
            msg="Available products should be fewer than all products",
        )

        new_usd_rate = self.driver.find_element_by_id("exch_rate_usd").text
        self.assertEqual(
            usd_rate,
            new_usd_rate,
            msg="Showing discontinued products should not change the exchange rate",
        )

        self._change_date("2020-09-28")
        products_new_date = self.driver.find_elements(
            By.CSS_SELECTOR, "#pricing_products_tbody tr"
        )
        self.assertEqual(
            len(all_products),
            len(products_new_date),
            msg="Changing date should not change discontinued",
        )

        discontinued_product = self.driver.find_elements(
            By.CSS_SELECTOR, "#pricing_products_tbody tr.status_discontinued"
        )[0]
        self.driver.execute_script("window.scrollTo(0, 500)")
        time.sleep(1)
        discontinued_product.find_elements(By.CSS_SELECTOR, "td a.add-to-quote")[
            0
        ].click()
        time.sleep(1)
        quote_elements = self.driver.find_elements(
            By.CSS_SELECTOR, ".quote-product-list li > .quote_product_name"
        )

        self.assertEqual(
            len(quote_elements),
            1,
            msg="Discontinued product should be added to the quote.",
        )


class TestApi(unittest.TestCase):
    def test_discontinued_products(self):
        base_url = "http://localhost:9761/api/v1/pricing_products"

        response = json.loads(requests.get(base_url).content)
        discontinued_products = [
            product
            for ref_id, product in response.items()
            if product["Status"] != "Available"
        ]
        self.assertEqual(
            len(discontinued_products), 0, msg="No discontinued products by default"
        )

        url = base_url + "?discontinued=true"
        response = json.loads(requests.get(url).content)
        discontinued_products = [
            product
            for ref_id, product in response.items()
            if product["Status"] != "Available"
        ]
        self.assertGreater(
            len(discontinued_products), 0, msg="Discontinued products should be added"
        )
