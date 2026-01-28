#!/usr/bin/env bash

/usr/local/bin/_entrypoint.sh

echo $PATH

# Install the package in development mode
cd /workspace
python -m pip install -e .

# Set up config files for local development
# Link settings.yaml to run_dir
ln -sf /workspace/.devcontainer/config/settings.yaml /workspace/run_dir/settings.yaml

# Link .genologicsrc to home directory (where genologics library looks for it)
ln -sf /workspace/.devcontainer/config/.genologicsrc /home/mambauser/.genologicsrc

# Link genosqlrc.yaml to home directory (where genologics_sql library looks for it)
ln -sf /workspace/.devcontainer/config/genosqlrc.yaml /home/mambauser/.genosqlrc.yaml

# If user has their own conf directory mounted, prefer those configs
if [ -d /home/mambauser/conf ]; then
    [ -f /home/mambauser/conf/.genologicsrc ] && ln -sf /home/mambauser/conf/.genologicsrc /home/mambauser/.genologicsrc
    [ -f /home/mambauser/conf/genosqlrc.yaml ] && ln -sf /home/mambauser/conf/genosqlrc.yaml /home/mambauser/.genosqlrc.yaml
    [ -f /home/mambauser/conf/settings.yaml ] && ln -sf /home/mambauser/conf/settings.yaml /workspace/run_dir/settings.yaml
fi

echo ""
echo "=== Development Environment Ready ==="
echo "CouchDB:         http://localhost:5984"
echo "CouchDB UI:      http://localhost:5984/_utils"
echo "CouchDB creds:   admin / admin"
echo "Genomics Status: http://localhost:9761 (after starting)"
echo "====================================="
