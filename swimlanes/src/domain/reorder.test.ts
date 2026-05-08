import { describe, expect, it } from 'vitest'
import { reorderArray } from './reorder'

describe('reorderArray', () => {
  it('moves an element forward', () => {
    expect(reorderArray(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an element backward', () => {
    expect(reorderArray(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('moves to the last position', () => {
    expect(reorderArray(['a', 'b', 'c', 'd'], 1, 3)).toEqual(['a', 'c', 'd', 'b'])
  })

  it('moves to the first position', () => {
    expect(reorderArray(['a', 'b', 'c', 'd'], 2, 0)).toEqual(['c', 'a', 'b', 'd'])
  })

  it('returns a copy when fromIndex equals toIndex', () => {
    const input = ['a', 'b', 'c']
    const result = reorderArray(input, 1, 1)
    expect(result).toEqual(['a', 'b', 'c'])
    expect(result).not.toBe(input)
  })

  it('returns a copy for out-of-bounds fromIndex', () => {
    expect(reorderArray(['a', 'b'], -1, 0)).toEqual(['a', 'b'])
    expect(reorderArray(['a', 'b'], 5, 0)).toEqual(['a', 'b'])
  })

  it('clamps toIndex to array length', () => {
    expect(reorderArray(['a', 'b', 'c'], 0, 10)).toEqual(['b', 'c', 'a'])
  })
})
