status
======

Tornado web app for visualizing information and statistics regarding SciLifeLab Genomics platform operations.

Status interfaces with StatusDB; the CouchDB database instance we're using at SciLifeLab to store metadata in 
various forms.
Document specifications for StatusDB are available in the internal wiki.

For running, it requires a `settings.yaml` file which points to the CouchDB server to use, and which port to
serve the web app to.

The status web app both provides the HTML web interface, and a RESTful api for accessing the data being
visualized on the various pages.
