/**
 * State Manager
 * Maintains runtime state for all objects, records interaction actions,
 * and supports export/import of state.
 */
import type {
  SceneObject,
  RuntimeObjectState,
  InteractionAction,
  InteractionActionType,
  InteractionState,
} from '@/types';

export class StateManager {
  private objectStates: Map<string, RuntimeObjectState> = new Map();
  private actions: InteractionAction[] = [];
  private projectId: string;
  private changeListeners: Array<() => void> = [];

  constructor(objects: SceneObject[], projectId: string) {
    this.projectId = projectId;
    // Initialize runtime state from default layouts
    for (const obj of objects) {
      this.objectStates.set(obj.id, { ...obj.default_layout });
    }
  }

  /**
   * Get the current state of an object
   */
  getObjectState(objectId: string): RuntimeObjectState | undefined {
    return this.objectStates.get(objectId);
  }

  /**
   * Get all object states
   */
  getAllStates(): Map<string, RuntimeObjectState> {
    return this.objectStates;
  }

  /**
   * Record an action and update state
   */
  applyAction(
    objectId: string,
    action: InteractionActionType,
    value: Record<string, unknown>,
    timeMs: number = Date.now()
  ): void {
    const state = this.objectStates.get(objectId);
    if (!state) return;

    // Record the action
    this.actions.push({ time_ms: timeMs, object_id: objectId, action, value });

    // Apply the action to runtime state
    switch (action) {
      case 'set_visible':
        state.visible = value.visible as boolean;
        break;
      case 'move':
        state.x = value.x as number;
        state.y = value.y as number;
        break;
      case 'resize':
        state.width = value.width as number;
        state.height = value.height as number;
        break;
      case 'set_z':
        state.z = value.z as number;
        break;
      case 'set_opacity':
        state.opacity = value.opacity as number;
        break;
      case 'rotate':
        state.rotation = value.rotation as number;
        break;
    }

    this.notifyChange();
  }

  /**
   * Subscribe to state changes
   */
  onChange(listener: () => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Notify all listeners of a state change
   */
  private notifyChange(): void {
    for (const listener of this.changeListeners) {
      listener();
    }
  }

  /**
   * Export current interaction state as JSON-serializable object
   */
  exportState(): InteractionState {
    return {
      project_id: this.projectId,
      actions: [...this.actions],
    };
  }

  /**
   * Import a previously exported interaction state
   */
  importState(state: InteractionState, objects: SceneObject[]): void {
    // Reset to defaults first
    for (const obj of objects) {
      this.objectStates.set(obj.id, { ...obj.default_layout });
    }
    this.actions = [];

    // Replay all actions
    for (const action of state.actions) {
      this.applyAction(action.object_id, action.action, action.value, action.time_ms);
    }
  }

  /**
   * Reset to default states
   */
  reset(objects: SceneObject[]): void {
    this.actions = [];
    for (const obj of objects) {
      this.objectStates.set(obj.id, { ...obj.default_layout });
    }
    this.notifyChange();
  }
}
