#!/usr/bin/env python

import argparse
import couchdb
import yaml

import trello

from logbook import Logger, FileHandler

DESCRIPTION = """Updates stauts (archived or not) of the suggestions stored in the database.

Requires the settings.yaml configuration file used to parametrise genomics-status
"""
if __name__=="__main__":

    parser = argparse.ArgumentParser(description=DESCRIPTION)
    parser.add_argument('config', type=str, help="Path to settings.yaml file")
    args = parser.parse_args()

    try:
        with open(args.config, 'r') as f:
            config = yaml.load(f)
    except IOError:
        raise IOError('Please make sure to specify a correct path to settings.yaml file')

    # From here, assume that all credentials are present in the configuration file,
    # that is actually needed to run genomics-status

    logfile = config.get('sb_log', None) or '~/.suggestion-box.log'
    fh = FileHandler(logfile)
    log = Logger('Suggestion Box')
    log.handlers.append(fh)

    # Connect to Trello
    api_key = config.get('trello').get('api_key')
    api_secret = config.get('trello').get('api_secret')
    token = config.get('trello').get('token')
    t_client = trello.TrelloClient(api_key=api_key, api_secret=api_secret, token=token)

    # Connect to StatusDB
    s = couchdb.Server(config.get('couch_server'))

    # Get list of stored suggestions
    sb_database = s['suggestion_box']
    cards_in_db = {row.key:row.value for row in sb_database.view('card/id').rows}

    # Get list of cards in Suggestion Box board
    for b in t_client.list_boards():
        if b.name == 'Suggestion Box':
            sb_board = b
    all_cards = sb_board.all_cards()

    docs = []
    for card in all_cards:
        # There are some archived cards from the testing phase that are not on
        # the database but are still in Trello. They cannot be removed.
        if card.id in cards_in_db.keys():
            log.info('Updating status of card {}...'.format(card.name))
            doc = sb_database.get(cards_in_db[card.id])
            doc['archived'] = card.closed
            docs.append(doc)
    # Checking if someone has been naughty and moved cards from the suggestion box
    for dbcard_id in cards_in_db.keys():
        if dbcard_id in [i.id for i in all_cards]:
            continue
        try:
            tcard = t_client.get_card(dbcard_id)
            closed = tcard.closed
        except:
            # Trello-py might not give any exceptions if the card is not found
            log.warning("Card {} in DB was not found Trello, it was likely deleted".format(dbcard_id))
            continue
        log.info('Updating status of non-suggestion box card {}...'.format(tcard.name))
        doc = sb_database.get(cards_in_db[tcard.id])
        doc['archived'] = closed
        docs.append(doc)

    sb_database.update(docs)
