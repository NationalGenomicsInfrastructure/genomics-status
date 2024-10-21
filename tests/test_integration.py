#!/usr/bin/env python
import json
import os
import re

import requests
import yaml
from nose.tools import assert_true

file_dir_path = os.path.dirname(__file__)
TEST_ITEMS = os.path.join(file_dir_path, "test_items.yaml")


class TestGet:
    def setUp(self):
        """Server Settings"""
        self.url = "http://localhost:9761"
        self.api = requests.get(self.url + "/api/v1")
        assert_true(self.api.ok)
        with open(TEST_ITEMS) as test_items:
            self.test_items = yaml.load(test_items, Loader=yaml.SafeLoader)

    def test_all_pages(self):
        pages = json.loads(self.api.content)["pages"]

        # Check every url, that it gives a 200 OK response
        error_pages = list(filter(lambda u: not requests.get(self.url + u).ok, pages))

        assert_true(
            len(error_pages) == 0,
            msg=(f"Pages resulted in error: {error_pages} "),
        )

    def test_api_without_regexp(self):
        pages = json.loads(self.api.content)["api"]
        have_regexp = re.compile(".*\(.+\).*")

        # Filter out all url:s with regular expressions
        # (don't know how to handle them just yet)
        no_regexp_pages = filter(lambda x: have_regexp.match(x) is None, pages)

        ignore_pages = [
            "/api/v1/deliveries/set_bioinfo_responsible$",  # Never meant to be a api-get URL
            "/api/v1/bioinfo_analysis",  # Never meant to be a api-get URL
            "/api/v1/sequencing_queues",  # lims-heavy request, refuses connection eventually
        ]
        no_regexp_pages = [x for x in no_regexp_pages if x not in ignore_pages]

        # Check every url, that it gives a 200 OK response
        error_pages = list(
            filter(lambda u: not requests.get(self.url + u).ok, no_regexp_pages)
        )

        assert_true(
            len(error_pages) == 0,
            msg=(f"Requests resulted in error: {error_pages} "),
        )

    def test_api_test(self):
        id = str(self.test_items["test"])
        r = requests.get(self.url + "/api/v1" + "/test/" + id)
        assert_true(r.ok)

    def test_api_misc(self):
        """Testing:
        '/api/v1/project_summary/([^/]*)$'
        '/api/v1/application/([^/]*)$',
        """
        project_id = self.test_items["projects"]["project_id"]
        application = self.test_items["application"]["application"]

        url = self.url + "/api/v1/"
        urls = [
            url + "project_summary/" + project_id,
            url + "application/" + application,
        ]

        error_pages = list(filter(lambda u: not requests.get(u).ok, urls))
        assert_true(
            len(error_pages) == 0,
            msg=(f"Misc requests resulted in error {error_pages} "),
        )

        non_error_url = filter(lambda u: u not in error_pages, urls)
        empty_json = list(
            filter(
                lambda u: len(json.loads(requests.get(u).content)) == 0, non_error_url
            )
        )
        assert_true(
            len(empty_json) == 0,
            msg=(f"Misc requests are empty: {empty_json} "),
        )
