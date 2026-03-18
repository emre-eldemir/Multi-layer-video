/**
 * Interaction Handler
 * Manages mouse/pointer interactions on the canvas including
 * object selection, dragging, and resizing.
 */
import type { SceneObject, RuntimeObjectState } from '@/types';
import type { StateManager } from './state';
import type { Compositor } from './compositor';

type DragMode = 'none' | 'move' | 'resize';
type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

interface DragState {
  mode: DragMode;
  objectId: string | null;
  startX: number;
  startY: number;
  startObjX: number;
  startObjY: number;
  startObjW: number;
  startObjH: number;
  resizeCorner: ResizeCorner | null;
}

export class InteractionHandler {
  private canvas: HTMLCanvasElement;
  private stateManager: StateManager;
  private compositor: Compositor;
  private objects: SceneObject[];
  private dragState: DragState;
  private selectedObjectId: string | null = null;
  private selectionListeners: Array<(id: string | null) => void> = [];
  private scaleX = 1;
  private scaleY = 1;

  constructor(
    canvas: HTMLCanvasElement,
    stateManager: StateManager,
    compositor: Compositor,
    objects: SceneObject[]
  ) {
    this.canvas = canvas;
    this.stateManager = stateManager;
    this.compositor = compositor;
    this.objects = objects;
    this.dragState = this.resetDrag();

    this.bindEvents();
  }

  /**
   * Set the display-to-canvas scale ratio (for CSS-scaled canvases)
   */
  setScale(scaleX: number, scaleY: number): void {
    this.scaleX = scaleX;
    this.scaleY = scaleY;
  }

  /**
   * Reset drag state
   */
  private resetDrag(): DragState {
    return {
      mode: 'none',
      objectId: null,
      startX: 0,
      startY: 0,
      startObjX: 0,
      startObjY: 0,
      startObjW: 0,
      startObjH: 0,
      resizeCorner: null,
    };
  }

  /**
   * Bind mouse events
   */
  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
  }

  /**
   * Get canvas-space coordinates from mouse event
   */
  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * this.scaleX,
      y: (e.clientY - rect.top) * this.scaleY,
    };
  }

  /**
   * Find which object is under the mouse cursor
   */
  private hitTest(x: number, y: number): SceneObject | null {
    // Check objects in reverse z-order (top first)
    const states = this.stateManager.getAllStates();
    const sorted = [...this.objects]
      .filter((obj) => {
        const state = states.get(obj.id);
        return state && state.visible;
      })
      .sort((a, b) => {
        const sa = states.get(a.id)!;
        const sb = states.get(b.id)!;
        return sb.z - sa.z;
      });

    for (const obj of sorted) {
      const state = states.get(obj.id)!;
      if (
        x >= state.x &&
        x <= state.x + state.width &&
        y >= state.y &&
        y <= state.y + state.height
      ) {
        return obj;
      }
    }
    return null;
  }

  /**
   * Check if the mouse is over a resize handle
   */
  private hitTestResizeHandle(
    x: number,
    y: number
  ): { objectId: string; corner: ResizeCorner } | null {
    if (!this.selectedObjectId) return null;

    const state = this.stateManager.getObjectState(this.selectedObjectId);
    if (!state) return null;

    const handles = this.compositor.getResizeHandles(state);
    const threshold = 10;

    for (const handle of handles) {
      if (
        Math.abs(x - handle.x) <= threshold &&
        Math.abs(y - handle.y) <= threshold
      ) {
        return { objectId: this.selectedObjectId, corner: handle.corner as ResizeCorner };
      }
    }
    return null;
  }

  /**
   * Handle mouse down
   */
  private onMouseDown(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);

    // Check resize handles first
    const resizeHit = this.hitTestResizeHandle(x, y);
    if (resizeHit) {
      const obj = this.objects.find((o) => o.id === resizeHit.objectId);
      if (obj?.interaction.resizable) {
        const state = this.stateManager.getObjectState(resizeHit.objectId)!;
        this.dragState = {
          mode: 'resize',
          objectId: resizeHit.objectId,
          startX: x,
          startY: y,
          startObjX: state.x,
          startObjY: state.y,
          startObjW: state.width,
          startObjH: state.height,
          resizeCorner: resizeHit.corner,
        };
        return;
      }
    }

    // Check object hit
    const hitObj = this.hitTest(x, y);
    if (hitObj) {
      this.selectObject(hitObj.id);
      if (hitObj.interaction.draggable) {
        const state = this.stateManager.getObjectState(hitObj.id)!;
        this.dragState = {
          mode: 'move',
          objectId: hitObj.id,
          startX: x,
          startY: y,
          startObjX: state.x,
          startObjY: state.y,
          startObjW: state.width,
          startObjH: state.height,
          resizeCorner: null,
        };
      }
    } else {
      this.selectObject(null);
    }
  }

  /**
   * Handle mouse move
   */
  private onMouseMove(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);

    if (this.dragState.mode === 'move' && this.dragState.objectId) {
      const dx = x - this.dragState.startX;
      const dy = y - this.dragState.startY;
      const newX = this.dragState.startObjX + dx;
      const newY = this.dragState.startObjY + dy;

      this.stateManager.applyAction(this.dragState.objectId, 'move', { x: newX, y: newY });
    } else if (this.dragState.mode === 'resize' && this.dragState.objectId) {
      const dx = x - this.dragState.startX;
      const dy = y - this.dragState.startY;
      let newW = this.dragState.startObjW;
      let newH = this.dragState.startObjH;
      let newX = this.dragState.startObjX;
      let newY = this.dragState.startObjY;

      const obj = this.objects.find((o) => o.id === this.dragState.objectId);
      const lockAspect = obj?.constraints?.lock_aspect_ratio ?? false;
      const aspect = this.dragState.startObjW / this.dragState.startObjH;

      switch (this.dragState.resizeCorner) {
        case 'se':
          newW = Math.max(50, this.dragState.startObjW + dx);
          newH = lockAspect ? newW / aspect : Math.max(50, this.dragState.startObjH + dy);
          break;
        case 'sw':
          newW = Math.max(50, this.dragState.startObjW - dx);
          newH = lockAspect ? newW / aspect : Math.max(50, this.dragState.startObjH + dy);
          newX = this.dragState.startObjX + (this.dragState.startObjW - newW);
          break;
        case 'ne':
          newW = Math.max(50, this.dragState.startObjW + dx);
          newH = lockAspect ? newW / aspect : Math.max(50, this.dragState.startObjH - dy);
          newY = this.dragState.startObjY + (this.dragState.startObjH - newH);
          break;
        case 'nw':
          newW = Math.max(50, this.dragState.startObjW - dx);
          newH = lockAspect ? newW / aspect : Math.max(50, this.dragState.startObjH - dy);
          newX = this.dragState.startObjX + (this.dragState.startObjW - newW);
          newY = this.dragState.startObjY + (this.dragState.startObjH - newH);
          break;
      }

      // Apply constraints
      if (obj?.constraints) {
        newW = Math.max(obj.constraints.min_width, Math.min(obj.constraints.max_width, newW));
        if (lockAspect) newH = newW / aspect;
      }

      this.stateManager.applyAction(this.dragState.objectId, 'resize', { width: newW, height: newH });
      this.stateManager.applyAction(this.dragState.objectId, 'move', { x: newX, y: newY });
    }

    // Update cursor
    const resizeHit = this.hitTestResizeHandle(x, y);
    if (resizeHit) {
      const cursorMap: Record<string, string> = {
        nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
      };
      this.canvas.style.cursor = cursorMap[resizeHit.corner] ?? 'default';
    } else if (this.hitTest(x, y)) {
      this.canvas.style.cursor = 'grab';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * Handle mouse up
   */
  private onMouseUp(): void {
    this.dragState = this.resetDrag();
  }

  /**
   * Select an object
   */
  selectObject(id: string | null): void {
    this.selectedObjectId = id;
    for (const listener of this.selectionListeners) {
      listener(id);
    }
  }

  /**
   * Get currently selected object ID
   */
  getSelectedObjectId(): string | null {
    return this.selectedObjectId;
  }

  /**
   * Subscribe to selection changes
   */
  onSelectionChange(listener: (id: string | null) => void): void {
    this.selectionListeners.push(listener);
  }

  /**
   * Update the objects list (e.g. when active objects change)
   */
  setActiveObjects(objects: SceneObject[]): void {
    this.objects = objects;
  }
}
