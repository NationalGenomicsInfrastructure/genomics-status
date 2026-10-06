#!/bin/bash
set -e

# Default port if not set
PORT=${PORT:-9761}

# Execute the application
exec micromamba run -n base python ../status_app.py --port="$PORT"