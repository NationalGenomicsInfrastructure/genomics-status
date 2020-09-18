#!/usr/bin/env python
from nose.tools import assert_equal, assert_true, assert_almost_equal
import json
import requests
import re
import os

import yaml

file_dir_path = os.path.dirname(__file__)
TEST_ITEMS = os.path.join(file_dir_path, "test_items.yaml")

class TestGet(object):
    def setUp(self):
        """Server Settings"""
        self.url = 'http://localhost:9761'
        self.api = requests.get(self.url + '/api/v1')
        #assert_true(self.api.ok)
        with open(TEST_ITEMS) as test_items:
            self.test_items = yaml.load(test_items, Loader=yaml.SafeLoader)

    def test_all_pages(self):
        pages = json.loads(self.api.content)['pages']

        # Check every url, that it gives a 200 OK response
        error_pages = list(filter(lambda u: not requests.get(self.url + u).ok, pages))

        assert_true(len(error_pages) == 0,
                    msg=('Pages resulted in error: {0} '.format(error_pages)))

    def test_api_without_regexp(self):
        pages = json.loads(self.api.content)['api']
        have_regexp = re.compile('.*\(.+\).*')

        # Filter out all url:s with regular expressions
        # (don't know how to handle them just yet)
        no_regexp_pages = filter(lambda x: have_regexp.match(x) is None,
                                 pages)

        ignore_pages = ['/api/v1/deliveries/set_bioinfo_responsible$',  # Never meant to be a api-get URL
                        '/api/v1/bioinfo_analysis',  # Never meant to be a api-get URL
                        '/api/v1/sequencing_queues' # lims-heavy request, refuses connection eventually
                        ]
        no_regexp_pages = [x for x in no_regexp_pages if x not in ignore_pages]

        # Check every url, that it gives a 200 OK response
        error_pages = list(filter(lambda u: not requests.get(self.url + u).ok,
                             no_regexp_pages))

        assert_true(len(error_pages) == 0,
                    msg=('Requests resulted in error: {0} '.format(error_pages)))


    def test_api_test(self):
        id = str(self.test_items['test'])
        r = requests.get(self.url + '/api/v1' + '/test/' + id)
        assert_true(r.ok)

    def test_api_samples(self):
        """ Testing:
        '/api/v1/samples/start/([^/]*)$'
        '/api/v1/samples/([^/]*)$',
        '/api/v1/sample_summary/([^/]*)$',
        '/api/v1/sample_run_counts/(\\w+)?',
        '/api/v1/sample_readcount/(\\w+)?',
        '/api/v1/sample_insert_sizes/([^/]*)$',
        '/api/v1/sample_info/([^/]*)$',
        '/api/v1/sample_coverage/([^/]*)$',
        '/api/v1/sample_alignment/([^/]*)$',
        '/api/v1/qc/([^/]*)$'
        """
        sample_id1 = self.test_items['samples']['sample_id1']
        sample_id2 = self.test_items['samples']['sample_id2']
        sample_run_id = self.test_items['samples']['sample_run_id']

        url = self.url + '/api/v1/'
        urls = [url + 'samples/start/' + sample_id1,
                url + 'samples/start/' + sample_id2,
                url + 'samples/' + sample_id1,
                url + 'samples/' + sample_id2,
                url + 'sample_summary/' + sample_run_id,
                url + 'sample_run_counts/' + sample_id1,
                url + 'sample_run_counts/' + sample_id2,
                url + 'sample_readcount/' + sample_id1,
                url + 'sample_readcount/' + sample_id2,
                url + 'sample_insert_sizes/' + sample_run_id,
                url + 'sample_info/' + sample_id1,
                url + 'sample_info/' + sample_id2,
                url + 'sample_coverage/' + sample_run_id,
                url + 'sample_alignment/' + sample_run_id,
                url + 'qc/' + sample_run_id]

        error_pages = list(filter(lambda u: not requests.get(u).ok, urls))
        assert_true(len(error_pages) == 0,
                    msg=('Sample requests resulted in error {0} '.format(error_pages)))

    def test_api_quotas(self):
        """ Testing:

        '/api/v1/quotas/(\\w+)?'

        """

        quota_id = self.test_items['quota']['quota_id']
        url = self.url + '/api/v1/'
        urls = [url + 'quotas/' + quota_id]

        error_pages = filter(lambda u: not requests.get(u).ok, urls)
        assert_true(len(error_pages) == 0,
                    msg=('Quota requests resulted in error {0} '.format(error_pages)))


    def test_api_flowcells(self):
        """" Testing:
        '/api/v1/flowcells/([^/]*)$'
        '/api/v1/flowcell_qc/([^/]*)$',
        '/api/v1/flowcell_q30/([^/]*)$',
        '/api/v1/flowcell_info/([^/]*)$',
        '/api/v1/flowcell_demultiplex/([^/]*)$',
        """
        flowcell_id = self.test_items['flowcells']['flowcell_id']
        url = self.url + '/api/v1/'
        urls = [url + 'flowcells/' + flowcell_id,
                url + 'flowcell_qc/' + flowcell_id,
                url + 'flowcell_q30/' + flowcell_id,
                url + 'flowcell_info/' + flowcell_id,
                url + 'flowcell_demultiplex/' + flowcell_id]

        error_pages = filter(lambda u: not requests.get(u).ok, urls)
        assert_true(len(error_pages) == 0,
                    msg=('Flowcell requests resulted in error {0} '.format(error_pages)))

        non_error_url = filter(lambda u: u not in error_pages,  urls)
        empty_json = filter(lambda u: len(json.loads(requests.get(u).content)) == 0, non_error_url)
        assert_true(len(empty_json) == 0,
                    msg=('Flowcell requests are empty: {0} '.format(empty_json)))



    def test_api_misc(self):
        """ Testing:
        '/api/v1/project_summary/([^/]*)$'
        '/api/v1/application/([^/]*)$',
        """
        project_id = self.test_items['projects']['project_id']
        application = self.test_items['application']['application']

        url = self.url + '/api/v1/'
        urls = [url + 'project_summary/' + project_id,
                url + 'application/' + application]

        error_pages = filter(lambda u: not requests.get(u).ok, urls)
        assert_true(len(error_pages) == 0,
                    msg=('Misc requests resulted in error {0} '.format(error_pages)))

        non_error_url = filter(lambda u: u not in error_pages,  urls)
        empty_json = filter(lambda u: len(json.loads(requests.get(u).content)) == 0, non_error_url)
        assert_true(len(empty_json) == 0,
                    msg=('Misc requests are empty: {0} '.format(empty_json)))
