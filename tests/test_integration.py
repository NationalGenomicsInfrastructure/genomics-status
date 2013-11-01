#!/usr/bin/env python
from nose.tools import assert_equal, assert_true, assert_almost_equal
import json
import requests
import re
import os

import yaml

file_dir_path = os.path.dirname(__file__)
TEST_ITEMS = os.path.join(file_dir_path,"test_items.yaml")

class TestGet(object):
    def setUp(self):
        """Server Settings"""
        self.url = 'http://localhost:9761'
        self.api = requests.get(self.url + '/api/v1')
        assert_true(self.api.ok)
        with open(TEST_ITEMS) as test_items:
            self.test_items = yaml.load(test_items)

    def test_all_pages(self):
        pages = json.loads(self.api.content)['pages']

        # Check every url, that it gives a 200 OK response
        error_pages = filter(lambda u: not requests.get(self.url + u).ok, pages)

        assert_true(len(error_pages) == 0,
                    msg=('Pages resulted in error: {0} '.format(error_pages)))

    def test_api_without_regexp(self):
        pages = json.loads(self.api.content)['api']
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

    
    def test_api_test(self):
        id = str(self.test_items['test'])
        r = requests.get(self.url + '/api/v1' + '/test/' + id)
        assert_true(r.ok)

    def test_api_samples(self):
        """ Matches:
        '/api/v1/samples/start/([^/]*)$'
        '/api/v1/samples/([^/]*)$',
        '/api/v1/sample_summary/([^/]*)$',
        '/api/v1/sample_run_counts/(\\w+)?',
        '/api/v1/sample_readcount/(\\w+)?',
        '/api/v1/sample_insert_sizes/([^/]*)$',
        '/api/v1/sample_info/([^/]*)$',
        '/api/v1/sample_coverage/([^/]*)$',
        '/api/v1/sample_alignment/([^/]*)$',
        """
        samples_start_id = self.test_items['samples']['start_id'] 
        
        r = requests.get(self.url + '/api/v1' + '/samples/' + 'start/' + samples_start_id)
        assert_true(r.ok)
        
