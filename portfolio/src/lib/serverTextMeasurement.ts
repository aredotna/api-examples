import 'server-only'

import { join } from 'node:path'
import { createCanvas, GlobalFonts } from '@napi-rs/canvas'

let didRegisterFonts = false

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

  if (!didRegisterFonts) {
    GlobalFonts.registerFromPath(join(process.cwd(), 'public/fonts/Areal-Regular.woff2'), 'Areal')
    didRegisterFonts = true
  }
}
