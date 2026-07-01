# Default Development Configuration

This directory contains safe-to-commit default configuration files for local development.

## Purpose

These configuration files serve as fallback defaults when running the application locally or in a dev container:
- **Safe for public repositories** - Contains only fake/test credentials
- **Works everywhere** - Accessible both in containers and local development
- **Automatic fallback** - Used when custom configs don't exist

## Files

- `settings.yaml` - Main application settings (CouchDB, ports, fake OAuth/API credentials)
- `.genologicsrc` - Fake LIMS API credentials
- `lims_backend_cred.yaml` - Additional LIMS credentials (fake)
- `orderportal_cred.yaml` - Order portal API token (fake)
- `.genosqlrc.yaml` - GenologicsSQL database credentials (fake)
