import json

from status.util import SafeHandler


class LanesOrderedHandler(SafeHandler):
    """Serves a page with statistics over lanes ordered"""

    def get(self):
        t = self.application.loader.load("lanes_ordered.html")
        self.write(
            t.generate(
                gs_globals=self.application.gs_globals, user=self.get_current_user()
            )
        )


class LanesOrderedDataHandler(SafeHandler):
    """Delivers data for the Lanes Ordered statistics page"""

    def get(self):
        key1 = self.get_argument("key1", None)
        key2 = self.get_argument("key2", None)
        key3 = self.get_argument("key3", None)

        key_begin = [k for k in [key1, key2, key3] if k is not None]
        group_level = len(key_begin) + 1

        if key_begin:
            key_end = key_begin + ["ZZZ"]
            view = self.application.projects_db.view(
                "project/status_lanes_ordered", group_level=group_level, reduce=True
            )[key_begin:key_end]
        else:
            view = self.application.projects_db.view(
                "project/status_lanes_ordered", group_level=group_level, reduce=True
            )

        # Create a dictionary with the data
        data = {
            item["key"][group_level - 1]: {"value": "{:0.2f}".format(item["value"])}
            for item in view.rows
            if item["key"][group_level - 1] not in ["closed", "aborted"]
        }

        self.set_header("Content-type", "application/json")
        self.write(json.dumps(data))
