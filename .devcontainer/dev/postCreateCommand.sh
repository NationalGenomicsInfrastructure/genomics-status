#!/usr/bin/env bash

/usr/local/bin/_entrypoint.sh

echo $PATH

# Get the workspace directory (works in both Codespaces and local)
WORKSPACE_DIR="${WORKSPACE_DIR:-$(pwd)}"
if [ -d "/app" ]; then
    # Running in container
    WORKSPACE_DIR="/app"
fi

echo "Working in: $WORKSPACE_DIR"

# Install the package in development mode
cd "$WORKSPACE_DIR"
python -m pip install -e .

# Set up config files for local development
# If no custom settings.yaml exists, the app will use config.defaults/settings.yaml
# You can create a custom settings.yaml in run_dir/ to override defaults
if [ ! -f "$WORKSPACE_DIR/run_dir/settings.yaml" ]; then
    echo "No custom settings.yaml found - will use config.defaults/settings.yaml"
fi

# Potentially add some functionality to override the config defaults here.

echo ""
echo "=== Development Environment Ready ==="
echo "Environment:     DEV (Local)"
echo "CouchDB:         http://localhost:5984"
echo "CouchDB UI:      http://localhost:5984/_utils"
echo "CouchDB creds:   admin / admin"
echo "Genomics Status: http://localhost:9761 (after starting)"
echo "Config source:   run_dir/config.defaults/ (fallback defaults)"
echo "                 Create run_dir/settings.yaml to override"
echo "====================================="
