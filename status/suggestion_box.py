import tornado.web

from status.util import SafeHandler

class SuggestionBoxHandler(SafeHandler):
    """ Returns the Suggestion Box html template, as it is
    """
    def get(self):
        t = self.application.loader.load("suggestion_box.html")
        self.write(t.generate(user=self.get_current_user_name()))
