# Layered Video Media (LVM) — Interactive Multi-Layer Video Player

![LVM Player Screenshot](https://github.com/user-attachments/assets/fed5b160-6956-48ba-be3b-d4a5cee9eace)

## Project Purpose

**Layered Video Media** is a prototype application that reimagines video playback by separating video content into individual, interactive layers. Unlike traditional flat video, LVM allows users to manipulate object layers during playback — toggling visibility, dragging, resizing, reordering z-depth, and exporting the resulting composition.

This is an MVP prototype built to validate the concept. It does not define a new codec; instead, it uses a **container format** (JSON metadata + video assets), a **custom player runtime**, and a **canvas-based compositor**.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    Toolbar                       │
├──────────┬──────────────────────┬───────────────┤
│  Layers  │                      │   Inspector   │
│  Panel   │   Canvas Compositor  │    Panel      │
│          │   (2D Context)       │               │
│          │                      │               │
├──────────┴──────────────────────┴───────────────┤
│               Timeline Slider                    │
├─────────────────────────────────────────────────┤
│                 Status Bar                       │
└─────────────────────────────────────────────────┘
```

### Core Components

| Module | File | Purpose |
|--------|------|---------|
| **Loader** | `app/player/loader.ts` | Loads LVM project (manifest, timeline, objects, interactions) |
| **Timeline** | `app/player/timeline.ts` | Resolves active scene and objects at any given time |
| **State** | `app/player/state.ts` | Manages runtime object state, records actions, supports export/import |
| **Compositor** | `app/player/compositor.ts` | Renders layers to canvas sorted by z-index |
| **Interaction** | `app/player/interaction.ts` | Handles mouse drag, resize, and selection on canvas |
| **Decoder** | `app/player/decoder.ts` | Browser video decode support check (MVP uses HTMLVideoElement) |
| **Exporter** | `app/player/exporter.ts` | Exports interaction state JSON; placeholder for flattened video |
| **Layers Panel** | `app/ui/layers-panel.ts` | Layer list with visibility toggle and z-order controls |
| **Toolbar** | `app/ui/toolbar.ts` | Top toolbar with playback and export buttons |
| **Inspector** | `app/ui/inspector.ts` | Property editor for selected object (position, size, opacity, z) |

### Data Flow

```
manifest.json ──┐
timeline.json ──┼──► Loader ──► TimelineManager ──► Compositor ──► Canvas
objects.json  ──┤                                        ▲
interactions  ──┘       StateManager ◄──► InteractionHandler
                              │
                    LayersPanel / Inspector / Exporter
```

## Installation

```bash
# Clone the repository
git clone https://github.com/emre-eldemir/Multi-layer-video.git
cd Multi-layer-video

# Install dependencies
npm install
```

## Development Commands

```bash
# Start development server (opens at http://localhost:3000)
npm run dev

# Type-check
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

## How to Run the Demo

1. Start the dev server: `npm run dev`
2. The app auto-loads the demo project on startup
3. Use the **Layers Panel** (left) to toggle visibility, reorder layers
4. Click an object on canvas or in the layer list to select it
5. Drag objects on the canvas to reposition them
6. Use corner handles to resize selected objects
7. Edit precise values in the **Inspector Panel** (right)
8. Use the **Timeline Slider** to scrub through time (Info Chart appears at 5s)
9. Click **Export State** to download your interaction changes as JSON
10. Click **Import** to reload a previously exported state

## File Format (.lvm)

An LVM project is a directory (or ZIP archive) containing:

```
demo_project.lvm/
├── manifest.json              # Project metadata, canvas config, capabilities
├── timeline.json              # Scene definitions with time ranges
├── metadata/
│   ├── objects.json           # Object definitions (layout, interaction, constraints)
│   ├── interactions.json      # Recorded user interaction actions
│   └── constraints.json       # Global constraints (canvas bounds, grid)
├── assets/
│   ├── video/                 # Object video tracks (MP4)
│   │   ├── background.mp4
│   │   ├── speaker.mp4
│   │   ├── logo.mp4
│   │   └── chart.mp4
│   └── alpha/                 # Alpha/mask tracks (WebM)
│       └── speaker_alpha.webm
└── previews/
    └── flattened_preview.mp4  # Pre-rendered fallback video
```

### manifest.json

Defines project metadata, canvas dimensions (1280×720 @ 30fps), entrypoints to other files, and supported capabilities (drag, resize, toggle, z-reorder, export).

### objects.json

Each object has:
- **Identity**: id, type (video/image/overlay), label, kind (speaker/logo/chart)
- **Timing**: start_ms, end_ms
- **Sources**: source_track, alpha_track
- **Layout**: x, y, width, height, rotation, opacity, z, visible
- **Interaction**: draggable, resizable, rotatable, toggleable, z_reorderable
- **Constraints**: bounds, min/max width, lock_aspect_ratio

### interaction state

Actions recorded during playback:
- `set_visible` — toggle layer visibility
- `move` — change position (x, y)
- `resize` — change dimensions (width, height)
- `set_z` — change z-index ordering
- `set_opacity` — change transparency
- `rotate` — change rotation (future)

## Python Tools

```bash
# Validate project structure
python3 tools/validate_schema.py sample/demo_project.lvm

# Pack project into ZIP archive
python3 tools/packer.py sample/demo_project.lvm output.lvm.zip

# Unpack archive
python3 tools/unpacker.py output.lvm.zip ./unpacked/

# Export flattened video (MVP: re-encodes background only)
python3 tools/flatten_export.py sample/demo_project.lvm output.mp4
```

## JSON Schemas

Validation schemas are in `schemas/`:
- `manifest.schema.json` — Manifest structure
- `object.schema.json` — Scene object definition
- `interaction.schema.json` — Interaction state format

## Project Structure

```
├── app/                       # Frontend application (TypeScript + Vite)
│   ├── index.html             # HTML entry point
│   ├── main.ts                # Application bootstrap
│   ├── types/index.ts         # TypeScript type definitions
│   ├── player/                # Player core modules
│   │   ├── loader.ts          # Project loader
│   │   ├── timeline.ts        # Timeline manager
│   │   ├── state.ts           # State manager
│   │   ├── compositor.ts      # Canvas compositor
│   │   ├── decoder.ts         # Decoder support
│   │   ├── interaction.ts     # Mouse interaction handler
│   │   └── exporter.ts        # State/video export
│   ├── ui/                    # UI components
│   │   ├── layers-panel.ts    # Layer list panel
│   │   ├── toolbar.ts         # Top toolbar
│   │   └── inspector.ts       # Property inspector
│   └── styles/app.css         # Application styles
├── sample/                    # Demo project data
│   └── demo_project.lvm/      # Sample LVM project
├── schemas/                   # JSON validation schemas
├── tools/                     # Python utilities
│   ├── packer.py              # Pack project to ZIP
│   ├── unpacker.py            # Unpack ZIP to project
│   ├── validate_schema.py     # Validate project files
│   └── flatten_export.py      # Export flattened video
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Known Limitations (MVP)

- **No real video compositing in export** — flattened video export is a placeholder; only re-encodes background
- **No alpha channel rendering** — alpha/mask architecture is prepared but not implemented in the compositor
- **No real-time streaming** — all assets are loaded locally
- **No multi-user collaboration** — single-user, single-session only
- **No rotation support** — rotation fields exist in the data model but are not rendered
- **No WebCodecs** — uses standard HTMLVideoElement; no frame-accurate seeking
- **Placeholder demo videos** — solid color rectangles with text labels, not real content
- **No undo/redo** — actions are recorded but there's no undo mechanism
- **No keyboard shortcuts** — all interaction is mouse/button based

## Future Development

### Phase 2 — Enhanced Rendering
- WebGL-based compositor for better performance
- Alpha channel video support (VP9/AV1 with alpha)
- WebCodecs API for frame-accurate seeking
- Real-time canvas-to-video export via MediaRecorder

### Phase 3 — Advanced Interaction
- Undo/redo system
- Keyboard shortcuts
- Snap-to-grid and alignment guides
- Multi-select and group operations
- Rotation support
- Animation keyframes per object

### Phase 4 — Production Pipeline
- Server-side FFmpeg compositing (via flatten_export.py)
- Object extraction pipeline (OpenCV-based segmentation)
- Project file upload/download
- Real .lvm container format (beyond ZIP)
- Streaming playback support

### Phase 5 — Collaboration
- Multi-user real-time editing
- Version history
- Comments and annotations
- Shared project hosting

## License

MIT