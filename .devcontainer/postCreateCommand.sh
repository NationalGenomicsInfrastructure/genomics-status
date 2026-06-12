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

cd "$WORKSPACE_DIR"
python -m pip install -e .

# Set up config files for local development
# If no custom settings.yaml exists, the app will use config.defaults/settings.yaml
# You can create a custom settings.yaml in run_dir/ to override defaults
if [ ! -f "$WORKSPACE_DIR/run_dir/settings.yaml" ]; then
    echo "No custom settings.yaml found - will use config.defaults/settings.yaml"
fi

# Remove default config files copied by Dockerfile (they're just fallbacks)
# Replace them with symlinks to real credentials
rm -f /home/mambauser/.genologicsrc
rm -f /home/mambauser/.genosqlrc.yaml

ln -s /home/mambauser/conf/.genologicsrc /home/mambauser/.genologicsrc
ln -s /home/mambauser/conf/genosqlrc.yaml /home/mambauser/.genosqlrc.yaml