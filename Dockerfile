FROM mambaorg/micromamba:latest

# Need git to install genologics
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*
USER $MAMBA_USER

# Install dependencies
COPY --chown=$MAMBA_USER:$MAMBA_USER conda_requirements.yml requirements.txt requirements_dev.txt /tmp/
# Copy entrypoint script
COPY --chown=$MAMBA_USER:$MAMBA_USER entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN micromamba install -y -n base -f /tmp/conda_requirements.yml

ARG MAMBA_DOCKERFILE_ACTIVATE=1
# Update pip to latest version
RUN micromamba run -n base python -m ensurepip --upgrade
RUN micromamba run -n base python -m pip install --upgrade pip setuptools
RUN micromamba run -n base python -m pip install -r /tmp/requirements.txt -r /tmp/requirements_dev.txt
# Copy application code
COPY --chown=$MAMBA_USER:$MAMBA_USER . /app
WORKDIR /app

# Install the package
RUN micromamba run -n base python -m pip install -e .

# Set working directory to run_dir (where the app expects to run from)
WORKDIR /app/run_dir

# Set default port via environment variable (can be overridden at runtime)
ENV PORT=9761

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/ || exit 1

# Note: Configuration files (settings.yaml, .genologicsrc, etc.) should be mounted
# as volumes or provided via environment-specific secrets at runtime

# Default command to start the application
ENTRYPOINT ["/app/entrypoint.sh"]