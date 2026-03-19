/**
 * Toolbar
 * Top toolbar with playback controls and export buttons.
 */
export interface ToolbarCallbacks {
  onLoadDemo: () => void;
  onPlay: () => void;
  onPause: () => void;
  onExportState: () => void;
  onExportFlattened: () => void;
  onImportState: () => void;
}

export class Toolbar {
  private container: HTMLElement;
  private callbacks: ToolbarCallbacks;
  private playBtn!: HTMLButtonElement;
  private pauseBtn!: HTMLButtonElement;

  constructor(containerId: string, callbacks: ToolbarCallbacks) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.callbacks = callbacks;

    this.render();
    this.bindEvents();
  }

  /**
   * Update play/pause button states
   */
  setPlaying(playing: boolean): void {
    this.playBtn.disabled = playing;
    this.pauseBtn.disabled = !playing;
    this.playBtn.classList.toggle('active', !playing);
    this.pauseBtn.classList.toggle('active', playing);
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="d-flex align-items-center justify-content-between w-100 px-2 h-100 gap-2">
        <div class="d-flex align-items-center gap-1">
          <button id="btn-load-demo" class="btn btn-sm btn-outline-secondary" title="Load Demo Project">
            <i class="bi bi-folder2-open me-1"></i>Load Demo
          </button>
        </div>
        <div class="d-flex align-items-center gap-1">
          <button id="btn-play" class="btn btn-sm btn-outline-light" title="Play">
            <i class="bi bi-play-fill me-1"></i>Play
          </button>
          <button id="btn-pause" class="btn btn-sm btn-outline-light" title="Pause" disabled>
            <i class="bi bi-pause-fill me-1"></i>Pause
          </button>
        </div>
        <div class="d-flex align-items-center gap-1">
          <button id="btn-import-state" class="btn btn-sm btn-outline-secondary" title="Import State">
            <i class="bi bi-box-arrow-in-down me-1"></i>Import
          </button>
          <button id="btn-export-state" class="btn btn-sm btn-outline-secondary" title="Export State">
            <i class="bi bi-save me-1"></i>Export State
          </button>
          <button id="btn-export-flat" class="btn btn-sm btn-outline-secondary" title="Export Flattened Video">
            <i class="bi bi-camera-reels me-1"></i>Export Video
          </button>
        </div>
      </div>
    `;

    this.playBtn = document.getElementById('btn-play') as HTMLButtonElement;
    this.pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement;
  }

  private bindEvents(): void {
    document.getElementById('btn-load-demo')?.addEventListener('click', this.callbacks.onLoadDemo);
    this.playBtn.addEventListener('click', this.callbacks.onPlay);
    this.pauseBtn.addEventListener('click', this.callbacks.onPause);
    document.getElementById('btn-export-state')?.addEventListener('click', this.callbacks.onExportState);
    document.getElementById('btn-export-flat')?.addEventListener('click', this.callbacks.onExportFlattened);
    document.getElementById('btn-import-state')?.addEventListener('click', this.callbacks.onImportState);
  }
}
