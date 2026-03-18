/**
 * Shared UI Utilities
 * Helper functions for safe HTML rendering and common UI operations.
 */

/** HTML entity map for escaping user-provided strings */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

/**
 * Escape a string for safe insertion into HTML.
 * Prevents XSS when interpolating user-provided data into innerHTML.
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}
