# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) and other agents when working with code in this repository.

## Overview

Genomics Status is a Tornado web application for visualizing NGI Stockholm operations at SciLifeLab. It interfaces with StatusDB (CouchDB) for metadata storage and Genologics LIMS for laboratory information.

## Development Commands

### Running the Application

```bash
# From the run_dir directory
cd run_dir
python ../status_app.py --testing_mode

# With auto-reload for development
python ../status_app.py --develop --testing_mode

# Custom port
python ../status_app.py --testing_mode --port=9762
```

The `--testing_mode` flag disables Google OAuth authentication. The app runs on port 9761 by default.

### Docker Compose

The project supports docker compose to run a development setup, completely without local settings file. This requires the Statusdb_NGI repository to be cloned alongside of the Genomics-status repository.

### Dev Container

The project also supports devcontainers. When using Dev Containers:
- Ports 9761 (app) is forwarded
- The app auto-starts with `--develop --testing_mode`

A remote `stage` database is needed to run the application run in a devcontainer.

### Linting

```bash
ruff check .                    # Check for issues
ruff check --fix .              # Auto-fix issues
ruff format .                   # Format code
```

Ruff is configured in `pyproject.toml` with rules for pycodestyle, Pyflakes, isort, and pyupgrade.

## Architecture

### Request Flow

1. Browser requests a page (e.g., `/projects/all`)
2. Tornado routes to the appropriate Handler class
3. Handler renders a template from `run_dir/design/` with server-side data
4. Template makes JavaScript calls to the REST API (`/api/v1/...`)
5. API handlers query CouchDB and return JSON
6. Client-side JavaScript builds the UI

The traditional structure uses tornado templating more, with little or no use of javascript (jquery) and the REST API. The more modern approach is to use Vue and the REST API more and the tornado templating less. This hybrid approach creates seperate Vue apps on different pages, and Vue components are not very often reusable. 

### Code Structure

- `status_app.py` - Main application entry point, defines all URL routes and initializes the Tornado Application
- `status/` - Handler modules organized by feature:
  - `util.py` - Base handler classes (`SafeHandler`, `UnsafeHandler`, `BaseHandler`)
  - `projects.py`, `flowcells.py`, etc. - Feature-specific handlers
- `run_dir/` - Runtime directory (must run app from here):
  - `design/` - Tornado HTML templates
  - `static/` - CSS, JavaScript, images
  - `settings.yaml` - Configuration (not in repo)

### Handler Inheritance

- `BaseHandler` - Base class with authentication, error handling
- `SafeHandler(BaseHandler)` - Requires authentication (use `@tornado.web.authenticated`)
- `UnsafeHandler(BaseHandler)` - No authentication required
- `SafeSocketHandler` - WebSocket with authentication

### Database Access

The app uses IBM Cloudant SDK to connect to CouchDB:
```python
# Available via self.application.cloudant in handlers
self.application.cloudant.post_view(db="...", ddoc="...", view="...", ...)
self.application.cloudant.get_document(db="...", doc_id="...")
```

Key databases: `projects`, `flowcells`, `worksets`, `gs_users`, `gs_configs`, `server_status`

### API Pattern

API handlers typically:
1. Inherit from `SafeHandler` (Rare exception `UnsafeHandler` where the data can safely be exposed on the intranet)
2. Implement `get()`, `post()`, or `put()` methods
3. Set `Content-type: application/json` header
4. Return JSON via `self.write(json.dumps(data))`

### Templates

Templates use Tornado's templating with embedded Python:
- `{% ... %}` for control structures
- `{{ ... }}` for expressions
- Templates access `gs_globals`, `user`, and handler-passed variables

## Configuration

Configuration files work with fallback defaults:

### Settings Priority

1. **Custom config**: `run_dir/settings.yaml` (if exists)
2. **Default config**: `run_dir/config.defaults/settings.yaml` (fallback)

The app automatically uses defaults if no custom config is present.

### Config Files

**Main settings** (`run_dir/settings.yaml` or `run_dir/config.defaults/settings.yaml`):
- CouchDB connection (`couch_server`, `couch_url`)
- OAuth settings (disabled with `--testing_mode`)
- External API credentials (Zendesk, Jira, Slack)
- Port configuration

**LIMS credentials**:
- `.genologicsrc` - Genologics LIMS API (must be in home directory)
- `lims_backend_cred.yaml` - Additional LIMS credentials
- Location: `~/.genologicsrc` (symlink from `run_dir/config.defaults/` for dev)

**Order portal**:
- `orderportal_cred.yaml` - API token

### Setting Up Configs

**For local development** (using defaults):
```bash
cd run_dir
# Defaults are used automatically, no setup needed!
python ../status_app.py --testing_mode
```

**With custom settings**:
```bash
cd run_dir
cp config.defaults/settings.yaml settings.yaml
# Edit settings.yaml with your values
```

**For `.genologicsrc`**:
```bash
# Symlink default (for dev/testing)
ln -sf "$(pwd)/run_dir/config.defaults/.genologicsrc" ~/.genologicsrc

# Or create custom with real credentials
cp run_dir/config.defaults/.genologicsrc ~/.genologicsrc
# Edit ~/.genologicsrc
```

### What's in Git

- ✅ `run_dir/config.defaults/` - Safe defaults with fake credentials
- ❌ `run_dir/settings.yaml` - Your custom settings (gitignored)
- ❌ `~/.genologicsrc` with real credentials (gitignored)

## User Roles

Defined in `status/util.py`:
- `admin` - Full admin access
- `pricing_admin` - Manage pricing
- `sample_requirements_admin` - Manage sample requirements
- `proj_coord` - Project coordinator
- `api_user` - JWT-authenticated API access
