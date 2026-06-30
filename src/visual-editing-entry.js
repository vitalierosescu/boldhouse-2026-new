// Sanity click-to-edit overlay bundle. Self-initialises on load.
//
// This file bundles @sanity/visual-editing AND React (its required peer dep), so
// it is intentionally kept OUT of the lean public main.js. main.js injects it as
// a <script> ONLY inside the Studio Presentation iframe (window.self !== window.top),
// so real site visitors never download React or this overlay code.
//
// It reads the data-sanity="..." attributes emitted by the `sanityEdit` Eleventy
// filter and draws clickable overlays that jump to the matching Studio field.
import { enableVisualEditing } from '@sanity/visual-editing'

enableVisualEditing({
  history: {
    subscribe: (navigate) => {
      const onPop = () => navigate({ type: 'pop', url: location.href })
      window.addEventListener('popstate', onPop)
      // Barba navigates via pushState on link clicks (no popstate fires), so
      // report each finished page transition to keep the Studio URL in sync.
      if (window.barba?.hooks) {
        window.barba.hooks.after(() => navigate({ type: 'push', url: location.href }))
      }
      return () => window.removeEventListener('popstate', onPop)
    },
    update: (update) => {
      if (update.type === 'pop') {
        history.back()
        return
      }
      // Studio asked the frontend to navigate (e.g. clicked a document location).
      if (window.barba && update.url && update.url !== location.pathname + location.search) {
        window.barba.go(update.url)
        return
      }
      if (update.type === 'push') history.pushState(null, '', update.url)
      if (update.type === 'replace') history.replaceState(null, '', update.url)
    },
  },
  // Studio "refresh" button → reload the iframe (static build, so a reload picks
  // up the latest published content).
  refresh: (payload) => {
    if (payload.source === 'manual') {
      window.location.reload()
      return new Promise(() => {})
    }
    return false
  },
})
