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
      <div class="toolbar-group">
        <button id="btn-load-demo" class="toolbar-btn" title="Load Demo Project">
          📂 Load Demo
        </button>
      </div>
      <div class="toolbar-group toolbar-center">
        <button id="btn-play" class="toolbar-btn" title="Play">▶️ Play</button>
        <button id="btn-pause" class="toolbar-btn" title="Pause" disabled>⏸️ Pause</button>
      </div>
      <div class="toolbar-group">
        <button id="btn-import-state" class="toolbar-btn" title="Import State">📥 Import</button>
        <button id="btn-export-state" class="toolbar-btn" title="Export State">💾 Export State</button>
        <button id="btn-export-flat" class="toolbar-btn" title="Export Flattened Video">🎬 Export Video</button>
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
