# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Dev Container

The project supports VS Code Dev Containers. When using Dev Containers:
- Ports 9761 (app) and 5984 (CouchDB) are forwarded
- The app auto-starts with `--develop --testing_mode`

### Linting

```bash
ruff check .                    # Check for issues
ruff check --fix .              # Auto-fix issues
ruff format .                   # Format code
```

Ruff is configured in `pyproject.toml` with rules for pycodestyle, Pyflakes, isort, and pyupgrade.

### Running Tests

Tests use nose and require a running server:
```bash
# Start the server first, then in another terminal:
cd tests
nosetests test_integration.py
```

Tests are in the `tests/` directory and require `tests/test_items.yaml` for test data.

## Architecture

### Request Flow

1. Browser requests a page (e.g., `/projects/all`)
2. Tornado routes to the appropriate Handler class
3. Handler renders a template from `run_dir/design/` with server-side data
4. Template makes JavaScript calls to the REST API (`/api/v1/...`)
5. API handlers query CouchDB and return JSON
6. Client-side JavaScript builds the UI

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
1. Inherit from `SafeHandler` or `UnsafeHandler`
2. Implement `get()`, `post()`, or `put()` methods
3. Set `Content-type: application/json` header
4. Return JSON via `self.write(json.dumps(data))`

### Templates

Templates use Tornado's templating with embedded Python:
- `{% ... %}` for control structures
- `{{ ... }}` for expressions
- Templates access `gs_globals`, `user`, and handler-passed variables

## Configuration

Required config files in `run_dir/`:
- `settings.yaml` - Main config (CouchDB, OAuth, Zendesk, Jira, Slack)
- `.genologicsrc` - LIMS API credentials
- `orderportal_cred.yaml` - Order portal API token

## User Roles

Defined in `status/util.py`:
- `admin` - Full admin access
- `pricing_admin` - Manage pricing
- `sample_requirements_admin` - Manage sample requirements
- `proj_coord` - Project coordinator
- `api_user` - JWT-authenticated API access
