/**
 * Project Loader
 * Loads an LVM project from a base URL path, reading manifest, timeline,
 * objects, and interactions JSON files.
 */
import type { Manifest, Timeline, SceneObject, InteractionState, ProjectData } from '@/types';

const DEMO_PROJECT_BASE = 'demo_project.lvm';

/**
 * Fetch JSON from a relative path within the project
 */
async function fetchJSON<T>(basePath: string, filePath: string): Promise<T> {
  const url = `${basePath}/${filePath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Load a complete LVM project from a base path
 */
export async function loadProject(basePath: string = DEMO_PROJECT_BASE): Promise<ProjectData> {
  // Load manifest first
  const manifest = await fetchJSON<Manifest>(basePath, 'manifest.json');

  // Load remaining files based on manifest entrypoints
  const [timeline, objectsData, interactions] = await Promise.all([
    fetchJSON<Timeline>(basePath, manifest.entrypoints.timeline),
    fetchJSON<{ objects: SceneObject[] }>(basePath, manifest.entrypoints.objects),
    fetchJSON<InteractionState>(basePath, manifest.entrypoints.interactions),
  ]);

  return {
    manifest,
    timeline,
    objects: objectsData.objects,
    interactions,
  };
}
