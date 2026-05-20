// Splits on spaces, hyphens, underscores, and CamelCase transitions — matches es-toolkit behaviour
export function camelCase(str: string): string {
  if (!str) {
    return str
  }
  const words = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[\s\-_]+/)
    .filter(Boolean)
  return words
    .map((word, i) =>
      i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('')
}
