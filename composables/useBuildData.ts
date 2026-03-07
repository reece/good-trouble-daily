/**
 * Singleton composable for structured build data.
 *
 * Parses raw runtime config exactly once (via useState), writes the result
 * to localStorage for debugging, and exposes the parsed values to any consumer.
 *
 * The localStorage write is a natural side effect of first initialisation —
 * useState ensures the factory (and therefore the write) only runs once.
 */
export function useBuildData() {
  return useState('build-data', () => {
    const parsed = parseBuildData(useRuntimeConfig().public as Parameters<typeof parseBuildData>[0])

    if (import.meta.client) {
      try {
        localStorage.setItem('isf-build-data', JSON.stringify(parsed))
      }
      catch {
        // ignore storage errors (e.g. private browsing quota)
      }
    }

    return parsed
  })
}
