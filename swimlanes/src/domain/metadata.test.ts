import { describe, expect, it } from 'vitest'
import { readNumberMetadata, toMetadataRecord } from './metadata'

describe('metadata helpers', () => {
  it('filters non-scalar values out of metadata records', () => {
    expect(
      toMetadataRecord({
        title: 'hello',
        score: 4,
        published: true,
        optional: null,
        nested: { skip: true },
        list: [1, 2],
      }),
    ).toEqual({
      title: 'hello',
      score: 4,
      published: true,
      optional: null,
    })
  })

  it('parses numeric strings when reading numeric metadata', () => {
    const metadata = toMetadataRecord({
      estimate_points: '6',
    })

    expect(metadata).toEqual({
      estimate_points: '6',
    })
    expect(readNumberMetadata(metadata, 'estimate_points', 0)).toBe(6)
  })
})
