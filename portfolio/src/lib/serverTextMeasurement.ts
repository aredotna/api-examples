import 'server-only'

import { createCanvas } from '@napi-rs/canvas'

class NodeOffscreenCanvas {
  private canvas: {
    getContext: (contextType: '2d') => CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  }

  constructor(width: number, height: number) {
    this.canvas = createCanvas(width, height) as unknown as NodeOffscreenCanvas['canvas']
  }

  getContext(contextType: '2d') {
    return this.canvas.getContext(contextType)
  }
}

export function ensureServerTextMeasurement() {
  globalThis.OffscreenCanvas ??= NodeOffscreenCanvas as unknown as typeof OffscreenCanvas
}
