#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import json
import shlex
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
PHASE_TO_CATEGORY = {
    "feature": "feature_spec",
    "screen": "screen_spec",
    "architecture": "architecture",
    "design": "design_guide",
    "asset": "asset",
    "api": "api",
    "data": "data",
    "iac": "iac",
    "integration": "integration",
    "nonfunctional": "nonfunctional",
    "security": "security",
    "test": "test",
    "operate": "operate",
}


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inspect and optionally run SDD preflight automation tasks.")
    parser.add_argument(
        "--manifest",
        default=str(Path(__file__).with_name("sdd_preflight_manifest.py")),
        help="Path to the Python preflight manifest.",
    )
    parser.add_argument("--tasks-var", default="PREFLIGHT_TASKS", help="Manifest variable that defines task list.")
    parser.add_argument("--service", action="append", dest="services", help="Filter by service coverage. Repeatable.")
    parser.add_argument("--section", action="append", dest="sections", help="Filter by primary SDD section. Repeatable.")
    parser.add_argument("--category", action="append", dest="categories", help="Filter by category. Repeatable.")
    parser.add_argument("--phase", action="append", dest="phases", help="Compatibility alias for category filter. Repeatable.")
    parser.add_argument("--task", action="append", dest="task_ids", help="Filter by task id. Repeatable.")
    parser.add_argument("--list", action="store_true", help="Compatibility flag. Report output is the default behavior.")
    parser.add_argument("--format", choices=["text", "json"], default="text", help="Output format.")
    parser.add_argument("--run", action="store_true", help="Run actionable automation tasks with missing/stale outputs.")
    parser.add_argument("--force", action="store_true", help="Run actionable automation tasks even when outputs are ready.")
    return parser.parse_args(argv)


def load_python_value(module_path: Path, variable_name: str) -> Any:
    spec = importlib.util.spec_from_file_location(module_path.stem, module_path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Unable to load manifest: {module_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    if not hasattr(module, variable_name):
        raise SystemExit(f"Manifest {module_path} does not define {variable_name}")

    return getattr(module, variable_name)


def to_path(value: str | Path) -> Path:
    path = value if isinstance(value, Path) else Path(value)
    return path if path.is_absolute() else ROOT / path


def ensure_paths(values: list[str | Path]) -> list[Path]:
    return [to_path(value) for value in values]


def collect_existing_files(path: Path) -> list[Path]:
    if not path.exists():
        return []
    if path.is_file():
        return [path]
    files = sorted(child for child in path.rglob("*") if child.is_file())
    return files or [path]


def output_exists(path: Path) -> bool:
    if not path.exists():
        return False
    if path.is_file():
        return True
    return any(child.is_file() for child in path.rglob("*"))


def collect_recipe_outputs(recipes: list[dict[str, Any]]) -> list[Path]:
    outputs: list[Path] = []
    for recipe in recipes:
        output = recipe.get("output")
        if output is not None:
            outputs.append(to_path(output))
        children = recipe.get("children", [])
        if children:
            outputs.extend(collect_recipe_outputs(children))
    return outputs


def resolve_task_outputs(task: dict[str, Any]) -> list[Path]:
    if "output_manifest" in task:
        manifest_info = task["output_manifest"]
        recipes = load_python_value(to_path(manifest_info["manifest"]), manifest_info["recipes_var"])
        return collect_recipe_outputs(recipes)

    if "output_config" in task:
        config_info = task["output_config"]
        config = load_python_value(to_path(config_info["manifest"]), config_info["config_var"])
        return [to_path(config[field]) for field in config_info["fields"]]

    return ensure_paths(task.get("outputs", []))


def resolve_task_inputs(task: dict[str, Any]) -> list[Path]:
    inputs = ensure_paths(task.get("inputs", []))

    if "output_manifest" in task:
        inputs.append(to_path(task["output_manifest"]["manifest"]))

    if "output_config" in task:
        inputs.append(to_path(task["output_config"]["manifest"]))

    return inputs


def compute_status(task: dict[str, Any], inputs: list[Path], outputs: list[Path]) -> str:
    if task["kind"] == "proposal":
        return "missing_automation"

    if not outputs or any(not output_exists(path) for path in outputs):
        return "missing_output"

    input_files: list[Path] = []
    for path in inputs:
        input_files.extend(collect_existing_files(path))

    output_files: list[Path] = []
    for path in outputs:
        output_files.extend(collect_existing_files(path))

    if input_files and output_files:
        newest_input = max(path.stat().st_mtime for path in input_files)
        oldest_output = min(path.stat().st_mtime for path in output_files)
        if newest_input > oldest_output:
            return "stale"

    return "ready"


def matches_filters(
    task: dict[str, Any],
    services: set[str] | None,
    sections: set[str] | None,
    categories: set[str] | None,
    task_ids: set[str] | None,
) -> bool:
    if services:
        coverage = set(task.get("coverage", []))
        if "shared" not in coverage and coverage.isdisjoint(services):
            return False

    if sections and task.get("section") not in sections:
        return False

    if categories and task.get("category") not in categories:
        return False

    if task_ids and task.get("id") not in task_ids:
        return False

    return True


def normalize_categories(raw_categories: list[str] | None, raw_phases: list[str] | None) -> set[str] | None:
    categories = set(raw_categories or [])
    for phase in raw_phases or []:
        categories.add(PHASE_TO_CATEGORY.get(phase, phase))
    return categories or None


def normalize_task_ids(raw_task_ids: list[str] | None) -> set[str] | None:
    if not raw_task_ids:
        return None
    return {task_id.replace("-", "_") for task_id in raw_task_ids}


def to_jsonable(value: Any) -> Any:
    if isinstance(value, Path):
        return str(value.relative_to(ROOT) if value.is_relative_to(ROOT) else value)
    if isinstance(value, list):
        return [to_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: to_jsonable(item) for key, item in value.items()}
    return value


def serialize_task(task: dict[str, Any]) -> dict[str, Any]:
    serialized = to_jsonable(task)
    serialized["inputs"] = [str(path.relative_to(ROOT)) for path in task["resolved_inputs"]]
    serialized["outputs"] = [str(path.relative_to(ROOT)) for path in task["resolved_outputs"]]
    return serialized


def print_text(tasks: list[dict[str, Any]]) -> None:
    for task in tasks:
        section = task.get("section", "unscoped")
        coverage = ",".join(task.get("coverage", []))
        print(f"[{task['status']}] {task['id']} ({section} / {task['category']} / {coverage})")
        print(f"  description: {task['description']}")
        print(f"  required_for: {', '.join(task.get('required_for', []))}")
        if task["kind"] == "proposal":
            print(f"  priority: {task['priority']}")
            print(f"  gap: {task['gap']}")
            suggested = ", ".join(str(path.relative_to(ROOT)) for path in task["resolved_outputs"])
            if suggested:
                print(f"  suggested_artifacts: {suggested}")
        else:
            print(f"  command: {shlex.join(task['command'])}")
            print(f"  inputs: {', '.join(str(path.relative_to(ROOT)) for path in task['resolved_inputs'])}")
            print(f"  outputs: {', '.join(str(path.relative_to(ROOT)) for path in task['resolved_outputs'])}")
        print()


def build_report(args: argparse.Namespace) -> list[dict[str, Any]]:
    tasks = load_python_value(to_path(args.manifest), args.tasks_var)
    if not isinstance(tasks, list):
        raise SystemExit(f"{args.tasks_var} in {args.manifest} must be a list")

    services = set(args.services or []) or None
    sections = set(args.sections or []) or None
    categories = normalize_categories(args.categories, args.phases)
    task_ids = normalize_task_ids(args.task_ids)

    report: list[dict[str, Any]] = []
    for raw_task in tasks:
        if not matches_filters(raw_task, services, sections, categories, task_ids):
            continue

        task = dict(raw_task)
        task["resolved_inputs"] = resolve_task_inputs(task)
        task["resolved_outputs"] = ensure_paths(task.get("suggested_artifacts", [])) if task["kind"] == "proposal" else resolve_task_outputs(task)
        task["status"] = compute_status(task, task["resolved_inputs"], task["resolved_outputs"])
        report.append(task)

    return report


def run_tasks(tasks: list[dict[str, Any]], force: bool) -> int:
    for task in tasks:
        if task["kind"] != "automation":
            continue

        if task["status"] == "ready" and not force:
            print(f"[skip] {task['id']} is ready")
            continue

        if task["status"] == "missing_automation":
            continue

        print(f"[run] {task['id']}: {shlex.join(task['command'])}")
        result = subprocess.run(task["command"], cwd=ROOT)
        if result.returncode != 0:
            return result.returncode

    return 0


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    report = build_report(args)

    if args.format == "json":
        print(json.dumps([serialize_task(task) for task in report], ensure_ascii=False, indent=2))
    else:
        print_text(report)

    if args.run:
        return run_tasks(report, force=args.force)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
