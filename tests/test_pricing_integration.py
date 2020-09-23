import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By


class TestAddproduct(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.get("http://localhost:9761/pricing_quote")
        time.sleep(1)

    def tearDown(self):
        self.driver.quit()

    def test_addproduct(self):
        self.driver.set_window_size(1920, 1080)
        self.driver.find_element(By.CSS_SELECTOR, ".status_available:nth-child(2) .add-to-quote .glyphicon").click()
        self.driver.find_element(By.CSS_SELECTOR, ".status_available:nth-child(5) .add-to-quote .glyphicon").click()

        # Fetch the ref_id of the product added
        e = self.driver.find_element(By.CSS_SELECTOR, ".status_available:nth-child(5) .add-to-quote")
        id = e.get_attribute('data-product-id')

        e = self.driver.find_element(By.CSS_SELECTOR, ".quote-product-list input[data-product-id='{}']".format(id))
        self.assertEqual(e.get_attribute('value'), '1', msg="One item of this product is added")

        elements = self.driver.find_elements(By.CSS_SELECTOR, ".quote-product-list li > .quote_product_name")
        self.assertEqual(len(elements), 2, msg="Two products added to the quote")

        e = self.driver.find_element(By.CSS_SELECTOR, ".quote-product-list input[data-product-id='{}']".format(id))
        self.assertEqual(e.get_attribute('value'), '1', msg="Two items of this product are added")

        self.driver.find_element(By.CSS_SELECTOR, ".status_available:nth-child(5) .glyphicon").click()
        elements = self.driver.find_elements(By.CSS_SELECTOR, ".quote-product-list li > .quote_product_name")
        self.assertEqual(len(elements), 2, msg="Two products (2+1) added to the quote")

        self.driver.find_element(By.CSS_SELECTOR, ".quote-product-list li:nth-child(2) .glyphicon").click()
        elements = self.driver.find_elements(By.CSS_SELECTOR, ".quote-product-list li > .quote_product_name")
        self.assertEqual(len(elements), 1, msg="Removing one product should leave just one in the quote")

        self.driver.find_element(By.CSS_SELECTOR, ".quote-product-list li:nth-child(1) .glyphicon").click()
        elements = self.driver.find_elements(By.CSS_SELECTOR, ".quote-product-list li > .quote_product_name")
        self.assertEqual(len(elements), 0, msg="Removing the last product should leave no product in the quote")
