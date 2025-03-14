import logging

import ibm_cloud_sdk_core

from status.util import SafeHandler


class ConfigDataHandler(SafeHandler):
    def get(self, config_id):
        log = logging.getLogger(__name__)

        try:
            config_doc = self.application.cloudant.get_document(
                'gs_configs',
                config_id
            ).get_result()
        except ibm_cloud_sdk_core.api_exception.ApiException as e:
            log.exception(f"Failed to get config document {config_id} due to {e}")
            self.set_status(500)
            return

        self.write(config_doc)