#!/usr/bin/env python3
"""
LVM Flatten Export
Exports a flattened (composited) video from an LVM project.

In the MVP version, this is a placeholder that demonstrates the architecture.
A production version would use FFmpeg to composite all layers into a single video.

Usage:
    python flatten_export.py <project_dir> [output_file]

Example:
    python flatten_export.py sample/demo_project.lvm output.mp4
"""

import sys
import json
import subprocess
import shutil
from pathlib import Path


def check_ffmpeg() -> bool:
    """Check if FFmpeg is available."""
    return shutil.which("ffmpeg") is not None


def flatten_export(project_dir: str, output_file: str | None = None) -> str:
    """
    Export a flattened video from an LVM project.

    MVP Implementation:
    - Simply copies the background video as the flattened output
    - TODO: Composite all visible layers at their current positions

    Production Implementation would:
    1. Read manifest and state
    2. For each frame:
       a. Render background
       b. Overlay each visible object at its position/size/opacity
       c. Apply alpha masks
    3. Encode the composited frames into a video file
    """
    project_path = Path(project_dir)

    # Load manifest
    manifest_path = project_path / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"manifest.json not found in {project_dir}")

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    # Load timeline to find background
    timeline_path = project_path / manifest["entrypoints"]["timeline"]
    with open(timeline_path, "r") as f:
        timeline = json.load(f)

    if not timeline["scenes"]:
        raise ValueError("No scenes found in timeline")

    background_src = project_path / timeline["scenes"][0]["background"]

    if output_file is None:
        output_file = "flattened_output.mp4"

    if not check_ffmpeg():
        print("Warning: FFmpeg not found. Copying background as fallback.")
        shutil.copy2(str(background_src), output_file)
        print(f"Copied background to {output_file}")
        return output_file

    # MVP: Re-encode the background video as the flattened output
    # TODO: Add overlay compositing with ffmpeg filter_complex
    print(f"Exporting flattened video from: {manifest.get('title', 'Unknown')}")
    print(f"Canvas: {manifest['canvas']['width']}x{manifest['canvas']['height']} @ {manifest['canvas']['fps']}fps")
    print(f"Duration: {manifest['duration_ms']}ms")
    print()
    print("NOTE: MVP mode - using background video only.")
    print("TODO: Composite object layers using FFmpeg filter_complex")
    print()

    # Simple FFmpeg re-encode of background
    cmd = [
        "ffmpeg", "-y",
        "-i", str(background_src),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-t", str(manifest["duration_ms"] / 1000),
        output_file,
    ]

    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"FFmpeg error:\n{result.stderr}", file=sys.stderr)
        raise RuntimeError("FFmpeg export failed")

    size_mb = Path(output_file).stat().st_size / (1024 * 1024)
    print(f"\nExported: {output_file} ({size_mb:.2f} MB)")
    return output_file


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    project_dir = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        flatten_export(project_dir, output_file)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
