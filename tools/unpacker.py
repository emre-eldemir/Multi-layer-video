#!/usr/bin/env python3
"""
LVM Unpacker
Unpacks a .lvm.zip archive into a project directory.

Usage:
    python unpacker.py <archive_file> [output_dir]

Example:
    python unpacker.py demo_project.lvm.zip ./unpacked/
"""

import sys
import json
import zipfile
from pathlib import Path


def unpack_project(archive_file: str, output_dir: str | None = None) -> str:
    """Unpack an LVM archive into a project directory."""
    archive_path = Path(archive_file)

    if not archive_path.exists():
        raise FileNotFoundError(f"Archive not found: {archive_file}")

    if not zipfile.is_zipfile(archive_file):
        raise ValueError(f"Not a valid ZIP file: {archive_file}")

    # Determine output directory
    if output_dir is None:
        output_dir = archive_path.stem.replace(".lvm", "") + "_unpacked"

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Extract files
    file_count = 0
    with zipfile.ZipFile(archive_file, "r") as zf:
        # Security check: no path traversal
        for name in zf.namelist():
            if name.startswith("/") or ".." in name:
                raise ValueError(f"Unsafe path in archive: {name}")

        zf.extractall(output_path)
        file_count = len(zf.namelist())

        for name in zf.namelist():
            print(f"  Extracted: {name}")

    # Validate manifest
    manifest_path = output_path / "manifest.json"
    if manifest_path.exists():
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
        print(f"\nProject: {manifest.get('title', 'Unknown')}")
        print(f"Format: {manifest.get('format', 'Unknown')} v{manifest.get('version', '?')}")
    else:
        print("\nWarning: No manifest.json found in archive")

    print(f"Extracted {file_count} files to {output_dir}")
    return str(output_path)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    archive_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        unpack_project(archive_file, output_dir)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
