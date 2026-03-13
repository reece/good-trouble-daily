# DR-0003 — Branching and Deployment Strategy

**Status:** Accepted  
**Date:** 2026-03-13  
**Deciders:** Reece  

---

## Context

The project is a statically generated Nuxt site that needs three distinct deployment targets:

- **Production** (`nokingscountdown.org`) — stable, user-facing; must only update on explicit releases
- **Integration** (`main.nokingscountdown.org`) — reflects the current state of `main`; used for review and verification before tagging a release
- **PR previews** — ephemeral per-PR URLs for reviewing changes before merge

### Branching model

The repo uses a single trunk (`main`) with short-lived feature branches. All feature work is done in branches named `{type}/{issue-number}-{short-kebab-description}` and merged back to `main` via merge commit. No long-lived release or production branches exist. Tags are the authoritative markers for releases.

Tags serve two distinct purposes in this project:

1. **Semver release tags** (`x.y.z`) — mark a production release; drive the in-app `appVersion` via `git describe`, populate `releaseVersionIndex` via `git for-each-ref`, and gate the production deploy
2. **Non-semver tags** — used for other product surfaces such as in-app feature tour anchors; these must never trigger a production deploy

### The Vercel integration problem

Vercel's native GitHub integration is branch-based. It has no first-class understanding of tags. The only available workaround — an "Ignored Build Step" shell script configured in the Vercel dashboard — can be made to work, but it places critical deploy logic in an invisible UI text field outside version control. That is not acceptable.

An alternative of maintaining a dedicated `production` branch was also considered. It would have played more naturally with Vercel's model, but it would decouple deploys from tags. Because tags are a product surface here (release notes, feature tours), dropping the tag-driven model would require either maintaining two parallel systems or abandoning those features. Tooling constraints do not drive product decisions.

### Build environment constraint

The Nuxt build resolves two pieces of version metadata at build time using git commands:

- `git describe --always --tags` for `appVersion`
- `git for-each-ref refs/tags` to build `releaseVersionIndex`

Both require a full git history with all tags present. Vercel's own build environment does not guarantee access to git tags. All three deploy workflows therefore run the build on the GitHub Actions runner — using `vercel build` (which invokes `pnpm generate`) with `fetch-depth: 0` and `fetch-tags: true` — and upload the pre-built output to Vercel with `vercel deploy --prebuilt`. Vercel does no rebuilding of its own.

---

## Decision

Disable Vercel's native GitHub integration entirely (`"github": { "enabled": false }` in `vercel.json`) and drive all deployments from GitHub Actions.

### Workflows

| Workflow | Trigger | Target | Deployed to |
|---|---|---|---|
| `deploy-production.yml` | Push of tag matching `[0-9]+.[0-9]+.[0-9]+` | Vercel production | `nokingscountdown.org` |
| `deploy-main.yml` | Push to `main` | Vercel preview, aliased | `main.nokingscountdown.org` |
| `deploy-preview.yml` | PR opened, synchronized, or reopened | Vercel preview | ephemeral URL (posted as PR comment) |

The production workflow uses `vercel deploy --prebuilt --prod`; the other two use `vercel deploy --prebuilt` (preview environment). The main-branch workflow additionally runs `vercel alias set` to pin the preview deployment to the stable `main.nokingscountdown.org` domain.

Non-semver tags and untagged commits to `main` do not trigger a production deploy. The tag pattern `[0-9]+.[0-9]+.[0-9]+` is intentionally exact — it matches `1.4.0` but not `1.4.0-tour.action-cards` or similar non-release tags.

### Transition from GitHub Pages

Prior to this strategy, production was served from GitHub Pages via `nuxtjs_deploy.yml`. That workflow remains in the repository during the transition period but is being phased out. The cutover to Vercel as the sole production host completes with the **1.4.0 release (2026-03-13)**. After that release, `nuxtjs_deploy.yml` and the GitHub Pages environment can be removed.

### Secrets required

All three Vercel workflows depend on three repository secrets:

- `VERCEL_TOKEN` — API token for the Vercel CLI
- `VERCEL_ORG_ID` — Vercel organization ID
- `VERCEL_PROJECT_ID` — Vercel project ID
