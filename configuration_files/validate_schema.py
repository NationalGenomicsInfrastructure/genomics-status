#!/usr/bin/env python
"""
Validate sample_classification_patterns.json against its JSON schema.

Usage:
    python validate_schema.py
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import jsonschema
    from jsonschema import ValidationError, validate
except ImportError:
    print("Error: jsonschema package not installed")
    print("Install with: pip install jsonschema")
    sys.exit(1)


def validate_config():
    """Validate the sample classification patterns configuration."""
    config_dir = Path(__file__).parent

    # Load configuration first to get schema reference
    config_path = config_dir / "sample_classification_patterns.json"
    with config_path.open() as f:
        config = json.load(f)

    # Get schema path from $schema field
    schema_ref = config.get("$schema")
    if not schema_ref:
        print(f"✗ No $schema field found in {config_path.name}")
        print("  Add a $schema field pointing to the schema file")
        return False

    # Resolve schema path (handle relative paths)
    if schema_ref.startswith("./") or schema_ref.startswith("../"):
        schema_path = (config_path.parent / schema_ref).resolve()
    else:
        # Assume it's in the same directory if not a URL
        schema_path = config_path.parent / schema_ref

    if not schema_path.exists():
        print(f"✗ Schema file not found: {schema_path}")
        return False

    # Load schema
    with schema_path.open() as f:
        schema = json.load(f)

    print(f"Using schema: {schema_path.name}")

    # Validate
    try:
        validate(instance=config, schema=schema)
        print(f"✓ {config_path.name} is valid!")
        return True
    except ValidationError as e:
        print(f"✗ Validation failed for {config_path.name}:")
        print(f"\nError at: {' -> '.join(str(p) for p in e.path)}")
        print(f"Message: {e.message}")
        if e.context:
            print("\nContext:")
            for error in e.context:
                print(f"  - {error.message}")
        return False
    except Exception as e:
        print(f"✗ Error during validation: {e}")
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Validate sample_classification_patterns.json against its JSON schema"
    )
    parser.add_argument(
        "config",
        nargs="?",
        default="sample_classification_patterns.json",
        help="Path to the sample classification patterns JSON file",
    )
    args = parser.parse_args()
    success = validate_config()
    sys.exit(0 if success else 1)
