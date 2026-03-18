/**
 * Layers Panel
 * Renders the list of object layers with visibility toggles and z-order controls.
 */
import type { SceneObject } from '@/types';
import type { StateManager } from '@/player/state';
import { escapeHtml } from './utils';

export class LayersPanel {
  private container: HTMLElement;
  private stateManager: StateManager;
  private objects: SceneObject[];
  private selectedObjectId: string | null = null;
  private onSelect: (id: string | null) => void;

  constructor(
    containerId: string,
    stateManager: StateManager,
    objects: SceneObject[],
    onSelect: (id: string | null) => void
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.stateManager = stateManager;
    this.objects = objects;
    this.onSelect = onSelect;

    this.render();
    this.stateManager.onChange(() => this.render());
  }

  /**
   * Set the selected object
   */
  setSelected(id: string | null): void {
    this.selectedObjectId = id;
    this.render();
  }

  /**
   * Update active objects list
   */
  setActiveObjects(objects: SceneObject[]): void {
    this.objects = objects;
    this.render();
  }

  /**
   * Render the layers panel
   */
  private render(): void {
    const states = this.stateManager.getAllStates();

    // Sort by z-index (highest first in the panel)
    const sorted = [...this.objects].sort((a, b) => {
      const sa = states.get(a.id);
      const sb = states.get(b.id);
      return (sb?.z ?? 0) - (sa?.z ?? 0);
    });

    this.container.innerHTML = `
      <div class="panel-header">
        <span class="panel-title"><i class="bi bi-layers me-1"></i>Layers</span>
      </div>
      <div class="layers-list list-group list-group-flush flex-grow-1 overflow-auto">
        ${sorted.map((obj) => this.renderLayer(obj)).join('')}
      </div>
    `;

    // Bind events
    this.container.querySelectorAll('.list-group-item').forEach((el) => {
      const id = (el as HTMLElement).dataset.id!;

      el.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('.layer-actions')) {
          this.onSelect(id);
        }
      });
    });

    this.container.querySelectorAll('.toggle-visibility').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (btn as HTMLElement).dataset.id!;
        const state = states.get(id);
        if (state) {
          this.stateManager.applyAction(id, 'set_visible', { visible: !state.visible });
        }
        e.stopPropagation();
      });
    });

    this.container.querySelectorAll('.move-up').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (btn as HTMLElement).dataset.id!;
        const state = states.get(id);
        if (state) {
          this.stateManager.applyAction(id, 'set_z', { z: state.z + 1 });
        }
        e.stopPropagation();
      });
    });

    this.container.querySelectorAll('.move-down').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (btn as HTMLElement).dataset.id!;
        const state = states.get(id);
        if (state) {
          this.stateManager.applyAction(id, 'set_z', { z: Math.max(0, state.z - 1) });
        }
        e.stopPropagation();
      });
    });
  }

  /**
   * Render a single layer item
   */
  private renderLayer(obj: SceneObject): string {
    const state = this.stateManager.getObjectState(obj.id);
    if (!state) return '';

    const isSelected = obj.id === this.selectedObjectId;
    const kindIcons: Record<string, string> = {
      speaker: 'bi-mic',
      logo: 'bi-tag',
      chart: 'bi-bar-chart',
      info_panel: 'bi-info-circle',
      overlay: 'bi-square',
    };
    const iconClass = kindIcons[obj.kind] ?? 'bi-box';

    return `
      <div class="list-group-item d-flex align-items-center gap-2 ${isSelected ? 'active' : ''} ${!state.visible ? 'hidden-layer' : ''}" data-id="${escapeHtml(obj.id)}">
        <span class="layer-icon"><i class="bi ${iconClass}"></i></span>
        <span class="layer-name flex-grow-1">${escapeHtml(obj.label)}</span>
        <span class="badge text-bg-secondary rounded-pill small">z:${state.z}</span>
        <div class="layer-actions d-flex gap-1">
          <button class="btn toggle-visibility" data-id="${escapeHtml(obj.id)}" title="Toggle visibility">
            <i class="bi ${state.visible ? 'bi-eye' : 'bi-eye-slash'}"></i>
          </button>
          <button class="btn move-up" data-id="${escapeHtml(obj.id)}" title="Move up">
            <i class="bi bi-chevron-up"></i>
          </button>
          <button class="btn move-down" data-id="${escapeHtml(obj.id)}" title="Move down">
            <i class="bi bi-chevron-down"></i>
          </button>
        </div>
      </div>
    `;
  }
}
