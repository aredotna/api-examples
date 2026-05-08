export const reorderArray = <T>(values: readonly T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= values.length) {
    return [...values]
  }

  const nextValues = [...values]
  const [item] = nextValues.splice(fromIndex, 1)
  if (!item) {
    return [...values]
  }

  nextValues.splice(Math.min(toIndex, nextValues.length), 0, item)
  return nextValues
}
