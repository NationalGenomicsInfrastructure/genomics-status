#!/usr/bin/env bash

/usr/local/bin/_entrypoint.sh

echo $PATH

python -m pip install -e .
ln -s /home/mambauser/conf/.genologicsrc /home/mambauser/.genologicsrc
ln -s /home/mambauser/conf/genosqlrc.yaml /home/mambauser/.genosqlrc.yaml