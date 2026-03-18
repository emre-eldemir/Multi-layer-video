#!/usr/bin/env python3
"""
LVM Schema Validator
Validates LVM project files against JSON schemas.

Usage:
    python validate_schema.py <project_dir>

Example:
    python validate_schema.py sample/demo_project.lvm
"""

import sys
import json
from pathlib import Path


def load_json(file_path: str) -> dict:
    """Load and parse a JSON file."""
    with open(file_path, "r") as f:
        return json.load(f)


def validate_manifest(manifest: dict) -> list[str]:
    """Validate manifest.json structure."""
    errors: list[str] = []
    required_fields = [
        "format", "version", "project_id", "title",
        "created_at", "duration_ms", "canvas", "entrypoints", "capabilities"
    ]

    for field in required_fields:
        if field not in manifest:
            errors.append(f"manifest.json: Missing required field '{field}'")

    if "format" in manifest and manifest["format"] != "layered-video-media":
        errors.append(f"manifest.json: Invalid format '{manifest['format']}', expected 'layered-video-media'")

    if "canvas" in manifest:
        canvas = manifest["canvas"]
        for field in ["width", "height", "fps"]:
            if field not in canvas:
                errors.append(f"manifest.json: canvas missing '{field}'")
            elif not isinstance(canvas[field], (int, float)) or canvas[field] <= 0:
                errors.append(f"manifest.json: canvas.{field} must be a positive number")

    if "entrypoints" in manifest:
        for field in ["timeline", "objects", "interactions", "constraints", "preview"]:
            if field not in manifest["entrypoints"]:
                errors.append(f"manifest.json: entrypoints missing '{field}'")

    return errors


def validate_object(obj: dict, index: int) -> list[str]:
    """Validate a single scene object."""
    errors: list[str] = []
    prefix = f"objects[{index}] ({obj.get('id', '?')})"

    required_fields = ["id", "type", "label", "kind", "start_ms", "end_ms", "source_track", "default_layout"]
    for field in required_fields:
        if field not in obj:
            errors.append(f"{prefix}: Missing required field '{field}'")

    if "default_layout" in obj:
        layout = obj["default_layout"]
        for field in ["x", "y", "width", "height", "rotation", "opacity", "z", "visible"]:
            if field not in layout:
                errors.append(f"{prefix}: default_layout missing '{field}'")

    if "start_ms" in obj and "end_ms" in obj:
        if obj["end_ms"] <= obj["start_ms"]:
            errors.append(f"{prefix}: end_ms must be greater than start_ms")

    return errors


def validate_objects(objects_data: dict) -> list[str]:
    """Validate objects.json structure."""
    errors: list[str] = []

    if "objects" not in objects_data:
        errors.append("objects.json: Missing 'objects' array")
        return errors

    for i, obj in enumerate(objects_data["objects"]):
        errors.extend(validate_object(obj, i))

    return errors


def validate_timeline(timeline: dict) -> list[str]:
    """Validate timeline.json structure."""
    errors: list[str] = []

    if "scenes" not in timeline:
        errors.append("timeline.json: Missing 'scenes' array")
        return errors

    for i, scene in enumerate(timeline["scenes"]):
        prefix = f"scenes[{i}] ({scene.get('scene_id', '?')})"
        for field in ["scene_id", "label", "start_ms", "end_ms", "background", "active_objects"]:
            if field not in scene:
                errors.append(f"{prefix}: Missing required field '{field}'")

    return errors


def validate_interactions(interactions: dict) -> list[str]:
    """Validate interactions.json structure."""
    errors: list[str] = []

    if "project_id" not in interactions:
        errors.append("interactions.json: Missing 'project_id'")
    if "actions" not in interactions:
        errors.append("interactions.json: Missing 'actions' array")

    return errors


def validate_project(project_dir: str) -> list[str]:
    """Validate an entire LVM project directory."""
    project_path = Path(project_dir)
    all_errors: list[str] = []

    if not project_path.is_dir():
        return [f"Project directory not found: {project_dir}"]

    # Validate manifest
    manifest_path = project_path / "manifest.json"
    if not manifest_path.exists():
        return ["manifest.json not found"]

    manifest = load_json(str(manifest_path))
    all_errors.extend(validate_manifest(manifest))

    # Validate timeline
    if "entrypoints" in manifest:
        timeline_path = project_path / manifest["entrypoints"].get("timeline", "")
        if timeline_path.exists():
            timeline = load_json(str(timeline_path))
            all_errors.extend(validate_timeline(timeline))
        else:
            all_errors.append(f"Timeline file not found: {timeline_path}")

        # Validate objects
        objects_path = project_path / manifest["entrypoints"].get("objects", "")
        if objects_path.exists():
            objects_data = load_json(str(objects_path))
            all_errors.extend(validate_objects(objects_data))
        else:
            all_errors.append(f"Objects file not found: {objects_path}")

        # Validate interactions
        interactions_path = project_path / manifest["entrypoints"].get("interactions", "")
        if interactions_path.exists():
            interactions = load_json(str(interactions_path))
            all_errors.extend(validate_interactions(interactions))
        else:
            all_errors.append(f"Interactions file not found: {interactions_path}")

    return all_errors


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    project_dir = sys.argv[1]

    print(f"Validating project: {project_dir}")
    print("-" * 50)

    errors = validate_project(project_dir)

    if errors:
        print(f"\n❌ Found {len(errors)} error(s):\n")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)
    else:
        print("\n✅ Project is valid!")
        sys.exit(0)


if __name__ == "__main__":
    main()
