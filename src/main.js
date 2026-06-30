import gsap from 'gsap'
import { MQ } from './utils/breakpoints.js'
import { splitReveal } from './utils/splitReveal.js'
import { initChromeC } from './utils/chromeC.js'
import { initCart } from './shop/cart.js'
import { initCartDrawer } from './shop/cart-drawer.js'
import { initNavCartBadge } from './shop/nav-cart-badge.js'
import { initShopPage } from './shop/shop-page.js'
import { initProductPage } from './shop/product-page.js'
import { initApplyPage } from './apply.js'

if (!window.gsap) window.gsap = gsap

const _plugins = [
  window.ScrollTrigger,
  window.CustomEase,
  window.SplitText,
  window.Draggable,
  window.InertiaPlugin,
  window.Observer,
].filter(Boolean)
gsap.registerPlugin(..._plugins)
window.gsap.registerPlugin(..._plugins)

// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

history.scrollRestoration = 'manual'

let nextPage = document
let isOnceFunctionsInitialized = false

const hasLenis = typeof window.Lenis !== 'undefined'
const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined'

const rmMQ = window.matchMedia('(prefers-reduced-motion: reduce)')
let reducedMotion = rmMQ.matches
rmMQ.addEventListener?.('change', (e) => (reducedMotion = e.matches))
rmMQ.addListener?.((e) => (reducedMotion = e.matches))

const has = (s) => !!(nextPage.matches?.(s) || nextPage.querySelector(s))

const durationDefault = 0.6
const easeDefault = 'boldhouse'

CustomEase.create('boldhouse', '.5,0,.05,1.01')
gsap.defaults({ ease: easeDefault, duration: durationDefault })

const initialPageFade = (container = document) => {
  let elements
  if (container === document) {
    elements = Array.from(document.querySelectorAll('[data-start="hidden"]'))
  } else {
    // Entering container + global elements outside any Barba container (e.g. nav)
    const inContainer = Array.from(container.querySelectorAll('[data-start="hidden"]'))
    const global = Array.from(document.querySelectorAll('[data-start="hidden"]')).filter(
      (el) => !el.closest('[data-barba="container"]')
    )
    elements = [...new Set([...inContainer, ...global])]
  }

  if (!elements.length) return

  if (reducedMotion || isOnceFunctionsInitialized) {
    gsap.set(elements, { autoAlpha: 1 })
    return
  }

  gsap.fromTo(elements, { autoAlpha: 0 }, { autoAlpha: 1 })
}

// ====================== FUNCTION REGISTRY
function initOnceFunctions() {
  initLenis()
  if (isOnceFunctionsInitialized) return
  isOnceFunctionsInitialized = true

  // Shop: global singletons (persist across Barba transitions)
  initCart()
  initCartDrawer()
  initNavCartBadge()

  //
  initButtonHover()
  if (document.querySelector('[data-barba-namespace="home"]')) initHomeHero()
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document

  initHeroEnter(nextPage)
  initialPageFade(nextPage)
}

function initAfterEnterFunctions(next) {
  nextPage = next || document

  initGlobal(nextPage)

  // Page-specific code, dispatched by data-barba-namespace.
  const ns = nextPage?.dataset?.barbaNamespace
  if (ns === 'home') initHomePage(nextPage)
  else if (ns === 'club') initClubPage(nextPage)
  else if (ns === 'spaces') initSpacesPage(nextPage)
  else if (ns === 'shop') initShopPage(nextPage)
  else if (ns === 'product') initProductPage(nextPage)
  else if (ns === 'apply') initApplyPage()

  if (hasLenis) window.lenis?.resize()
  if (hasScrollTrigger) ScrollTrigger.refresh()
}


// ================== PAGE TRANSITIONS
function runPageOnceAnimation() {
  const tl = gsap.timeline()

  tl.call(resetPage, null, 0)

  return tl
}

function runPageLeaveAnimation(current, next) {
  const tl = gsap.timeline({
    onComplete: () => {
      current.remove()
    },
  })

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 })
  }

  tl.to(current, { autoAlpha: 0, ease: 'power2.inOut', duration: 0.4 }, 0)

  const heroLines = current.querySelectorAll('[data-hero-heading] .line')
  if (heroLines.length) {
    tl.to(heroLines, { yPercent: -110, stagger: 0.05, duration: 0.35, ease: 'power2.in' }, 0)
  }

  return tl
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline()

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 })
    tl.add('pageReady')
    tl.call(resetPage, null, 'pageReady')
    return new Promise((resolve) => tl.call(resolve, null, 'pageReady'))
  }

  tl.add('startEnter', 0)

  tl.fromTo(
    next,
    { autoAlpha: 0 },
    { autoAlpha: 1, ease: 'power2.inOut', duration: 0.5 },
    'startEnter'
  )

  tl.add('pageReady')
  tl.call(resetPage, [next], 'pageReady')

  return new Promise((resolve) => {
    tl.call(resolve, null, 'pageReady')
  })
}


// ======================= BARBA HOOKS + INIT

// Snapshot of the LEAVING page's cleanup functions.
// With sync: true, afterEnter fires before afterLeave, so by the time afterLeave
// runs, pageCleanups already contains NEW page entries too. We snapshot before
// the transition starts so afterLeave only drains the old page's cleanups.
let _leavingPageCleanups = []

barba.hooks.beforeLeave(() => {
  _leavingPageCleanups = pageCleanups.splice(0)
})

barba.hooks.beforeEnter((data) => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (window.lenis && typeof window.lenis.stop === 'function') {
    window.lenis.stop()
  }

  initBeforeEnterFunctions(data.next.container)
  applyThemeFrom(data.next.container)
})

barba.hooks.afterLeave(() => {
  // Run only the leaving page's cleanups (new page's are in pageCleanups).
  runPageCleanups(_leavingPageCleanups)
})

// afterLeave fires BEFORE Barba removes the old container, so ScrollTrigger
// triggers from the leaving page are still in the DOM at that point and
// won't be caught by a document.contains() check. The `after` hook fires
// once both containers are settled and the old one is removed — safe to kill.
barba.hooks.after(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach((trigger) => {
      if (!trigger.trigger || !document.contains(trigger.trigger)) {
        trigger.kill()
      }
    })
  }
})

barba.hooks.enter((data) => {
  initBarbaNavUpdate(data)
})

barba.hooks.afterEnter((data) => {
  // The old container may still be in the DOM (leave animation outlasts enter).
  // Remove it now so clearing position:fixed doesn't push the new container
  // below it in document flow.
  if (data.current?.container?.isConnected) {
    data.current.container.remove()
  }

  // Safe to unfix now — old container is gone, new container returns to normal flow.
  gsap.set(data.next.container, { clearProps: 'position,top,left,right' })

  // Run page functions
  initAfterEnterFunctions(data.next.container)

  if (window.lenis) {
    window.lenis.resize()
    window.lenis.start()
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh()
  }
})

barba.init({
  debug: true, // Set to 'false' in production
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: 'default',
      sync: true,

      // First load
      async once(data) {
        initOnceFunctions()
        applyThemeFrom(data.next.container)
        // Reveal [data-start="hidden"] elements (nav + hero sections).
        // initOnceFunctions set isOnceFunctionsInitialized=true, so this does an
        // instant gsap.set reveal (no fade) — correct for first load.
        initialPageFade(data.next.container)
        // On non-home pages, play the hero heading slide-in (home uses initHomeHero instead).
        const ns = data.next.container?.dataset?.barbaNamespace
        if (ns && ns !== 'home') initHeroEnter(data.next.container)
        initAfterEnterFunctions(data.next.container)

        return runPageOnceAnimation()
      },

      // Current page leaves
      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container)
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container)
      },
    },
  ],
})

// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

const themeConfig = {
  light: {
    nav: 'light',
    transition: 'light',
  },
  dark: {
    nav: 'dark',
    transition: 'dark',
  },
}

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || 'light'
  const config = themeConfig[pageTheme] || themeConfig.light

  document.body.dataset.pageTheme = pageTheme
  const transitionEl = document.querySelector('[data-theme-transition]')
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition
  }

  const nav = document.querySelector('[data-theme-nav]')
  if (nav) {
    // Optional per-page override, e.g. homepage starts with dark nav over the hero.
    const navStart = container?.dataset?.navStart
    nav.dataset.themeNav = navStart || config.nav
  }
}

function initNavThemeTriggers(container = document) {
  if (!hasScrollTrigger) return

  const nav = document.querySelector('[data-theme-nav]')
  if (!nav) return

  const initialTheme = nav.dataset.themeNav

  container.querySelectorAll('[data-nav-theme-to]').forEach((section) => {
    const targetTheme = section.dataset.navThemeTo
    if (!targetTheme) return

    ScrollTrigger.create({
      trigger: section,
      start: 'top 2%',
      onEnter: () => {
        nav.dataset.themeNav = targetTheme
      },
      onLeaveBack: () => {
        nav.dataset.themeNav = initialTheme
      },
    })
  })
}

// Resolves once T.Ricks' Theme Collector has populated window.colorThemes.
// First load: waits for the `colorThemesReady` event. Subsequent Barba navs:
// localStorage cache means themes are already in memory, so resolves immediately.
function whenColorThemesReady() {
  return new Promise((resolve) => {
    if (
      window.colorThemes?.themes &&
      Object.keys(window.colorThemes.themes).length > 0
    ) {
      resolve()
      return
    }
    document.addEventListener('colorThemesReady', () => resolve(), {
      once: true,
    })
  })
}

// Cached on first build so Barba navs don't re-snapshot a possibly-tweened
// page-wrap and capture the wrong resting state.
let restingThemeVarsCache = null

function buildRestingThemeVars(pageWrap) {
  if (restingThemeVarsCache) return restingThemeVarsCache
  const themes = window.colorThemes?.themes
  if (!themes) return null

  const restingVars = {}
  const pageWrapStyle = getComputedStyle(pageWrap)
  Object.values(themes).forEach((theme) => {
    // Theme map is either flat (no brand classes) or wrapped in { brands: {...} }.
    const flatVars = theme?.brands ? Object.values(theme.brands)[0] : theme
    if (!flatVars) return
    Object.keys(flatVars).forEach((key) => {
      if (!key.startsWith('--')) return
      if (key in restingVars) return
      restingVars[key] = pageWrapStyle.getPropertyValue(key).trim()
    })
  })

  restingThemeVarsCache = restingVars
  return restingVars
}

function initSectionThemeTriggers(container = document) {
  if (!hasScrollTrigger) return

  const sections = container.querySelectorAll('[data-theme-page-to]')
  if (!sections.length) return

  // Smooth background transition for theme switch
  if (!document.getElementById('section-theme-transition')) {
    const style = document.createElement('style')
    style.id = 'section-theme-transition'
    style.textContent = '[data-theme-page-to] { transition: background-color 0.6s ease, color 0.6s ease; }'
    document.head.appendChild(style)
  }

  const nav = document.querySelector('[data-theme-nav]')
  const navInitial = nav?.dataset.themeNav
  const triggers = []

  sections.forEach((section) => {
    const themeName = section.dataset.themePageTo
    if (!themeName) return

    const themeClass = `u-theme-${themeName}`

    // Toggle theme class when section enters/leaves viewport
    const stPage = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      onEnter: () => section.classList.add(themeClass),
      onLeaveBack: () => section.classList.remove(themeClass),
    })
    triggers.push(stPage)

    // Update nav color when footer top reaches near viewport top
    if (nav && themeName === 'dark') {
      const stNav = ScrollTrigger.create({
        trigger: section,
        start: 'top 2%',
        onEnter: () => { nav.dataset.themeNav = 'dark' },
        onLeaveBack: () => { nav.dataset.themeNav = navInitial || 'dark' },
      })
      triggers.push(stNav)
    }
  })

  registerCleanup(() => {
    triggers.forEach((st) => st.kill())
    sections.forEach((s) => {
      const name = s.dataset.themePageTo
      if (name) s.classList.remove(`u-theme-${name}`)
    })
  })
}

// Lenis is disabled on mobile landscape & down — native scroll handles
// momentum + URL bar collapse better on touch devices.
const lenisMQ = window.matchMedia(MQ.mobileLandscapeDown)
const lenisAllowed = () => !lenisMQ.matches

function lenisRaf(time) {
  window.lenis?.raf(time * 1000)
}

function initLenis() {
  if (window.lenis) return // already created
  if (!hasLenis) return
  if (!lenisAllowed()) return

  window.lenis = new Lenis({
    lerp: 0.15,
    wheelMultiplier: 1.25,
  })

  if (hasScrollTrigger) {
    window.lenis.on('scroll', ScrollTrigger.update)
  }

  gsap.ticker.add(lenisRaf)
}

function destroyLenis() {
  if (!window.lenis) return
  gsap.ticker.remove(lenisRaf)
  window.lenis.destroy()
  window.lenis = null
  if (hasScrollTrigger) ScrollTrigger.refresh()
}

const onLenisMQChange = (e) => {
  if (e.matches) destroyLenis()
  else initLenis()
}
lenisMQ.addEventListener?.('change', onLenisMQChange)
lenisMQ.addListener?.(onLenisMQChange)

// Pause animation work while the tab is hidden. Browsers throttle RAF to ~1fps
// in background tabs; without this, GSAP/Lenis try to "catch up" the accumulated
// delta in a single frame burst on return, causing laggy scroll.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.lenis?.stop()
    gsap.ticker.sleep()
  } else {
    gsap.ticker.wake()
    window.lenis?.start()
    if (hasScrollTrigger) ScrollTrigger.refresh()
  }
})

// Per-page cleanup registry. Inits that attach window-level listeners or
// observers push a teardown fn here; barba.afterLeave drains it.
const pageCleanups = []
function registerCleanup(fn) {
  pageCleanups.push(fn)
}
// Expose to feature modules (e.g. shop/motion.js) so their non-ScrollTrigger
// teardown (matchMedia, Observer, Flip listeners) is drained on barba.afterLeave.
window.__bhRegisterCleanup = registerCleanup
function runPageCleanups(list) {
  while (list.length) {
    const fn = list.pop()
    try {
      fn()
    } catch (e) {
      console.warn('pageCleanup error', e)
    }
  }
}

function resetPage() {
  window.scrollTo(0, 0)
  // Do NOT clear position:fixed here — the leaving page may still be in the DOM.
  // Removing fixed puts the entering container below the leaving one in document flow
  // → blank screen until the leaving container is removed (~175ms gap).
  // clearProps is handled in afterEnter, after the old container is removed.
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth
        fn.apply(this, args)
      }
    }, ms)
  }
}

function initBarbaNavUpdate(data) {
  const tpl = document.createElement('template')
  tpl.innerHTML = data.next.html.trim()
  const nextNodes = tpl.content.querySelectorAll('[data-barba-update]')
  const currentNodes = document.querySelectorAll('nav [data-barba-update]')

  currentNodes.forEach(function (curr, index) {
    const next = nextNodes[index]
    if (!next) return

    // Aria-current sync
    const newStatus = next.getAttribute('aria-current')
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus)
    } else {
      curr.removeAttribute('aria-current')
    }

    // Class list sync
    const newClassList = next.getAttribute('class') || ''
    curr.setAttribute('class', newClassList)
  })
}

//  ==================== GLOBAL MODULES (was global.js)
const initForm = (container = document) => {
  if (!container.querySelector('.form_input')) return

  container.querySelectorAll('.form_input').forEach((field) => {
    if (field._formInit) return
    field._formInit = true

    const label = field.closest('.form-field-group')?.querySelector('.form_label')
    const isTextarea = field.closest('.form-field-group')?.querySelector('.form_input.is-text-area')

    // On focus in
    field.addEventListener('focusin', () => {
      if (label) label.classList.remove('is-large')
      if (isTextarea) field.classList.add('is-active')
    })

    // On focus out
    field.addEventListener('focusout', () => {
      const isEmpty = field.value.trim().length === 0
      if (isEmpty && label) label.classList.add('is-large')
      if (isTextarea && isEmpty) field.classList.remove('is-active')
    })

    // On load
    if (field.value.trim().length > 0) {
      if (label) label.classList.remove('is-large')
      if (isTextarea) field.classList.add('is-active')
    }
  })
}

function initHighlightMarkerTextReveal(container = document) {
  const defaults = {
    direction: 'right',
    theme: 'accent',
    scrollStart: 'top 90%',
    staggerStart: 'start',
    stagger: 100,
    barDuration: 0.6,
    barEase: 'power3.inOut',
    heroDelay: 3,
  }

  const colorMap = {
    accent: '#82eeff',
    white: '#FFFFFF',
  }

  const directionMap = {
    right: { prop: 'scaleX', origin: 'right center' },
    left: { prop: 'scaleX', origin: 'left center' },
    up: { prop: 'scaleY', origin: 'center top' },
    down: { prop: 'scaleY', origin: 'center bottom' },
  }

  function resolveColor(value) {
    if (colorMap[value]) return colorMap[value]
    if (value.startsWith('--')) {
      return getComputedStyle(document.body).getPropertyValue(value).trim() || value
    }
    return value
  }

  function createBar(color, origin) {
    const bar = document.createElement('div')
    bar.className = 'highlight-marker-bar'
    Object.assign(bar.style, {
      backgroundColor: color,
      transformOrigin: origin,
    })
    return bar
  }

  function cleanupElement(el) {
    if (!el._highlightMarkerReveal) return
    el._highlightMarkerReveal.timeline?.kill()
    el._highlightMarkerReveal.scrollTrigger?.kill()
    el._highlightMarkerReveal.split?.revert()
    el.querySelectorAll('.highlight-marker-bar').forEach((bar) => bar.remove())
    delete el._highlightMarkerReveal
  }

  let reduceMotion = false

  gsap.matchMedia().add({ reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
    reduceMotion = context.conditions.reduce
  })

  // Reduced motion: no animation at all
  if (reduceMotion) {
    container.querySelectorAll('[data-highlight-marker-reveal]').forEach((el) => {
      gsap.set(el, { autoAlpha: 1 })
    })
    return
  }

  // Cleanup previous instances
  container.querySelectorAll('[data-highlight-marker-reveal]').forEach(cleanupElement)

  const elements = container.querySelectorAll('[data-highlight-marker-reveal]')
  if (!elements.length) return

  elements.forEach((el) => {
    const direction = el.getAttribute('data-marker-direction') || defaults.direction
    const theme = el.getAttribute('data-marker-theme') || defaults.theme
    const scrollStart = el.getAttribute('data-marker-scroll-start') || defaults.scrollStart
    const staggerStart = el.getAttribute('data-marker-stagger-start') || defaults.staggerStart
    const staggerOffset =
      (parseFloat(el.getAttribute('data-marker-stagger')) || defaults.stagger) / 1000

    const color = resolveColor(theme)
    const dirConfig = directionMap[direction] || directionMap.right
    const isHero = !!el.closest('[data-hero]')
    const heroDelay = parseFloat(el.getAttribute('data-marker-delay')) || defaults.heroDelay

    el._highlightMarkerReveal = {}

    const split = SplitText.create(el, {
      type: 'lines',
      linesClass: 'highlight-marker-line',
      autoSplit: true,
      onSplit(self) {
        const instance = el._highlightMarkerReveal

        // Teardown previous build
        instance.timeline?.kill()
        instance.scrollTrigger?.kill()
        el.querySelectorAll('.highlight-marker-bar').forEach((bar) => bar.remove())

        // Build bars and timeline
        const lines = self.lines
        const tl = gsap.timeline({ paused: true })

        lines.forEach((line, i) => {
          gsap.set(line, { position: 'relative', overflow: 'hidden' })

          const bar = createBar(color, dirConfig.origin)
          line.appendChild(bar)

          const staggerIndex = staggerStart === 'end' ? lines.length - 1 - i : i

          tl.to(
            bar,
            {
              [dirConfig.prop]: 0,
              duration: defaults.barDuration,
              ease: defaults.barEase,
            },
            staggerIndex * staggerOffset
          )
        })

        // Reveal parent — bars are covering the text
        gsap.set(el, { autoAlpha: 1 })

        if (isHero) {
          // Hero: play after delay, no ScrollTrigger
          gsap.delayedCall(heroDelay, () => tl.play())
        } else {
          // ScrollTrigger
          const st = ScrollTrigger.create({
            trigger: el,
            start: scrollStart,
            once: true,
            onEnter: () => tl.play(),
          })
          instance.scrollTrigger = st
        }

        instance.timeline = tl
      },
    })

    el._highlightMarkerReveal.split = split
  })
}

function initButtonHover(container = document) {
  const offsetIncrement = 0.01 // Transition offset increment in seconds
  const buttons = container.querySelectorAll('[data-button-text]')

  buttons.forEach((button) => {
    if (button._buttonHoverInit) return
    button._buttonHoverInit = true

    const text = button.textContent // Get the button's text content
    button.innerHTML = '' // Clear the original content
      ;[...text].forEach((char, index) => {
        const span = document.createElement('span')
        span.textContent = char
        span.style.transitionDelay = `${index * offsetIncrement}s`

        // Handle spaces explicitly
        if (char === ' ') {
          span.style.whiteSpace = 'pre' // Preserve space width
        }

        button.appendChild(span)
      })
  })
}

function initMegaNav() {
  const menuWrap = document.querySelector('[data-menu-wrap]')
  if (!menuWrap || menuWrap._megaNavInit) return
  menuWrap._megaNavInit = true

  const DUR = {
    bgMorph: 0.4,
    contentIn: 0.3,
    contentOut: 0.2,
    stagger: 0.25,
    backdropIn: 0.3,
    backdropOut: 0.2,
    openScale: 0.35,
    closeScale: 0.25,
  }

  const HOVER_ENTER = 120
  const HOVER_LEAVE = 150

  // DOM references
  const navList = document.querySelector('[data-nav-list]')
  const dropWrapper = document.querySelector('[data-dropdown-wrapper]')
  const dropContainer = document.querySelector('[data-dropdown-container]')
  const dropBg = document.querySelector('[data-dropdown-bg]')
  const backdrop = document.querySelector('[data-menu-backdrop]')
  const toggles = [...document.querySelectorAll('[data-dropdown-toggle]')]
  const panels = [...document.querySelectorAll('[data-nav-content]')]
  const burger = document.querySelector('[data-burger-toggle]')
  const backBtn = document.querySelector('[data-mobile-back]')
  const logo = document.querySelector('[data-menu-logo]')
  const [lineTop, lineMid, lineBot] = ['top', 'mid', 'bot'].map((id) =>
    document.querySelector(`[data-burger-line='${id}']`)
  )

  // State
  const state = {
    isOpen: false,
    activePanel: null,
    activePanelIndex: -1,
    isMobile: window.innerWidth <= 991,
    mobileMenuOpen: false,
    mobilePanelActive: null,
    hoverTimer: null,
    leaveTimer: null,
    tl: null,
    mobileTl: null,
    mobilePanelTl: null,
  }

  // Helpers
  const getPanel = (name) => document.querySelector(`[data-nav-content="${name}"]`)
  const getToggle = (name) => document.querySelector(`[data-dropdown-toggle="${name}"]`)
  const getFade = (el) => el.querySelectorAll('[data-menu-fade]')
  const getNavItems = () => navList.querySelectorAll('[data-nav-list-item]')
  const getIndex = (name) => toggles.indexOf(getToggle(name))
  const stagger = (n) => (n <= 1 ? 0 : { amount: DUR.stagger })

  function clearTimers() {
    clearTimeout(state.hoverTimer)
    clearTimeout(state.leaveTimer)
    state.hoverTimer = state.leaveTimer = null
  }

  function killTl(key) {
    if (state[key]) {
      state[key].kill()
      state[key] = null
    }
  }

  function killDropdown() {
    killTl('tl')
    gsap.killTweensOf(dropContainer)
    gsap.killTweensOf(backdrop)
    panels.forEach((p) => {
      gsap.killTweensOf(p)
      gsap.killTweensOf(getFade(p))
    })
  }

  function killMobile() {
    killTl('mobileTl')
    gsap.killTweensOf([navList, lineTop, lineMid, lineBot])
  }

  function killMobilePanel() {
    killTl('mobilePanelTl')
    gsap.killTweensOf(getNavItems())
    gsap.killTweensOf([backBtn, logo])
    panels.forEach((p) => {
      gsap.killTweensOf(p)
      gsap.killTweensOf(getFade(p))
    })
  }

  function resetToggles() {
    toggles.forEach((t) => t.setAttribute('aria-expanded', 'false'))
  }

  function resetDesktop() {
    panels.forEach((p) => {
      gsap.set(p, { visibility: 'hidden', opacity: 0, pointerEvents: 'none', xPercent: 0 })
      gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 })
    })
    gsap.set(dropContainer, { height: 0 })
    gsap.set(backdrop, { autoAlpha: 0 })
    menuWrap.setAttribute('data-menu-open', 'false')
    resetToggles()
  }

  function setupMobile() {
    panels.forEach((p) => {
      gsap.set(p, { autoAlpha: 0, xPercent: 0, visibility: 'visible', pointerEvents: 'none' })
      gsap.set(getFade(p), { xPercent: 20, autoAlpha: 0 })
    })
    gsap.set(getNavItems(), { xPercent: 0, y: 0, autoAlpha: 1 })
    gsap.set(navList, { autoAlpha: 0, x: 0 })
    gsap.set(backBtn, { autoAlpha: 0 })
    gsap.set(logo, { autoAlpha: 1 })
    gsap.set(dropContainer, { clearProps: 'height' })
    gsap.set(backdrop, { autoAlpha: 0 })
  }

  function measurePanel(name) {
    const el = getPanel(name)
    if (!el) return 0
    const s = el.style
    const prev = [s.visibility, s.opacity, s.pointerEvents]
    Object.assign(s, { visibility: 'visible', opacity: '0', pointerEvents: 'none' })
    const h = el.getBoundingClientRect().height
      ;[s.visibility, s.opacity, s.pointerEvents] = prev
    return h
  }

  // DESKTOP — open dropdown (first open)
  function openDropdown(panelName) {
    if (state.isOpen && state.activePanel === panelName) return
    if (state.isOpen) return switchPanel(state.activePanel, panelName)

    const height = measurePanel(panelName)
    if (!height) return

    killDropdown()
    resetDesktop()

    const el = getPanel(panelName)
    const fade = getFade(el)
    const toggle = getToggle(panelName)

    state.isOpen = true
    state.activePanel = panelName
    state.activePanelIndex = getIndex(panelName)
    menuWrap.setAttribute('data-menu-open', 'true')
    if (toggle) toggle.setAttribute('aria-expanded', 'true')

    gsap.set(dropContainer, { height: 0 })

    const tl = gsap.timeline()
    state.tl = tl
    tl.to(backdrop, { autoAlpha: 1, duration: DUR.backdropIn, ease: 'power2.out' }, 0)
    tl.to(dropContainer, { height, duration: DUR.openScale, ease: 'power3.out' }, 0)
    tl.set(el, { visibility: 'visible', opacity: 1, pointerEvents: 'auto' }, 0.05)
    if (fade.length) {
      tl.fromTo(
        fade,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: DUR.contentIn,
          stagger: stagger(fade.length),
          ease: 'power3.out',
        },
        0.1
      )
    }
  }

  // DESKTOP — close dropdown
  function closeDropdown() {
    if (!state.isOpen) return
    const el = getPanel(state.activePanel)
    const fade = el ? getFade(el) : []

    killDropdown()

    const tl = gsap.timeline({
      onComplete() {
        state.isOpen = false
        state.activePanel = null
        state.activePanelIndex = -1
        state.tl = null
        resetDesktop()
      },
    })
    state.tl = tl
    if (fade.length)
      tl.to(fade, { autoAlpha: 0, y: -4, duration: DUR.contentOut * 0.7, ease: 'power2.in' }, 0)
    tl.to(dropContainer, { height: 0, duration: DUR.closeScale, ease: 'power2.in' }, 0.05)
    tl.to(backdrop, { autoAlpha: 0, duration: DUR.backdropOut, ease: 'power2.out' }, 0)
    if (el) tl.set(el, { visibility: 'hidden', opacity: 0, pointerEvents: 'none' })
  }

  // DESKTOP — switch panel (directional)
  function switchPanel(fromName, toName) {
    const dir = getIndex(toName) > getIndex(fromName) ? 1 : -1
    const fromEl = getPanel(fromName),
      toEl = getPanel(toName)
    if (!fromEl || !toEl) return

    const fromFade = getFade(fromEl),
      toFade = getFade(toEl)
    const toHeight = measurePanel(toName)
    if (!toHeight) return

    killDropdown()

    // Reset all panels, then restore fromEl as visible
    panels.forEach((p) => {
      gsap.set(p, { visibility: 'hidden', opacity: 0, pointerEvents: 'none', xPercent: 0 })
      gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 })
    })
    gsap.set(fromEl, { visibility: 'visible', opacity: 1, pointerEvents: 'auto', x: 0 })
    if (fromFade.length) gsap.set(fromFade, { autoAlpha: 1, x: 0, y: 0 })
    gsap.set(backdrop, { autoAlpha: 1 })

    const toToggle = getToggle(toName)
    state.activePanel = toName
    state.activePanelIndex = getIndex(toName)
    resetToggles()
    if (toToggle) toToggle.setAttribute('aria-expanded', 'true')

    const xOut = dir * -30,
      xIn = dir * 30
    const tl = gsap.timeline()
    state.tl = tl

    if (fromFade.length)
      tl.to(fromFade, { autoAlpha: 0, x: xOut, duration: DUR.contentOut, ease: 'power2.in' }, 0)
    tl.set(
      fromEl,
      { visibility: 'hidden', opacity: 0, pointerEvents: 'none', xPercent: 0 },
      DUR.contentOut
    )
    if (fromFade.length) tl.set(fromFade, { x: 0 }, DUR.contentOut)
    tl.to(dropContainer, { height: toHeight, duration: DUR.bgMorph, ease: 'power3.out' }, 0.05)
    tl.set(
      toEl,
      { visibility: 'visible', opacity: 1, pointerEvents: 'auto', xPercent: 0 },
      DUR.contentOut * 0.5
    )
    if (toFade.length) {
      tl.fromTo(
        toFade,
        { autoAlpha: 0, x: xIn },
        {
          autoAlpha: 1,
          x: 0,
          duration: DUR.contentIn,
          stagger: stagger(toFade.length),
          ease: 'power3.out',
        },
        DUR.contentOut * 0.6
      )
    }
  }

  // DESKTOP — hover intent
  function handleToggleEnter(e) {
    if (state.isMobile) return
    const name = e.currentTarget.getAttribute('data-dropdown-toggle')
    if (!name) return
    clearTimeout(state.leaveTimer)
    state.leaveTimer = null
    clearTimeout(state.hoverTimer)
    state.hoverTimer = setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER)
  }

  function handleToggleLeave() {
    if (state.isMobile) return
    clearTimeout(state.hoverTimer)
    state.hoverTimer = null
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE)
  }

  function handleWrapperEnter() {
    if (state.isMobile) return
    clearTimeout(state.leaveTimer)
    state.leaveTimer = null
  }

  function handleWrapperLeave() {
    if (state.isMobile) return
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE)
  }

  // DESKTOP — close behaviors
  function handleEscape(e) {
    if (e.key !== 'Escape') return
    if (state.isMobile) {
      state.mobilePanelActive ? closeMobilePanel() : state.mobileMenuOpen && closeMobileMenu()
      return
    }
    if (state.isOpen) {
      const t = getToggle(state.activePanel)
      closeDropdown()
      if (t) t.focus()
    }
  }

  function handleDocClick(e) {
    if (state.isMobile || !state.isOpen) return
    if (!e.target.closest('[data-menu-wrap]')) closeDropdown()
  }

  // DESKTOP — keyboard navigation
  function focusFirstLink(panelName) {
    setTimeout(() => {
      const el = getPanel(panelName)
      if (!el) return
      const link = el.querySelector('a')
      if (!link) return
      gsap.set(link, { visibility: 'visible' })
      link.focus()
    }, 80)
  }

  function handleKeydownOnToggle(e) {
    if (state.isMobile) return
    const name = e.currentTarget.getAttribute('data-dropdown-toggle')

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (state.isOpen && state.activePanel === name) closeDropdown()
      else {
        openDropdown(name)
        focusFirstLink(name)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!state.isOpen || state.activePanel !== name) openDropdown(name)
      focusFirstLink(name)
    }
    if (e.key === 'Tab' && !e.shiftKey && state.isOpen && state.activePanel === name) {
      e.preventDefault()
      const link = getPanel(name)?.querySelector('a')
      if (link) link.focus()
    }
  }

  function handleKeydownInPanel(e) {
    if (state.isMobile || !state.isOpen) return
    const el = getPanel(state.activePanel)
    if (!el) return

    const links = [...el.querySelectorAll('a')]
    const idx = links.indexOf(document.activeElement)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      links[(idx + 1) % links.length].focus()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (idx <= 0) {
        const t = getToggle(state.activePanel)
        if (t) t.focus()
      } else links[idx - 1].focus()
    }
    if (e.key === 'Tab' && !e.shiftKey && idx === links.length - 1) {
      e.preventDefault()
      const curIdx = toggles.indexOf(getToggle(state.activePanel))
      const next = curIdx < toggles.length - 1 ? toggles[curIdx + 1] : null
      closeDropdown()
      if (next) next.focus()
    }
    if (e.key === 'Tab' && e.shiftKey && idx === 0) {
      e.preventDefault()
      const t = getToggle(state.activePanel)
      if (t) t.focus()
    }
  }

  // MOBILE — burger animation
  function animateBurger(toX) {
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
    if (toX) {
      tl.to(lineTop, { y: '0.3125em', duration: 0.15 }, 0)
      tl.to(lineBot, { y: '-0.3125em', duration: 0.15 }, 0)
      tl.to(lineMid, { autoAlpha: 0, duration: 0.1 }, 0.1)
      tl.to(lineTop, { rotation: 45, duration: 0.2 }, 0.15)
      tl.to(lineBot, { rotation: -45, duration: 0.2 }, 0.15)
    } else {
      tl.to(lineTop, { rotation: 0, duration: 0.2 }, 0)
      tl.to(lineBot, { rotation: 0, duration: 0.2 }, 0)
      tl.to(lineTop, { y: 0, duration: 0.15 }, 0.15)
      tl.to(lineBot, { y: 0, duration: 0.15 }, 0.15)
      tl.to(lineMid, { autoAlpha: 1, duration: 0.1 }, 0.15)
    }
    return tl
  }

  // MOBILE — open/close menu
  function openMobileMenu() {
    killMobile()
    state.mobileMenuOpen = true
    menuWrap.setAttribute('data-menu-open', 'true')
    burger.setAttribute('aria-expanded', 'true')
    document.body.style.overflow = 'hidden'

    const items = getNavItems()
    const tl = gsap.timeline()
    state.mobileTl = tl
    tl.add(animateBurger(true), 0)
    tl.to(navList, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 0)
    if (items.length) {
      tl.fromTo(
        items,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power3.out' },
        0.15
      )
    }
  }

  function closeMobileMenu() {
    const hadPanel = state.mobilePanelActive
    const panelEl = hadPanel ? getPanel(hadPanel) : null

    killMobile()
    killMobilePanel()

    menuWrap.setAttribute('data-menu-open', 'false')
    state.mobileMenuOpen = false
    state.mobilePanelActive = null
    burger.setAttribute('aria-expanded', 'false')

    const tl = gsap.timeline({
      onComplete() {
        document.body.style.overflow = ''
        state.mobileTl = null
        setupMobile()
      },
    })
    state.mobileTl = tl

    tl.add(animateBurger(false), 0)

    // If a panel was open, fade it out with the close — no snap reset
    if (hadPanel && panelEl) {
      tl.to(panelEl, { autoAlpha: 0, duration: 0.3, ease: 'power2.inOut' }, 0.05)
      tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0.05)
    }

    // Fade out the nav list container
    tl.to(navList, { autoAlpha: 0, duration: 0.3, ease: 'power2.inOut' }, 0.05)
  }

  // MOBILE — slide-over panels
  function openMobilePanel(panelName) {
    const el = getPanel(panelName)
    if (!el) return
    killMobilePanel()
    state.mobilePanelActive = panelName

    const navItems = getNavItems()
    const panelFade = getFade(el)

    const tl = gsap.timeline()
    state.mobilePanelTl = tl

    // Fade out each nav item to the left
    if (navItems.length) {
      tl.to(
        navItems,
        {
          xPercent: -10,
          autoAlpha: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: 'power2.in',
        },
        0
      )
    }

    // Logo → back button swap
    tl.to(logo, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0)
    tl.to(backBtn, { autoAlpha: 1, duration: 0.25, ease: 'power2.inOut' }, 0.15)

    // Show panel container, then fade in its items from the right
    tl.set(el, { autoAlpha: 1, xPercent: 0, pointerEvents: 'auto' }, 0.2)
    if (panelFade.length) {
      tl.fromTo(
        panelFade,
        { xPercent: 8, autoAlpha: 0 },
        {
          xPercent: 0,
          autoAlpha: 1,
          duration: 0.3,
          stagger: stagger(panelFade.length),
          ease: 'power3.out',
        },
        0.25
      )
    }
  }

  function closeMobilePanel() {
    if (!state.mobilePanelActive) return
    const el = getPanel(state.mobilePanelActive)
    if (!el) return
    killMobilePanel()

    const navItems = getNavItems()
    const panelFade = getFade(el)

    const tl = gsap.timeline({
      onComplete() {
        state.mobilePanelActive = null
        state.mobilePanelTl = null
      },
    })
    state.mobilePanelTl = tl

    // Fade out panel items to the right
    if (panelFade.length) {
      tl.to(
        el,
        {
          xPercent: 20,
          autoAlpha: 0,
          duration: 0.3,
          stagger: 0.02,
          ease: 'power2.in',
        },
        0
      )
    }

    // Hide panel
    tl.set(el, { autoAlpha: 0, pointerEvents: 'none' }, 0.25)

    // Back → logo swap
    tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0)
    tl.to(logo, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }, 0.15)

    // Fade nav items back in from center
    if (navItems.length) {
      tl.fromTo(
        navItems,
        { xPercent: -20, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.35, stagger: 0.03, ease: 'power3.out' },
        0.25
      )
    }
  }

  function handleToggleClick(e) {
    if (!state.isMobile || !state.mobileMenuOpen) return
    const name = e.currentTarget.getAttribute('data-dropdown-toggle')
    if (name) {
      e.preventDefault()
      openMobilePanel(name)
    }
  }

  // RESIZE
  let resizeTimer = null
  let lastWidth = window.innerWidth
  function handleResize() {
    const w = window.innerWidth
    if (w === lastWidth) return
    lastWidth = w
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const was = state.isMobile
      state.isMobile = window.innerWidth <= 991

      if (was && !state.isMobile) {
        killMobile()
        killMobilePanel()
        gsap.set(navList, { clearProps: 'all' })
        gsap.set(getNavItems(), { clearProps: 'all' })
        gsap.set(backBtn, { autoAlpha: 0 })
        gsap.set(logo, { clearProps: 'all' })
        gsap.set([lineTop, lineMid, lineBot], { rotation: 0, y: 0, autoAlpha: 1 })
        burger.setAttribute('aria-expanded', 'false')
        state.mobileMenuOpen = false
        state.mobilePanelActive = null
        document.body.style.overflow = ''
        resetDesktop()
      }
      if (!was && state.isMobile) {
        killDropdown()
        state.isOpen = false
        state.activePanel = null
        state.activePanelIndex = -1
        clearTimers()
        menuWrap.setAttribute('data-menu-open', 'false')
        resetToggles()
        setupMobile()
      }
    }, 150)
  }

  // EVENT BINDING
  toggles.forEach((btn) => {
    btn.addEventListener('mouseenter', handleToggleEnter)
    btn.addEventListener('mouseleave', handleToggleLeave)
    btn.addEventListener('keydown', handleKeydownOnToggle)
    btn.addEventListener('click', handleToggleClick)
  })
  dropWrapper.addEventListener('mouseenter', handleWrapperEnter)
  dropWrapper.addEventListener('mouseleave', handleWrapperLeave)
  panels.forEach((p) => p.addEventListener('keydown', handleKeydownInPanel))
  backdrop.addEventListener('click', closeDropdown)
  document.addEventListener('keydown', handleEscape)
  document.addEventListener('click', handleDocClick)
  burger.addEventListener('click', () =>
    state.mobileMenuOpen ? closeMobileMenu() : openMobileMenu()
  )
  backBtn.addEventListener('click', closeMobilePanel)
  window.addEventListener('resize', handleResize)

  // INIT
  state.isMobile ? setupMobile() : resetDesktop()
}

const initNav = () => {
  const navLogo = document.querySelector('.mega-nav__bar-logo')

    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: document.body,
          start: 'clamp(top bottom)',
          end: 'top -400px',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      .to(navLogo, { width: '9rem' })
}

function initStackingStickyCardsBounce(container = document) {
  const cardsSections = container.querySelectorAll('[data-stacking-cards-init]')

  const currentTier = getCurrentViewportTier()
  window.viewportTier = currentTier

  ScrollTrigger.getAll().forEach((trigger) => {
    cardsSections.forEach((section) => {
      if (section.contains(trigger.trigger)) trigger.kill()
    })
  })

  cardsSections.forEach((section) => {
    section.querySelectorAll('[data-stacking-card-target]').forEach((el) => {
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: 'all' })
    })
  })

  cardsSections.forEach((section) => {
    const tier = currentTier

    const isEnabled =
      (tier === 'desktop' && section.dataset.stackingCardsDesktop === 'true') ||
      (tier === 'tablet' && section.dataset.stackingCardsTablet === 'true') ||
      ((tier === 'mobile-portrait' || tier === 'mobile-landscape') &&
        section.dataset.stackingCardsMobile === 'true')

    if (!isEnabled) return

    const cards = Array.from(section.querySelectorAll('[data-stacking-card]'))
    if (!cards.length) return

    const stickyTop = parseFloat(getComputedStyle(cards[0]).top) || 0

    const tierKey = tier === 'desktop' || tier === 'tablet' ? tier : 'mobile'
    const attr = (axis) => `data-stacking-cards-${tierKey}-${axis}`

    const rotateValues = parseRotateValues(section, attr('rotate'))
    const xValues = parseAxisValues(section, attr('x'))
    const yValues = parseAxisValues(section, attr('y'))

    cards.forEach((card, index) => {
      const targetEl = card.querySelector('[data-stacking-card-target]')
      if (!targetEl) return

      const rotate = rotateValues[index % rotateValues.length]
      const x = xValues[index % xValues.length]
      const y = yValues[index % yValues.length]

      gsap.set(targetEl, {
        rotate: 0,
        x: 0,
        y: 0,
        scale: 1,
        zIndex: cards.length - index,
      })

      gsap.to(targetEl, {
        rotate,
        x,
        y,
        ease: 'power1.in',
        overwrite: 'auto',
        scrollTrigger: {
          id: `stacking-rotate-${index}`,
          trigger: card,
          start: 'top 75%',
          end: `top-=${stickyTop} top`,
          scrub: true,
        },
      })

      ScrollTrigger.create({
        id: `stacking-bounce-${index}`,
        trigger: card,
        start: `top-=${stickyTop} top`,
        onEnter: () => pulseElement(targetEl),
      })
    })
  })

  ScrollTrigger.refresh()

  function parseRotateValues(section, attr) {
    const fallback = [0, 4, -4]
    const values = (section.getAttribute(attr) || '')
      .split(',')
      .map((val) => parseFloat(val.trim()))
    return values.length >= 1 && values.every((v) => !isNaN(v)) ? values : fallback
  }

  function parseAxisValues(section, attr) {
    const raw = section.getAttribute(attr)
    if (!raw) return ['0em', '0em', '0em']
    const values = raw
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val !== '')
    return values.length ? values : ['0em', '0em', '0em']
  }

  if (!window._hasStackingResizeListener) {
    let last = getCurrentViewportTier()

    window.addEventListener(
      'resize',
      debounceOnWidthChange(() => {
        const next = getCurrentViewportTier()

        if (last !== next) {
          ScrollTrigger.getAll().forEach((t) => {
            if (t.vars?.id?.startsWith('stacking')) t.kill()
          })

          cardsSections.forEach((section) => {
            section.querySelectorAll('[data-stacking-card-target]').forEach((el) => {
              gsap.killTweensOf(el)
              gsap.set(el, { clearProps: 'all' })
            })
          })

          initStackingStickyCardsBounce()
        }

        last = next
        window.viewportTier = next
      }, 250)
    )

    window._hasStackingResizeListener = true
  }

  // Helper: Get Current Viewport Tier
  function getCurrentViewportTier() {
    const width = window.innerWidth

    if (width <= 479) return 'mobile-portrait'
    if (width <= 767) return 'mobile-landscape'
    if (width <= 991) return 'tablet'
    return 'desktop'
  }

  // Helper: Pulse pulse (Bounce Animation)
  function pulseElement(targetEl) {
    const width = targetEl.offsetWidth
    const height = targetEl.offsetHeight
    const fontSize = parseFloat(getComputedStyle(targetEl).fontSize)
    const stretchPx = 1.5 * fontSize
    const targetScaleX = (width + stretchPx) / width
    const targetScaleY = (height - stretchPx * 0.33) / height

    const tl = gsap.timeline()
    tl.to(targetEl, {
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: 0.1,
      ease: 'power1.out',
    }).to(targetEl, {
      scaleX: 1,
      scaleY: 1,
      duration: 1,
      //ease: 'elastic.out(1, 0.3)',
    })
  }
}

const initPerks = (container = document) => {
  const containers = container.querySelectorAll('[data-typo-scroll-init]')
  if (!containers.length) return

  const CLIP_HIDDEN = 'inset(1.5em)'
  const CLIP_SHOWN = 'inset(0em)'
  const ease = CustomEase.create('perksMedia', '0.16, 1, 0.3, 1')
  const ATTR = 'data-typo-scroll-item'

  const entries = Array.from(containers).flatMap((c) =>
    Array.from(c.querySelectorAll(`[${ATTR}]`)).map((el) => ({
      el,
      heading: el.querySelector('.typo-scroll__h'),
      tooltip: el.querySelector('.perk_tooltip'),
      media: el.querySelector('.typo-scroll__media'),
    }))
  )

  entries.forEach(({ tooltip, media }) => {
    if (tooltip) gsap.set(tooltip, { autoAlpha: 0, clipPath: CLIP_HIDDEN })
    if (media) gsap.set(media, { autoAlpha: 0, clipPath: CLIP_HIDDEN })
  })

  const isActive = (entry) => entry.el.getAttribute(ATTR) === 'active'

  const reveal = () => {
    const anyActive = entries.some(isActive)
    entries.forEach((entry) => {
      const active = isActive(entry)
      const { heading, tooltip, media } = entry

      if (heading) {
        heading.style.color = !anyActive || active ? 'black' : '#C1C0BE'
        heading.style.zIndex = active ? '2' : ''
      }
      if (tooltip) {
        gsap.set(tooltip, { autoAlpha: active ? 1 : 0 })
        gsap.to(tooltip, {
          clipPath: active ? CLIP_SHOWN : CLIP_HIDDEN,
          duration: 0.5,
          ease,
          overwrite: 'auto',
        })
      }
      if (media) {
        gsap.set(media, { autoAlpha: active ? 1 : 0 })
        gsap.to(media, {
          clipPath: active ? CLIP_SHOWN : CLIP_HIDDEN,
          duration: 1.2,
          ease,
          overwrite: 'auto',
        })
      }
    })
  }

  // Closest-to-viewport-center tracker: writes data-typo-scroll-item="active" on one item per container.
  const tracked = Array.from(containers).map((container) => ({
    container,
    items: Array.from(container.querySelectorAll(`[${ATTR}]`)),
    centers: [],
    top: 0,
    bottom: 0,
  }))

  const measure = () => {
    const scrollY = window.scrollY
    tracked.forEach((data) => {
      const rect = data.container.getBoundingClientRect()
      data.top = rect.top + scrollY
      data.bottom = rect.bottom + scrollY
      data.centers = data.items.map((item) => {
        const r = item.getBoundingClientRect()
        return r.top + scrollY + r.height / 2
      })
    })
  }

  const setActive = (item, value) => {
    if (item.getAttribute(ATTR) === value) return false
    item.setAttribute(ATTR, value)
    return true
  }

  const update = () => {
    const center = window.scrollY + window.innerHeight / 2
    let changed = false

    tracked.forEach((data) => {
      if (!data.items.length) return

      const inView = center >= data.top && center <= data.bottom
      if (!inView) {
        data.items.forEach((item) => {
          if (setActive(item, '')) changed = true
        })
        return
      }

      let closestIndex = 0
      let closestDistance = Infinity
      data.centers.forEach((c, i) => {
        const d = Math.abs(center - c)
        if (d < closestDistance) {
          closestDistance = d
          closestIndex = i
        }
      })

      data.items.forEach((item, i) => {
        if (setActive(item, i === closestIndex ? 'active' : '')) changed = true
      })
    })

    if (changed) reveal()
  }

  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      update()
    })
  }

  let measureQueued = false
  const scheduleMeasureUpdate = () => {
    if (measureQueued) return
    measureQueued = true
    requestAnimationFrame(() => {
      measureQueued = false
      measure()
      update()
    })
  }

  measure()
  update()

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', scheduleMeasureUpdate)

  const bg = container.querySelector('.perks_bg')
  let bgMm = null
  if (bg) {
    bgMm = gsap.matchMedia()
    bgMm.add(MQ.tabletUp, () => {
      gsap.fromTo(
        bg,
        { scale: 0.8 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.section_perks',
            start: 'clamp(top 100%)',
            end: 'bottom top',
            scrub: true,
          },
        }
      )
    })
  }

  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      window.lenis?.resize()
      scheduleMeasureUpdate()
    })
  }

  registerCleanup(() => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', scheduleMeasureUpdate)
    bgMm?.revert()
  })
}

const initParallax = (container = document) => {
  if (!container.querySelector('.parallax-parent')) return

  const mm = gsap.matchMedia()
  mm.add(MQ.tabletUp, () => {
    container.querySelectorAll('.parallax-parent').forEach((parallaxParent) => {
    const parallaxImg = parallaxParent.querySelector('.parallax')
    if (!parallaxImg) return

    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: parallaxParent,
          start: 'clamp(top bottom)',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      .to(parallaxImg, { yPercent: 40 })
  })
})

  registerCleanup(() => mm.revert())
}

function initTextAnimations(container = document) {
  container.querySelectorAll('[data-split]').forEach((el) => {
    if (el.hasAttribute('data-hero-heading')) return
    splitReveal(el, {
      scrollTrigger: {
        trigger: el,
        start: 'clamp(top 90%)',
        once: true,
      },
    })
  })
}

function initOverlappingSlider(container = document) {
  const inits = container.querySelectorAll('[data-overlap-slider-init]')
  if (!inits.length) return

  inits.forEach(setupOverlappingSlider)

  function setupOverlappingSlider(init) {
    // --- attributes with defaults
    const minScale = +(init.getAttribute('data-scale') ?? 0.45)
    const maxRotation = +(init.getAttribute('data-rotate') ?? -8)
    const inertia = true

    const wrap = init.querySelector('[data-overlap-slider-collection]')
    const slider = init.querySelector('[data-overlap-slider-list]')
    const slides = Array.from(init.querySelectorAll('[data-overlap-slider-item]'))

    if (!wrap || !slider || !slides.length) {
      console.warn(
        'OverlappingSlider: missing required structure. Check Osmo Vault documentation please.'
      )
      return
    }

    wrap.style.touchAction = 'none'
    wrap.style.userSelect = 'none'

    // transform-origin never changes per frame; set once.
    gsap.set(slides, { transformOrigin: '75% center' })

    // quickSetter bypasses the tween pipeline — much cheaper than gsap.set
    // when called every frame during drag.
    const setSliderX = gsap.quickSetter(slider, 'x', 'px')

    let spacing = 0
    let slideW = 0
    let maxDrag = 0
    let dragX = 0
    // eslint-disable-next-line prefer-const
    let draggable

    // simple clamp that always uses latest maxDrag
    function clamp(value) {
      if (maxDrag <= 0) return 0
      return Math.min(Math.max(value, 0), maxDrag)
    }

    function update() {
      setSliderX(-dragX)

      slides.forEach((slide, i) => {
        const threshold = i * spacing
        const local = Math.max(0, dragX - threshold)
        const t = spacing > 0 ? Math.min(local / spacing, 1) : 0

        gsap.set(slide, {
          x: local,
          scale: 1 - (1 - minScale) * t,
          rotation: maxRotation * t,
        })
      })
    }

    function recalc() {
      if (!slides.length) return

      // measure one slide to get width + margin-right as "gap"
      const style = getComputedStyle(slides[0])
      const gapRight = parseFloat(style.marginRight) || 0

      slideW = slides[0].offsetWidth
      spacing = slideW + gapRight
      maxDrag = spacing * (slides.length - 1)

      // keep dragX within new bounds
      dragX = clamp(dragX)
      update()

      if (draggable) {
        draggable.applyBounds({ minX: -maxDrag, maxX: 0 })
      }
    }

    // create draggable
    draggable = Draggable.create(slider, {
      type: 'x',
      bounds: { minX: -maxDrag, maxX: 0 }, // will be updated after recalc
      inertia,
      maxDuration: 1,
      snap: true
        ? (raw) => {
          // raw is the x value
          const d = clamp(-raw)
          const idx = spacing > 0 ? Math.round(d / spacing) : 0
          return -idx * spacing
        }
        : false,
      onDrag() {
        dragX = clamp(-this.x)
        update()
      },
      onThrowUpdate() {
        dragX = clamp(-this.x)
        update()
      },
    })[0]

    // recalc on resize
    const ro = new ResizeObserver(() => {
      recalc()
    })
    ro.observe(init)

    // keyboard navigation (arrow left/right)
    let active = false
    let currentIndex = 0

    // helper function to switch slides
    function goToSlide(idx) {
      idx = Math.max(0, Math.min(idx, slides.length - 1))
      currentIndex = idx

      const targetX = idx * spacing

      gsap.to(
        { value: dragX },
        {
          value: targetX,
          duration: 0.35,
          ease: 'power4.out',
          onUpdate: function () {
            dragX = this.targets()[0].value
            update() // moves slider + transforms slides via quickSetters
          },
        }
      )

      wrap.setAttribute('aria-label', `Slide ${idx + 1} of ${slides.length}`)
    }

    // Observe visibility
    const io = new IntersectionObserver(
      (entries) => {
        active = entries[0].isIntersecting
      },
      {
        threshold: 0.25, // slider must be at least 25% visible
      }
    )

    io.observe(init)

    // Aria labels for accessibility
    wrap.setAttribute('role', 'region')
    wrap.setAttribute('aria-roledescription', 'carousel')
    wrap.setAttribute('aria-label', 'Testimonial slider')

    // key listener
    function onKey(e) {
      if (!active) return // only respond when slider in view

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToSlide(currentIndex - 1)
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToSlide(currentIndex + 1)
      }
    }
    window.addEventListener('keydown', onKey)

    // initial layout
    recalc()

    registerCleanup(() => {
      window.removeEventListener('keydown', onKey)
      ro.disconnect()
      io.disconnect()
      draggable?.kill()
    })
  }
}

const initFaq = (container = document) => {
  container.querySelectorAll('.accordion_wrap').forEach((component, listIndex) => {
    if (component.dataset.scriptInitialized) return
    component.dataset.scriptInitialized = 'true'

    const closePrevious = component.getAttribute('data-close-previous') !== 'false'
    const closeOnSecondClick = component.getAttribute('data-close-on-second-click') !== 'false'
    const openOnHover = component.getAttribute('data-open-on-hover') === 'true'
    const openByDefault =
      component.getAttribute('data-open-by-default') !== null &&
        !isNaN(+component.getAttribute('data-open-by-default'))
        ? +component.getAttribute('data-open-by-default')
        : false
    const list = component.querySelector('.accordion_list')
    let previousIndex = null
    const closeFunctions = []

    function removeCMSList(slot) {
      const dynList = Array.from(slot.children).find((child) =>
        child.classList.contains('w-dyn-list')
      )
      if (!dynList) return
      const nestedItems = dynList?.firstElementChild?.children
      if (!nestedItems) return
      const staticWrapper = [...slot.children]
        ;[...nestedItems].forEach(
          (el) => el.firstElementChild && slot.appendChild(el.firstElementChild)
        )
      staticWrapper.forEach((el) => el.remove())
    }
    removeCMSList(list)

    component.querySelectorAll('.accordion_component').forEach((card, cardIndex) => {
      const button = card.querySelector('.accordion_toggle_button')
      const content = card.querySelector('.accordion_content_wrap')
      const icon = card.querySelector('.accordion_toggle_icon')
      const iconSvg = card.querySelector('.accordion_toggle_svg')

      if (!button || !content || !icon) return console.warn('Missing elements:', card)

      button.setAttribute('aria-expanded', 'false')
      button.setAttribute('id', 'accordion_button_' + listIndex + '_' + cardIndex)
      content.setAttribute('id', 'accordion_content_' + listIndex + '_' + cardIndex)
      button.setAttribute('aria-controls', content.id)
      content.setAttribute('aria-labelledby', button.id)
      content.style.display = 'none'

      const refresh = () => {
        tl.invalidate()
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh()
        window.lenis?.resize()
      }
      const tl = gsap.timeline({
        paused: true,
        defaults: { duration: 0.6, ease: 'boldhouse' },
        onComplete: refresh,
        onReverseComplete: refresh,
      })
      tl.set(content, { display: 'block' })
      tl.fromTo(content, { height: 0 }, { height: 'auto' })
      tl.fromTo(iconSvg, { rotate: 0 }, { rotate: -225 }, '<')

      const closeAccordion = () =>
        card.classList.contains('is-opened') &&
        (card.classList.remove('is-opened'),
          tl.reverse(),
          button.setAttribute('aria-expanded', 'false'))
      closeFunctions[cardIndex] = closeAccordion

      const openAccordion = (instant = false) => {
        if (closePrevious && previousIndex !== null && previousIndex !== cardIndex)
          closeFunctions[previousIndex]?.()
        previousIndex = cardIndex
        button.setAttribute('aria-expanded', 'true')
        card.classList.add('is-opened')
        instant ? tl.progress(1) : tl.play()
      }
      if (openByDefault === cardIndex + 1) openAccordion(true)

      button.addEventListener('click', () =>
        card.classList.contains('is-opened') && closeOnSecondClick
          ? (closeAccordion(), (previousIndex = null))
          : openAccordion()
      )
      if (openOnHover) button.addEventListener('mouseenter', () => openAccordion())
    })
  })
}

const initMomentumBasedHover = (container = document) => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return
  }
  const xyMultiplier = 15
  const rotationMultiplier = 20
  const inertiaResistance = 500
  const clampXY = gsap.utils.clamp(-1080, 1080)
  const clampRot = gsap.utils.clamp(-60, 60)

  container.querySelectorAll('[data-momentum-hover-init]').forEach((root) => {
    if (root._momentumHoverInit) return
    root._momentumHoverInit = true

    let prevX = 0,
      prevY = 0
    let velX = 0,
      velY = 0
    let rafId = null

    root.addEventListener('mousemove', (e) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        velX = e.clientX - prevX
        velY = e.clientY - prevY
        prevX = e.clientX
        prevY = e.clientY
        rafId = null
      })
    })

    root.querySelectorAll('[data-momentum-hover-element]').forEach((el) => {
      el.addEventListener('mouseenter', (e) => {
        const target = el.querySelector('[data-momentum-hover-target]') || el.querySelector('path')
        if (!target) return

        // Compute offset from center to pointer
        const { left, top, width, height } = target.getBoundingClientRect()
        const centerX = left + width / 2
        const centerY = top + height / 2
        const offsetX = e.clientX - centerX
        const offsetY = e.clientY - centerY

        const rawTorque = offsetX * velY - offsetY * velX

        const leverDist = Math.hypot(offsetX, offsetY) || 1
        const angularForce = rawTorque / leverDist

        const velocityX = clampXY(velX * xyMultiplier)
        const velocityY = clampXY(velY * xyMultiplier)
        const rotationVelocity = clampRot(angularForce * rotationMultiplier)

        gsap.to(target, {
          inertia: {
            x: { velocity: velocityX, end: 0 },
            y: { velocity: velocityY, end: 0 },
            rotation: { velocity: rotationVelocity, end: 0 },
            resistance: inertiaResistance,
          },
        })
      })
    })
  })
}

const initEventSlider = (container = document) => {
  container.querySelectorAll('.slider_component').forEach((component) => {
    if (component.hasAttribute('data-slider')) return
    component.setAttribute('data-slider', '')

    const sliderElement = component.querySelector('.slider_wrap')
    if (!sliderElement) return

    const swiper = new Swiper(sliderElement, {
      slidesPerView: 'auto',
      followFinger: true,
      freeMode: false,
      slideToClickedSlide: false,
      centeredSlides: false,
      autoHeight: false,
      speed: 600,
      mousewheel: { forceToAxis: true },
      keyboard: { enabled: true, onlyInViewport: true },
      navigation: {
        nextEl: component.querySelector('.slider_button.is-next'),
        prevEl: component.querySelector('.slider_button.is-prev'),
      },
      pagination: {
        el: component.querySelector('.slider_bullet_wrap'),
        bulletActiveClass: 'is-active',
        bulletClass: 'slider_bullet_item',
        bulletElement: 'button',
        clickable: true,
      },
      scrollbar: {
        el: component.querySelector('.slider_draggable_wrap'),
        draggable: true,
        dragClass: 'slider_draggable_handle',
        snapOnRelease: true,
      },
      slideActiveClass: 'is-active',
      slideDuplicateActiveClass: 'is-active',
    })
  })
}

function initDynamicTextCursor(container = document) {
  const cursor = container.querySelector('[data-cursor]')
  const cursorTextTarget = container.querySelector('[data-cursor-text-target]')

  if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

  let mouseX = 0
  let mouseY = 0
  let hasMouseMoved = false

  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3.out' })
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3.out' })

  function updateCursor() {
    const hoverItem = container.elementFromPoint(mouseX, mouseY)?.closest('[data-cursor-hover]')
    const rect = cursor.getBoundingClientRect()

    const isHovering = !!hoverItem
    const isEdge = rect.right >= window.innerWidth

    cursor.setAttribute('data-cursor', isHovering ? (isEdge ? 'active-edge' : 'active') : '')

    if (hoverItem && cursorTextTarget) {
      const text = hoverItem.getAttribute('data-cursor-text')
      if (text) cursorTextTarget.textContent = text
    }
  }

  window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX
    mouseY = event.clientY
    hasMouseMoved = true

    xTo(mouseX)
    yTo(mouseY)

    requestAnimationFrame(updateCursor)
  })

  window.addEventListener(
    'scroll',
    () => {
      if (!hasMouseMoved) return
      requestAnimationFrame(updateCursor)
    },
    { passive: true }
  )
}

function initMarqueeScrollDirection(container = document) {
  const marquees = container.querySelectorAll('[data-marquee-scroll-direction-target]')
  if (!marquees.length) return

  const animations = []

  marquees.forEach((marquee) => {
    // Query marquee elements
    const marqueeContent = marquee.querySelector('[data-marquee-collection-target]');
    const marqueeScroll = marquee.querySelector('[data-marquee-scroll-target]');
    if (!marqueeContent || !marqueeScroll) return;

    // Get data attributes
    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;

    // Convert data attributes to usable types
    const marqueeSpeedAttr = parseFloat(speed);
    const marqueeDirectionAttr = direction === 'right' ? 1 : -1; // 1 for right, -1 for left
    const duplicateAmount = parseInt(duplicate || 0);
    const scrollSpeedAttr = parseFloat(scrollSpeed);
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    const marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    // Precompute styles for the scroll container
    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

    // Duplicate marquee content
    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    // GSAP animation for marquee content
    const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
    const animation = gsap.to(marqueeItems, {
      xPercent: -100, // Move completely out of view
      repeat: -1,
      duration: marqueeSpeed,
      ease: 'linear'
    }).totalProgress(0.5);

    // Initialize marquee in the correct direction
    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr); // Set correct direction
    animation.play(); // Start animation immediately
    animations.push(animation)

    // Set initial marquee status
    marquee.setAttribute('data-marquee-status', 'normal');

    // ScrollTrigger logic for direction inversion
    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const isInverted = self.direction === 1; // Scrolling down
        const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;

        // Update animation direction and marquee status
        animation.timeScale(currentDirection);
        marquee.setAttribute('data-marquee-status', isInverted ? 'normal' : 'inverted');
      }
    });

    // Extra speed effect on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 0
      }
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = -scrollStart;

    tl.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: 'none' });
  });

  registerCleanup(() => animations.forEach(a => a.kill()))
}

function initCta(container = document) {
  const bg = container.querySelector('.cta_bg')
  const images = container.querySelectorAll('.cta_bg-img')
  const trigger = container.querySelector('.section_cta')

  if (bg) {

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger,
          start: 'clamp(top 100%)',
          end: 'bottom bottom',
          scrub: true,
        },
      })

      tl.fromTo(bg, { width: '100%' }, { width: '100vw' })

      const tlImages = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger,
          start: 'clamp(top 60%)',
          end: 'bottom bottom',
          scrub: true,
        },
      })

      tlImages.fromTo(
        images,
        { opacity: 1 },
        {
          opacity: 0,
          duration: 0.05,
          stagger: { each: 0.04, from: 'end' },
        }
      )

  }
}

function initReviews(container = document) {
  const svg = container.querySelectorAll('.m-slider_duration-svg')
  const monthItem = container.querySelectorAll('.m-slider_duration-wrap')
  const trigger = container.querySelector('[data-reviews-section]')

  if (svg) {

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trigger,
          start: 'clamp(top 100%)',
          end: 'bottom top',
          scrub: true,
        },
        defaults: { ease: 'none' }
      });

      tl.fromTo(
        svg,
        { rotateZ: '100deg', scale: 1.5 },
        {
          rotateZ: '360deg',
          scale: 1,
        }
      )
      .fromTo(monthItem[0], { y: '30%' }, { y: '-120%', }, 0)
      .fromTo(monthItem[1], { y: '-120%' }, { y: '30%', }, 0)
  }

}

function initReviews2(container = document) {
  const section = container.querySelector('[data-reviews-section]')
  const track = container.querySelector('[data-reviews-track]')
  const items = container.querySelectorAll('[data-reviews-item]')
  const svg = container.querySelectorAll('.m-slider_duration-svg')
  const monthItem = container.querySelectorAll('.m-slider_duration-wrap')

  if (!section || !track || !items.length) return

  const mm = gsap.matchMedia()
  mm.add(MQ.tabletUp, () => {
    const getScrollAmount = () => -(track.scrollWidth - window.innerWidth) - 200

    const amplitude = 120     
    const wavelength = 900    

    let phaseAnchorX = 0
    const captureAnchor = () => {
      const bounds = items[0].getBoundingClientRect()
      const trackX = gsap.getProperty(track, 'x') || 0
      phaseAnchorX = bounds.left + bounds.width / 2 - trackX
    }

    const applyWave = () => {
      items.forEach((item) => {
        const bounds = item.getBoundingClientRect()
        const centerX = bounds.left + bounds.width / 2
        const phase = ((centerX - phaseAnchorX) / wavelength) * Math.PI * 2
        const y = (1 - Math.cos(phase)) * 0.5 * amplitude
        gsap.set(item, { y })
      })
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 90%',
        end: 'bottom 5%',
        scrub: 1,
        invalidateOnRefresh: true,
        //onUpdate: applyWave,
        //onRefresh: () => { captureAnchor(); applyWave() },
      },
      defaults: { ease: 'none' }
    })

    tl.fromTo(track, { x: '100px' }, { x: getScrollAmount }, 0)

    //captureAnchor()
    //applyWave()

    if (svg.length) {
      gsap.set(svg, { rotateZ: '0deg', scale: 1.5 })
      gsap.to(svg, {
        rotateZ: '120deg',
        stagger: .2,
        scale: 1,
        duration: 1,
        ease: 'boldhouse',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
        },
      })
    }
    // if (monthItem[0]) tl.fromTo(monthItem[0], { y: '-120%' }, { y: '30%' }, 0)
    // if (monthItem[1]) tl.fromTo(monthItem[1], { y: '30%' }, { y: '-120%' }, 0)
  })

  registerCleanup(() => mm.revert())
}

function initPriceCards(next = document) {
  ScrollTrigger.refresh();
  let wrap = next.querySelector("[data-pricing-section]");

  if (!wrap) {
    return;
  }

  if (wrap.querySelector("[data-price-status]")) {
    const buttons = wrap.querySelectorAll("[data-price-toggle]")
    const row = wrap.querySelector("[data-price-status]")

    buttons.forEach(button => {
      const type = button.getAttribute("data-price-toggle")
      button.addEventListener("click", () => {
        if (row.getAttribute("data-price-status") === type) return
        row.setAttribute("data-price-status", type)
        buttons.forEach(btn => btn.classList.remove("is--active"))
        button.classList.add("is--active")
      })
    })

  } else {
    const left = wrap.querySelector(".p-card.is--left");
    const right = wrap.querySelector(".p-card.is--right");
    const center = wrap.querySelector(".p-card.is--center");
    const anim = wrap.querySelector("[data-lottie]");
    const cards = wrap.querySelectorAll(".p-card");
    const sub = wrap.querySelectorAll(".p-card__sub");

    const animation = lottie.loadAnimation({
      container: anim,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: anim.getAttribute("data-lottie-path"),
    });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top bottom",
          toggleActions: "play none none reverse",
        },
        onReverseComplete: () => {
          animation.goToAndStop(0, true);
        },
      })
      .from(left, {
        xPercent: 80,
        yPercent: 30,
        rotate: 6,
        duration: 0.8,
        ease: "back.out(1.8)",
      })
      .from(
        right,
        {
          xPercent: -80,
          yPercent: 30,
          rotate: -6,
          duration: 0.8,
          ease: "back.out(1.8)",
        },
        0
      )
      .from(
        center,
        {
          yPercent: 10,
          scale: 0.85,
          duration: 0.8,
          ease: "back.out(1.5)",
          onStart: () => {
            gsap.delayedCall(0.5, () => {
              animation.play();
            });
          },
        },
        0
      );

    // HOVERING
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        cards.forEach((c) => c.classList.remove("is--active"));
        card.classList.add("is--active");
        gsap.to(card, {
          scale: reducedMotion ? 1 : 1.1,
          duration: 0.3,
          ease: "back.out(1.8)",
          overwrite: "auto",
        });
      });

      card.addEventListener("mouseleave", () => {
        card.classList.remove("is--active");
        center.classList.add("is--active");
        gsap.to(card, {
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.5)",
          overwrite: "auto",
        });
      });
    });

    // PRICE CHANGE
    const solo = next.querySelector("[data-price-solo]");
    const joint = next.querySelector("[data-price-joint]");
    const toggleTl = gsap.timeline({ paused: true });
    toggleTl
      .to(".p-card__heading", {
        y: "-0.9em",
        duration: 0.5,
        ease: "back.inOut(2)",
      })
      .to(
        ".p-card__eyebrow .eyebrow",
        {
          yPercent: -100,
          duration: 0.5,
          ease: "back.inOut(2)",
        },
        0
      )
      .to(
        ".p-card__sign.offset",
        {
          left: "0em",
          duration: 0.5,
          ease: "back.inOut(2)",
        },
        0
      )
      .to(
        sub,
        {
          x: "0em",
          duration: 0.5,
          ease: "back.inOut(2)",
        },
        0
      );

    solo.addEventListener("click", () => {
      if (!solo.classList.contains("is--active")) {
        joint.classList.remove("is--active");
        solo.classList.add("is--active");
        toggleTl.reverse();
      }
    });

    joint.addEventListener("click", () => {
      if (!joint.classList.contains("is--active")) {
        solo.classList.remove("is--active");
        joint.classList.add("is--active");
        toggleTl.play();
      }
    });
    wrap = null;
  }

}

// =================== Before Enter JS

const initHeroEnter = (container = document) => {
  const heroHeadings = container.querySelectorAll('[data-hero-heading]')
  heroHeadings.forEach((heading) => {
    SplitText.create(heading, {
      type: 'lines',
      mask: 'lines',
      autoSplit: false,
      linesClass: 'line',
      onSplit(self) {
        if (!self.lines?.length) return
        gsap.set(self.lines, { yPercent: 110 })
        gsap.to(self.lines, {
          yPercent: 0,
          stagger: 0.12,
          duration: 1.2,
          ease: 'expo.out',
          force3D: true,
        })
      },
    })
  })
}

// =================== GLOBAL JS

function initGlobal(container) {
  initForm(container)
  if (has('[data-highlight-marker-reveal]')) {
    document.fonts.ready.then(() => initHighlightMarkerTextReveal(container))
  }
  if (has('[data-button-text]')) initButtonHover(container)
  initMegaNav()
initNav(container)
  if (has('[data-stacking-cards-init]')) initStackingStickyCardsBounce(container)
  initPerks(container)
  initParallax(container)
  //initOverlappingSlider(container)
  initFaq(container)
  initMomentumBasedHover(container)
  if (has('[data-nav-theme-to]')) initNavThemeTriggers(container)
  if (has('[data-theme-page-to]')) initSectionThemeTriggers(container)
  document.fonts.ready.then(() => {
    initTextAnimations(container)
  })

  initEventSlider(container)
  initDynamicTextCursor()

  initMarqueeScrollDirection(container)

  initCta(container)
  initReviews2(container)
  initClippingImageTrail(container)
  initPriceCards(container)
}

// =================== HOME page

CustomEase.create('drift', 'M0,0 C0.65,0 0,1.04 1,1')

const initHomeHeroParallax = (container = document) => {
  const hero = container.querySelector('[data-hero-target]')
  const heroImg = container.querySelector('[data-hero-img]')
  if (!hero) return

  const mm = gsap.matchMedia()
  mm.add(
    {
      isTabletUp: MQ.tabletUp,
      isMobileLandscapeDown: MQ.mobileLandscapeDown,
    },
    (ctx) => {
      const { isTabletUp } = ctx.conditions
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '[data-hero-trigger]',
          start: 'clamp(top 100%)',
          end: 'top top',
          scrub: true,
        },
      })

      if (isTabletUp) tl.to(heroImg, { y: '60vh' }, 0)
      tl.to('.section_h-hero-2', { y: '30vh' }, 0)
    }
  )

  registerCleanup(() => mm.revert())
}

function initHomeHero(container = document) {
  const logoPaths = container.querySelectorAll('[data-hero-svg] path')

  const heroHeadings = container.querySelectorAll('[data-hero-heading]')
  const linkList = container.querySelector('.h-hero-2_link-list')

  const nav = container.querySelectorAll(
    '.mega-nav__bar-logo, .mega-nav__bar-action, .mega-nav__bar-list'
  )

  CustomEase.create('nav', '.5,0,.05,1.01')

  // Prevent accidental hover interactions while the intro is playing
  if (linkList) gsap.set(linkList, { pointerEvents: 'none' })

  // CustomEase.create('bounce', '.34,-0.34,.08,.99')
  const tl = gsap.timeline({
    defaults: {
      // ease: 'cubic-bezier(.5,0,.05,1.01)',
      ease: 'nav',
    },
  })

  gsap.set(nav, { yPercent: -100 })

  tl.fromTo(
    '.h-hero_bg',
    { clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' },
    { clipPath: 'polygon(42% 38%, 58% 38%, 58% 62%, 42% 62%)', duration: 0.6, ease: 'power3.out' }
  )
    .to('.h-hero_bg', {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 1,
      ease: 'expo.inOut',
      // ease: 'bounce',
    })
    .fromTo('.h-hero_img', { scale: 1 }, { scale: 1.2, duration: 1.5, ease: 'expo.inOut' }, '<')

  /* Logo */
  tl.fromTo(
    logoPaths,
    {
      yPercent: 160,
    },
    {
      yPercent: 0,
      stagger: {
        amount: 0.2,
        ease: 'power4.inOut',
        from: 'center',
      },
      duration: 2,
      onComplete: () => {
        // initMomentumBasedHover()
        // gsap.set('[data-hero-svg]', { overflow: 'visible' })
      },
    },
    '-=2'
  )

  tl.to(nav, { yPercent: 0, duration: 1.5 }, '<+=.5')

  if (linkList) {
    const links = Array.from(linkList.querySelectorAll('.h-hero-2_link'))
    const listRect = linkList.getBoundingClientRect()
    const linkRects = links.map((el) => el.getBoundingClientRect())
    const gap = 32
    const totalCompressedWidth =
      linkRects.reduce((sum, r) => sum + r.width, 0) + gap * (links.length - 1)
    let cursor = listRect.left + (listRect.width - totalCompressedWidth) / 2
    const fromX = linkRects.map((r) => {
      const offset = cursor - r.left
      cursor += r.width + gap
      return offset
    })
    tl.fromTo(links, { x: (i) => fromX[i] }, { x: 0, duration: 2.5, ease: 'expo.inOut' }, '<-.7')
  }

  /* Button */
  tl.fromTo(
    '.section_h-hero-2 .button',
    { clipPath: 'inset(100% 0% 0% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 },
    '-=.6'
  )

  // Re-enable hover once the intro timeline completes
  tl.call(() => {
    if (linkList) gsap.set(linkList, { clearProps: 'pointerEvents' })
  }, null, '>')

  heroHeadings.forEach((heading) => {
    splitReveal(heading, {
      delay: 1.4,
      duration: 1.2,
      stagger: 0.12,
    })
  })
}

function initAcceleratingGlobe(container = document) {
  container.querySelectorAll('[data-accelerating-globe]').forEach(function (globe) {
    const circles = globe.querySelectorAll('[data-accelerating-globe-circle]')
    if (circles.length < 8) return // Min 8

    const tl = gsap.timeline({
      repeat: -1,
      defaults: { duration: 1, ease: 'none' },
    })

    const widths = [
      ['50%', '37.5%'],
      ['37.5%', '25%'],
      ['25%', '12.5%'],
      ['calc(12.5% + 1px)', 'calc(0% + 1px)'],
      ['calc(0% + 1px)', 'calc(12.5% + 1px)'],
      ['12.5%', '25%'],
      ['25%', '37.5%'],
      ['37.5%', '50%'],
    ]

    circles.forEach((el, i) => {
      const [fromW, toW] = widths[i]
      tl.fromTo(el, { width: fromW }, { width: toW }, i === 0 ? 0 : '<')
    })

    let lastY = window.scrollY
    let lastT = performance.now()
    let stopTimeout

    function onScroll() {
      const now = performance.now()
      const dy = window.scrollY - lastY
      const dt = now - lastT
      lastY = window.scrollY
      lastT = now

      const velocity = dt > 0 ? (dy / dt) * 1000 : 0 // px/s
      const boost = Math.abs(velocity * 0.005)
      const targetScale = boost + 1

      tl.timeScale(targetScale)

      clearTimeout(stopTimeout)
      stopTimeout = setTimeout(() => {
        gsap.to(tl, {
          timeScale: 1,
          duration: 0.6,
          ease: 'power2.out',
          overwrite: true,
        })
      }, 100)
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    registerCleanup(() => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(stopTimeout)
      tl.kill()
    })
  })
}

function initClippingImageTrail(container = document) {
  const area = container.querySelector('[data-trail-area]')
  if (!area) return

  const collection = area.querySelector('[data-trail-collection]')
  if (!collection) return

  const items = collection.querySelectorAll('[data-trail-item]')
  if (!items.length) return

  // Distance logic
  let index = 0
  let lastCloneX = null
  let lastCloneY = null

  const cardWidth = items[0].getBoundingClientRect().width
  const stepDistance = cardWidth * 0.6

  function spawnTrailItem(x, y) {
    const original = items[index]
    const clone = original.cloneNode(true)

    clone.style.left = x + 'px'
    clone.style.top = y + 'px'
    clone.setAttribute('data-trail-item', 'visible')

    area.appendChild(clone)

    gsap.fromTo(
      clone,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power2.out' }
    )

    gsap.to(clone, {
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: 0.4,
      ease: 'power2.in',
      delay: 0.6,
      onComplete: function () {
        clone.remove()
      },
    })

    index = (index + 1) % items.length
    lastCloneX = x
    lastCloneY = y
  }

  // Mouse movement logic
  area.addEventListener('mousemove', function (event) {
    const rect = area.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      lastCloneX = null
      lastCloneY = null
      return
    }

    if (lastCloneX === null || lastCloneY === null) {
      spawnTrailItem(x, y)
      return
    }

    const dx = x - lastCloneX
    const dy = y - lastCloneY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance >= stepDistance) {
      spawnTrailItem(x, y)
    }
  })
}

function initRoomsBackground(container = document) {
  const roomsList = container.querySelector('.h-rooms_list')
  if (!roomsList) return

  const triggers = roomsList.querySelectorAll('.h-rooms_item')
  if (!triggers.length) return

  const defaultImage = container.querySelector('.h-rooms_img.is--default')
  const fadeEls = container.querySelectorAll('.h-rooms_fade')
  const images = Array.from(container.querySelectorAll('.h-rooms_img')).filter(
    (img) => !img.classList.contains('is--default')
  )

  const DURATION = 0.6
  const EASE = 'drift'
  const hasDefault = !!defaultImage
  let isHovering = false

  gsap.set(images, { autoAlpha: 0 })
  if (defaultImage) gsap.set(defaultImage, { autoAlpha: 1 })

  triggers.forEach((trigger, index) => {
    const image = images[index]

    trigger.addEventListener('mouseenter', () => {
      isHovering = true
      if (!hasDefault) roomsList.setAttribute('data-rooms-hover', 'active')

      if (image) gsap.to(image, { autoAlpha: 1, duration: DURATION, ease: EASE, overwrite: true })
      if (defaultImage)
        gsap.to(defaultImage, { autoAlpha: 0, duration: DURATION, ease: EASE, overwrite: true })

      triggers.forEach((t, i) => {
        if (t !== trigger) {
          const otherImage = images[i]
          if (otherImage)
            gsap.to(otherImage, { autoAlpha: 0, duration: DURATION, ease: EASE, overwrite: true })
        }
      })

      gsap.to(fadeEls, { opacity: 0.2, duration: DURATION, ease: EASE, overwrite: true })

      triggers.forEach((t) => {
        gsap.to(t, {
          opacity: t === trigger ? 1 : 0.2,
          duration: DURATION,
          ease: EASE,
          overwrite: true,
        })
      })
    })

    trigger.addEventListener('mouseleave', () => {
      isHovering = false
      gsap.delayedCall(0.05, () => {
        if (isHovering) return
        if (!hasDefault) roomsList.setAttribute('data-rooms-hover', '')
        if (image) gsap.to(image, { autoAlpha: 0, duration: DURATION, ease: EASE, overwrite: true })
        if (defaultImage)
          gsap.to(defaultImage, { autoAlpha: 1, duration: DURATION, ease: EASE, overwrite: true })
        gsap.to(fadeEls, { opacity: 1, duration: DURATION, ease: EASE, overwrite: true })
        gsap.to(triggers, { opacity: 1, duration: DURATION, ease: EASE, overwrite: true })
      })
    })
  })
}

function initHomeHeroHover(container = document) {
  const links = container.querySelectorAll('.h-hero-2_link')
  const overlay = container.querySelector('.h-hero_bg-overlay')
  if (!links.length) return

  const fadeEls = document.querySelectorAll('.mega-nav, .h-hero-2_svg-wrap, .h-hero-2_bottom')
  const DURATION = 0.4
  const EASE = 'drift'
  const ENTER_DELAY = 0.1
  const LEAVE_DELAY = 0.15
  let isHovering = false
  let hasHoveredOnce = false
  let enterCall = null
  let leaveCall = null

  const anim = (targets, vars) =>
    gsap.to(targets, { duration: DURATION, ease: EASE, overwrite: 'auto', ...vars })

  function applyHoverState(activeLink) {
    anim(fadeEls, { opacity: 0.1 })
    anim(overlay, { opacity: 0.7 })
    links.forEach((l) => anim(l, { opacity: l === activeLink ? 1 : 0.1 }))
  }

  function resetHoverState() {
    anim(fadeEls, { opacity: 1 })
    anim(links, { opacity: 1 })
    anim(overlay, { opacity: 0.4 })
  }

  links.forEach((link) => {
    link.addEventListener('mouseenter', () => {
      isHovering = true
      leaveCall?.kill()
      enterCall?.kill()

      const delay = hasHoveredOnce ? ENTER_DELAY : 0
      hasHoveredOnce = true
      enterCall = gsap.delayedCall(delay, () => applyHoverState(link))
    })

    link.addEventListener('mouseleave', () => {
      isHovering = false
      enterCall?.kill()

      leaveCall = gsap.delayedCall(LEAVE_DELAY, () => {
        if (!isHovering) resetHoverState()
      })
    })
  })
}

const initHighlightImages = (container = document) => {
  const section = container.querySelector('.section_quote')
  if (!section) return

  const items = section.querySelectorAll('.highlight-img_item')
  if (!items.length) return

  const SPEEDS = [100, 40, 15, 50]

  items.forEach((item, i) => {
    gsap.set(item, { clipPath: 'inset(50%)', willChange: 'clip-path, transform' })

    gsap.to(item, {
      clipPath: 'inset(0%)',
      duration: 1,
      ease: 'boldhouse',
      scrollTrigger: {
        trigger: item,
        start: 'clamp(top 85%)',
        once: true,
      },
    })

    gsap.to(item, {
      yPercent: SPEEDS[i % SPEEDS.length],
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'clamp(top bottom)',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    })
  })
}

function initTabSystem(container = document) {
  const wrappers = container.querySelectorAll('[data-tabs="wrapper"]')

  wrappers.forEach((wrapper) => {
    const contentItems = wrapper.querySelectorAll('[data-tabs="content-item"]')
    const visualItems = wrapper.querySelectorAll('[data-tabs="visual-item"]')
    const squares = wrapper.querySelectorAll('.content-item_square')

    const autoplay = wrapper.dataset.tabsAutoplay === 'true'
    const autoplayDuration = parseInt(wrapper.dataset.tabsAutoplayDuration) || 5000

    let activeContent = null // keep track of active item/link
    let activeVisual = null
    let isAnimating = false
    let progressBarTween = null // to stop/start the progress bar
    let sectionInView = !autoplay // when no autoplay, gating is irrelevant
    let activeIndex = 0

    function startProgressBar(index) {
      if (progressBarTween) progressBarTween.kill()
      if (!sectionInView) return // don't cycle while section is offscreen
      const bar = contentItems[index].querySelector('[data-tabs="item-progress"]')
      if (!bar) return

      // In this function, you can basically do anything you want, that should happen as a tab is active
      // Maybe you have a circle filling, some other element growing, you name it.
      gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' })
      progressBarTween = gsap.to(bar, {
        scaleX: 1,
        duration: autoplayDuration / 1000,
        ease: 'power1.inOut',
        onComplete: () => {
          if (!isAnimating) {
            const nextIndex = (index + 1) % contentItems.length
            switchTab(nextIndex) // once bar is full, set next to active – this is important
          }
        },
      })
    }

    function switchTab(index) {
      if (isAnimating || contentItems[index] === activeContent) return

      isAnimating = true
      if (progressBarTween) progressBarTween.kill() // Stop any running progress bar here

      const outgoingContent = activeContent
      const outgoingVisual = activeVisual
      const outgoingBar = outgoingContent?.querySelector('[data-tabs="item-progress"]')
      const outgoingDetails = outgoingContent?.querySelector('[data-tabs="item-details"]')

      const incomingContent = contentItems[index]
      const incomingVisual = visualItems[index]
      const incomingBar = incomingContent.querySelector('[data-tabs="item-progress"]')
      const incomingDetails = incomingContent.querySelector('[data-tabs="item-details"]')

      // Square indicator: animate the about-to-be-visible square FROM the
      // currently-visible square's position back to its own natural position.
      // CSS handles opacity (only the .active item's square is visible), so
      // the visual effect is "the marker glides between tabs."
      const outgoingSquare = outgoingContent?.querySelector('.content-item_square')
      const incomingSquare = squares[index]
      if (outgoingSquare && incomingSquare) {
        gsap.set([outgoingSquare, incomingSquare], { clearProps: 'x,y,rotateZ' })
        const oldRect = outgoingSquare.getBoundingClientRect()
        const newRect = incomingSquare.getBoundingClientRect()
        gsap.fromTo(
          incomingSquare,
          { x: oldRect.left - newRect.left, y: oldRect.top - newRect.top, rotateZ: 0 },
          { x: 0, y: 0, rotateZ: 360, duration: 0.65, ease: 'power3.out' },
        )
      }

      outgoingContent?.classList.remove('active')
      outgoingVisual?.classList.remove('active')
      incomingContent.classList.add('active')
      incomingVisual.classList.add('active')

      const tl = gsap.timeline({
        defaults: { duration: 0.65, ease: 'power3' },
        onComplete: () => {
          activeContent = incomingContent
          activeVisual = incomingVisual
          activeIndex = index
          isAnimating = false
          if (autoplay) startProgressBar(index) // gated by sectionInView inside
        },
      })

      // Wrap 'outgoing' in a check to prevent warnings on first run of the function
      // Of course, during first run (on page load), there's no 'outgoing' tab yet!
      if (outgoingContent) {
        tl.set(outgoingBar, { transformOrigin: 'right center' })
          .to(outgoingBar, { scaleX: 0, duration: 0.3 }, 0)
          .to(outgoingVisual, { autoAlpha: 0, xPercent: 3 }, 0)
          .to(outgoingDetails, { height: 0 }, 0)
      }

      tl.fromTo(incomingVisual, { autoAlpha: 0, xPercent: 3 }, { autoAlpha: 1, xPercent: 0 }, 0.3)
        .fromTo(incomingDetails, { height: 0 }, { height: 'auto' }, 0)
        .set(incomingBar, { scaleX: 0, transformOrigin: 'left center' }, 0)
    }

    // on page load, set first to active. Autoplay cycling is gated on
    // sectionInView (set by the ScrollTrigger below) so the section's height
    // doesn't keep changing while the user is scrolled away from it.
    switchTab(0)

    if (autoplay && window.ScrollTrigger) {
      const setInView = (inView) => {
        if (sectionInView === inView) return
        sectionInView = inView
        if (inView) {
          if (!isAnimating) startProgressBar(activeIndex)
        } else if (progressBarTween) {
          progressBarTween.kill()
          progressBarTween = null
        }
      }
      const st = window.ScrollTrigger.create({
        trigger: wrapper,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => setInView(self.isActive),
        onRefresh: (self) => setInView(self.isActive),
      })
      // Seed after current frame in case the section is already in view at load.
      requestAnimationFrame(() => setInView(st.isActive))
    }

    // switch tabs on click
    contentItems.forEach((item, i) =>
      item.addEventListener('click', () => {
        if (item === activeContent) return // ignore click if current one is already active
        switchTab(i)
      }),
    )
  })
}


function initDepthTiles(con = document) {
  con.querySelectorAll("[data-depth-tiles-init]").forEach((container) => {
    const list = container.querySelector("[data-depth-tiles-list]");
    const tiles = container.querySelectorAll("[data-depth-tiles-item]");
    const tileCount = tiles.length;
    if (tileCount < 2) return;

    const xMultiplier = 0.65;
    const backScale = 0.5;
    const backOpacity = 1;
    const backDarkness = 1;
    const sideRotateY = 5;
    const perspective = 75;

    const moveDuration = 1.5;
    const startDelay = 0.5;
    const pauseDuration = 0.125;

    const state = { progress: 0 };

    let isActive = false;
    let isHovering = false;
    let hasStarted = false;
    let stepTimeline;
    let delayedCall;
    let startDelayedCall;
    let activeTileIndex = -1;

    gsap.set(list, { perspective: `${perspective}em` });
    gsap.set(tiles, {
      transformStyle: "preserve-3d",
      transformPerspective: perspective * 16
    });

    function getRelativeIndex(index) {
      let relative = index - state.progress;
      relative = ((relative + tileCount / 2) % tileCount + tileCount) % tileCount - tileCount / 2;
      return gsap.utils.clamp(-2, 2, relative);
    }

    function getActiveIndex() {
      return ((Math.round(state.progress) % tileCount) + tileCount) % tileCount;
    }

    function updateTileStatus() {
      const currentActiveIndex = getActiveIndex();
      if (currentActiveIndex === activeTileIndex) return;

      activeTileIndex = currentActiveIndex;

      tiles.forEach((tile, index) => {
        tile.setAttribute("data-depth-tiles-item-status", index === activeTileIndex ? "active" : "not-active");
      });
    }

    function renderDepth() {
      const tileWidth = tiles[0].offsetWidth;
      const radiusX = tileWidth * xMultiplier;

      updateTileStatus();

      tiles.forEach((tile, index) => {
        const relative = getRelativeIndex(index);
        const angle = (relative / 2) * Math.PI;

        const orbitX = Math.sin(angle) * radiusX;
        const orbitDepth = (Math.cos(angle) + 1) / 2;

        const x = relative <= -2 || relative >= 2 ? 0 : orbitX;
        const scale = gsap.utils.interpolate(backScale, 1, orbitDepth);
        const opacity = gsap.utils.interpolate(backOpacity, 1, orbitDepth);
        const brightness = gsap.utils.interpolate(backDarkness, 1, orbitDepth);
        const rotateY = Math.sin(angle) * -sideRotateY;
        const zIndex = Math.round(gsap.utils.interpolate(1, 1000, orbitDepth));

        gsap.set(tile, {
          x,
          scale,
          opacity,
          rotateY,
          filter: `brightness(${brightness})`,
          zIndex
        });
      });
    }

    function goToNextTile() {
      if (!isActive || isHovering) return;

      stepTimeline = gsap.timeline({
        paused: true,
        onComplete: () => {
          if (isActive && !isHovering) {
            delayedCall = gsap.delayedCall(pauseDuration, goToNextTile);
          }
        }
      });

      stepTimeline.to(state, {
        progress: state.progress + 1,
        duration: moveDuration,
        ease: "power4.inOut",
        onUpdate: renderDepth
      });

      stepTimeline.play();
    }

    function pauseDepth() {
      isActive = false;
      if (stepTimeline) stepTimeline.pause();
      if (delayedCall) delayedCall.pause();
      if (startDelayedCall) startDelayedCall.pause();
    }

    function playDepth() {
      isActive = true;
      if (isHovering) return;

      if (!hasStarted) {
        hasStarted = true;
        startDelayedCall = gsap.delayedCall(startDelay, goToNextTile);
        return;
      }

      if (stepTimeline && stepTimeline.progress() < 1) {
        stepTimeline.play();
      } else {
        goToNextTile();
      }
    }

    function handleHoverStart() {
      isHovering = true;
      if (delayedCall) delayedCall.pause();
      if (startDelayedCall) startDelayedCall.pause();
    }

    function handleHoverEnd() {
      isHovering = false;
      if (!isActive) return;

      if (!hasStarted) {
        playDepth();
        return;
      }

      if (stepTimeline && stepTimeline.progress() < 1) {
        stepTimeline.play();
      } else {
        goToNextTile();
      }
    }

    list.addEventListener("pointerover", (event) => {
      if (!event.target.closest("[data-depth-tiles-item]")) return;
      handleHoverStart();
    });

    list.addEventListener("pointerleave", () => {
      handleHoverEnd();
    });

    renderDepth();

    ScrollTrigger.create({
      trigger: container,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => self.isActive ? playDepth() : pauseDepth()
    });
  });
}


function initHomePage(container) {
  initHomeHeroParallax(container)
  initAcceleratingGlobe(container)
  initRoomsBackground(container)
  initHomeHeroHover(container)
  initHighlightImages(container)
  initTabSystem(container)

  const chromeCTeardown = initChromeC(container)
  if (chromeCTeardown) registerCleanup(chromeCTeardown)
      initDepthTiles(container)
}

// ================= CLUB page (was pages/club.js)

const initClubNetwork = (container = document) => {
  const trigger = container.querySelector('.section_network')
  console.log(trigger)
  if (!trigger) return

  const mm = gsap.matchMedia()

  mm.add(MQ.tabletUp, () => {
    const cards = trigger.querySelectorAll('.network_card_item')
    if (!cards.length) return

    const tl = gsap.timeline({
      defaults: {
        ease: 'power4.out',
        duration: 1.6,
      },
      scrollTrigger: {
        trigger,
        start: 'clamp(top 90%)',
        end: 'top top',
        scrub: false,
      },
    })

    gsap.set(cards, {
      transformOrigin: (i) => (i === 0 ? 'bottom right' : 'bottom left'),
    })

    tl.from(cards, {
      y: '10vh',
      scale: 0.85,
      rotate: (i) => (i === 0 ? -30 : 30),
      xPercent: (i) => (i === 0 ? -15 : 15),
      yPercent: 10,
      duration: 1.2,
      stagger: 0.1,
    })
  })

  registerCleanup(() => mm.revert())
}

const initClubGallery = (container = document) => {
  const trigger = container.querySelector('.section_gallery')
  if (!trigger) return
  const mm = gsap.matchMedia()
  mm.add(MQ.tabletUp, () => {
    const gallery = trigger.querySelector('.gallery_component')
    if (!gallery) return

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger,
        start: 'clamp(top 100%)',
        end: 'bottom top',
        scrub: true,
      },
    })

    const imgs = trigger.querySelectorAll('.gallery_img')
    tl.to(gallery, { x: '-20vw' }, 0)
    tl.to(imgs, { x: '-7%' }, 0)
  })

  registerCleanup(() => mm.revert())
}

function initStackingCardsParallax() {
  const cards = document.querySelectorAll("[data-stacking-cards-item]");

  if (cards.length < 2) return;

  cards.forEach((card, i) => {
    // Skip over the first section
    if (i === 0) return;

    // When current section is in view, target the PREVIOUS one
    const previousCard = cards[i - 1]
    if (!previousCard) return;

    // Find any element inside the previous card
    const previousCardImage = previousCard.querySelector("[data-stacking-cards-img]")
    const previousCardFade = previousCard.querySelector(".stacking-cards__fade")

    const tl = gsap.timeline({
      defaults: {
        ease: "none",
        duration: 1
      },
      scrollTrigger: {
        trigger: card,
        start: "top bottom",
        end: "top top",
        scrub: true,
        invalidateOnRefresh: true
      }
    })

    tl.fromTo(previousCard, { y: '0vh', scale: 1 }, { y: '-10vh', scale: 0.95 })
      .fromTo(previousCardFade, { opacity: 0 }, { opacity: .6 }, "<")
    // .fromTo(previousCardImage, { rotate: 0, yPercent: 0 }, { rotate: -5, yPercent: -25 }, "<")
  });
}

const initPillarsAnimation = (container = document) => {
  const mm = gsap.matchMedia();

  mm.add(MQ.tabletUp, () => {
      const triggerElement = container.querySelector('.pillars_sticky-parent')
      if (!triggerElement) return

      gsap
        .timeline({
          scrollTrigger: {
            trigger: triggerElement,
            start: "top top",
            end: "80% bottom",
            scrub: 1,
          },
        })
        .fromTo(".pillars_sticky-heading", { scale: 0.55, y: '50vh' }, { scale: 1, y: '0vh' })
        .fromTo(".pillars_title", { scale: 1.6 }, { scale: 1 }, 0.0);

      gsap
        .timeline({
          scrollTrigger: {
            trigger: triggerElement,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        })
        // .fromTo("[text-wrap]", { x: "-0.75em" }, { x: "0em" })
        .from(".pillars_title", { yPercent: 35 }, { yPercent: 0 });

        gsap.timeline({
          scrollTrigger: {
            trigger: triggerElement,
            start: "top top",
            end: "bottom -5000px",
            scrub: 1,
          },
        })
        .fromTo(".pillars_span-img", { width: "0%" }, { width: "100%" })
  });

  mm.add("(max-width: 767px)", () => {});

  registerCleanup(() => mm.revert())
}

function initClubPage(container) {
  if (has('.network_component')) initClubNetwork(container)
  if (has('.gallery_component')) initClubGallery(container)
  if (has("[data-stacking-cards-item]")) initStackingCardsParallax();
  if (has('.section_pillars')) initPillarsAnimation(container)
}



// ================= SPACES page

CustomEase.create('slideshow-wipe', '0.6, 0.08, 0.02, 0.99')

function initSlideShow(el) {
  // Save all elements in an object for easy reference
  const ui = {
    el,
    slides: Array.from(el.querySelectorAll('[data-slideshow="slide"]')),
    inner: Array.from(el.querySelectorAll('[data-slideshow="parallax"]')),
    thumbs: Array.from(el.querySelectorAll('[data-slideshow="thumb"]')),
  }

  let current = 0
  const length = ui.slides.length
  let animating = false
  let autoTimer
  const animationDuration = 0.9 // Define the duration of your 'slide' here

  ui.slides.forEach((slide, index) => {
    slide.setAttribute('data-index', index)
  })
  ui.thumbs.forEach((thumb, index) => {
    thumb.setAttribute('data-index', index)
  })

  ui.slides[current].classList.add('is--current')
  ui.thumbs[current].classList.add('is--current')

  function scheduleNext() {
    if (autoTimer) autoTimer.kill()
    const proxy = { value: 0 }
    autoTimer = gsap.to(proxy, {
      value: 100,
      duration: 7,
      ease: 'none',
      onUpdate: () => el.style.setProperty('--slideshow-progress', proxy.value),
      onComplete: () => {
        navigate(1)
        scheduleNext()
      },
    })
  }

  function navigate(direction, targetIndex = null) {
    if (animating) return
    animating = true

    const previous = current
    current =
      targetIndex !== null && targetIndex !== undefined
        ? targetIndex
        : direction === 1
          ? current < length - 1
            ? current + 1
            : 0
          : current > 0
            ? current - 1
            : length - 1

    const currentSlide = ui.slides[previous]
    const currentInner = ui.inner[previous]
    const upcomingSlide = ui.slides[current]
    const upcomingInner = ui.inner[current]

    gsap
      .timeline({
        defaults: {
          duration: animationDuration,
          ease: 'slideshow-wipe',
        },
        onStart: function () {
          upcomingSlide.classList.add('is--current')
          ui.thumbs[previous].classList.remove('is--current')
          ui.thumbs[current].classList.add('is--current')
        },
        onComplete: function () {
          currentSlide.classList.remove('is--current')
          animating = false
        },
      })
      .to(currentSlide, { xPercent: -direction * 100 }, 0)
      .to(currentInner, { xPercent: direction * 50 }, 0)
      .fromTo(upcomingSlide, { xPercent: direction * 100 }, { xPercent: 0 }, 0)
      .fromTo(upcomingInner, { xPercent: -direction * 50 }, { xPercent: 0 }, 0)
  }

  function onClick(event) {
    const targetIndex = parseInt(event.currentTarget.getAttribute('data-index'), 10)
    if (targetIndex === current || animating) return
    const direction = targetIndex > current ? 1 : -1
    navigate(direction, targetIndex)
    scheduleNext()
  }

  ui.thumbs.forEach((thumb) => {
    thumb.addEventListener('click', onClick)
  })

  scheduleNext()

  return {
    destroy: function () {
      if (autoTimer) autoTimer.kill()
      ui.thumbs.forEach((thumb) => {
        thumb.removeEventListener('click', onClick)
      })
    },
  }
}

function initParallaxImageGalleryThumbnails(container = document) {
  const wrappers = container.querySelectorAll('[data-slideshow="wrap"]')
  wrappers.forEach((wrap) => {
    const instance = initSlideShow(wrap)
    registerCleanup(() => instance.destroy())
  })
}

const initSpacesPage = (container) => {
  initParallaxImageGalleryThumbnails(container)
}

// --- Sanity visual editing (click-to-edit overlays) ---
// Loads ONLY inside the Studio Presentation iframe, from a CDN, so real site
// visitors never download it. Reads the data-sanity="..." attributes emitted by
// the `sanityEdit` Eleventy filter and draws clickable overlays that jump to the
// matching field in the Studio. Barba is wired into the history option so the
// Studio URL bar + "documents on this page" follow SPA page transitions.
// ponytail: CDN runtime import (esm.sh resolves the React peer dep) instead of
// bundling — keeps React out of the public main.js. Swap to a bundled entry only
// if esm.sh proves unreliable.
if (window.self !== window.top) {
  import(/* @vite-ignore */ 'https://esm.sh/@sanity/visual-editing@5')
    .then(({ enableVisualEditing }) => {
      let veNavigate = null
      barba.hooks.after(() => {
        if (veNavigate) veNavigate({ type: 'push', url: location.pathname + location.search })
      })
      enableVisualEditing({
        history: {
          subscribe: (navigate) => {
            veNavigate = navigate
            return () => {
              veNavigate = null
            }
          },
          update: (update) => {
            const here = location.pathname + location.search
            if ((update.type === 'push' || update.type === 'replace') && update.url !== here) {
              barba.go(update.url)
            }
          },
        },
      })
    })
    .catch((e) => console.error('[visual-editing] failed to load', e))
}
