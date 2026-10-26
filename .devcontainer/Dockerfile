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