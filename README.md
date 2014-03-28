# Genomics Status

Genomics Status is a Tornado web app for visualizing information and statistics regarding SciLifeLab Genomics platform operations.

Status interfaces with StatusDB; the CouchDB database instance we're using at SciLifeLab to store metadata in 
various forms. Document specifications for StatusDB are available in the internal wiki. Documentation about CouchDB can be found [here](http://guide.couchdb.org/).

## Installing and running genomics status

**NOTE**: These steps assume that:
* you're either running a python virtualenv or you do have root permissions.
* you have access to both StatusDB and Genologics LIMS

1 - Clone the repository with the ```--recursive``` option (this will also download [nvd3](http://nvd3.org/) library):

```
git clone --recursive https://github.com/SciLifeLab/status.git
```

2 - Install the package

```
cd status
python setup.py install
```

3 - You'll need to install matplotlib separatedly:

```
pip install matplotlib
```

4 - For running, it requires a `settings.yaml` file which points to the CouchDB server to use, and which port to
serve the web app to. You will also need a .genologicsrc file with the API credentials for our Genologics LIMS. The files should look like these:

<status_dir>/run_dir/settings.yaml
```yaml
couch_server: http://<username>:<password>@tools-dev.scilifelab.se:5984
username: <tools_username>
password: <tools_password>
port: 9761
redirect_uri: http://localhost:9761/login

google_oauth:
    key_old: write
    key: anything
    secret: here

contact_person: someone@domain.com

instruments:
    HiSeq:
        INSTRUMENT_ID: INSTRUMENT_NAME
    MiSeq:
        INSTRUMENT_ID: INSTRUMENT_NAME

password_seed: dont_needed
```

~/.genologicsrc
```yaml
[genologics]
BASEURI=https://genologics-stage.scilifelab.se:8443
USERNAME=<lims_api_username>
PASSWORD=<lims_api_password>
```

The status web app both provides the HTML web interface, and a RESTful api for accessing the data being
visualized on the various pages.

## Genomics Status architecture

This pictures illustrates the architecture of how Genomics Status is built with a real example, a request to https://genomics-status.scilifelab.se/projects/all. It is simplified for the sace of comprehension, in reallity there are a few more API calls.

<p align="center">
  <img src="https://raw.githubusercontent.com/guillermo-carrasco/status/master/doc/genomics_status.png"
       alt="Genomics Status Architecture"/>
</p>

1. The web browser (a human, actually) requests the page /projects/all. The browser sends the request to Tornado, which has assigned the ProjectsHandler to this call.
2. Tornado returns a rendered template with all the parameters needes to build the projects page, i.e useranme, projects to list, etc.
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

Basically, you have to define a handlaer for each URL you want your application to serve. In this case, we define just one handler for the URI '/'. This will just print a "Hello, World" page.

Handlers that inherit from ```tornado.web.RequestHandler``` should implement at least one of the HTTP basic operations, i.e GET, POST or PUT. 

### Tornado templating
Tornado templates are a good way to generate dynamic pages server side. The advantage of templates is that you can embeed python code in them. [The official documentation](http://www.tornadoweb.org/en/stable/template.html) is good enough to learn how they work.

On Genomics Status, templates are located in status/run_dir/design
