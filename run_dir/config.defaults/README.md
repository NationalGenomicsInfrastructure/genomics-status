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

## Usage

### Docker Compose (Standalone)

When running `docker-compose up`, the Dockerfile copies these defaults directly into the container. No additional setup needed:

```bash
docker-compose up
# Uses all config.defaults automatically
```

### DevContainer (Development)

The devcontainer (`.devcontainer/`) uses these defaults but allows overrides:

```bash
# Defaults are already in place from Dockerfile
# To override, create custom configs in run_dir/
cd run_dir
cp config.defaults/settings.yaml settings.yaml
cp config.defaults/.genologicsrc .genologicsrc
# Edit your custom files
```

The `postCreateCommand.sh` will automatically:
- Use defaults from Dockerfile if no custom configs exist
- Replace with symlinks to custom configs if they exist in `run_dir/`


### Local Python (No Docker)

For running directly on your machine without Docker:

```bash
cd run_dir

# Option 1: Symlink to defaults
ln -s config.defaults/.genologicsrc ~/.genologicsrc
ln -s config.defaults/.genosqlrc.yaml ~/.genosqlrc.yaml

# Option 2: Copy and customize
cp config.defaults/.genologicsrc ~/.genologicsrc
cp config.defaults/.genosqlrc.yaml ~/.genosqlrc.yaml
# Edit the files with real credentials

# Run the app
python ../status_app.py --testing_mode
```

## What's Ignored by Git

The following are ignored (see `.gitignore`):
- `run_dir/settings.yaml` - Your custom settings
- `run_dir/settings/` - Legacy settings directory
- `**/.genologicsrc` - Credentials (except the one in this defaults directory)
- `**/.genosqlrc.yaml` - Credentials (except the one in this defaults directory)
- `**/orderportal_cred.yaml` - Credentials (except the one in this defaults directory)

**These defaults ARE committed** because they contain only fake credentials safe for development.

## How It Works Across Environments

1. **Dockerfile layer**: Copies these defaults to `/home/mambauser/` so basic `docker-compose up` works
2. **Dev container**: Keeps defaults or replaces with custom configs from `run_dir/` if they exist  
3. **Staging container**: Removes defaults and replaces with real credentials from `~/conf` mount
4. **Application**: Uses `run_dir/settings.yaml` first, falls back to `config.defaults/settings.yaml`
