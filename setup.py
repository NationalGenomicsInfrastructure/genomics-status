#!/usr/bin/env python
"""Setup file and install script SciLife python scripts.
"""
from setuptools import setup, find_packages

setup(name=
      "status",
      author=
      "Valentine Svensson",
      author_email=
      "genomics_support@scilifelab.se",
      description=
      "Webapp for keeping track of metadata status at SciLifeLab",
      license=
      "MIT",
      scripts=
      ["status_app.py"],
      install_requires=
      ["tornado",
       "couchdb",
       "pyyaml",
       "numpy",
       "matplotlib"],
      packages=
      find_packages()
      )
