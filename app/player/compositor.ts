/**
 * Compositor
 * Renders the scene to a canvas by compositing background and object layers
 * sorted by z-index. Handles video elements, positioning, opacity, and
 * selection indicators.
 */
import type { SceneObject, RuntimeObjectState } from '@/types';

/** Handle size for resize corners */
const HANDLE_SIZE = 8;
/** Selection border color */
const SELECTION_COLOR = '#00d4ff';
/** Selection border width */
const SELECTION_BORDER = 2;

export class Compositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElements: Map<string, HTMLVideoElement> = new Map();
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.canvasWidth = width;
    this.canvasHeight = height;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D rendering context');
    this.ctx = ctx;
  }

  /**
   * Pre-load a video element for an object
   */
  async loadVideo(objectId: string, src: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = src;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.loop = true;

      video.addEventListener('loadeddata', () => {
        this.videoElements.set(objectId, video);
        resolve(video);
      });
      video.addEventListener('error', () => {
        reject(new Error(`Failed to load video: ${src}`));
      });
    });
  }

  /**
   * Load the background video
   */
  async loadBackground(src: string): Promise<HTMLVideoElement> {
    return this.loadVideo('__background__', src);
  }

  /**
   * Get a loaded video element
   */
  getVideo(objectId: string): HTMLVideoElement | undefined {
    return this.videoElements.get(objectId);
  }

  /**
   * Render a single frame
   */
  render(
    activeObjects: SceneObject[],
    states: Map<string, RuntimeObjectState>,
    selectedObjectId: string | null,
    backgroundSrc?: string
  ): void {
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Draw dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Draw background video if available
    const bgVideo = this.videoElements.get('__background__');
    if (bgVideo && bgVideo.readyState >= 2) {
      ctx.drawImage(bgVideo, 0, 0, w, h);
    }

    // Sort active objects by z-index
    const sortedObjects = [...activeObjects].sort((a, b) => {
      const stateA = states.get(a.id);
      const stateB = states.get(b.id);
      return (stateA?.z ?? 0) - (stateB?.z ?? 0);
    });

    // Draw each object
    for (const obj of sortedObjects) {
      const state = states.get(obj.id);
      if (!state || !state.visible) continue;

      ctx.save();
      ctx.globalAlpha = state.opacity;

      // Draw the object video/image
      const video = this.videoElements.get(obj.id);
      if (video && video.readyState >= 2) {
        ctx.drawImage(video, state.x, state.y, state.width, state.height);
      } else {
        // Fallback: draw colored placeholder rectangle
        this.drawPlaceholder(ctx, obj, state);
      }

      ctx.restore();

      // Draw selection indicator
      if (obj.id === selectedObjectId) {
        this.drawSelection(ctx, state);
      }
    }
  }

  /**
   * Draw a placeholder rectangle for objects whose video hasn't loaded
   */
  private drawPlaceholder(
    ctx: CanvasRenderingContext2D,
    obj: SceneObject,
    state: RuntimeObjectState
  ): void {
    const colors: Record<string, string> = {
      speaker: '#2d6a4f',
      logo: '#e63946',
      chart: '#264653',
      info_panel: '#457b9d',
      overlay: '#6c757d',
      background: '#1a1a2e',
    };

    ctx.fillStyle = colors[obj.kind] ?? '#555555';
    ctx.fillRect(state.x, state.y, state.width, state.height);

    // Draw label
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      obj.label,
      state.x + state.width / 2,
      state.y + state.height / 2
    );
  }

  /**
   * Draw selection border and resize handles
   */
  private drawSelection(
    ctx: CanvasRenderingContext2D,
    state: RuntimeObjectState
  ): void {
    ctx.strokeStyle = SELECTION_COLOR;
    ctx.lineWidth = SELECTION_BORDER;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(state.x, state.y, state.width, state.height);
    ctx.setLineDash([]);

    // Draw resize handles at corners
    const handles = this.getResizeHandles(state);
    ctx.fillStyle = SELECTION_COLOR;
    for (const handle of handles) {
      ctx.fillRect(
        handle.x - HANDLE_SIZE / 2,
        handle.y - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
    }
  }

  /**
   * Get resize handle positions for a given state
   */
  getResizeHandles(state: RuntimeObjectState): Array<{ x: number; y: number; corner: string }> {
    return [
      { x: state.x, y: state.y, corner: 'nw' },
      { x: state.x + state.width, y: state.y, corner: 'ne' },
      { x: state.x, y: state.y + state.height, corner: 'sw' },
      { x: state.x + state.width, y: state.y + state.height, corner: 'se' },
    ];
  }

  /**
   * Sync all video playback to a given time
   */
  syncVideos(timeSeconds: number, playing: boolean): void {
    for (const [, video] of this.videoElements) {
      if (Math.abs(video.currentTime - timeSeconds) > 0.1) {
        video.currentTime = timeSeconds;
      }
      if (playing && video.paused) {
        video.play().catch(() => { /* ignore autoplay errors */ });
      } else if (!playing && !video.paused) {
        video.pause();
      }
    }
  }

  /**
   * Pause all videos
   */
  pauseAll(): void {
    for (const [, video] of this.videoElements) {
      video.pause();
    }
  }

  /**
   * Play all videos
   */
  playAll(): void {
    for (const [, video] of this.videoElements) {
      video.play().catch(() => { /* ignore autoplay errors */ });
    }
  }

  /**
   * Get canvas dimensions
   */
  getCanvasDimensions(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }
}
