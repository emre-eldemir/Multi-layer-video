/**
 * Exporter
 * Handles exporting interaction state and (placeholder) flattened video.
 */
import type { InteractionState } from '@/types';
import type { StateManager } from './state';

/**
 * Export interaction state as a JSON file download
 */
export function exportState(stateManager: StateManager): void {
  const state = stateManager.exportState();
  const json = JSON.stringify(state, null, 2);
  downloadFile(json, 'interaction_state.json', 'application/json');
}

/**
 * Import interaction state from a JSON file
 */
export function importStateFromFile(file: File): Promise<InteractionState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as InteractionState;
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Export flattened video
 * TODO: In production, this would use FFmpeg (via WASM or server-side)
 * to composite all layers into a single video file.
 * For the MVP, this is a placeholder that shows a message.
 */
export function exportFlattenedVideo(): void {
  alert(
    'Flattened video export is not yet implemented.\n\n' +
    'In a production version, this would:\n' +
    '1. Capture canvas frames using captureStream()\n' +
    '2. Encode with MediaRecorder or FFmpeg.wasm\n' +
    '3. Apply all layer states at each frame\n' +
    '4. Output a single composited video file\n\n' +
    'See tools/flatten_export.py for the server-side approach.'
  );
}

/**
 * Helper: trigger a file download in the browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
