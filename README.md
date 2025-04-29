# Genomics Status

Genomics Status is a Tornado web app for visualizing information and statistics regarding operations by NGI Stockholm at SciLifeLab.

Genomics Status interfaces with StatusDB, which is a [CouchDB](http://guide.couchdb.org/) database instance used to store metadata in various forms.

## Installing and running genomics status

### Requirements

* you're either running a python virtualenv or you do have root permissions.
* you're running python version 3.6 or later (dicts are ordered by default)
* you have access to both StatusDB and Genologics LIMS

### Installation

Clone the repository with the `--recursive` option (this will also download [nvd3](http://nvd3.org/) library):

```bash
git clone --recursive https://github.com/NationalGenomicsInfrastructure/genomics-status.git
```

<details>

<summary>Note on `conda` environments</summary>

#### Create the environment with the correct dependencies

If you decide to use a conda environment, create one making sure to use the `conda_requirements.yml` file with the following command:

```bash
conda env create -n <env_name> -f conda_requirements.yml
```

where `<env_name>` is the name of the environment you want to create.  Then, activate the environment with:

```bash
conda activate <env_name>
```

</details>

Install the dependencies and the package (the `pip install -r requirements_dev.txt` can be skipped on a production server)

```bash
pip install -r requirements.txt
pip install -r requirements_dev.txt
python setup.py install
```

<details>

<summary>Note on MacOS installations</summary>

### Fix library issues

If you are using MacOS, you might run into some issues with the libraries when running the app. 

In case you get the `OSError: cannot load library 'gobject-2.0-0'` error (or similar), install `glib` and `pango` via [Homebrew](https://brew.sh/):

```bash
brew install glib
brew install pango
```

and then symlink the libraries to `/usr/local/lib`:

```bash
sudo ln -s /opt/homebrew/opt/glib/lib/libgobject-2.0.0.dylib /usr/local/lib/gobject-2.0
sudo ln -s /opt/homebrew/opt/pango/lib/libpango-1.0.dylib /usr/local/lib/pango-1.0
sudo ln -s /opt/homebrew/opt/harfbuzz/lib/libharfbuzz.dylib /usr/local/lib/harfbuzz
sudo ln -s /opt/homebrew/opt/fontconfig/lib/libfontconfig.1.dylib /usr/local/lib/fontconfig-1
sudo ln -s /opt/homebrew/opt/pango/lib/libpangoft2-1.0.dylib /usr/local/lib/pangoft2-1.0
```

</details>


### Configuration

Before running the app, you need to configure it. This is done by creating the`settings.yaml` file, which points to 
the CouchDB server to use and defines which port to serve the web app to. You will also need to create a `.genologicsrc`
file with the API credentials for our Genologics LIMS, and a `orderportal_cred.yaml` file with the credentials for the 
order portal. The files should look like these:

`<status_dir>/run_dir/settings.yaml`:
```yaml
couch_server: http://<username>:<password>@ngi-statusdb-dev.scilifelab.se:5984
username: <tools_username> # same as input above
password: <tools_password> # same as input above
port: 9761
redirect_uri: http://localhost:9761/login
cookie_secret: 
couch_url: https://ngi-statusdb-dev.scilifelab.se

# Data Centre's pro subscription
font_awesome_url: https://kit.fontawesome.com/<subscription_id>.js

lims_backend_credential_location: <genologicsrc_location>

order_portal_credential_location: orderportal_cred.yaml

google_oauth:
    key: <google_oauth_key>
    secret: <google_oauth_secret>

zendesk:
    url: https://ngisweden.zendesk.com
    username: <zendesk_username>
    token: <zendesk_token>

contact_person: <contact_person_email>

instruments:
    HiSeq:
        INSTRUMENT_ID: <Instrument_Name>
    MiSeq:
        INSTRUMENT_ID: <Instrument_Name>

slack:
    token: <slack_token>

jira:
    url: https://scilifelab.atlassian.net
    user: <jira_user>
    api_token: <jira_api_token>
    project_key: NSD

# Trello suggestion box update log
sb_log: suggestion_box.log # Optional

psul_log: /home/hiseq.bioinfo/log/LIMS2DB/lims2db_projects.log
charon:
    url: https://charon-dev.scilifelab.se
    api_token:  

# LIMS Dashboard
lims_dashboard_url: https://lims-dashboard.scilifelab.se

server_status:
    instruments:
        <instrument_address>: <instrument_name>
        <instrument_address>: <instrument_name>
        <instrument_address>: <instrument_name>

reports_path: <reports_path>
```

`.genologicsrc`:
```yaml
[genologics]
BASEURI=https://ngi-lims-stage.scilifelab.se:8443
USERNAME=<lims_api_username>
PASSWORD=<lims_api_password>
```

`orderportal_cred.yaml`:
```yaml
order_portal:
    api_get_order_url: 'https://ngisweden.scilifelab.se/orders/api/v1/order'
    api_token: <order_portal_api_token>
```

### Usage

Run the tornado app from `run_dir`:
```bash
cd run_dir
python ../status_app.py --testing_mode
```

The `--testing_mode` flag will skip the google authentication, which is convenient for testing.

The status web app both provides the HTML web interface, and a RESTful api for accessing the data being
visualized on the various pages.

If you've used the `settings.yaml` template above, you should now be able to access the site at `http://localhost:9761/` or `http://localhost:9761/login`


## Generating the custom bootstrap css file
The bootstrap css file is customised to use a smaller font size.
To replicate this, use the following snippet:

```bash
conda create -n nodejs
conda activate nodejs
conda install nodejs
npm install sass -g
npm install bootstrap@next -g
cd run_dir/static/scss
```

Then modify the `custom.scss` file, especially the hard-coded path according to your needs, and run the compilation:

```bash
sass custom.scss custom-bootstrap-5-alpha.css
```

## Genomics Status architecture

This pictures illustrates the architecture of how Genomics Status is built with a real example, a request to https://genomics-status.scilifelab.se/projects/all. It is simplified for the sake of comprehension, in reality there are a few more API calls.

<p align="center">
  <img src="https://raw.githubusercontent.com/NationalGenomicsInfrastructure/genomics-status/master/doc/genomics_status.png"
       alt="Genomics Status Architecture"/>
</p>

1. The web browser (a human, actually) requests the page `/projects/all`. The browser sends the request to Tornado, which has assigned the `ProjectsHandler` to this call.
2. Tornado returns a rendered template with all the parameters needes to build the projects page, i.e username, projects to list, etc.
3. Within the template, in order to build the project list, it performas a JavaScript (JQuery) call to GenStat API.
4. Tornado queries StatusDB information about the projects and parses it correctly.
5. A JSON document is returned to the web browser
6. Which uses it to build the project list client-side.

This design aims to decouple design and backend, as well as avoid making calls to the database from the web browser.

It also facilitates the reusability of the API for other possible applications.

### Tornado
[Tornado](http://www.tornadoweb.org/en/stable/) is a Python web framework and asynchronous networking library. Genomics Status is based on Tornado.

A very basic tornado web app, but enough to get the idea, would be something like this:

```python
import tornado.ioloop
import tornado.web

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

application = tornado.web.Application([
    (r"/", MainHandler),
])

if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()
```

Basically, you have to define a handlaer for each URL you want your application to serve. In this case, we define just one handler for the URI `'/'`. This will just print a `"Hello, World"` page.

Handlers that inherit from ```tornado.web.RequestHandler``` should implement at least one of the HTTP basic operations, i.e GET, POST or PUT.

### Tornado templating
Tornado templates are a good way to generate dynamic pages server side. The advantage of templates is that you can embeed python code in them. [The official documentation](http://www.tornadoweb.org/en/stable/template.html) is good enough to learn how they work.

On Genomics Status, templates are located in `status/run_dir/design`


TODO:

    - [ ] Fix links to old project page vs new project page
    - [ ] Add link to project cards from menu and front page
    