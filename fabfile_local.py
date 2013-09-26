"""Fabfile to locally deploy genomics-status
"""

from fabric.api import *

def stop():
    """ Stops the genomics-status webapp server.
    """
    local("kill $(ps aux | grep '[s]tatus_app.py' | awk '{print $2}')")

def git_pull():
    """ Pulls the changes from the origin/master of the repo on the server.
    """
    with lcd('/home/genomics.www/status'):
        with prefix('source ~/.virtualenvs/web/bin/activate'):
            local('git pull')
            local('git submodule update')

def install():
    """ Installs the webapp code in the virtual environemnt 'web' on the server.
    """
    with lcd('/home/genomics.www/status'):
        with prefix('source ~/.virtualenvs/web/bin/activate'):
            local('python setup.py develop')

def start():
    """ Starts the genommics-status webapp server, in a screen session.
    """
    with lcd('/home/genomics.www/status/run_dir'):
        with prefix('source ~/.virtualenvs/web/bin/activate'):
            local('status_app.py &')

def deploy():
    """ Performs all steps needed to deploy new code.
    """
    stop()
    git_pull()
    install()
    start()
