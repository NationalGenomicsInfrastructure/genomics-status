from collections import OrderedDict
from datetime import datetime
import tornado.web

from trello import TrelloClient, Card
from status.util import SafeHandler

TITLE_TEMPLATE = "{title} ({area})"

DESCRIPTION_TEMPLATE = """
* Created on: {date}
* Area: {area}
* System: {system}
* Importance: {importance}
* Difficulty: {difficulty}
* Reporter: {user}

**Description**
{description}

**Suggestion**
{suggestion}
"""

class SuggestionBoxHandler(SafeHandler):
    """ Handles URL /suggestion_box
    """
    def get(self):
        """ Returns the Suggestion Box HTML template, as it is
        """
        t = self.application.loader.load("suggestion_box.html")
        self.write(t.generate(user=self.get_current_user_name()))

    def post(self):
        """ Collect data from the HTML form to fill in a Trello card.

        That card will be uploaded to Suggestion Box board, on the corresponding
        list, determined by the "System" attribute given in the form.
        """
        # Get form data
        date = datetime.now()
        title = self.get_argument('title')
        area = self.get_argument('area')
        system = self.get_argument('system')
        importance = self.get_argument('importance')
        difficulty = self.get_argument('difficulty')
        user = self.get_current_user_name()
        description = self.get_argument('description')
        suggestion = self.get_argument('suggestion')

        client = TrelloClient(api_key = self.application.trello_api_key,
                              api_secret = self.application.trello_api_secret,
                              token = self.application.trello_token)

        # Get Suggestion Box board
        boards = client.list_boards()
        suggestion_box = None
        for b in boards:
            if b.name == 'Suggestion Box':
                suggestion_box = client.get_board(b.id)
                break

        # Get the board lists (which correspond to System in the form data) and
        # concretely get the list where the card will go
        lists = b.all_lists()
        card_list = None
        for l in lists:
            if l.name == system:
                card_list = l
                break

        # Create new card using the info from the form
        new_card = card_list.add_card(TITLE_TEMPLATE.format(title=title, area=area))
        new_card.set_description(DESCRIPTION_TEMPLATE.format(date = date.ctime(),
                                                             area=area,
                                                             system=system,
                                                             importance=importance,
                                                             difficulty=difficulty,
                                                             user=user,
                                                             description=description,
                                                             suggestion=suggestion))

        # Save the information of the card in the database
        self.application.suggestions_db.create({'date': date.isoformat(),
                                                'card_id': new_card.id,
                                                'description': new_card.description,
                                                'name': new_card.name,
                                                'url': new_card.url})

        self.set_status(200)


class SuggestionBoxDataHandler(SafeHandler):
    """ Handles URL /api/v1/suggestions
    """
    def get(self):
        view = self.application.suggestions_db.view("date/info")
        self.set_header("Content-type", "application/json")
        suggestions = OrderedDict()
        for row in sorted(view.rows, key=lambda x: x.key, reverse=True):
            suggestions[row.key] = row.value
        self.write(suggestions)
