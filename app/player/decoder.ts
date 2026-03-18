/**
 * Decoder
 * Handles video decoding and frame extraction.
 * In the MVP, this is mostly a thin wrapper around HTML5 video elements.
 * Future versions could use WebCodecs API for more control.
 */

/**
 * Check if the browser supports basic video decoding
 */
export function checkDecoderSupport(): { supported: boolean; message: string } {
  const video = document.createElement('video');
  const canPlayMP4 = video.canPlayType('video/mp4');
  const canPlayWebM = video.canPlayType('video/webm');

  if (!canPlayMP4 && !canPlayWebM) {
    return { supported: false, message: 'Browser does not support MP4 or WebM video playback' };
  }

  return {
    supported: true,
    message: `Decoder ready. MP4: ${canPlayMP4 || 'no'}, WebM: ${canPlayWebM || 'no'}`,
  };
}

/**
 * TODO: Future WebCodecs-based decoder for frame-accurate seeking
 * and alpha channel video support.
 *
 * The current MVP uses standard HTMLVideoElement for decoding.
 * A production version would:
 * - Use VideoDecoder API for frame-level control
 * - Support VP9/AV1 alpha channel decoding
 * - Implement frame buffering for smooth playback
 * - Handle codec negotiation for different browsers
 */
export class FrameDecoder {
  // Placeholder for future implementation
  private _initialized = false;

  async initialize(): Promise<void> {
    this._initialized = true;
    console.log('[FrameDecoder] Initialized (MVP mode - using HTMLVideoElement)');
  }

  isInitialized(): boolean {
    return this._initialized;
  }
}
