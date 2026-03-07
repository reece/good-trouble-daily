/**
 * Pure function — parses raw runtime config into structured build data.
 * No Nuxt composables, no side effects, easily unit-testable.
 */
export function parseBuildData(config: {
  commitSha: string
  commitShortSha: string
  commitRef: string
  buildDate: string
}) {
  const withoutDirty = config.commitSha.replace(/\+$/, '')
  const gHashMatch = withoutDirty.match(/-\d+-g[0-9a-f]+$/)
  return {
    appVersion: gHashMatch
      ? withoutDirty.slice(0, withoutDirty.length - gHashMatch[0].length)
      : withoutDirty,
    commitShortSha: config.commitShortSha,
    commitRef: config.commitRef,
    buildDate: config.buildDate,
  }
}
