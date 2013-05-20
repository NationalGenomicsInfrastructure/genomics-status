""" Handlers for information about Amanita
"""
import json
import time

from dateutil import parser
import tornado.web


class AmanitaHandler(tornado.web.RequestHandler):
    """ Serves a page which displays storage usage over time on Amanita.
    """
    def get(self):
        t = self.application.loader.load("amanita.html")
        self.write(t.generate())


class AmanitaHomeDataHandler(tornado.web.RequestHandler):
    """ Serves a time series of directory usage in HOME on Amanita.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_usage()))

    def home_usage(self):
        sizes = []
        for row in self.application.amanita_db.view("sizes/home_total"):
            obs_time = parser.parse(row.key)
            sizes.append({"x": int(time.mktime(obs_time.timetuple()) * 1000),
                          "y": row.value * 1024})

        return sizes


class AmanitaHomeUserDataHandler(tornado.web.RequestHandler):
    """ Serves a time series of user HOME directory storage usage on
    Amanita for a provided user.
    """
    def get(self, user):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_usage(user)))

    def home_usage(self, user):
        sizes = []
        view = self.application.amanita_db.view("sizes/home_user", group=True)[[user, "0"], [user, "a"]]
        for row in view:
            sizes.append({"x": int(time.mktime(parser.parse(row.key[1]).timetuple()) * 1000),
                          "y": row.value * 1024})

        return sizes


class AmanitaUsersDataHandler(tornado.web.RequestHandler):
    """ Serves a list of users on Amanita.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_users()))

    def home_users(self):
        users = []
        view = self.application.amanita_db.view("sizes/home_user",
                                                group_level=1)
        for row in view:
            if "/" not in row.key[0]:
                users.append(row.key[0])

        return users


class AmanitaBox2DataHandler(tornado.web.RequestHandler):
    """ Serves a time series of storage usage on the box2 storage of Amanita.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_usage()))

    def home_usage(self):
        sizes = []
        for row in self.application.amanita_db.view("sizes/box2_projects_total"):
            obs_time = parser.parse(row.key)
            sizes.append({"x": int(time.mktime(obs_time.timetuple()) * 1000),
                          "y": row.value * 1024})

        return sizes


class AmanitaBox2ProjectDataHandler(tornado.web.RequestHandler):
    """ Serves a time series of storage usage for a specified project on the
    box2 storage on Amanita.
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.box2_usage(project)))

    def box2_usage(self, project):
        sizes = []
        view = self.application.amanita_db.view("sizes/box2_projects", group=True)
        for row in view[[project, "0"], [project, "a"]]:
            obs_time = parser.parse(row.key[1])
            sizes.append({"x": int(time.mktime(obs_time.timetuple()) * 1000),
                          "y": row.value * 1024})

        return sizes


class AmanitaBox2ProjectsDataHandler(tornado.web.RequestHandler):
    """ Serves a list of the projects which uses or have used the box2
    storage on Amanita.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.box2_projects()))

    def box2_projects(self):
        proejcts = []
        view = self.application.amanita_db.view("sizes/box2_projects", group_level=1)
        for row in view:
            if "/" not in row.key[0]:
                proejcts.append(row.key[0])

        return proejcts


class AmanitaHomeProjectsDataHandler(tornado.web.RequestHandler):
    """ Serves a list of the projects which have used or uses storage in
    HOME/projects on Amanita.
    """
    def get(self):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.box2_projects()))

    def box2_projects(self):
        proejcts = []
        for row in self.application.amanita_db.view("sizes/home_projects", group_level=1):
            if "/" not in row.key[0]:
                proejcts.append(row.key[0])

        return proejcts


class AmanitaHomeProjectDataHandler(tornado.web.RequestHandler):
    """ Serves a time series of storage usage of a specified project in
    HOME/projects on Amanita.
    """
    def get(self, project):
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(self.home_projects_usage(project)))

    def home_projects_usage(self, project):
        sizes = []
        view = self.application.amanita_db.view("sizes/home_projects", group=True)
        for row in view[[project, "0"], [project, "a"]]:
            obs_time = parser.parse(row.key[1])
            sizes.append({"x": int(time.mktime(obs_time.timetuple()) * 1000),
                          "y": row.value * 1024})

        return sizes


