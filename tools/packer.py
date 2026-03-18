#!/usr/bin/env python3
"""
LVM Packer
Packs an LVM project directory into a .lvm archive (ZIP-based).

Usage:
    python packer.py <project_dir> [output_file]

Example:
    python packer.py sample/demo_project.lvm demo_project.lvm.zip
"""

import os
import sys
import json
import zipfile
from pathlib import Path


def pack_project(project_dir: str, output_file: str | None = None) -> str:
    """Pack an LVM project directory into a .lvm.zip archive."""
    project_path = Path(project_dir)

    if not project_path.is_dir():
        raise FileNotFoundError(f"Project directory not found: {project_dir}")

    manifest_path = project_path / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"manifest.json not found in {project_dir}")

    # Validate manifest
    with open(manifest_path, "r") as f:
        manifest = json.load(f)
    print(f"Packing project: {manifest.get('title', 'Unknown')}")
    print(f"Format: {manifest.get('format', 'Unknown')} v{manifest.get('version', '?')}")

    # Determine output file
    if output_file is None:
        output_file = f"{project_path.name}.zip"

    # Create ZIP archive
    file_count = 0
    with zipfile.ZipFile(output_file, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(project_path):
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(project_path)
                zf.write(file_path, arcname)
                file_count += 1
                print(f"  Added: {arcname}")

    size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"\nPacked {file_count} files into {output_file} ({size_mb:.2f} MB)")
    return output_file


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    project_dir = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        pack_project(project_dir, output_file)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
