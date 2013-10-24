#!/usr/bin/env python
from nose.tools import assert_equal, assert_true, assert_almost_equal
import json
import requests
import re

class TestGet(object):
    def setUp(self):
        """Server Settings"""
        self.url = 'http://localhost:9761'

    def test_all_pages(self):
        api = requests.get(self.url + '/api/v1')
        assert_true(api.ok)

        pages = json.loads(api.content)['pages']

        # Check every url, that it gives a 200 OK response
        error_pages = filter(lambda u: not requests.get(self.url + u).ok, pages)

        assert_true(len(error_pages) == 0,
                    msg=('Pages resulted in error: {0} '.format(error_pages)))

    def test_api_without_regexp(self):
        api = requests.get(self.url + '/api/v1')
        assert_true(api.ok)
        
        pages = json.loads(api.content)['api']
        have_regexp = re.compile('.*\(.+\).*')

        # Filter out all url:s with regular expressions 
        # (don't know how to handle them just yet)
        no_regexp_pages = filter(lambda x: have_regexp.match(x) is None, 
                                 pages)

        # Check every url, that it gives a 200 OK response
        error_pages = filter(lambda u: not requests.get(self.url + u).ok, 
                             no_regexp_pages)

        assert_true(len(error_pages) == 0,
                    msg=('Requests resulted in error: {0} '.format(error_pages)))
