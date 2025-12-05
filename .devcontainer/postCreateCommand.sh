#!/usr/bin/env bash

/usr/local/bin/_entrypoint.sh

echo $PATH

# Install the package in development mode
cd /workspace
python -m pip install -e .

# Create symlinks for config files if the conf directory is mounted
if [ -d /home/mambauser/conf ]; then
    [ -f /home/mambauser/conf/.genologicsrc ] && ln -sf /home/mambauser/conf/.genologicsrc /home/mambauser/.genologicsrc
    [ -f /home/mambauser/conf/genosqlrc.yaml ] && ln -sf /home/mambauser/conf/genosqlrc.yaml /home/mambauser/.genosqlrc.yaml
fi

echo ""
echo "=== Development Environment Ready ==="
echo "CouchDB:         http://localhost:5984"
echo "CouchDB UI:      http://localhost:5984/_utils"
echo "CouchDB creds:   admin / admin"
echo "Genomics Status: http://localhost:9761 (after starting)"
echo "====================================="