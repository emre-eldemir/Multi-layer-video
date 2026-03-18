/**
 * Layered Video Media - Main Application
 * Entry point that wires together loader, player, compositor, UI panels, and interaction.
 */
import { loadProject } from '@/player/loader';
import { TimelineManager } from '@/player/timeline';
import { StateManager } from '@/player/state';
import { Compositor } from '@/player/compositor';
import { InteractionHandler } from '@/player/interaction';
import { checkDecoderSupport, FrameDecoder } from '@/player/decoder';
import { exportState, exportFlattenedVideo, importStateFromFile } from '@/player/exporter';
import { LayersPanel } from '@/ui/layers-panel';
import { Toolbar } from '@/ui/toolbar';
import { InspectorPanel } from '@/ui/inspector';
import type { ProjectData, SceneObject } from '@/types';

import './styles/app.css';

// ─── Application State ──────────────────────────────────────────────

let projectData: ProjectData | null = null;
let timelineManager: TimelineManager | null = null;
let stateManager: StateManager | null = null;
let compositor: Compositor | null = null;
let interaction: InteractionHandler | null = null;
let layersPanel: LayersPanel | null = null;
let inspectorPanel: InspectorPanel | null = null;

let playing = false;
let currentTimeMs = 0;
let animationFrameId: number | null = null;
let lastFrameTime: number | null = null;

// ─── DOM Elements ───────────────────────────────────────────────────

const canvas = document.getElementById('player-canvas') as HTMLCanvasElement;
const timelineSlider = document.getElementById('timeline-slider') as HTMLInputElement;
const timeDisplay = document.getElementById('time-display') as HTMLElement;
const statusBar = document.getElementById('status-bar') as HTMLElement;

// ─── Initialization ─────────────────────────────────────────────────

async function init(): Promise<void> {
  // Check decoder support
  const decoderCheck = checkDecoderSupport();
  const decoder = new FrameDecoder();
  await decoder.initialize();
  setStatus(decoderCheck.message);

  // Setup toolbar
  new Toolbar('toolbar', {
    onLoadDemo: () => loadDemo(),
    onPlay: () => play(),
    onPause: () => pause(),
    onExportState: () => {
      if (stateManager) exportState(stateManager);
    },
    onExportFlattened: () => exportFlattenedVideo(),
    onImportState: () => handleImportState(),
  });

  // Auto-load demo on startup
  await loadDemo();
}

// ─── Project Loading ────────────────────────────────────────────────

async function loadDemo(): Promise<void> {
  try {
    setStatus('Loading demo project...');
    projectData = await loadProject('demo_project.lvm');

    const { manifest, timeline, objects, interactions } = projectData;

    // Create managers
    timelineManager = new TimelineManager(timeline, objects);
    stateManager = new StateManager(objects, manifest.project_id);

    // Import existing interactions if any
    if (interactions.actions.length > 0) {
      stateManager.importState(interactions, objects);
    }

    // Setup canvas and compositor
    const { width, height } = manifest.canvas;
    compositor = new Compositor(canvas, width, height);

    // Update scale for interaction handling
    updateCanvasScale();

    // Setup interaction handler
    interaction = new InteractionHandler(canvas, stateManager, compositor, objects);

    // Setup UI panels
    layersPanel = new LayersPanel('layers-panel', stateManager, objects, (id) => {
      selectObject(id);
    });

    inspectorPanel = new InspectorPanel('inspector-panel', stateManager, objects);

    // Wire up selection sync
    interaction.onSelectionChange((id) => {
      layersPanel?.setSelected(id);
      inspectorPanel?.setSelected(id);
    });

    // Setup timeline slider
    const durationMs = manifest.duration_ms;
    timelineSlider.max = String(durationMs);
    timelineSlider.value = '0';
    timelineSlider.addEventListener('input', () => {
      currentTimeMs = parseInt(timelineSlider.value, 10);
      updateTimeDisplay();
      renderFrame();
    });

    // Load videos
    await loadVideos(objects, manifest.canvas.width, manifest.canvas.height);

    // State change handler - re-render on any state change
    stateManager.onChange(() => renderFrame());

    // Initial render
    currentTimeMs = 0;
    renderFrame();
    updateTimeDisplay();

    setStatus(`Loaded: ${manifest.title} (${formatTime(durationMs)})`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    setStatus(`Error: ${msg}`);
    console.error('Failed to load project:', error);
  }
}

// ─── Video Loading ──────────────────────────────────────────────────

async function loadVideos(objects: SceneObject[], _canvasW: number, _canvasH: number): Promise<void> {
  if (!compositor || !timelineManager) return;

  // Load background video from the first scene
  const scene = timelineManager.getActiveScene(0);
  if (scene?.background) {
    try {
      await compositor.loadBackground(`demo_project.lvm/${scene.background}`);
    } catch (err) {
      console.warn('Failed to load background video, using placeholder:', err);
    }
  }

  // Load object videos
  for (const obj of objects) {
    if (obj.source_track) {
      try {
        await compositor.loadVideo(obj.id, `demo_project.lvm/${obj.source_track}`);
      } catch (err) {
        console.warn(`Failed to load video for ${obj.id}, using placeholder:`, err);
      }
    }
  }
}

// ─── Playback ───────────────────────────────────────────────────────

function play(): void {
  if (!projectData || !compositor) return;
  playing = true;
  lastFrameTime = performance.now();
  compositor.playAll();
  scheduleFrame();
  updateToolbarState();
  setStatus('Playing');
}

function pause(): void {
  playing = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  compositor?.pauseAll();
  updateToolbarState();
  setStatus('Paused');
}

function scheduleFrame(): void {
  animationFrameId = requestAnimationFrame(onAnimationFrame);
}

function onAnimationFrame(timestamp: number): void {
  if (!playing || !projectData) return;

  // Calculate elapsed time
  if (lastFrameTime !== null) {
    const deltaMs = timestamp - lastFrameTime;
    currentTimeMs += deltaMs;

    // Loop at end
    if (currentTimeMs >= projectData.manifest.duration_ms) {
      currentTimeMs = 0;
      compositor?.syncVideos(0, true);
    }
  }
  lastFrameTime = timestamp;

  // Update timeline slider
  timelineSlider.value = String(Math.round(currentTimeMs));
  updateTimeDisplay();

  // Sync video elements
  compositor?.syncVideos(currentTimeMs / 1000, true);

  // Render frame
  renderFrame();

  // Continue animation
  scheduleFrame();
}

// ─── Rendering ──────────────────────────────────────────────────────

function renderFrame(): void {
  if (!compositor || !timelineManager || !stateManager) return;

  const activeObjects = timelineManager.getActiveObjects(currentTimeMs);
  const states = stateManager.getAllStates();
  const selectedId = interaction?.getSelectedObjectId() ?? null;

  // Update interaction handler with current active objects
  interaction?.setActiveObjects(activeObjects);

  compositor.render(activeObjects, states, selectedId);
}

// ─── Object Selection ───────────────────────────────────────────────

function selectObject(id: string | null): void {
  interaction?.selectObject(id);
  layersPanel?.setSelected(id);
  inspectorPanel?.setSelected(id);
  renderFrame();
}

// ─── Import State ───────────────────────────────────────────────────

function handleImportState(): void {
  if (!stateManager || !projectData) return;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const state = await importStateFromFile(file);
      stateManager!.importState(state, projectData!.objects);
      renderFrame();
      setStatus('State imported successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatus(`Import error: ${msg}`);
    }
  });
  input.click();
}

// ─── UI Helpers ─────────────────────────────────────────────────────

function updateCanvasScale(): void {
  if (!compositor || !interaction) return;
  const { width, height } = compositor.getCanvasDimensions();
  const rect = canvas.getBoundingClientRect();
  interaction.setScale(width / rect.width, height / rect.height);
}

function updateToolbarState(): void {
  const playBtn = document.getElementById('btn-play') as HTMLButtonElement | null;
  const pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement | null;
  if (playBtn) playBtn.disabled = playing;
  if (pauseBtn) pauseBtn.disabled = !playing;
}

function updateTimeDisplay(): void {
  if (timeDisplay) {
    const total = projectData?.manifest.duration_ms ?? 0;
    timeDisplay.textContent = `${formatTime(currentTimeMs)} / ${formatTime(total)}`;
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function setStatus(msg: string): void {
  if (statusBar) statusBar.textContent = msg;
  console.log(`[LVM] ${msg}`);
}

// ─── Window Resize Handling ─────────────────────────────────────────

window.addEventListener('resize', () => {
  if (interaction && compositor) {
    updateCanvasScale();
  }
});

// ─── Start Application ──────────────────────────────────────────────

init().catch((err) => {
  console.error('Application initialization failed:', err);
  setStatus('Failed to initialize application');
});
