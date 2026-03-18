/**
 * Timeline Manager
 * Resolves which scene is active and which objects should be displayed
 * at any given point in time.
 */
import type { Timeline, TimelineScene, SceneObject } from '@/types';

export class TimelineManager {
  private scenes: TimelineScene[];
  private objects: SceneObject[];

  constructor(timeline: Timeline, objects: SceneObject[]) {
    this.scenes = timeline.scenes;
    this.objects = objects;
  }

  /**
   * Get the active scene at a given time
   */
  getActiveScene(timeMs: number): TimelineScene | null {
    return this.scenes.find(
      (s) => timeMs >= s.start_ms && timeMs < s.end_ms
    ) ?? null;
  }

  /**
   * Get all objects that should be active at a given time
   * Filters by both scene membership and object time range
   */
  getActiveObjects(timeMs: number): SceneObject[] {
    const scene = this.getActiveScene(timeMs);
    if (!scene) return [];

    return this.objects.filter((obj) => {
      const inScene = scene.active_objects.includes(obj.id);
      const inTimeRange = timeMs >= obj.start_ms && timeMs < obj.end_ms;
      return inScene && inTimeRange;
    });
  }

  /**
   * Get all objects regardless of time (for layer panel)
   */
  getAllObjects(): SceneObject[] {
    return [...this.objects];
  }

  /**
   * Get total duration from scenes
   */
  getTotalDuration(): number {
    if (this.scenes.length === 0) return 0;
    return Math.max(...this.scenes.map((s) => s.end_ms));
  }
}
