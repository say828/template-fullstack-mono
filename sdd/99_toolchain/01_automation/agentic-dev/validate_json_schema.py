#!/usr/bin/env python3
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: validate_json_schema.py <schema-json> <instance-json>", file=sys.stderr)
        return 1

    schema_path = Path(sys.argv[1])
    instance_path = Path(sys.argv[2])
    if not schema_path.is_file():
        print(f"Schema not found: {schema_path}", file=sys.stderr)
        return 1
    if not instance_path.is_file():
        print(f"Instance not found: {instance_path}", file=sys.stderr)
        return 1

    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    instance = json.loads(instance_path.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(instance), key=lambda error: list(error.absolute_path))
    if errors:
      print("schema_validation=fail")
      for error in errors[:20]:
          path_label = ".".join(str(part) for part in error.absolute_path) or "<root>"
          print(f"- {path_label}: {error.message}")
      return 2

    print("schema_validation=pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
