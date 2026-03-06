export function useAnalytics() {
  const { gtag } = useGtag()
  const config = useRuntimeConfig()

  /**
   * Set build metadata as GA global properties. Call once on app mount.
   * app_version is a reserved GA4 dimension; commit_short_sha and commit_ref are custom.
   */
  const setBuildMetadata = () => {
    if (!import.meta.client)
      return
    const sha = config.public.commitSha
    const withoutDirty = sha.replace(/\+$/, '')
    const gHashMatch = withoutDirty.match(/-\d+-g[0-9a-f]+$/)
    const baseTag = gHashMatch
      ? withoutDirty.slice(0, withoutDirty.length - gHashMatch[0].length)
      : withoutDirty
    const commitShortSha = config.public.commitShortSha
    const commitRef = config.public.commitRef
    const buildDate = config.public.buildDate

    // Push to GA as global dimensions on every event in this session.
    gtag('set', {
      app_version: baseTag,
      commit_short_sha: commitShortSha,
      commit_ref: commitRef,
    })

    // Write to localStorage so future versions can identify what last touched the data.
    try {
      localStorage.setItem('isf-build-meta', JSON.stringify({
        appVersion: baseTag,
        commitShortSha,
        commitRef,
        buildDate,
      }))
    }
    catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }

  /** Fire once per device on true first visit (localStorage-backed). */
  const trackFirstVisit = () => {
    if (!import.meta.client)
      return
    const key = 'isf-visited'
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, new Date().toISOString())
      gtag('event', 'first_visit_app', {
        visit_date: new Date().toISOString().slice(0, 10),
      })
    }
  }

  const trackViewDetail = (dateKey: string) => {
    gtag('event', 'view_detail', { date_key: dateKey })
  }

  const trackCompleteAction = (dateKey: string) => {
    gtag('event', 'complete_action', { date_key: dateKey })
  }

  const trackUncompleteAction = (dateKey: string) => {
    gtag('event', 'uncomplete_action', { date_key: dateKey })
  }

  const trackShareDetail = (dateKey: string) => {
    gtag('event', 'share_detail', { date_key: dateKey })
  }

  const trackShareProgress = () => {
    gtag('event', 'share_progress')
  }

  const trackCtaClick = (dateKey: string, linkUrl: string) => {
    gtag('event', 'cta_click', { date_key: dateKey, link_url: linkUrl })
  }

  const trackTourStarted = (tourName: string) => {
    gtag('event', 'tour_started', { tour_name: tourName })
  }

  const trackTourCompleted = (tourName: string) => {
    gtag('event', 'tour_completed', { tour_name: tourName })
  }

  return {
    setBuildMetadata,
    trackFirstVisit,
    trackViewDetail,
    trackCompleteAction,
    trackUncompleteAction,
    trackShareDetail,
    trackShareProgress,
    trackCtaClick,
    trackTourStarted,
    trackTourCompleted,
  }
}
