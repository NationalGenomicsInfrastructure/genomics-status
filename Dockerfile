FROM condaforge/mambaforge:latest



# Install dependencies
COPY conda_requirements.yml conda_requirements.yml
RUN mamba install -y python=3.12
RUN mamba install -y pango>=1.42.4 pandas>=1.3.2
RUN mamba install -y -c conda-forge psycopg2 open-fonts xorg-libxrender xorg-libxext xorg-libxau

COPY requirements.txt requirements.txt
ARG MAMBA_DOCKERFILE_ACTIVATE=1
# Update pip to latest version
RUN python -m ensurepip --upgrade
RUN python -m pip install --upgrade pip
RUN python -m pip install --upgrade setuptools
RUN python -m pip install -r requirements.txt