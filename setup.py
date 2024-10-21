#!/usr/bin/env python
"""Setup file and install script SciLife python scripts.
"""
from setuptools import find_packages, setup

try:
    with open("requirements.txt") as f:
        install_requires = [x.strip() for x in f.readlines()]
except OSError:
    install_requires = []

setup(
    name="status",
    author="Science For Life Laboratory",
    author_email="genomics_support@scilifelab.se",
    description="Webapp for keeping track of metadata status at SciLifeLab",
    license="MIT",
    scripts=["status_app.py", "scripts/update_suggestion_box"],
    install_requires=install_requires,
    packages=find_packages(),
)
