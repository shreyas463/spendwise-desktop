import * as pdfjs from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
// Vite bundles the worker as a local asset URL — no CDN, so it works in the
// packaged Electron app (file://) and the offline web build alike.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

const MAX_PAGES = 60

/**
 * Extract a PDF's text as one string per visual line, preserving column gaps.
 *
 * PDF text is a bag of positioned glyph runs, not lines. We group runs by
 * their y-coordinate into lines, order each line left-to-right, and insert a
 * double space wherever there's a wide horizontal gap — so the pure parser in
 * src/core/pdf.ts can tell a description column from an amount column.
 *
 * Runs in the renderer (Chromium) only; never imported by the pure core or
 * the unit tests.
 */
export async function extractPdfLines(bytes: Uint8Array): Promise<string[]> {
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise
  try {
    const lines: string[] = []
    const pageCount = Math.min(doc.numPages, MAX_PAGES)

    for (let p = 1; p <= pageCount; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const items = content.items.filter((i): i is TextItem => 'str' in i && 'transform' in i)

      // Bucket items into rows by rounded y (PDF y grows upward).
      const rows = new Map<number, { x: number; width: number; str: string }[]>()
      for (const it of items) {
        if (!it.str) continue
        const x = it.transform[4]
        const y = Math.round(it.transform[5])
        // Merge near-equal baselines (±2pt) into the same row bucket.
        let key = y
        for (const existing of rows.keys()) {
          if (Math.abs(existing - y) <= 2) {
            key = existing
            break
          }
        }
        const bucket = rows.get(key) ?? []
        bucket.push({ x, width: it.width, str: it.str })
        rows.set(key, bucket)
      }

      // Emit rows top-to-bottom (descending y), items left-to-right.
      const orderedY = [...rows.keys()].sort((a, b) => b - a)
      for (const y of orderedY) {
        const cells = rows.get(y)!.sort((a, b) => a.x - b.x)
        let line = ''
        let prevEnd = -Infinity
        for (const cell of cells) {
          const gap = cell.x - prevEnd
          if (line) line += gap > 12 ? '  ' : gap > 1 ? ' ' : ''
          line += cell.str
          prevEnd = cell.x + cell.width
        }
        const trimmed = line.replace(/\s+$/g, '')
        if (trimmed.trim()) lines.push(trimmed)
      }
    }
    return lines
  } finally {
    // Free the worker's document resources.
    void doc.destroy()
  }
}
