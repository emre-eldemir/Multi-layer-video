/**
 * Inspector Panel
 * Shows detailed properties of the selected object and allows editing.
 */
import type { SceneObject } from '@/types';
import type { StateManager } from '@/player/state';
import { escapeHtml } from './utils';

export class InspectorPanel {
  private container: HTMLElement;
  private stateManager: StateManager;
  private objects: SceneObject[];
  private selectedObjectId: string | null = null;

  constructor(
    containerId: string,
    stateManager: StateManager,
    objects: SceneObject[]
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.stateManager = stateManager;
    this.objects = objects;

    this.render();
    this.stateManager.onChange(() => this.render());
  }

  /**
   * Set the selected object to inspect
   */
  setSelected(id: string | null): void {
    this.selectedObjectId = id;
    this.render();
  }

  /**
   * Render the inspector panel
   */
  private render(): void {
    if (!this.selectedObjectId) {
      this.container.innerHTML = `
        <div class="panel-header">
          <span class="panel-title">Inspector</span>
        </div>
        <div class="inspector-empty">
          <p>Select an object to inspect its properties</p>
        </div>
      `;
      return;
    }

    const obj = this.objects.find((o) => o.id === this.selectedObjectId);
    const state = this.stateManager.getObjectState(this.selectedObjectId);

    if (!obj || !state) {
      this.container.innerHTML = `
        <div class="panel-header">
          <span class="panel-title">Inspector</span>
        </div>
        <div class="inspector-empty">
          <p>Object not found</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">Inspector</span>
      </div>
      <div class="inspector-content">
        <div class="inspector-section">
          <h4>${escapeHtml(obj.label)}</h4>
          <span class="inspector-badge">${escapeHtml(obj.kind)}</span>
          <span class="inspector-badge">${escapeHtml(obj.type)}</span>
        </div>

        <div class="inspector-section">
          <label>Position</label>
          <div class="inspector-row">
            <div class="inspector-field">
              <span>X</span>
              <input type="number" class="inspector-input" data-prop="x" value="${Math.round(state.x)}" />
            </div>
            <div class="inspector-field">
              <span>Y</span>
              <input type="number" class="inspector-input" data-prop="y" value="${Math.round(state.y)}" />
            </div>
          </div>
        </div>

        <div class="inspector-section">
          <label>Size</label>
          <div class="inspector-row">
            <div class="inspector-field">
              <span>W</span>
              <input type="number" class="inspector-input" data-prop="width" value="${Math.round(state.width)}" />
            </div>
            <div class="inspector-field">
              <span>H</span>
              <input type="number" class="inspector-input" data-prop="height" value="${Math.round(state.height)}" />
            </div>
          </div>
        </div>

        <div class="inspector-section">
          <label>Opacity</label>
          <input type="range" class="inspector-slider" data-prop="opacity"
            min="0" max="1" step="0.05" value="${state.opacity}" />
          <span class="inspector-value">${(state.opacity * 100).toFixed(0)}%</span>
        </div>

        <div class="inspector-section">
          <label>Z-Index</label>
          <input type="number" class="inspector-input" data-prop="z" value="${state.z}" />
        </div>

        <div class="inspector-section">
          <label>Visible</label>
          <input type="checkbox" class="inspector-checkbox" data-prop="visible" ${state.visible ? 'checked' : ''} />
        </div>
      </div>
    `;

    this.bindInputEvents();
  }

  /**
   * Bind input change events for editing properties
   */
  private bindInputEvents(): void {
    if (!this.selectedObjectId) return;
    const id = this.selectedObjectId;

    // Number inputs (x, y, width, height, z)
    this.container.querySelectorAll('.inspector-input').forEach((input) => {
      input.addEventListener('change', () => {
        const prop = (input as HTMLInputElement).dataset.prop!;
        const value = parseFloat((input as HTMLInputElement).value);
        if (isNaN(value)) return;

        switch (prop) {
          case 'x':
          case 'y': {
            const state = this.stateManager.getObjectState(id);
            if (state) {
              this.stateManager.applyAction(id, 'move', {
                x: prop === 'x' ? value : state.x,
                y: prop === 'y' ? value : state.y,
              });
            }
            break;
          }
          case 'width':
          case 'height': {
            const state = this.stateManager.getObjectState(id);
            if (state) {
              this.stateManager.applyAction(id, 'resize', {
                width: prop === 'width' ? value : state.width,
                height: prop === 'height' ? value : state.height,
              });
            }
            break;
          }
          case 'z':
            this.stateManager.applyAction(id, 'set_z', { z: value });
            break;
        }
      });
    });

    // Opacity slider
    this.container.querySelectorAll('.inspector-slider').forEach((input) => {
      input.addEventListener('input', () => {
        const value = parseFloat((input as HTMLInputElement).value);
        this.stateManager.applyAction(id, 'set_opacity', { opacity: value });
      });
    });

    // Visible checkbox
    this.container.querySelectorAll('.inspector-checkbox').forEach((input) => {
      input.addEventListener('change', () => {
        const checked = (input as HTMLInputElement).checked;
        this.stateManager.applyAction(id, 'set_visible', { visible: checked });
      });
    });
  }
}
