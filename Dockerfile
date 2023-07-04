FROM condaforge/mambaforge:latest

# Update pip to latest version
RUN python -m pip install --upgrade pip

# Install dependencies
COPY conda_requirements.yml conda_requirements.yml
RUN mamba install -n base pango=1.42.4 pandas>=1.3.2 
RUN mamba install -c conda-forge psycopg2 open-fonts xorg-libxrender xorg-libxext xorg-libxau

COPY requirements.txt requirements.txt
ARG MAMBA_DOCKERFILE_ACTIVATE=1
RUN python -m pip install -r requirements.txt