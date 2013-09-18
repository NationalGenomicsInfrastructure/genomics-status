from fabric.api import *


# Hosts

def tools():
    env.hosts = ['tools.scilifelab.se']
    # Obs! nonstandard port!

def tools_dev():
    env.hosts = ['tools-dev.scilifelab.se']


# Commands

def stop():
    """ Stops the genomics-status webapp server.
    """
    sudo("kill $(ps aux | grep '[s]tatus_app.py' | awk '{print $2}')", user='genomics.www')

def git_pull():
    """ Pulls the changes from the origin/master of the repo on the server.
    """
    with cd('/home/genomics.www/status'):
        sudo('git pull', user='genomics.www')
        sudo('git submodule update', user='genomics.www')

def install():
    """ Installs the webapp code in the virtual environemnt 'web' on the server.
    """
    with cd('/home/genomics.www/status'):
        with prefix('workon web'):
            sudo('python setup.py develop', user='genomics.www')

def start():
    """ Starts the genommics-status webapp server, in a screen session.
    """
    with cd('/home/genomics.www/status/run_dir'):
        with prefix('workon web'):
            sudo('screen -S status_app -d -m status_app.py', user='genomics.www')

def deploy():
    """ Performs all steps needed to deploy new code.
    """
    stop()
    git_pull()
    install()
    start()
