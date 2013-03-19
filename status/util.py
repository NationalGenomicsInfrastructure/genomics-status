from datetime import datetime


def dthandler(obj):
    """ISO formatting for datetime to be used in JSON.
    """
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    else:
        raise TypeError, "Object can not be isoformatted."
