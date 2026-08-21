FROM mambaorg/micromamba:latest

# Need git to install genologics
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*
USER $MAMBA_USER

# Install dependencies
COPY --chown=$MAMBA_USER:$MAMBA_USER conda_requirements.yml conda_requirements.yml
COPY --chown=$MAMBA_USER:$MAMBA_USER requirements.txt /tmp/requirements.txt
COPY --chown=$MAMBA_USER:$MAMBA_USER requirements_dev.txt /tmp/requirements_dev.txt

RUN micromamba install -y -n base -f conda_requirements.yml

ARG MAMBA_DOCKERFILE_ACTIVATE=1
# Update pip to latest version
RUN python -m ensurepip --upgrade
RUN python -m pip install --upgrade pip
RUN python -m pip install --upgrade setuptools
RUN python -m pip install -r requirements.txt
RUN python -m pip install -r requirements_dev.txt

# Keep this for now, but ideally we should remove this and just be able to specify it in the defaults configs.
# Set up default .genologicsrc in home directory
# This is needed because genologics library reads it at import time
COPY --chown=$MAMBA_USER:$MAMBA_USER run_dir/config.defaults/.genologicsrc /home/mambauser/.genologicsrc

# Set up default .genosqlrc.yaml for genologics_sql library
COPY --chown=$MAMBA_USER:$MAMBA_USER run_dir/config.defaults/.genosqlrc.yaml /home/mambauser/.genosqlrc.yaml