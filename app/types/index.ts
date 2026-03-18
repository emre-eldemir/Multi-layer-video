/**
 * Layered Video Media - Type Definitions
 * Core data models for the LVM format
 */

// ─── Canvas Configuration ───────────────────────────────────────────
export interface CanvasConfig {
  width: number;
  height: number;
  fps: number;
}

// ─── Manifest ───────────────────────────────────────────────────────
export interface Manifest {
  format: string;
  version: string;
  project_id: string;
  title: string;
  created_at: string;
  duration_ms: number;
  canvas: CanvasConfig;
  entrypoints: {
    timeline: string;
    objects: string;
    interactions: string;
    constraints: string;
    preview: string;
  };
  capabilities: {
    toggle_visibility: boolean;
    drag_move: boolean;
    resize: boolean;
    rotate: boolean;
    z_reorder: boolean;
    export_state: boolean;
  };
}

// ─── Object Layout ──────────────────────────────────────────────────
export interface ObjectLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  z: number;
  visible: boolean;
}

// ─── Object Interaction Config ──────────────────────────────────────
export interface ObjectInteraction {
  draggable: boolean;
  resizable: boolean;
  rotatable: boolean;
  toggleable: boolean;
  z_reorderable: boolean;
}

// ─── Object Constraints ─────────────────────────────────────────────
export interface ObjectConstraints {
  bounds: { x_min: number; x_max: number; y_min: number; y_max: number };
  min_width: number;
  max_width: number;
  lock_aspect_ratio: boolean;
}

// ─── Scene Object ───────────────────────────────────────────────────
export interface SceneObject {
  id: string;
  type: string;
  label: string;
  kind: string;
  start_ms: number;
  end_ms: number;
  source_track: string;
  alpha_track: string;
  default_layout: ObjectLayout;
  interaction: ObjectInteraction;
  constraints: ObjectConstraints;
}

// ─── Timeline Scene ─────────────────────────────────────────────────
export interface TimelineScene {
  scene_id: string;
  label: string;
  start_ms: number;
  end_ms: number;
  background: string;
  active_objects: string[];
}

// ─── Timeline ───────────────────────────────────────────────────────
export interface Timeline {
  scenes: TimelineScene[];
}

// ─── Interaction Action ─────────────────────────────────────────────
export type InteractionActionType = 'set_visible' | 'move' | 'resize' | 'set_z' | 'set_opacity' | 'rotate';

export interface InteractionAction {
  time_ms: number;
  object_id: string;
  action: InteractionActionType;
  value: Record<string, unknown>;
}

// ─── Interaction State ──────────────────────────────────────────────
export interface InteractionState {
  project_id: string;
  actions: InteractionAction[];
}

// ─── Runtime Object State ───────────────────────────────────────────
export interface RuntimeObjectState {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  z: number;
  visible: boolean;
}

// ─── Project Data ───────────────────────────────────────────────────
export interface ProjectData {
  manifest: Manifest;
  timeline: Timeline;
  objects: SceneObject[];
  interactions: InteractionState;
}

// ─── Player State ───────────────────────────────────────────────────
export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  selectedObjectId: string | null;
}
