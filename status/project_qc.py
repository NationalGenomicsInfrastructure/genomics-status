"""Handlers related with the project QC page
"""

import re
import os
import json
from status.util import SafeHandler


# Moved here from projects, not currently used. Should it be deleted?
class ProjectQCDataHandler(SafeHandler):
    """Serves filenames in qc_reports
    URL: /api/v1/projectqc/([^/]*)
    """

    def get(self, projectname):
        paths = {}
        prefix = os.path.join(os.getcwd(), "qc_reports")
        # this should be run_dir

        if re.match("^[A-Z]{1,2}\.[A-Za-z0-9]+\_[0-9]{2}\_[0-9]{2,3}$", projectname):
            qc_location = os.path.join(prefix, projectname)
            cursample = ""
            currun = ""
            for root, _, files in os.walk(qc_location):
                rootname = os.path.basename(root)
                if re.match("^P[0-9]{3,5}\_[0-9]{3,4}$", rootname):
                    paths[rootname] = {}
                    cursample = rootname
                    currun = ""

                elif re.match("^[0-9]+\_[A-Z0-9]+$", rootname):
                    paths[cursample][rootname] = []
                    currun = rootname

                for f in files:
                    try:
                        paths[cursample][currun].append(
                            os.path.relpath(os.path.join(root, f), prefix)
                        )
                    except KeyError:
                        print(
                            "cannot add {} to paths, one of these two keys does not exist: sample->{} run->{}".format(
                                os.path.relpath(os.path.join(root, f), prefix),
                                cursample,
                                currun,
                            )
                        )
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(paths))
