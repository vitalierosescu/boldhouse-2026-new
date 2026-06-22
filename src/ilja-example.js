gsap.registerPlugin(ScrollTrigger, CustomEase)

CustomEase.create(
  'fruitful-bounce',
  'M0,0 C0.084,0.61 0.202,0.898 0.327,0.977 0.555,1.121 0.661,0.92 1,1 '
)

const lottieAnimations = [
  'https://uploads-ssl.webflow.com/659f15a242e58eb40c8cf14b/65cdf88239dc5b5eeb090c11_Leaf%2003.json',
  'https://uploads-ssl.webflow.com/659f15a242e58eb40c8cf14b/65cdf882765a69af7c1dee90_Leaf%2002.json',
  'https://uploads-ssl.webflow.com/659f15a242e58eb40c8cf14b/65cdf882218339a1bb49c9f5_Leaf%2001.json',
]

const generalFlag = false
let globalMuteState = false
let globalPlayState = true
let resizeTimer
let previousWindowWidth = window.innerWidth

const isMobile = window.innerWidth < 480
const isMobileLandscape = window.innerWidth < 768
const isDesktop = window.innerWidth > 991

const IS_PRODUCTION =
  window.location.host === 'my.fruitful.com' ||
  window.location.host === 'www.fruitful.com' ||
  window.location.host === 'fruitful.com'
const FRUITFUL_API_BASE_URL = IS_PRODUCTION
  ? 'https://api.fruitful.com/api'
  : 'https://stg-api.fruitful.com/api'
const FRUITFUL_APP_BASE_URL = IS_PRODUCTION ? 'https://my.fruitful.com' : 'https://stg.fruitful.com'
const STRIPE_KEY = IS_PRODUCTION
  ? 'pk_live_51LNkQgGGy6RMRSOZPOOE4JMpIfDeiSlZFfxjoJwXfGuEKymSDcWplAr57UidvursuvPIofBeK9YxH6vs332gp02J00Q5tkzk8Q'
  : 'pk_test_51LNkQgGGy6RMRSOZBuGNHGAfrI8V5JooMTVzLcPzz00DXKodZojAdF4aVZiXKG246OARKGmT7gvTdAoww5Gg9WWq00e63ZrMiZ'
const PLAN_ID_ATTRIBUTE = IS_PRODUCTION ? 'data-flow-account-id' : 'data-flow-account-test-id'

const TRIAL_VARIANT = '202602_FREE_14'
const TRIAL_PRICE = 0 // drives UI, keep in sync with TRIAL_VARIANT
const TRIAL_LENGTH = 14 // drives UI, keep in sync with TRIAL_VARIANT

// Remove below once ready to turn on 202602_FREE_14
// if (IS_PRODUCTION) {
//   TRIAL_VARIANT = '202511_TEN_30';
//   let TRIAL_PRICE = 10; // drives UI, keep in sync with TRIAL_VARIANT
//   let TRIAL_LENGTH = 30; // drives UI, keep in sync with TRIAL_VARIANT
// }

const FREE_TRIAL_PLAN_TYPES = ['essential', 'plus']

const BASE_FREE_MONTH_PROMO_CODE = '30Free' // If this promo code is auto-applied, replace with 30FreeSolo or 30FreeJoint
const SOLO_FREE_MONTH_PROMO_CODE = '30FreeSolo'
const JOINT_FREE_MONTH_PROMO_CODE = '30FreeJoint'

// GENERAL
function addMaintenanceBanner() {
  const todoDiv = document.createElement('div')
  todoDiv.style.cssText = `
    text-align: center;
    color: black;
    font-size: 12px;
    z-index: 1000;
    position: fixed;
    background: peachpuff;
    line-height: 14px;
    padding: 6px;
    width: 100%;
  `
  todoDiv.textContent =
    'Fruitful has scheduled maintenance on August 14 from 10-11 PM ET, and some services may be unavailable.'

  // Insert as the first element in the body
  document.body.insertBefore(todoDiv, document.body.firstChild)

  return todoDiv
}

function initLogger() {
  if (!!window.Sentry && !!Sentry.captureException) {
    window.captureException = Sentry.captureException
    window.captureMessage = Sentry.captureMessage
    return
  }
  window.Sentry = {
    captureException: function (e) {
      console.error('Captured Error', e)
    },
    captureMessage: function (...msg) {
      console.log(...msg)
    },
  }
}

function transitionIn(next, name) {
  if (!next) {
    next = document.querySelector('[data-barba="container"]')
  }
  //
  const fade = next.querySelectorAll('[data-flow-fade]')
  const bounce = next.querySelectorAll('[data-flow-bounce]')

  const tl = gsap.timeline({
    onStart: () => {
      window.scrollTo(0, 0)
    },
  })

  tl.fromTo(
    bounce,
    {
      autoAlpha: 0,
      y: '4em',
    },
    {
      autoAlpha: 1,
      y: '0em',
      stagger: 0.06,
      duration: 0.525,
      ease: 'fruitful-bounce',
    }
  ).fromTo(
    fade,
    {
      autoAlpha: 0,
      y: '2em',
    },
    {
      autoAlpha: 1,
      y: '0em',
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3',
    },
    0
  )
}

function isEmailValid(email) {
  return /^\S+@\S+\.\S+$/.test(email)
}

function isTrialPlan(plan) {
  return FREE_TRIAL_PLAN_TYPES.includes((plan?.type ?? '').toLowerCase())
}

function isFreeTrialPlan(plan) {
  return isTrialPlan(plan) && (TRIAL_PRICE === undefined || TRIAL_PRICE === 0)
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function capitalizeIfAllLowercase(word) {
  word = word.trim()
  if (/^[a-z]+$/.test(word)) {
    // if all lowercase letters
    return capitalize(word)
  }
  return word
}

function toQueryString(params) {
  return Object.keys(params)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&')
}

function getDistinctId() {
  try {
    const mp = window.mixpanel
    if (!mp || typeof mp.get_distinct_id !== 'function') return undefined

    return mp.get_distinct_id()
  } catch (err) {
    return undefined
  }
}

// FUNCTIONAL
function handleResize() {
  const currentWindowWidth = window.innerWidth
  if (currentWindowWidth !== previousWindowWidth) {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(function () {
      window.location.reload()
      previousWindowWidth = window.innerWidth
    }, 250)
  }
}
window.addEventListener('resize', handleResize)

function supportsTouch() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

function prefersReducedMotion() {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  return query.matches
}

function setLoadingState(isLoading) {
  const isLoadingClass = 'is--loading'
  const bodyClasses = document.body.classList
  if (isLoading) {
    bodyClasses.add(isLoadingClass)
  } else {
    bodyClasses.remove(isLoadingClass)
  }
}

function resetWebflow(data) {
  const parser = new DOMParser()
  const dom = parser.parseFromString(data.next.html, 'text/html')
  const webflowPageId = dom.querySelector('html').getAttribute('data-wf-page')
  document.documentElement.setAttribute('data-wf-page', webflowPageId)
  window.Webflow.destroy()
  window.Webflow.ready()
  window.Webflow.require('ix2').init()
}

/* New */
function updateTodayElements(next) {
  // Base date (today)
  const date = new Date()

  // Formatting options
  const options = { month: 'long', day: 'numeric', year: 'numeric' }

  // Helper: format with ordinal
  function formatWithOrdinal(d) {
    let formatted = d.toLocaleDateString('en-US', options)
    formatted = formatted.replace(/\d+/, (day) => {
      const suffix = ['th', 'st', 'nd', 'rd']
      const v = day % 100
      return day + (suffix[(v - 20) % 10] || suffix[v] || suffix[0])
    })
    return formatted
  }

  // Handle [data-today]
  const todayElements = next.querySelectorAll('[data-today]')
  if (todayElements.length > 0) {
    const formattedToday = formatWithOrdinal(date)
    todayElements.forEach((el) => {
      el.textContent = formattedToday
    })
  }

  // Handle [data-today-plus-month]
  const monthElements = next.querySelectorAll('[data-today-plus-month]')
  if (monthElements.length > 0) {
    const trialEndDate = new Date(date)
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_LENGTH)

    const formattedTrialEndDate = formatWithOrdinal(trialEndDate)

    monthElements.forEach((el) => {
      el.textContent = formattedTrialEndDate
    })
  }
}

async function initReferralLogic() {
  const params = new URLSearchParams(window.location.search)
  console.log(params)
  const referralCode = params.get('referralCode')
  const nameElement = document.querySelector('[data-referral="name"]')
  const defaultElement = document.querySelector('[data-referral-default]')
  const storedName = localStorage.getItem('referralName')

  function handleNoName() {
    if (defaultElement) defaultElement.textContent = "You've been invited to Fruitful."
    if (nameElement) nameElement.style.display = 'none'
  }

  // Treat "undefined" string or empty as invalid
  if (storedName && storedName !== 'undefined' && storedName.trim() !== '') {
    console.log('name exists')
    if (nameElement) {
      nameElement.textContent = storedName
      nameElement.classList.remove('is--loading')
    }
  } else {
    // Clean up bad stored value if present
    if (storedName) localStorage.removeItem('referralName')
  }

  const storedCode = localStorage.getItem('referralCode')
  const hasReferral = referralCode || storedCode
  if (hasReferral) {
    document.body.setAttribute('data-referral', 'active')
  }

  if (!referralCode || storedCode) {
    console.log('no referralCode found in URL or already exists in local storage')
    if (!storedName || storedName === 'undefined' || storedName.trim() === '') handleNoName()
    return
  }

  console.log(referralCode)
  try {
    const response = await fetch(`${FRUITFUL_API_BASE_URL}/signup/validate-referral-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralCode }),
    })
    console.log(JSON.stringify({ referralCode }))
    const result = await response.json()
    console.log(result)

    const name = result?.referrerFirstName

    if (result && name && name !== 'undefined' && name.trim() !== '') {
      localStorage.setItem('referralCode', referralCode)
      if (!localStorage.getItem('referralName')) {
        localStorage.setItem('referralName', name)
        if (nameElement) {
          nameElement.textContent = name
          nameElement.classList.remove('is--loading')
        }
      }
    } else {
      console.warn('Invalid referral code or no name returned', referralCode)
      localStorage.setItem('referralCode', referralCode) // still save the code
      handleNoName()
    }
  } catch (err) {
    console.warn('Referral validation failed', err)
    handleNoName()
  }
}

/*
function initSignupSlider(container) {
  if (!container) {
    container = document.querySelector('[data-barba="container"]')
  }

  // ── Tweakable Config ────────────────────────────────────────────

  const CONFIG = {
    nextPageUrl: '/sign-up/why-join',
    swiperSpeed: 400,
    easeIn: 'power2.in',
    easeOut: 'power2.out',
    textDuration: 0.5,
    titleDuration: 0.4,
    visualDuration: 0.6,
    shadowDuration: 1.2,
    panelDuration: 0.5,
    stagger: 0.1,
    centerDuration: 0.7,
    centerEase: 'power4.inOut',
    fanDuration: 0.6,
    cardDuration: 0.5,
    exitDuration: 0.2,
  }

  // ── Setup ─────────────────────────────────────────────────────────

  const component = container.querySelector('.ss_component')
  if (!component || component.hasAttribute('data-ss')) return
  component.setAttribute('data-ss', '')

  const sliderElement = component.querySelector('.ss_wrap')
  if (!sliderElement) return

  const skipBtn = document.querySelector('.ss_skip')
  const nextBtn = component.querySelector('[data-ss-next]')

  const ANIMATED_ELS = '.ss_blockquote, .ss_p, .ss_title, .ss_visual-w, .ss_visual-p'

  // ── Reduced Motion ──────────────────────────────────────────────

  let motionOk = true
  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: reduce)', () => {
    motionOk = false
    return () => {
      motionOk = true
    }
  })

  // ── Animation Helpers ───────────────────────────────────────────

  function animateText(slide, tl) {
    tl.fromTo(
      slide.querySelector('.ss_blockquote'), { y: '0.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.textDuration,
        ease: CONFIG.easeOut,
      },
    )
    tl.fromTo(
      slide.querySelector('.ss_p'), { y: '0.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.textDuration,
        ease: CONFIG.easeOut,
      },
      '<10%',
    )
    tl.fromTo(
      slide.querySelector('.ss_title'), { y: '0.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.titleDuration,
        ease: CONFIG.easeOut,
      },
      '<10%',
    )
  }

  function animateShadows(slide, tl, stagger) {
    tl.fromTo(
      slide.querySelectorAll('.ss_visual.is--shadow'), { scale: .6, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: CONFIG.shadowDuration,
        ease: "power3.out",
        stagger: stagger || 0,
      },
      0,
    )
  }

  // ── Entrance Animations ─────────────────────────────────────────

  function defaultSlideAnimation(slide) {
    const tl = gsap.timeline()
    animateText(slide, tl)
    tl.fromTo(
      slide.querySelector('.ss_visual-w'), { y: '1.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.visualDuration,
        ease: CONFIG.easeOut,
      },
      0,
    )
    animateShadows(slide, tl)
    return tl
  }

  const slideAnimations = []

  // Step 2: video fan-out from center
  slideAnimations[1] = function (slide) {
    const tl = gsap.timeline()
    animateText(slide, tl)

    tl.fromTo(
      slide.querySelector('.ss_visual-w'), { y: '1.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.visualDuration,
        ease: CONFIG.easeOut,
      },
      0,
    )
    tl.fromTo(
      slide.querySelector('.ss-2_center-w'), { scale: 0.2, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: CONFIG.centerDuration,
        ease: CONFIG.centerEase,
      },
      0,
    )

    const videos = slide.querySelectorAll('.ss-2_video-w')
    if (videos[0]) {
      tl.fromTo(
        videos[0], { rotate: 0, y: '3vh', x: 0, opacity: 0 },
        {
          rotate: -5,
          y: 0,
          opacity: 1,
          x: '-6vw',
          duration: CONFIG.fanDuration,
          ease: CONFIG.easeOut,
        },
        '<50%',
      )
    }
    if (videos[1]) {
      tl.fromTo(
        videos[1], { rotate: 0, y: '-3vh', x: 0, opacity: 0 },
        {
          rotate: 5,
          opacity: 1,
          y: 0,
          x: '6vw',
          duration: CONFIG.fanDuration,
          ease: CONFIG.easeOut,
        },
        '<50%',
      )
    }

    animateShadows(slide, tl)
    return tl
  }

  // Step 3: stagger visual panels, then shadows
  slideAnimations[2] = function (slide) {
    const tl = gsap.timeline()
    animateText(slide, tl)

    tl.fromTo(
      slide.querySelectorAll('.ss_visual-w .ss_visual-p'), { y: '1.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.panelDuration,
        ease: CONFIG.easeOut,
        stagger: CONFIG.stagger,
      },
      0,
    )

    animateShadows(slide, tl, CONFIG.stagger)
    return tl
  }

  // Step 4: stagger visual panels, then shadows
  slideAnimations[3] = function (slide) {
    const tl = gsap.timeline()
    animateText(slide, tl)

    tl.fromTo(
      slide.querySelectorAll('.ss_visual-w .ss_visual-card'),
      {
        y: '3rem',
        opacity: 0,
        x: '-2rem',
        rotateZ: '0deg',
      },
      {
        y: '-2rem',
        opacity: 1,
        duration: CONFIG.cardDuration,
        x: '2rem',
        rotateZ: '6deg',
        ease: CONFIG.easeOut,
        stagger: CONFIG.stagger,
      },
      '<50%',
    )
    tl.fromTo(
      slide.querySelectorAll('.ss_visual-w .ss_visual-p'), { y: '1.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.panelDuration,
        ease: CONFIG.easeOut,
        stagger: CONFIG.stagger,
      },
      0,
    )

    animateShadows(slide, tl, CONFIG.stagger)
    return tl
  }

  // ── Exit Animation ──────────────────────────────────────────────

  function animateExit(slide) {
    if (!motionOk) return
    gsap.killTweensOf(slide.querySelectorAll('*'))
    gsap.timeline().to(slide.querySelectorAll(ANIMATED_ELS), {
      y: '0.5rem',
      opacity: 0,
      duration: CONFIG.exitDuration,
      ease: CONFIG.easeIn,
    })
  }

  // ── Slide Activation ────────────────────────────────────────────

  function makeActive(slide, index) {
    gsap.killTweensOf(slide.querySelectorAll('*'))
    gsap.set(slide.querySelectorAll(ANIMATED_ELS), { clearProps: 'opacity,y' })
    if (!motionOk) return
    const fn = slideAnimations[index]
    if (fn) {
      fn(slide)
    } else {
      defaultSlideAnimation(slide)
    }
  }

  // ── Swiper ──────────────────────────────────────────────────────

  const swiper = new Swiper(sliderElement, {
    slidesPerView: 1,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    speed: CONFIG.swiperSpeed,
    allowTouchMove: true,
    followFinger: false,
    keyboard: { enabled: true, onlyInViewport: true },
    pagination: {
      el: component.querySelector('.ss_bullet_wrap'),
      bulletActiveClass: 'is-active',
      bulletClass: 'ss_bullet_item',
      bulletElement: 'button',
      clickable: true,
    },
    slideActiveClass: 'is-active',
  })

  const lastSlideIndex = swiper.slides.length - 1

  // ── Navigation ──────────────────────────────────────────────────

  function updateUI() {
    if (skipBtn) skipBtn.style.display = swiper.activeIndex === lastSlideIndex ? 'none' : ''
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => swiper.slideTo(lastSlideIndex))
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (swiper.activeIndex === lastSlideIndex) {
        window.location.href = CONFIG.nextPageUrl
      } else {
        swiper.slideNext()
      }
    })
  }

  // ── Events ──────────────────────────────────────────────────────

  updateUI()
  makeActive(swiper.slides[swiper.activeIndex], swiper.activeIndex)

  swiper.on('slideChange', function () {
    animateExit(swiper.slides[swiper.previousIndex])
    if (motionOk) {
      gsap.set(swiper.slides[swiper.activeIndex].querySelectorAll(ANIMATED_ELS), { opacity: 0 })
    }
    updateUI()
  })

  swiper.on('slideChangeTransitionEnd', function () {
    makeActive(swiper.slides[swiper.activeIndex], swiper.activeIndex)
  })
}
*/

/*
function initSignupSlider(container) {
  if (!container) {
    container = document.querySelector('[data-barba="container"]')
  }

  // ── Tweakable Config ────────────────────────────────────────────

  const CONFIG = {
    nextPageUrl: '/sign-up/why-join',
    swiperSpeed: 400,
    easeIn: 'power2.in',
    easeOut: 'power2.out',
    textDuration: 0.5,
    titleDuration: 0.4,
    visualDuration: 0.6,
    shadowDuration: 1.2,
    panelDuration: 0.5,
    stagger: 0.1,
    centerDuration: 0.7,
    centerEase: 'power4.inOut',
    fanDuration: 0.6,
    cardDuration: 0.5,
    exitDuration: 0.2,
  }

  // ── Setup ─────────────────────────────────────────────────────────

  const component = container.querySelector('.ss_component')
  if (!component || component.hasAttribute('data-ss')) return
  component.setAttribute('data-ss', '')

  const sliderElement = component.querySelector('.ss_wrap')
  if (!sliderElement) return

  const skipBtn = document.querySelector('.ss_skip')
  const nextBtn = component.querySelector('[data-ss-next]')

  const ANIMATED_ELS = '.ss_blockquote, .ss_p, .ss_title, .ss_visual-w, .ss_visual-p'

  const footnote = component.parentElement?.querySelector('.flow-footnote')
  const footnoteItems = footnote ? [...footnote.children] : []

  // ── Reduced Motion ──────────────────────────────────────────────

  let motionOk = true
  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: reduce)', () => {
    motionOk = false
    return () => {
      motionOk = true
    }
  })

  // ── Animation Helpers ───────────────────────────────────────────

  function animateText(slide, tl) {
    tl.fromTo(
      slide.querySelector('.ss_blockquote'), { y: '0.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.textDuration,
        ease: CONFIG.easeOut,
      },
    )
    tl.fromTo(
      slide.querySelector('.ss_p'), { y: '0.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.textDuration,
        ease: CONFIG.easeOut,
      },
      '<10%',
    )
    tl.fromTo(
      slide.querySelector('.ss_title'), { y: '0.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.titleDuration,
        ease: CONFIG.easeOut,
      },
      '<10%',
    )
  }

  function animateShadows(slide, tl, stagger) {
    tl.fromTo(
      slide.querySelectorAll('.ss_visual.is--shadow'), { scale: 0.6, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: CONFIG.shadowDuration,
        ease: 'power3.out',
        stagger: stagger || 0,
      },
      0,
    )
  }

  // ── Entrance Animations ─────────────────────────────────────────

  function defaultSlideAnimation(slide) {
    const tl = gsap.timeline()
    animateText(slide, tl)
    tl.fromTo(
      slide.querySelector('.ss_visual-w'), { y: '1.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.visualDuration,
        ease: CONFIG.easeOut,
      },
      0,
    )
    animateShadows(slide, tl)
    return tl
  }

  const slideAnimations = []

  // Step 2: video fan-out from center
  slideAnimations[1] = function (slide) {
    const tl = gsap.timeline()
    animateText(slide, tl)

    tl.fromTo(
      slide.querySelector('.ss_visual-w'), { y: '1.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.visualDuration,
        ease: CONFIG.easeOut,
      },
      0,
    )
    tl.fromTo(
      slide.querySelector('.ss-2_center-w'), { scale: 0.2, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: CONFIG.centerDuration,
        ease: CONFIG.centerEase,
      },
      0,
    )

    const videos = slide.querySelectorAll('.ss-2_video-w')
    if (videos[0]) {
      tl.fromTo(
        videos[0], { rotate: 0, y: '3vh', x: 0, opacity: 0 },
        {
          rotate: -5,
          y: 0,
          opacity: 1,
          x: '-6vw',
          duration: CONFIG.fanDuration,
          ease: CONFIG.easeOut,
        },
        '<50%',
      )
    }
    if (videos[1]) {
      tl.fromTo(
        videos[1], { rotate: 0, y: '-3vh', x: 0, opacity: 0 },
        {
          rotate: 5,
          opacity: 1,
          y: 0,
          x: '6vw',
          duration: CONFIG.fanDuration,
          ease: CONFIG.easeOut,
        },
        '<50%',
      )
    }

    animateShadows(slide, tl)
    return tl
  }

  // Step 3: stagger visual panels, then shadows
  slideAnimations[2] = function (slide) {
    const tl = gsap.timeline()
    animateText(slide, tl)

    tl.fromTo(
      slide.querySelectorAll('.ss_visual-w .ss_visual-p'), { y: '1.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.panelDuration,
        ease: CONFIG.easeOut,
        stagger: CONFIG.stagger,
      },
      0,
    )

    animateShadows(slide, tl, CONFIG.stagger)
    return tl
  }

  // Step 4: stagger visual panels, then shadows
  slideAnimations[3] = function (slide) {
    const tl = gsap.timeline()
    animateText(slide, tl)

    tl.fromTo(
      slide.querySelectorAll('.ss_visual-w .ss_visual-card'),
      {
        y: '3rem',
        opacity: 0,
        x: '-2rem',
        rotateZ: '0deg',
      },
      {
        y: '-2rem',
        opacity: 1,
        duration: CONFIG.cardDuration,
        x: '2rem',
        rotateZ: '6deg',
        ease: CONFIG.easeOut,
        stagger: CONFIG.stagger,
      },
      '<50%',
    )
    tl.fromTo(
      slide.querySelectorAll('.ss_visual-w .ss_visual-p'), { y: '1.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.panelDuration,
        ease: CONFIG.easeOut,
        stagger: CONFIG.stagger,
      },
      0,
    )

    animateShadows(slide, tl, CONFIG.stagger)
    return tl
  }

  // ── Exit Animation ──────────────────────────────────────────────

  function animateExit(slide) {
    if (!motionOk) return
    gsap.killTweensOf(slide.querySelectorAll('*'))
    gsap.timeline().to(slide.querySelectorAll(ANIMATED_ELS), {
      y: '0.5rem',
      opacity: 0,
      duration: CONFIG.exitDuration,
      ease: CONFIG.easeIn,
    })
  }

  // ── Slide Activation ────────────────────────────────────────────

  function makeActive(slide, index) {
    gsap.killTweensOf(slide.querySelectorAll('*'))
    gsap.set(slide.querySelectorAll(ANIMATED_ELS), { clearProps: 'opacity,y' })
    if (!motionOk) return
    const fn = slideAnimations[index]
    if (fn) {
      fn(slide)
    } else {
      defaultSlideAnimation(slide)
    }
  }

  // ── Swiper ──────────────────────────────────────────────────────

  const swiper = new Swiper(sliderElement, {
    slidesPerView: 1,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    speed: CONFIG.swiperSpeed,
    allowTouchMove: true,
    followFinger: false,
    keyboard: { enabled: true, onlyInViewport: true },
    pagination: {
      el: component.querySelector('.ss_bullet_wrap'),
      bulletActiveClass: 'is-active',
      bulletClass: 'ss_bullet_item',
      bulletElement: 'button',
      clickable: true,
    },
    slideActiveClass: 'is-active',
  })

  const lastSlideIndex = swiper.slides.length - 1

  // ── Navigation ──────────────────────────────────────────────────

  function updateFootnote(index) {
    footnoteItems.forEach((item, i) => {
      item.classList.toggle('is--hidden', i !== index)
    })
  }

  function updateUI() {
    if (skipBtn) skipBtn.style.display = swiper.activeIndex === lastSlideIndex ? 'none' : ''
    updateFootnote(swiper.activeIndex)
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => swiper.slideTo(lastSlideIndex))
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (swiper.activeIndex === lastSlideIndex) {
        window.location.href = CONFIG.nextPageUrl
      } else {
        swiper.slideNext()
      }
    })
  }

  // ── Events ──────────────────────────────────────────────────────

  updateUI()
  makeActive(swiper.slides[swiper.activeIndex], swiper.activeIndex)

  swiper.on('slideChange', function () {
    animateExit(swiper.slides[swiper.previousIndex])
    if (motionOk) {
      gsap.set(swiper.slides[swiper.activeIndex].querySelectorAll(ANIMATED_ELS), { opacity: 0 })
    }
    updateUI()
  })

  swiper.on('slideChangeTransitionEnd', function () {
    makeActive(swiper.slides[swiper.activeIndex], swiper.activeIndex)
  })
}
*/

function initCopyToClipboard() {
  const buttons = document.querySelectorAll('.copy-email-button')
  if (!buttons.length) return

  const resetButton = (button) => {
    button.removeAttribute('data-copy-button')
    button.setAttribute('aria-label', 'Copy email to clipboard')
    button._copyResetTimeout = null
  }

  const copyEmail = (button) => {
    const email =
      button.getAttribute('data-copy-email') ||
      button.querySelector('[data-copy-email-element]').textContent.trim()
    if (!email) return

    navigator.clipboard.writeText(email).then(() => {
      button.setAttribute('data-copy-button', 'copied')
      button.setAttribute('aria-label', 'Email copied to clipboard!')

      if (button._copyResetTimeout) {
        clearTimeout(button._copyResetTimeout)
      }

      button._copyResetTimeout = setTimeout(() => resetButton(button), 1250)
    })
  }

  const handleInteraction = (e) => {
    if (e.type === 'click' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))) {
      e.preventDefault()
      copyEmail(e.currentTarget)
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', handleInteraction)
    button.addEventListener('keydown', handleInteraction)
  })
}

function initSignupSlider(container) {
  if (!container) {
    container = document.querySelector('[data-barba="container"]')
  }

  // ── Tweakable Config ────────────────────────────────────────────

  const CONFIG = {
    nextPageUrl: '/sign-up/why-join',
    swiperSpeed: 150,
    easeIn: 'power2.in',
    easeOut: 'power2.out',
    textDuration: 0.5,
    titleDuration: 0.4,
    visualDuration: 0.6,
    shadowDuration: 1.2,
    panelDuration: 0.5,
    stagger: 0.1,
    centerDuration: 0.4,
    centerEase: 'power4.inOut',
    fanDuration: 0.6,
    cardDuration: 0.5,
    exitDuration: 0.2,
  }

  // ── Setup ─────────────────────────────────────────────────────────

  const component = container.querySelector('.ss_component')
  if (!component || component.hasAttribute('data-ss')) return
  component.setAttribute('data-ss', '')

  const sliderElement = component.querySelector('.ss_wrap')
  if (!sliderElement) return

  const skipBtn = document.querySelector('.ss_skip')
  const nextBtn = component.querySelector('[data-ss-next]')

  const ANIMATED_ELS = '.ss_blockquote, .ss_p, .ss_title, .ss_visual-w, .ss_visual-p'

  const footnote = component.parentElement?.querySelector('.flow-footnote')
  const footnoteItems = footnote ? [...footnote.children] : []

  // ── Reduced Motion ──────────────────────────────────────────────

  let motionOk = true
  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: reduce)', () => {
    motionOk = false
    return () => {
      motionOk = true
    }
  })

  // ── Animation Helpers ───────────────────────────────────────────

  function animateText(slide, tl) {
    tl.fromTo(
      slide.querySelector('.ss_blockquote'),
      { y: '0.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.textDuration,
        ease: CONFIG.easeOut,
      }
    )
    tl.fromTo(
      slide.querySelector('.ss_p'),
      { y: '0.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.textDuration,
        ease: CONFIG.easeOut,
      },
      '<10%'
    )
    tl.fromTo(
      slide.querySelector('.ss_title'),
      { y: '0.5rem', opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.titleDuration,
        ease: CONFIG.easeOut,
      },
      '<10%'
    )
  }

  function animateShadows(slide, tl, stagger) {
    tl.fromTo(
      slide.querySelectorAll('.ss_visual.is--shadow'),
      { scale: 0.6, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: CONFIG.shadowDuration,
        ease: 'power3.out',
        stagger: stagger || 0,
      },
      0
    )
  }

  // ── Entrance Animations ─────────────────────────────────────────

  function defaultSlideAnimation(slide, direction) {
    const xFrom = direction < 0 ? '-3rem' : '3rem'
    const tl = gsap.timeline()
    animateText(slide, tl)
    tl.fromTo(
      slide.querySelector('.ss_visual-w'),
      { x: xFrom, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: CONFIG.visualDuration,
        ease: CONFIG.easeOut,
      },
      0
    )
    animateShadows(slide, tl)
    return tl
  }

  const slideAnimations = []

  // Step 2: video fan-out from center
  slideAnimations[1] = function (slide, direction) {
    const xFrom = direction < 0 ? '-3rem' : '3rem'
    const tl = gsap.timeline()
    animateText(slide, tl)

    tl.fromTo(
      slide.querySelector('.ss_visual-w'),
      { x: xFrom, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: CONFIG.visualDuration,
        ease: CONFIG.easeOut,
      },
      0
    )
    tl.fromTo(
      slide.querySelector('.ss-2_center-w'),
      { scale: 0.2, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: CONFIG.centerDuration,
        ease: CONFIG.centerEase,
      },
      0
    )

    const videos = slide.querySelectorAll('.ss-2_video-w')
    if (videos[0]) {
      tl.fromTo(
        videos[0],
        { rotate: 0, y: '3vh', x: 0, opacity: 0 },
        {
          rotate: -5,
          y: 0,
          opacity: 1,
          x: '-6vw',
          duration: CONFIG.fanDuration,
          ease: CONFIG.easeOut,
        },
        '<50%'
      )
    }
    if (videos[1]) {
      tl.fromTo(
        videos[1],
        { rotate: 0, y: '-3vh', x: 0, opacity: 0 },
        {
          rotate: 5,
          opacity: 1,
          y: 0,
          x: '6vw',
          duration: CONFIG.fanDuration,
          ease: CONFIG.easeOut,
        },
        '<50%'
      )
    }

    animateShadows(slide, tl)
    return tl
  }

  // Step 3: stagger visual panels, then shadows
  slideAnimations[2] = function (slide, direction) {
    const xFrom = direction < 0 ? '-1.5rem' : '1.5rem'
    const tl = gsap.timeline()
    animateText(slide, tl)

    tl.fromTo(
      slide.querySelectorAll('.ss_visual-w .ss_visual-p'),
      { x: xFrom, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: CONFIG.panelDuration,
        ease: CONFIG.easeOut,
        stagger: CONFIG.stagger,
      },
      0
    )

    animateShadows(slide, tl, CONFIG.stagger)
    return tl
  }

  // Step 4: stagger visual panels, then shadows
  slideAnimations[3] = function (slide, direction) {
    const xFrom = direction < 0 ? '-1.5rem' : '1.5rem'
    const tl = gsap.timeline()
    animateText(slide, tl)

    tl.fromTo(
      slide.querySelectorAll('.ss_visual-w .ss_visual-card'),
      {
        y: '3rem',
        opacity: 0,
        x: '-2rem',
        rotateZ: '0deg',
      },
      {
        y: '-2rem',
        opacity: 1,
        duration: CONFIG.cardDuration,
        x: '2rem',
        rotateZ: '6deg',
        ease: CONFIG.easeOut,
        stagger: CONFIG.stagger,
      },
      '<50%'
    )
    tl.fromTo(
      slide.querySelectorAll('.ss_visual-w .ss_visual-p'),
      { x: xFrom, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: CONFIG.panelDuration,
        ease: CONFIG.easeOut,
        stagger: CONFIG.stagger,
      },
      0
    )

    animateShadows(slide, tl, CONFIG.stagger)
    return tl
  }

  // ── Exit Animation ──────────────────────────────────────────────

  function animateExit(slide, direction) {
    if (!motionOk) return
    const xTo = direction < 0 ? '3rem' : '-3rem'
    gsap.killTweensOf(slide.querySelectorAll('*'))
    const tl = gsap.timeline()
    tl.to(slide.querySelectorAll('.ss_blockquote, .ss_p, .ss_title'), {
      y: '0.5rem',
      opacity: 0,
      duration: CONFIG.exitDuration,
      ease: CONFIG.easeIn,
    })
    const visual = slide.querySelector('.ss_visual-w')
    if (visual) {
      tl.to(
        visual,
        {
          x: xTo,
          opacity: 0,
          duration: CONFIG.exitDuration,
          ease: CONFIG.easeIn,
        },
        0
      )
    }
  }

  // ── Slide Activation ────────────────────────────────────────────

  function makeActive(slide, index, direction) {
    gsap.killTweensOf(slide.querySelectorAll('*'))
    gsap.set(slide.querySelectorAll(ANIMATED_ELS), { clearProps: 'opacity,y,x' })
    if (!motionOk) return
    const fn = slideAnimations[index]
    if (fn) {
      fn(slide, direction)
    } else {
      defaultSlideAnimation(slide, direction)
    }
  }

  // ── Swiper ──────────────────────────────────────────────────────

  const swiper = new Swiper(sliderElement, {
    slidesPerView: 1,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    speed: CONFIG.swiperSpeed,
    allowTouchMove: true,
    followFinger: false,
    keyboard: { enabled: true, onlyInViewport: true },
    pagination: {
      el: component.querySelector('.ss_bullet_wrap'),
      bulletActiveClass: 'is-active',
      bulletClass: 'ss_bullet_item',
      bulletElement: 'button',
      clickable: true,
    },
    slideActiveClass: 'is-active',
  })

  const lastSlideIndex = swiper.slides.length - 1

  // ── Navigation ──────────────────────────────────────────────────

  function updateFootnote(index) {
    footnoteItems.forEach((item, i) => {
      item.classList.toggle('is--hidden', i !== index)
    })
  }

  function updateUI() {
    if (skipBtn) skipBtn.style.display = swiper.activeIndex === lastSlideIndex ? 'none' : ''
    updateFootnote(swiper.activeIndex)
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => swiper.slideTo(lastSlideIndex))
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (swiper.activeIndex === lastSlideIndex) {
        window.location.href = CONFIG.nextPageUrl
      } else {
        swiper.slideNext()
      }
    })
  }

  // ── Events ──────────────────────────────────────────────────────

  let slideDirection = 1

  updateUI()
  makeActive(swiper.slides[swiper.activeIndex], swiper.activeIndex, slideDirection)

  swiper.on('slideChange', function () {
    slideDirection = swiper.activeIndex > swiper.previousIndex ? 1 : -1
    animateExit(swiper.slides[swiper.previousIndex], slideDirection)
    if (motionOk) {
      gsap.set(swiper.slides[swiper.activeIndex].querySelectorAll(ANIMATED_ELS), { opacity: 0 })
    }
    updateUI()
  })

  swiper.on('slideChangeTransitionEnd', function () {
    makeActive(swiper.slides[swiper.activeIndex], swiper.activeIndex, slideDirection)
  })
}

function playLottieAnimationsStaggered(animations, staggerTime) {
  animations.forEach((animation, index) => {
    gsap.delayedCall(staggerTime * index, () => animation.play())
  })
}

function resetLottieAnimations(animations) {
  animations.forEach((animation) => {
    animation.goToAndStop(0, true)
  })
}

function initCursorAndButtons(container) {
  function initFollower() {
    if (generalFlag === false) {
      container = document.querySelector('body')
    }
    const follower = document.querySelector('.cursor-item')
    if (!follower || !container) return
    let targetX = 0,
      targetY = 0
    let currentX = 0,
      currentY = 0
    let velocityX = 0,
      velocityY = 0
    let lastY = 0
    let rotation = 0

    function lerp(start, end, factor) {
      return (1 - factor) * start + factor * end
    }

    const stiffness = 0.1
    const damping = 0.55
    const rotationSensitivity = 0.1

    function animate() {
      const dx = targetX - currentX
      const dy = targetY - currentY

      // Calculate velocity
      velocityX += dx * stiffness
      velocityY += dy * stiffness

      // Apply damping
      velocityX *= damping
      velocityY *= damping

      // Update current position
      currentX += velocityX
      currentY += velocityY

      const speedY = targetY - lastY

      if (Math.abs(speedY) > 0.2) {
        rotation = Math.max(Math.min(rotation + speedY * (rotationSensitivity * -1), 90), -90)
      } else {
        rotation = lerp(rotation, 0, 0.06)
      }

      follower.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`

      lastY = targetY

      requestAnimationFrame(animate)
    }
    animate()

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX
      targetY = e.clientY
    })

    document.querySelectorAll('[data-cursor]').forEach((element) => {
      element.addEventListener('mouseenter', function () {
        const cursorWrapper = document.querySelector('.cursor-item')
        if (cursorWrapper) {
          cursorWrapper.style.display = 'flex'
        }
        const cursorText = this.getAttribute('data-cursor')
        if (cursorText) {
          const cursorTextElement = document.querySelector('[data-cursor-text]')
          if (cursorTextElement) {
            cursorTextElement.textContent = cursorText
          }
        }
      })

      element.addEventListener('mouseleave', function () {
        const cursorWrapper = document.querySelector('.cursor-item')
        if (cursorWrapper) {
          cursorWrapper.style.display = ''
        }
      })
    })
  }
  initFollower()

  function setPositionAndTransform(container, position) {
    switch (position) {
      case 'top-left':
        container.style.left = '0px'
        container.style.top = '0px'
        container.style.transform = 'translate(-50%, -50%)'
        break
      case 'top-right':
        container.style.right = '0px'
        container.style.top = '0px'
        container.style.transform = 'translate(50%, -50%)'
        break
      case 'bottom-left':
        container.style.left = '0px'
        container.style.bottom = '0px'
        container.style.transform = 'translate(-50%, 50%)'
        break
      case 'bottom-right':
        container.style.right = '0px'
        container.style.bottom = '0px'
        container.style.transform = 'translate(50%, 50%)'
        break
    }
  }

  container.querySelectorAll('.button').forEach((button) => {
    if (prefersReducedMotion()) return
    button.addEventListener('mouseenter', function () {
      const parentDiv = button.parentElement
      const buttonSize = button.getBoundingClientRect()
      const numberOfAnimations = Math.floor(Math.random() * 2) + 1

      for (let i = 0; i < numberOfAnimations; i++) {
        const lottieContainer = document.createElement('div')
        lottieContainer.style.position = 'absolute'
        lottieContainer.style.width = '120px'
        lottieContainer.style.height = '120px'
        lottieContainer.style.pointerEvents = 'none'

        const randomIndex = Math.floor(Math.random() * lottieAnimations.length)
        const selectedAnimation = lottieAnimations[randomIndex]

        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
        const selectedPosition = positions[Math.floor(Math.random() * positions.length)]

        setPositionAndTransform(lottieContainer, selectedPosition)
        parentDiv.appendChild(lottieContainer)

        const animation = lottie.loadAnimation({
          container: lottieContainer,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          path: selectedAnimation,
        })

        const tl = gsap.timeline({})

        tl.to(button, {
          scale: 0.95,
          duration: 0.25,
        }).to(button, {
          scale: 1,
          duration: 0.45,
          ease: 'back.out(5)',
        })

        animation.addEventListener('complete', () => {
          lottieContainer.remove()
        })
      }
    })
  })
}

function initVideoOnHover() {
  if (supportsTouch()) {
    return
  }
  if (!isMobileLandscape) {
    console.log('yo')
    const videoPlayTriggers = document.querySelectorAll('[data-video-hover]')
    if (!videoPlayTriggers) return

    videoPlayTriggers.forEach((trigger) => {
      const image = trigger.querySelector('img')
      const video = trigger.querySelector('video')

      trigger.addEventListener('mouseenter', () => {
        gsap.to(image, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2',
        })
        gsap.to(video, {
          opacity: 1,
          duration: 0.2,
          ease: 'power2',
          onComplete: () => {
            video.play()
          },
        })
      })
      trigger.addEventListener('mouseleave', () => {
        gsap.to(image, {
          opacity: 1,
          duration: 0.2,
          ease: 'power2',
        })
        gsap.to(video, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2',
          onComplete: () => {
            video.pause()
          },
        })
      })
    })
  }
}

function initVideoControls(container) {
  if (!container) {
    container = document.querySelector('[data-barba="container"]')
  }
  const videoContainers = container.querySelectorAll('[data-video-controls]')
  const playButton = container.querySelectorAll('.play-button-icon')
  const soundButton = container.querySelectorAll('.sound-button-icon')

  if (!globalPlayState) {
    playButton.forEach((button) => {
      button.classList.add('active')
    })
  }
  if (!globalMuteState) {
    soundButton.forEach((button) => {
      button.classList.add('muted')
    })
  }

  videoContainers.forEach((container) => {
    const video = container.querySelector('video')
    const autoplay = container.getAttribute('data-video-controls')

    if (!autoplay) {
      video.addEventListener('click', () => {
        if (video.paused) {
          video.play()
          playButton.forEach((button) => {
            button.classList.remove('active')
          })
          globalPlayState = true
        } else {
          video.pause()
          playButton.forEach((button) => {
            button.classList.add('active')
          })
          globalPlayState = false
        }
      })
    }

    soundButton.forEach((button) => {
      button.addEventListener('click', () => {
        video.muted = !video.muted
        globalMuteState = video.muted
        soundButton.forEach((button) => {
          button.classList.toggle('muted')
        })
      })
    })
  })
}

function initCustomButtons(container) {
  const buttons = container.querySelectorAll('[data-flow-radio]')
  if (buttons.length > 0) {
    buttons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const wrapper = button.closest('[data-form-wrap]') || document.body
        const advance = wrapper.querySelector('[data-form-advance]')

        buttons.forEach((otherButton) => {
          if (otherButton !== button) {
            otherButton.classList.remove('active')
          }
        })
        button.classList.toggle('active')

        if (advance) {
          gsap.delayedCall(0.45, () => {
            advance.click()
          })
        } else {
        }
      })
    })
  }
}

function initToolTips() {
  const wrappers = document.querySelectorAll('.tooltip-w')
  if (!wrappers.length) return

  wrappers.forEach((wrapper) => {
    const tooltip = wrapper.querySelector('.tooltip')
    if (!tooltip) return

    // Hover
    wrapper.addEventListener('mouseenter', () => {
      tooltip.classList.add('active')
      wrapper.style.zIndex = 4
    })

    wrapper.addEventListener('mouseleave', () => {
      tooltip.classList.remove('active')
      wrapper.style.zIndex = 3
    })

    // Click toggle
    wrapper.addEventListener('click', (e) => {
      e.stopPropagation()
      const isActive = tooltip.classList.contains('active')
      document.querySelectorAll('.tooltip.active').forEach((t) => {
        t.classList.remove('active')
        t.parentElement.style.zIndex = 3
      })

      if (!isActive) {
        tooltip.classList.add('active')
        wrapper.style.zIndex = 4
      }
    })
  })

  // Close on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.tooltip.active').forEach((t) => {
      t.classList.remove('active')
      t.parentElement.style.zIndex = 3
    })
  })
}

const initHideNavOnScroll = () => {
  const navbarMenu = document.querySelector('.flow-top')
  const offsetY = 20
  const scrollThreshold = offsetY
  let oldScroll = 0

  window.addEventListener('scroll', () => {
    if (window.scrollY > scrollThreshold && window.scrollY > oldScroll) {
      navbarMenu.classList.add('is--scrolled')
    } else {
      navbarMenu.classList.remove('is--scrolled')
    }

    oldScroll = window.scrollY
  })
}

const initDropdown = (next) => {
  if (!next) {
    next = document.querySelector('[data-barba="container"]')
  }

  const dd = next.querySelector('[dropdown-status]')
  if (dd) {
    dd.addEventListener('click', () => {
      const status = dd.getAttribute('dropdown-status')
      if (status === 'open') {
        dd.setAttribute('dropdown-status', 'closed')
        gsap.to('.checkout-dropdown__content', {
          height: '0px',
          duration: 0.5,
          overwrite: 'auto',
          ease: 'power3.inOut',
        })
      } else {
        dd.setAttribute('dropdown-status', 'open')
        gsap.to('.checkout-dropdown__content', {
          height: 'auto',
          duration: 0.5,
          overwrite: 'auto',
          ease: 'power3.inOut',
        })
      }
    })
  }
}

function initOpeningHours() {
  const defaultTimezone = 'America/New_York'
  const schedule = [
    { open: true, openMin: 540, closeMin: 1020, overnight: false },
    { open: true, openMin: 540, closeMin: 1020, overnight: false },
    { open: true, openMin: 540, closeMin: 1020, overnight: false },
    { open: true, openMin: 540, closeMin: 1020, overnight: false },
    { open: true, openMin: 540, closeMin: 1020, overnight: false },
    { open: false, openMin: 0, closeMin: 0, overnight: false },
    { open: false, openMin: 0, closeMin: 0, overnight: false },
  ]

  const getNowParts = () => {
    let useTz = defaultTimezone
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: defaultTimezone })
    } catch {
      useTz = 'America/New_York'
    }
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: useTz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = fmt.formatToParts(new Date())
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
    const weekdayIdx = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(map.weekday)
    return {
      weekdayIdx,
      hour: parseInt(map.hour, 10),
      minute: parseInt(map.minute, 10),
    }
  }

  const evaluate = () => {
    const now = getNowParts()
    const curIdx = now.weekdayIdx
    const nowMin = now.hour * 60 + now.minute
    const today = schedule[curIdx]
    const yesterday = schedule[(curIdx + 6) % 7]
    let isOpen = false

    if (today.open) {
      if (!today.overnight) {
        isOpen = nowMin >= today.openMin && nowMin < today.closeMin
      } else {
        isOpen = nowMin >= today.openMin || nowMin < today.closeMin
      }
    }
    if (!isOpen && yesterday.open && yesterday.overnight && nowMin < yesterday.closeMin) {
      isOpen = true
    }

    const banner = document.querySelector('.banner.is--flow.is--default')

    if (!isOpen) {
      //if (banner) banner.style.display = "none";
      if (banner) banner.classList.add('is-disabled')
    } else {
      //if (banner) banner.style.display = "flex";
      if (banner) banner.classList.remove('is-disabled')
    }

    return isOpen
  }

  const initialStatus = evaluate()
  const timer = setInterval(evaluate, 60 * 1000)

  const visHandler = () => {
    if (!document.hidden) evaluate()
  }
  document.addEventListener('visibilitychange', visHandler)

  return {
    getStatus: evaluate,
    cleanup: () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visHandler)
    },
  }
}

function initMobileSliders() {
  const mobileSlider = new Swiper('.flow-guide__grid', {
    slidesPerView: 'auto',
    spaceBetween: 0,
    centeredSlides: true,
    speed: 800,
    init: true,
    initialSlide: 2,
    breakpoints: {
      768: {
        init: false,
      },
    },
    on: {
      init: function () {
        const swiper = this

        const getActiveSlide = () => swiper.slides[swiper.activeIndex]
        const updateActiveVideo = (action) => {
          const activeSlide = getActiveSlide()
          if (!activeSlide) return
          const memberImg = activeSlide.querySelector('img')
          const memberVid = activeSlide.querySelector('video')
          action(memberImg, memberVid)
        }

        console.log('hi')
        if (!isMobileLandscape) {
          updateActiveVideo(playActiveVid)

          swiper.on('beforeSlideChangeStart', function () {
            updateActiveVideo(pausePreviousVid)
          })

          swiper.on('slideChangeTransitionEnd', function () {
            updateActiveVideo(playActiveVid)
          })
        }

        // SUBNAV LOGIC
        const guideNav = document.querySelectorAll('.g-nav__item')
        guideNav[2].classList.add('active')
        if (guideNav.length) {
          if (guideNav[swiper.initialSlide]) {
            guideNav[swiper.initialSlide].classList.add('active')
          }

          guideNav.forEach((item, index) => {
            item.addEventListener('click', () => {
              guideNav.forEach((n) => n.classList.remove('active'))
              item.classList.add('active')
              swiper.slideTo(index)
            })
          })

          swiper.on('slideChangeTransitionEnd', () => {
            guideNav.forEach((n) => n.classList.remove('active'))
            if (guideNav[swiper.activeIndex]) {
              guideNav[swiper.activeIndex].classList.add('active')
            }
          })
        }
      },
    },
  })

  function playActiveVid(image, video) {
    gsap.to(image, {
      opacity: 0,
      duration: 0.3,
      ease: 'power1.inOut',
    })
    gsap.to(video, {
      opacity: 1,
      duration: 0.3,
      ease: 'power1.inOut',
      onComplete: () => {
        video.play()
      },
    })
  }

  function pausePreviousVid(image, video) {
    gsap.to(image, {
      opacity: 1,
      duration: 0.3,
      ease: 'power1.inOut',
    })
    gsap.to(video, {
      opacity: 0,
      duration: 0.3,
      ease: 'power1.inOut',
      onComplete: () => {
        video.pause()
      },
    })
  }
}

function initMemberStories() {
  document.querySelectorAll('[data-modal-open]').forEach((element) => {
    element.addEventListener('click', function () {
      const videoSrc = this.getAttribute('data-video-src')
      const size = this.getAttribute('data-modal-open')
      openVideoModal(videoSrc, size)
    })
  })

  function openVideoModal(videoSrc, size) {
    const tl = gsap.timeline({
      onStart: () => {
        if (size === 'portrait') {
          const m = document.querySelector('.modal-inner')
          m.classList.add('portrait')
        } else {
          const m = document.querySelector('.modal-inner')
          m.classList.remove('portrait')
        }
      },
    })
    tl.set('.modal-w', { display: 'flex' })
      .fromTo(
        '.modal-bg',
        { filter: 'blur(0px)', opacity: 0 },
        {
          filter: 'blur(4px)',
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
        }
      )
      .fromTo(
        '.modal-inner',
        {
          opacity: 0,
          yPercent: 5,
        },
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.6,
          ease: 'power3.out',
        },
        0
      )

    const videoElement = document.querySelector('.modal-w video')
    if (videoElement.getAttribute('src') !== videoSrc) {
      videoElement.src = videoSrc
      videoElement.load()
      if (!globalPlayState) {
        videoElement.oncanplay = () => {
          videoElement.pause()
        }
      }
    } else {
      if (globalPlayState) {
        videoElement.muted = globalMuteState
        videoElement.play()
      }
    }
    if (globalPlayState) {
      videoElement.oncanplay = () => {
        videoElement.muted = globalMuteState
        videoElement.play()
      }
    }

    document.querySelectorAll('[data-modal-close]').forEach((closeElement) => {
      closeElement.addEventListener('click', function () {
        videoElement.pause()
        gsap.to('.modal-bg', {
          filter: 'blur(0px)',
          duration: 0.5,
          opacity: 0,
          onComplete: () => {
            gsap.set('.modal-w', { display: 'none' })
          },
        })
        gsap.to('.modal-inner', {
          opacity: 0,
          yPercent: 5,
          duration: 0.5,
          ease: 'power3.out',
        })
      })
    })
  }
}

function initSheetOverlay(container) {
  const sheetWrap = container.querySelector('.flow-modal')
  const openButtons = container.querySelectorAll('[data-sheet-open="yes"]')
  if (openButtons.length > 0) {
    let state = 'closed'

    openButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (state === 'closed') {
          sheetWrap.classList.add('active')
          state = 'open'
        }
      })
    })

    const closeToggles = container.querySelectorAll('[data-sheet-close]')
    closeToggles.forEach((closeButton) => {
      closeButton.addEventListener('click', () => {
        if (state === 'open') {
          sheetWrap.classList.remove('active')
          state = 'closed'
        }
      })
    })
  }
}

function initCardsHover() {
  if (!isMobileLandscape) {
    const cards = document.querySelectorAll('[data-card]')
    cards.forEach((card) => {
      const originalZIndex = card.style.zIndex || 0
      const isStatic = card.getAttribute('data-card') === 'static'
      const isSimple = card.getAttribute('data-card') === 'simple'
      if (isStatic === true) return
      const video = card.querySelector('video')
      const image = card.querySelector('img')

      card.addEventListener('mouseenter', () => {
        card.style.zIndex = 10

        if (!prefersReducedMotion()) {
          gsap.to(card, {
            scale: isSimple ? 1.05 : 1.15,
            yPercent: isSimple ? -10 : null,
            rotate: isSimple ? 0 : Math.random() * 16 - 8,
            duration: 0.6,
            ease: CustomEase.create(
              'guides-bounce',
              'M0,0 C0.084,0.61 0.202,0.898 0.327,0.977 0.555,1.121 0.661,0.92 1,1 '
            ),
          })
        }

        if (!supportsTouch()) {
          gsap.to(image, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2',
          })
          gsap.to(video, {
            opacity: 1,
            duration: 0.2,
            ease: 'power2',
            onComplete: () => {
              video.play()
            },
          })
        }
      })

      card.addEventListener('mouseleave', () => {
        card.style.zIndex = originalZIndex
        if (!prefersReducedMotion()) {
          gsap.to(card, {
            scale: 1,
            yPercent: isSimple ? 0 : null,
            rotate: isSimple ? 0 : Math.random() * 6 - 3,
            duration: 0.6,
            ease: CustomEase.create(
              'guides-bounce',
              'M0,0 C0.084,0.61 0.202,0.898 0.327,0.977 0.555,1.121 0.661,0.92 1,1 '
            ),
          })
        }

        if (!supportsTouch()) {
          gsap.to(image, {
            opacity: 1,
            duration: 0.2,
            ease: 'power2',
          })
          gsap.to(video, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2',
            onComplete: () => {
              video.pause()
            },
          })
        }
      })
    })
  }
}

const initFlowNavObserver = (next) => {
  if (!next) {
    next = document.querySelector('[data-barba="container"]')
  }
  const mainW = next.querySelector('.main-w')
  const progressContainer = document.querySelector('.flow-top .flow-progress__container')
  const navBg = document.querySelector('.flow-top .flow-nav__bg')

  if (!mainW) return

  const observer = new MutationObserver(() => {
    if (mainW.hasAttribute('data-flow-hide-nav')) {
      setTimeout(() => {
        progressContainer?.style.setProperty('display', 'none')
      }, 500)

      if (navBg) {
        Object.assign(navBg.style, {
          justifyContent: 'center',
          padding: '0rem',
          position: 'relative',
          display: 'flex',
        })
      }
    }

    if (mainW.hasAttribute('data-flow-show-nav')) {
      progressContainer?.style.setProperty('display', 'flex')
    }
  })

  observer.observe(mainW, {
    attributes: true,
    attributeFilter: ['data-flow-hide-nav', 'data-flow-show-nav'],
  })
}

function initGuidesOverlay(next) {
  if (!next) {
    next = document.querySelector('[data-barba="container"]')
  }
  const overlayOpenTriggers = next.querySelectorAll('[data-overlay-open]')
  if (overlayOpenTriggers.length === 0) return
  const overlayWrapper = next.querySelector('.overlay-w')
  const overlayInner = next.querySelector('.overlay-inner')
  const overlayItems = next.querySelectorAll('.overlay-item')
  const overlayCloseTrigger = next.querySelectorAll('[data-overlay-close]')
  const overlayCta = next.querySelector('[data-overlay-cta]')
  const overlayNextButtons = next.querySelectorAll('[data-overlay-next]')
  const overlayPrevButtons = next.querySelectorAll('[data-overlay-prev]')
  const fade = next.querySelectorAll('[data-overlay-fade]')
  const tags = next.querySelectorAll('[data-overlay-tag]')

  const elementsToAnimateInAndOut = next.querySelectorAll(
    '.overlay-inner, [data-overlay-next], [data-overlay-prev]'
  )

  gsap.set(elementsToAnimateInAndOut, { yPercent: 20, opacity: 0 })

  overlayOpenTriggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => {
      gsap
        .timeline()
        .set(overlayWrapper, { display: 'flex' })
        .fromTo('.overlay-bg', { opacity: 0 }, { opacity: 1, duration: 0.4 })
        .fromTo(
          elementsToAnimateInAndOut,
          { yPercent: 20, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'back.out(2)',
          },
          '<'
        )
        .fromTo(
          fade,
          {
            opacity: 0,
            y: '1rem',
          },
          {
            opacity: 1,
            y: '0rem',
            duration: 0.45,
          },
          '<+=0.1'
        )
        .fromTo(
          tags,
          {
            opacity: 0,
            y: '1rem',
          },
          {
            opacity: 1,
            y: '0rem',
            stagger: 0.02,
            duration: 0.45,
            ease: 'back.out(2)',
          },
          '<'
        )

      if (index > 5) {
        index = index - 6
      }
      const prevIndex = index === 0 ? overlayItems.length - 1 : index - 1
      const nextIndex = index === overlayItems.length - 1 ? 0 : index + 1

      const activeItem = overlayItems[index]
      const prevItemName = overlayItems[prevIndex].getAttribute('data-overlay-name')
      const nextItemName = overlayItems[nextIndex].getAttribute('data-overlay-name')
      const activeItemName = overlayItems[index].getAttribute('data-overlay-name')

      const overlayPrevNameElement = next.querySelector('[data-overlay-prev-name]')
      const overlayNextNameElement = next.querySelector('[data-overlay-next-name]')

      next.querySelector('[data-guide-name]').textContent = activeItemName
      next.querySelector('[data-flow-guide]').setAttribute('data-flow-guide', activeItemName)

      const video = activeItem.querySelector('video')
      if (globalPlayState) {
        video.muted = globalMuteState
        video.play()
      }

      overlayItems.forEach((item) => item.classList.remove('is--active'))
      activeItem.classList.add('is--active')
      const overlayName = activeItem.getAttribute('data-overlay-name')
      //overlayCta.textContent = overlayName;

      if (overlayPrevNameElement) overlayPrevNameElement.textContent = prevItemName
      if (overlayNextNameElement) overlayNextNameElement.textContent = nextItemName
    })
  })

  overlayCloseTrigger.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      overlayItems.forEach((item) => {
        const video = item.querySelector('video')
        video.pause()
      })
      gsap
        .timeline()
        .fromTo('.overlay-bg', { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power3' })
        .fromTo(
          elementsToAnimateInAndOut,
          { yPercent: 0, opacity: 1 },
          {
            yPercent: 10,
            opacity: 0,
            duration: 0.3,
            ease: 'power3',
          },
          0
        )
        .set(overlayWrapper, { display: 'none' })
        .then(() => {
          overlayItems.forEach((item) => {
            item.classList.remove('is--active')
            gsap.set(item, { opacity: 0, xPercent: 0, clearProps: 'all' })
          })
        })
    })
  })

  //
  //

  function updateActiveItem(newIndex, direction) {
    const currentActiveIndex = Array.from(overlayItems).findIndex((item) =>
      item.classList.contains('is--active')
    )
    const newActiveItem = overlayItems[newIndex]
    const currentActiveItem = overlayItems[currentActiveIndex]
    const yMovement = direction === 'next' ? -1 : 1

    const currentVideo = currentActiveItem.querySelector('video')
    const newVideo = newActiveItem.querySelector('video')

    currentVideo.pause()

    const tlOut = gsap.timeline({
      onComplete: () => {
        if (currentActiveItem) {
          currentActiveItem.classList.remove('is--active')
        }
        newActiveItem.classList.add('is--active')
        animateInNewActiveItem()
      },
    })

    if (currentActiveItem) {
      tlOut.to(
        currentActiveItem.querySelectorAll('[data-overlay-fade]'),
        {
          opacity: 0,
          y: `${yMovement}rem`,
          stagger: 0.05,
          duration: 0.3,
          ease: 'power3',
        },
        '<'
      )
      tlOut.to(
        currentActiveItem.querySelectorAll('[data-overlay-tag]'),
        {
          opacity: 0,
          y: `${yMovement}rem`,
          stagger: 0.1,
          duration: 0.3,
          ease: 'power3',
        },
        '<'
      )
    }

    function animateInNewActiveItem() {
      if (globalPlayState) {
        newVideo.muted = globalMuteState
        newVideo.play()
      }
      const yInitialMovement = direction === 'next' ? '1rem' : '-1rem'
      const tlIn = gsap.timeline({
        onStart: () => {
          const overlayName = newActiveItem.getAttribute('data-overlay-name')
          //overlayCta.textContent = overlayName;
          updateAdjacentNames(newIndex)
        },
      })
      tlIn
        .fromTo(
          newActiveItem.querySelectorAll('[data-overlay-fade]'),
          {
            opacity: 0,
            y: yInitialMovement,
          },
          {
            opacity: 1,
            y: '0rem',
            stagger: 0.05,
            duration: 0.45,
          }
        )
        .fromTo(
          newActiveItem.querySelectorAll('[data-overlay-tag]'),
          {
            opacity: 0,
            y: yInitialMovement,
          },
          {
            opacity: 1,
            y: '0rem',
            stagger: 0.05,
            duration: 0.45,
            ease: 'back.out(2)',
          },
          '<'
        )
    }

    // Function to update previous and next names
    function updateAdjacentNames(activeIndex) {
      const prevIndex = activeIndex === 0 ? overlayItems.length - 1 : activeIndex - 1
      const nextIndex = activeIndex === overlayItems.length - 1 ? 0 : activeIndex + 1
      const prevItemName = overlayItems[prevIndex].getAttribute('data-overlay-name')
      const nextItemName = overlayItems[nextIndex].getAttribute('data-overlay-name')
      const activeItemName = overlayItems[activeIndex].getAttribute('data-overlay-name')

      const prevItemNameShow = document.querySelector('[data-overlay-prev-name]')
      const nextItemNameShow = document.querySelector('[data-overlay-next-name]')

      if (prevItemNameShow) {
        textContent = prevItemName
      }
      if (nextItemNameShow) {
        textContent = nextItemName
      }

      document.querySelector('[data-guide-name]').textContent = activeItemName
      document.querySelector('[data-flow-guide]').setAttribute('data-flow-guide', activeItemName)
    }
  }

  overlayNextButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentIndex = Array.from(overlayItems).findIndex((item) =>
        item.classList.contains('is--active')
      )
      const newIndex = currentIndex === overlayItems.length - 1 ? 0 : currentIndex + 1
      updateActiveItem(newIndex, 'next')
    })
  })

  overlayPrevButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentIndex = Array.from(overlayItems).findIndex((item) =>
        item.classList.contains('is--active')
      )
      const newIndex = currentIndex === 0 ? overlayItems.length - 1 : currentIndex - 1
      updateActiveItem(newIndex, 'prev')
    })
  })
}

function initPriceCards(next) {
  const wrap = next.querySelector('[data-pricing-section]')

  if (!wrap) {
    return
  }

  if (wrap.querySelector('[data-price-status]')) {
    const buttonGroups = wrap.querySelector('.price-toggle__nav')
    const buttons = wrap.querySelectorAll('[data-price-toggle]')
    const row = wrap.querySelector('[data-price-status]')

    buttons.forEach((button) => {
      const type = button.getAttribute('data-price-toggle')
      const equalButtons = wrap.querySelectorAll(`[data-price-toggle="${type}"]`)
      button.addEventListener('click', () => {
        if (row.getAttribute('data-price-status') === type) return
        row.setAttribute('data-price-status', type)
        buttons.forEach((btn) => btn.classList.remove('is--active'))
        button.classList.add('is--active')
        equalButtons.forEach((btn) => btn.classList.add('is--active'))
      })
    })

    const getStartedButtons = wrap.querySelectorAll(`[${PLAN_ID_ATTRIBUTE}]`)
    getStartedButtons.forEach((gsButton) => {
      gsButton.addEventListener('click', () => {
        const planKey = 'user.signup.selectedPlan'
        const planData = JSON.parse(localStorage.getItem(planKey)) || {}
        const billingFrequency = gsButton.getAttribute('data-flow-account-frequency')
        const due = gsButton.getAttribute('data-flow-account-due')
        const monthly = gsButton.getAttribute('data-flow-account-monthly')
        const id = gsButton.getAttribute(PLAN_ID_ATTRIBUTE)
        const isMostPopular = gsButton.hasAttribute('data-flow-popular')
        const type = gsButton.getAttribute('data-flow-account-type')

        planData.billingFrequency = billingFrequency
        planData.amount = due
        planData.monthlyAmount = monthly
        planData.isMostPopular = isMostPopular
        planData.id = id
        planData.type = type
        localStorage.setItem(planKey, JSON.stringify(planData))
        // console.log("Saved selected plan with frequency:", planData);
      })
    })
  }
}

class Modal {
  constructor({ message = '', buttonText = 'Close', isError = false } = {}) {
    this.message = message
    this.buttonText = buttonText
    this.isError = isError
    this.modal = null
    this.createModal()
  }

  createModal() {
    // Create the modal overlay
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    })

    // Create the modal box
    this.modal = document.createElement('div')
    this.modal.className = 'modal'
    Object.assign(this.modal.style, {
      backgroundColor: '#fff',
      padding: '50px',
      marginBottom: '300px',
      borderRadius: '12px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      width: '98vw',
      maxWidth: '480px',
      textAlign: 'center',
      fontSize: '16px',
      border: this.isError ? '1px solid #f5c6cb' : '1px solid #ccc',
    })

    // Add the message
    const messageElem = document.createElement('p')
    messageElem.innerText = this.message
    Object.assign(messageElem.style, {
      marginBottom: '40px',
      color: this.isError ? '#721c24' : '#000',
    })
    this.modal.appendChild(messageElem)

    // Add the close button
    const closeButton = document.createElement('button')
    closeButton.innerText = this.buttonText
    Object.assign(closeButton.style, {
      padding: '12px 32px',
      backgroundColor: '#2c3238',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
    })
    closeButton.onclick = () => this.removeModal()
    this.modal.appendChild(closeButton)

    // Append the modal to the overlay
    overlay.appendChild(this.modal)
    document.body.appendChild(overlay)
  }

  removeModal() {
    if (this.modal?.parentElement) {
      this.modal.parentElement.remove()
    }
  }
}

function showModal(message, buttonText) {
  new Modal({ message, buttonText, isError: false })
}

function showErrorModal(message, buttonText) {
  new Modal({ message, buttonText, isError: true })
}

// DATA EXCHANGES
function sendSignupFunnelEvent(eventName = '', eventData = {}) {
  if (eventName === 'SignupFunnel_CheckoutComplete') {
    // GTM actually expects this event to have the following name
    eventName = 'membershipPurchasePublished'
  }

  // Google Tag Manager script is added via webflow
  // It requires this "dataLayer" object and automatically picks up events that we push to it
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event: eventName, ...eventData })
}

async function sendSurveyData(email, surveyData) {
  let responseA = {}
  let responseB = {}
  // 1. Submit email
  try {
    responseA = await fetch(`${FRUITFUL_API_BASE_URL}/signup/marketing-subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), tags: ['Self Serve'] }),
    })

    if (!responseA.ok) {
      throw new Error('"Subscribe" endpoint response was not ok:' + responseA?.statusText)
    }
    // const responseData = await responseA.json();
    // console.log(responseData);
  } catch (err) {
    console.warn(err)
    captureException({ error: err, response: responseA })
  }

  // 2. Submit survey responses
  try {
    let dataToSend = {}
    try {
      dataToSend = JSON.parse(surveyData)
    } catch (e) {}

    responseB = await fetch(`${FRUITFUL_API_BASE_URL}/survey-responses/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), responses: dataToSend }),
    })

    if (!responseB.ok) {
      throw new Error('"Survey Responses" endpoint response was not ok:' + responseB?.statusText)
    }
    // const responseData = await responseB.json();
    // console.log(responseData);
  } catch (err) {
    console.warn(err)
    captureException({ error: err, response: responseB })
  }
}

async function sendPromoCodeToValidate(promoCode, priceId, runInBackground) {
  let response = {}
  try {
    response = await fetch(`${FRUITFUL_API_BASE_URL}/signup/validate-promo-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promoCode, priceId }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error('"Promo code" endpoint response was not ok: ' + responseData.error)
    }

    return responseData
  } catch (err) {
    if (err.message?.includes('Invalid promotional code submitted')) {
      if (!runInBackground) {
        showModal('That promo code is not valid.', 'OK')
      }
      const message = `The provided promo code is not valid. Promo code: ${promoCode}`
      console.warn(message)
      captureMessage(message, 'log')
    } else {
      if (!runInBackground) {
        showErrorModal(
          'There was a problem with submitting the promo code. Please try again, or contact support@fruitful.com.',
          'Close'
        )
      }
      console.warn(err)
      captureException({ error: err, response: response })
    }
  }
  return {}
}

async function sendPromoCodeToValidateForList(promoCode, priceIds) {
  let response = {}
  try {
    response = await fetch(`${FRUITFUL_API_BASE_URL}/signup/validate-promo-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promoCode, priceIds }),
    })

    if (!response.ok) {
      throw new Error('"Promo code list" endpoint response was not ok:' + response.statusText)
    }

    const responseData = await response.json()
    return responseData
  } catch (err) {
    console.warn(err)
    captureException({ error: err, response: response })
  }
  return {}
}

async function sendStripeCheckout(
  email,
  guideSignUpId,
  firstName,
  lastName,
  membershipType,
  billingFrequency,
  couponId,
  customerId
) {
  let response = {}
  const data = {
    email: email,
    guideSignUpId: guideSignUpId,
    billingUserFirstName: firstName,
    billingUserLastName: lastName,
    membershipType: membershipType,
    billingFrequency: billingFrequency,
    couponId: couponId,
    customerId: customerId,
    trialVariant: TRIAL_VARIANT,
  }

  try {
    data.email = email.trim().toLowerCase()
    data.billingUserFirstName = capitalizeIfAllLowercase(firstName.trim())
    data.billingUserLastName = capitalizeIfAllLowercase(lastName.trim())
    data.membershipType = membershipType?.toLowerCase() ?? ''
    data.deviceId = getDistinctId()

    billingFrequency = billingFrequency?.toLowerCase() ?? ''
    if (billingFrequency === 'annual') billingFrequency = 'yearly'
    data.billingFrequency = billingFrequency

    if ((couponId ?? '').trim() === '') couponId = undefined
    data.couponId = couponId
  } catch (err) {
    console.warn(err)
    captureException({ error: err })
  }

  try {
    response = await fetch(`${FRUITFUL_API_BASE_URL}/billing/subscription/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('"Billing" endpoint response was not ok:' + response.statusText)
    }

    const responseData = await response.json()
    return responseData
  } catch (err) {
    console.warn(err)
    showErrorModal(
      'There was a problem with submitting your information. Please try again, or contact support@fruitful.com.',
      'Close'
    )
    captureException({ error: err, response: response })
  }
  return {}
}

async function cancelStripeSubscription(email, customerId, subscriptionId) {
  await fetch(`${FRUITFUL_API_BASE_URL}/billing/subscription/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      customerId,
      subscriptionId,
    }),
  })
}

// FLOW STUFF
const initFlowProgress = (next) => {
  if (!next) {
    next = document.querySelector('[data-barba="container"]')
  }
  const mainW = next
  const progressContainer = document.querySelector('.flow-top .flow-progress__container')
  const navBg = document.querySelector('.flow-top .flow-nav__bg')
  const progressEl = document.querySelector('[data-flow-progress]')
  const totalStepsEl = document.querySelector('[data-flow-steps]')
  const currentStepEl = document.querySelector('[data-flow-step]')
  const flowLink = document.querySelector('[data-flow-bottom] a')

  // Progress bar
  if (progressEl && totalStepsEl && currentStepEl) {
    const totalSteps = parseInt(totalStepsEl.dataset.flowSteps, 10)
    const currentStep = parseInt(currentStepEl.dataset.flowStep, 10)

    const updateProgress = (step) => {
      const progress = (step / totalSteps) * 100
      gsap.to(progressEl, { width: `${progress}%`, duration: 0.5, ease: 'power2.out' })
      sessionStorage.setItem('flowProgress', step)
    }

    updateProgress(currentStep)

    flowLink?.addEventListener('click', () => {
      const nextStep = Math.min(currentStep + 1, totalSteps)
      updateProgress(nextStep)
    })
  }

  // Nav visibility observer
  if (mainW) {
    const observer = new MutationObserver(() => {
      if (mainW.hasAttribute('data-flow-hide-nav')) {
        setTimeout(() => {
          progressContainer?.style.setProperty('display', 'none')
        }, 500)

        if (navBg) {
          Object.assign(navBg.style, {
            justifyContent: 'center',
            padding: '0rem',
            position: 'relative',
            display: 'flex',
          })
        }
      }

      if (mainW.hasAttribute('data-flow-show-nav')) {
        progressContainer?.style.setProperty('display', 'flex')
      }
    })

    observer.observe(mainW, {
      attributes: true,
      attributeFilter: ['data-flow-hide-nav', 'data-flow-show-nav'],
    })
  }
}

function initFlowInput(container) {
  container = container || document.querySelector('[data-barba-container]')
  const storageKey = 'flowInputData'
  const flowData = JSON.parse(localStorage.getItem(storageKey)) || {}
  const formWrap = container.querySelector('[data-form-wrap]')
  if (!formWrap) return
  const stepKey = formWrap.dataset.key
  const stepLabel = formWrap.dataset.label
  const bottomBar = container.querySelector('.flow-bottom')

  // Store current step key for GTM event tracking
  sessionStorage.setItem('currentSurveyStepKey', stepKey)

  if (!flowData[stepKey]) flowData[stepKey] = { titles: [], selections: [] }
  if (!flowData[stepKey].titles.length)
    flowData[stepKey].titles.push({
      key: stepKey,
      value: stepLabel,
    })

  function handleInputClick(event) {
    if (event.target.hasAttribute('data-name')) return

    const option = event.target.closest('[data-key][data-value]')
    if (!option) return

    const input = option.querySelector('input')
    const inputType = (input && input.type) || option.dataset.inputType || 'checkbox'

    if (inputType === 'radio') flowData[stepKey].selections = []

    const optionKey = option.dataset.key
    const optionValue = option.dataset.value
    const index = flowData[stepKey].selections.findIndex((item) => item.key === optionKey)

    if (index > -1) {
      flowData[stepKey].selections.splice(index, 1)
    } else {
      flowData[stepKey].selections.push({ key: optionKey, value: optionValue })
    }
    localStorage.setItem(storageKey, JSON.stringify(flowData))
    //console.log("Updated Flow Data:", flowData);

    // Show next button if at least 1 is clicked
    if (inputType === 'checkbox') {
      // run after the DOM settles for this click
      requestAnimationFrame(() => {
        const hasChecked = formWrap.querySelectorAll('input[type="checkbox"]:checked').length > 0
        bottomBar?.classList.toggle('is--visible', hasChecked)
      })
    }
  }

  // Store click inputs
  const items = formWrap.querySelectorAll('[data-form-input]')
  items.forEach((item) => {
    item.addEventListener('click', handleInputClick)
  })

  // Store email input
  const emailInput = container.querySelector('[data-flow-email-input]')
  const emailSubmit = container.querySelector('[data-flow-email-submit]')
  if (emailInput && emailSubmit) {
    // Listen for input changes
    emailInput.addEventListener('input', function () {
      const email = emailInput.value.trim()
      const validEmail = isEmailValid(email)
      emailSubmit.classList.toggle('is--active', validEmail)
    })

    // Listen for click event on the submit button
    emailSubmit.addEventListener('click', function () {
      handleEmailSubmit()
    })

    // Listen for 'Enter' key on the input
    emailInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault() // Prevents any default form submission behavior
        if (emailSubmit.classList.contains('is--active')) {
          emailSubmit.click() // Simulate button click
        }
      }
    })

    function handleEmailSubmit() {
      const email = emailInput.value.trim().toLowerCase()
      if (isEmailValid(email)) {
        localStorage.setItem('user.signup.email', email)
      }

      try {
        // Sentry is an error reporting tool that should be loaded via header script
        // in webflow. This should help identify the user for all of their events.
        window.Sentry?.setUser({ email: email })
      } catch (e) {
        console.warn('Sentry functional call unsuccessful:', e)
      }

      const surveyData = localStorage.getItem('flowInputData') || null
      sendSurveyData(email, surveyData)
    }
  }

  // Store guide input
  if (container.getAttribute('data-barba-namespace') === 'flow-guides') {
    const guideCards = container.querySelectorAll('.flow-guide__list .flow-guide__item')
    const guideButtons = container.querySelectorAll('[data-flow-guide]')
    guideButtons.forEach((button, element, index) => {
      button.addEventListener('click', function () {
        const activeGuide = document.querySelector('.overlay-item.is--active')
        if (!activeGuide) return
        const bioEl = activeGuide.querySelector('[data-guide-bio]')
        const bio = bioEl ? bioEl.textContent.trim() : ''
        const firstName = activeGuide.dataset.guideFirstname || ''
        const lastName = activeGuide.dataset.guideLastname || ''
        const pronouns = activeGuide.dataset.guidePronouns || ''
        const signupId = activeGuide.dataset.guideSignupid || ''
        const status = activeGuide.dataset.guideStatus || ''
        const profileImageEl = activeGuide.querySelector('[data-guide-image]')
        const profileImageUrl = profileImageEl ? profileImageEl.getAttribute('src') : ''
        const styles = Object.keys(activeGuide.dataset)
          .filter((key) => key.startsWith('guideStyle'))
          .sort(
            (a, b) =>
              parseInt(a.replace('guideStyle', ''), 10) - parseInt(b.replace('guideStyle', ''), 10)
          )
          .map((key) => activeGuide.dataset[key])
        const selectedGuide = {
          bio,
          firstName,
          lastName,
          profileImageUrl,
          pronouns,
          signupId,
          status,
          styles,
          indexOfChosenGuide:
            Array.from(guideCards).findIndex(
              (card) =>
                card.getAttribute('data-card-name')?.toLowerCase() === signupId.toLowerCase()
            ) ?? 0,
          countOfGuidesToChooseFrom: guideCards?.length,
        }
        localStorage.setItem('user.signup.selectedGuide', JSON.stringify(selectedGuide))
        //console.log("Saved selected guide:", selectedGuide);
      })
    })
  }

  // Account type selection
  const accountTypeButtons = container.querySelectorAll('[data-flow-account-type]')
  if (accountTypeButtons.length) {
    accountTypeButtons.forEach((button) => {
      button.addEventListener('click', function () {
        const planKey = 'user.signup.selectedPlan'
        const planData = JSON.parse(localStorage.getItem(planKey)) || {}
        const planType = button.getAttribute('data-flow-account-type') || button.value
        planData.type = planType
        localStorage.setItem(planKey, JSON.stringify(planData))
        //console.log("Saved selected plan:", planData);
      })
    })
  }

  // Plan frequency selection
  const planFreqButtons = container.querySelectorAll('[data-flow-account-frequency]')
  if (planFreqButtons.length) {
    planFreqButtons.forEach((button) => {
      button.addEventListener('click', function () {
        const planKey = 'user.signup.selectedPlan'
        const planData = JSON.parse(localStorage.getItem(planKey)) || {}
        const billingFrequency = button.getAttribute('data-flow-account-frequency')
        const due = button.getAttribute('data-flow-account-due')
        const monthly = button.getAttribute('data-flow-account-monthly')
        const id = button.getAttribute(PLAN_ID_ATTRIBUTE)
        const isMostPopular = button.hasAttribute('data-flow-popular')

        planData.billingFrequency = billingFrequency
        planData.amount = due
        planData.monthlyAmount = monthly
        planData.isMostPopular = isMostPopular
        planData.id = id
        localStorage.setItem(planKey, JSON.stringify(planData))
        //console.log("Saved selected plan with frequency:", planData);
      })
    })
  }
}

function initAutoAppliedPromo() {
  const promoCodeInUrl = new URLSearchParams(window.location.search).get('promo') ?? ''
  const promoCodeInStorage = localStorage.getItem('user.signup.appliedPromoCode') ?? ''

  if (promoCodeInUrl !== '' && promoCodeInUrl !== promoCodeInStorage.trim()) {
    localStorage.setItem('user.signup.appliedPromoCode', promoCodeInUrl)
  }
}

function initFlowPreCheckoutSteps(next) {
  const container = document.querySelector('[data-barba-container]') || document

  const guideData = JSON.parse(localStorage.getItem('user.signup.selectedGuide'))

  const names = container.querySelectorAll('[data-guide-name]')
  names.forEach((name) => {
    name.textContent = guideData.firstName
  })
}

function initFlowCheckoutSurveryInput(next) {
  const container = document.querySelector('[data-barba-container]') || document

  const email = (localStorage.getItem('user.signup.email') ?? '').trim().toLowerCase()

  const emailInput = next.querySelector('#email-2')

  if (emailInput) {
    emailInput.value = email
    emailInput.addEventListener('blur', (e) => {
      const updatedEmail = (e.target?.value ?? '').trim().toLowerCase()
      if (!!updatedEmail) {
        localStorage.setItem('user.signup.email', updatedEmail)
      }
    })
  }

  const planData = JSON.parse(localStorage.getItem('user.signup.selectedPlan'))
  const guideData = JSON.parse(localStorage.getItem('user.signup.selectedGuide'))

  if (!guideData) {
    //captureMessage("Selected Guide not found - going back to email input step");
    window.location.replace('/sign-up/email')
    return
  }

  /*
  if (!planData) {
    captureMessage("Selected Plan not found - going back to email input step");
    window.location.replace('/sign-up/email');
    return;
  }
  */

  const cImg = container.querySelectorAll('[data-c-img]')
  if (cImg && guideData.profileImageUrl) {
    cImg.forEach((img) => {
      img.setAttribute('src', guideData.profileImageUrl)
    })
  }

  const cName = container.querySelectorAll('[data-c-name]')
  if (cName && guideData.firstName) {
    cName.forEach((name) => {
      name.textContent = guideData.firstName
    })
  }

  const cPlan = container.querySelector('[data-c-plan]')
  if (cPlan && planData.type && planData.billingFrequency) {
    // Map billingFrequency values to singular form for display
    const frequencyMap = {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Annual',
      annual: 'Annual',
    }
    const freqWord =
      frequencyMap[planData.billingFrequency.toLowerCase()] || planData.billingFrequency
    cPlan.textContent = `${capitalize(planData.type)} ${freqWord} Membership`
  }

  const cFrequency = container.querySelector('[data-c-frequency]')
  if (cFrequency && planData.billingFrequency) {
    // Map billingFrequency values to singular form for display
    const frequencyMap = {
      monthly: 'month',
      quarterly: 'quarter',
      yearly: 'year',
      annual: 'year',
    }
    const freqWord =
      frequencyMap[planData.billingFrequency.toLowerCase()] || planData.billingFrequency
    cFrequency.textContent = `your first ${freqWord}`
  }

  container.querySelectorAll('[data-c-due].p-reg').forEach((cDue) => {
    if (cDue && planData.amount) {
      cDue.textContent = '$' + planData.amount
    }
    if (cDue && isTrialPlan(planData)) {
      if (isFreeTrialPlan(planData)) {
        cDue.textContent = '$0' // $0 because of free trial for everyone selecting these plan types
      } else {
        cDue.textContent = '$' + TRIAL_PRICE
      }
    }
  })

  const cDueAfterTrial = container.querySelector('[data-c-billing-info]')?.parentNode
  if (cDueAfterTrial) {
    const isFreeTrial = isFreeTrialPlan(planData)
    // Map billingFrequency values to singular form for display
    const frequencyMap = {
      monthly: 'month',
      quarterly: 'quarter',
      yearly: 'year',
      annual: 'year',
    }
    const freqWord =
      frequencyMap[planData.billingFrequency.toLowerCase()] || planData.billingFrequency
    const billingInfoEl = document.createElement('span')
    billingInfoEl.setAttribute('data-c-billing-info', '')
    let afterTrialText
    if (freqWord === 'quarter') {
      billingInfoEl.textContent = `$${planData.amount} charged every 3 months`
      afterTrialText = document.createTextNode(
        `, starting after your ${isFreeTrial ? 'trial' : 'first month'}`
      )
    } else {
      billingInfoEl.textContent = `$${planData.amount}/${freqWord}`
      afterTrialText = document.createTextNode(
        ` after your ${isFreeTrial ? 'trial ends' : 'first month'}`
      )
    }
    cDueAfterTrial.innerHTML = ''
    cDueAfterTrial.appendChild(billingInfoEl)
    cDueAfterTrial.appendChild(afterTrialText)
  }

  // Plan benefit for 'plus' only
  const planBenefitPlus = container.querySelector('[data-c-plus-benefit]')
  if (planBenefitPlus) {
    if (planData.type === 'plus') {
      gsap.set(planBenefitPlus, { display: 'flex' })
    } else {
      gsap.set(planBenefitPlus, { display: 'none' })
    }
  }

  //console.log("Checkout info updated with guide and plan data:", { guideData, planData });
}

async function initFlowCheckout(next) {
  // NOTE!: This is for non-Stripe code. Any code that depends on Stripe
  // must be in `initStripe()`, which we ensure is not executed until the
  // Stripe script has loaded.

  // Utility functions
  const centsToDollars = (cents) => cents / 100
  const roundToTwoDecimals = (num) => Math.round(num * 100) / 100

  sendSignupFunnelEvent('SignupFunnel_CheckoutInit')

  // Retrieve selected plan details
  const selectedPlan = JSON.parse(localStorage.getItem('user.signup.selectedPlan'))

  const standardAmounts = {
    amountPerBillingFrequency: selectedPlan?.amount,
    amountPerBillingFrequencyWithPromo: null,
    amountDueTodayWithPromo: null,
  }

  // Promo elements and initial setup
  const promoInput = next.querySelector('#promo-input')
  const promoSubmit = next.querySelector('#promo-submit')

  function updateCheckoutPageWithAppliedPromo(appliedPromo) {
    const { coupon, code } = appliedPromo

    if (!coupon) {
      return
    }

    // Calculate discounted amounts
    let amountMinusPromo = standardAmounts.amountPerBillingFrequency

    if (coupon.amountOff !== null) {
      amountMinusPromo -= centsToDollars(coupon.amountOff)
      if (amountMinusPromo < 0) {
        amountMinusPromo = 0
      }
    }

    if (coupon.percentOff !== null) {
      amountMinusPromo -=
        standardAmounts.amountPerBillingFrequency * roundToTwoDecimals(coupon.percentOff / 100)
      if (amountMinusPromo < 0) {
        amountMinusPromo = 0
      }
    }

    amountMinusPromo = roundToTwoDecimals(amountMinusPromo)

    // Update standardAmounts based on coupon duration
    if (coupon.duration === 'once') {
      standardAmounts.amountDueTodayWithPromo = amountMinusPromo
    } else if (coupon.duration === 'forever') {
      standardAmounts.amountPerBillingFrequencyWithPromo = amountMinusPromo
      standardAmounts.amountDueTodayWithPromo = amountMinusPromo
    } else if (coupon.duration === 'repeating') {
      const err = {
        name: 'NotSupported',
        message: "Coupons with a 'repeating' frequency are not currently supported",
      }
      console.warn(err)
      captureException(err)
      standardAmounts.amountDueTodayWithPromo = amountMinusPromo
    }

    // Update UI Elements
    const promoInputWrap = next.querySelector('[data-promo="input"]')
    const promoDisplayWrap = next.querySelector('[data-promo="wrap"]')
    const promoCodeEl = next.querySelector('[data-promo="code"]')
    const promoMessageEl = next.querySelector('[data-promo="message"]')

    // Hide input, show promo display
    promoInputWrap.style.display = 'none'
    promoDisplayWrap.style.display = 'flex'

    // Set promo code text
    promoCodeEl.textContent = code

    // Set promo message text based on coupon duration
    let promoMessageText = ''
    const messageTextPrefix =
      coupon.percentOff !== null ? `${coupon.percentOff}%` : `$${centsToDollars(coupon.amountOff)}`

    if (coupon.duration === 'once') {
      promoMessageText = `${messageTextPrefix} off your first payment`
    } else if (coupon.duration === 'forever') {
      promoMessageText = `${messageTextPrefix} off forever`
    } else if (coupon.duration === 'repeating') {
      promoMessageText = `${messageTextPrefix} off for your first ${coupon.durationInMonths} months`
    }

    promoMessageEl.textContent = promoMessageText

    // Update displayed 'Due today' if not a trial plan type
    let originalAmountEl
    const amountDisplayEl = next.querySelector('[data-c-due]')
    if (!isTrialPlan(selectedPlan)) {
      if (amountDisplayEl) {
        // Clone and display original price
        originalAmountEl = amountDisplayEl.cloneNode(true)
        originalAmountEl.textContent = `$${standardAmounts.amountPerBillingFrequency}`
        originalAmountEl.style.color = 'var(--color--grey-800)'
        originalAmountEl.style.textDecoration = 'line-through'
        originalAmountEl.removeAttribute('data-c-due')
        amountDisplayEl.parentNode.insertBefore(originalAmountEl, amountDisplayEl)
        // Display discounted price
        amountDisplayEl.textContent = `$${standardAmounts.amountDueTodayWithPromo}`
      }
    }

    // Update the text like "$415 per quarter after your trial ends" or "$415 per quarter after your first month"
    if (isTrialPlan(selectedPlan)) {
      const isFreeTrial = isFreeTrialPlan(selectedPlan)
      const cDueAfterTrial = next.querySelector('[data-c-billing-info]').parentNode
      if (cDueAfterTrial) {
        // Map billingFrequency values to singular form for display
        const frequencyMap = {
          monthly: 'month',
          quarterly: 'quarter',
          yearly: 'year',
          annual: 'year',
        }
        const freqWord =
          frequencyMap[selectedPlan.billingFrequency.toLowerCase()] || selectedPlan.billingFrequency

        if (coupon.duration === 'forever') {
          // e.g. for a '$10 of forever' promo: "~~$48~~ $38 per month after your trial ends"
          const afterTrialOriginalAmountEl = document.createElement('span')
          afterTrialOriginalAmountEl.textContent = `$${standardAmounts.amountPerBillingFrequency}`
          afterTrialOriginalAmountEl.style.color = 'var(--color--grey-700)'
          afterTrialOriginalAmountEl.style.textDecoration = 'line-through'
          const billingInfoEl = document.createElement('span')
          billingInfoEl.setAttribute('data-c-billing-info', '')
          let afterTrialText
          if (freqWord === 'quarter') {
            billingInfoEl.textContent = ` $${standardAmounts.amountPerBillingFrequencyWithPromo} charged every 3 months`
            afterTrialText = document.createTextNode(
              `, starting after your ${isFreeTrial ? 'trial' : 'first month'}`
            )
          } else {
            billingInfoEl.textContent = ` $${standardAmounts.amountPerBillingFrequencyWithPromo} per ${freqWord}`
            afterTrialText = document.createTextNode(
              ` after your ${isFreeTrial ? 'trial ends' : 'first month'}`
            )
          }
          cDueAfterTrial.innerHTML = ''
          cDueAfterTrial.appendChild(afterTrialOriginalAmountEl)
          cDueAfterTrial.appendChild(billingInfoEl)
          cDueAfterTrial.appendChild(afterTrialText)
        } else if (coupon.duration === 'once') {
          // e.g. for a '$10 off once' promo: "After your trial, ~~$48~~ $38 for the first month, then $48 per month
          const afterTrialText = document.createTextNode(
            `After your ${isFreeTrial ? 'trial' : 'first month'}, `
          )
          const afterTrialOriginalAmountEl = document.createElement('span')
          afterTrialOriginalAmountEl.textContent = `$${standardAmounts.amountPerBillingFrequency}`
          afterTrialOriginalAmountEl.style.color = 'var(--color--grey-700)'
          afterTrialOriginalAmountEl.style.textDecoration = 'line-through'
          const billingInfoEl = document.createElement('span')
          billingInfoEl.setAttribute('data-c-billing-info', '')
          if (freqWord === 'quarter') {
            billingInfoEl.textContent = ` $${standardAmounts.amountDueTodayWithPromo} charged for the first 3 months, then $${standardAmounts.amountPerBillingFrequency} every 3 months`
          } else {
            billingInfoEl.textContent = ` $${standardAmounts.amountDueTodayWithPromo} for the ${freqWord == 'month' ? 'next' : 'first'} ${freqWord}, then $${standardAmounts.amountPerBillingFrequency} per ${freqWord}`
          }
          cDueAfterTrial.innerHTML = ''
          cDueAfterTrial.appendChild(afterTrialText)
          cDueAfterTrial.appendChild(afterTrialOriginalAmountEl)
          cDueAfterTrial.appendChild(billingInfoEl)
        }
      }
    }

    // Removal of promo code
    const removeButton = next.querySelector('[data-promo="remove"]')
    removeButton.addEventListener('click', (e) => {
      e.preventDefault() // prevent webflow form from submitting

      // Revert promo input and display
      promoInputWrap.style.display = 'block'
      promoDisplayWrap.style.display = 'none'
      promoInput.value = ''
      gsap.set(promoSubmit, { autoAlpha: 0 })

      // Undo the displayed price changes if not a trial plan
      if (!isTrialPlan(selectedPlan)) {
        if (originalAmountEl) originalAmountEl.remove()
        if (amountDisplayEl)
          amountDisplayEl.textContent = `$${standardAmounts.amountPerBillingFrequency}`
      }

      // Undo changes to text like "$415 per quarter after your trial ends" or "$415 per quarter after your first month"
      if (isTrialPlan(selectedPlan)) {
        const isFreeTrial = isFreeTrialPlan(selectedPlan)
        const cDueAfterTrial = next.querySelector('[data-c-billing-info]').parentNode
        if (cDueAfterTrial) {
          // Map billingFrequency values to singular form for display
          const frequencyMap = {
            monthly: 'month',
            quarterly: 'quarter',
            yearly: 'year',
            annual: 'year',
          }
          const freqWord =
            frequencyMap[selectedPlan.billingFrequency.toLowerCase()] ||
            selectedPlan.billingFrequency
          const billingInfoEl = document.createElement('span')
          billingInfoEl.setAttribute('data-c-billing-info', '')
          let afterTrialText
          if (freqWord === 'quarter') {
            billingInfoEl.textContent = `$${selectedPlan.amount} charged every 3 months`
            afterTrialText = document.createTextNode(
              `, starting after your ${isFreeTrial ? 'trial' : 'first month'}`
            )
          } else {
            billingInfoEl.textContent = `$${selectedPlan.amount}/${freqWord}`
            afterTrialText = document.createTextNode(
              ` after your ${isFreeTrial ? 'trial ends' : 'first month'}`
            )
          }
          cDueAfterTrial.innerHTML = ''
          cDueAfterTrial.appendChild(billingInfoEl)
          cDueAfterTrial.appendChild(afterTrialText)
        }
      }

      // Reset promo amounts
      standardAmounts.amountDueTodayWithPromo = null
      standardAmounts.amountPerBillingFrequencyWithPromo = null

      try {
        localStorage.removeItem('user.signup.appliedPromoCode')
        localStorage.removeItem('user.signup.appliedCouponId')
      } catch (e) {
        // do nothing
      }
    })
  }

  async function validateAndApplyPromo(promoCode, planType, planId, runInBackground) {
    promoCode = getPromoCodeForPlanType(promoCode, planType)

    const appliedPromo = await sendPromoCodeToValidate(promoCode.trim(), planId, runInBackground)
    localStorage.setItem('user.signup.appliedPromoCode', appliedPromo?.code ?? '')
    // also store this for use with stripe submission
    localStorage.setItem('user.signup.appliedCouponId', appliedPromo?.coupon?.id ?? '')

    updateCheckoutPageWithAppliedPromo(appliedPromo)
  }

  const appliedPromoCode = (localStorage.getItem('user.signup.appliedPromoCode') ?? '').trim()
  if (appliedPromoCode !== '') {
    await validateAndApplyPromo(appliedPromoCode, selectedPlan.type, selectedPlan.id, true)
  }

  gsap.set(promoSubmit, { autoAlpha: 0 })

  promoInput.addEventListener('input', () => {
    gsap.to(promoSubmit, {
      autoAlpha: promoInput.value.trim() !== '' ? 1 : 0,
      duration: 0.2,
    })
  })

  // Promo submit button click handler
  promoSubmit.addEventListener('click', async (e) => {
    e.preventDefault() // prevent webflow form
    const promoInputValue = promoInput.value.trim()
    if (promoInputValue === '') return

    await validateAndApplyPromo(promoInputValue, selectedPlan.type, selectedPlan.id, false)
  })
}

const initCheckoutPendingPage = (next) => {
  // First, read everything from URL
  const params = new URLSearchParams(window.location.search)

  const isTesting = params.get('testing') === 'true'

  const customerId = params.get('customerId')
  const email = params.get('email')
  const guideSignUpId = params.get('guideSignUpId')
  const hasPartner = params.get('hasPartner') === 'true'
  const plan = params.get('plan')
  const referralCode = localStorage.getItem('referralCode')

  // Now you can reference them safely
  const purchasePublishedStorageKey = `user.${email}.signup.purchasePublished`

  const storedSelectedPlan = JSON.parse(localStorage.getItem('user.signup.selectedPlan') ?? '{}')
  const appliedPromoCode = localStorage.getItem('user.signup.appliedPromoCode') ?? ''
  const appliedCouponId =
    appliedPromoCode.trim() !== ''
      ? (localStorage.getItem('user.signup.appliedCouponId') ?? '')
      : undefined

  const eventData = {
    stripeCustomerId: customerId,
    membershipEmail: email,
    membershipPlanId: storedSelectedPlan.id,
    membershipPlanType: storedSelectedPlan.type,
    membershipPlanAmount: storedSelectedPlan.amount,
    membershipPlanBillingFrequency: storedSelectedPlan.billingFrequency,
    appliedPromoCode: appliedCouponId,
  }

  if (!isTesting) {
    sendSignupFunnelEvent('SignupFunnel_CheckoutComplete', eventData)
    console.log('signup complete')
  }

  localStorage.setItem(
    purchasePublishedStorageKey,
    JSON.stringify({
      ...eventData,
      customerId,
      guideSignUpId,
    })
  )

  // Send "How did you hear" survey event when clicking a radio button
  const formWrap = next.querySelector('[data-form-wrap]')
  next.querySelectorAll('[data-flow-radio]').forEach((radio) => {
    radio.addEventListener('click', () => {
      const question = formWrap?.dataset.label || ''
      const answer = radio.dataset.value || ''
      if (answer) {
        sendSignupFunnelEvent('SignupFunnel_Survey_HowDidYouHear', {
          surveyHowDidYouHearQuestion: question,
          surveyHowDidYouHearAnswer: answer,
        })
      }

      setTimeout(() => {
        window.location.href = `${FRUITFUL_APP_BASE_URL}/start-membership?${params.toString()}${referralCode ? `&referralCode=${referralCode}` : ''}`
      }, 500)
    })
  })

  // Redirect button handler
  next.querySelector('[data-checkout-pending-btn]')?.addEventListener('click', () => {})
}

async function initStripe() {
  // If we're not on the Checkout page, then stop executing here
  if (!window.location.pathname.endsWith('/checkout')) {
    window.stripeInitialized = false
    return
  }

  if (!window.Stripe) {
    captureException('Stripe not defined in initStripe')
    showErrorModal(
      'The page was unable to load the checkout form. Please refresh to try again, or contact support@fruitful.com.'
    )
    return
  }

  const stripe = Stripe(STRIPE_KEY)

  // Retrieve selected guide details
  const selectedGuide = JSON.parse(localStorage.getItem('user.signup.selectedGuide') ?? '{}')

  // Retrieve selected plan details
  const selectedPlan = JSON.parse(localStorage.getItem('user.signup.selectedPlan'))

  const appearance = {
    variables: {
      fontFamily: '"PP Neue Montreal", "Helvetica Neue", sans-serif',
      fontSizeBase: '16px',
      spacingUnit: '5px',
      borderRadius: '12px',
      colorText: '#000',
      colorPrimary: '#000',
      focusBoxShadow: 'none',
      focusOutline: 'black',
      // Safari's default 'font-synthesis-weight' handling makes weights 600+ in our font face
      // look too bold. We can't change the font-synthesis-weight css prop through this API, and we
      // can't change it via CSS because this is in an iframe. So we can just override these to 500.
      fontWeightMedium: 500,
      fontWeightBold: 500,
    },
    rules: {
      '.Input': {
        border: '1px solid #7A828F',
        boxShadow: 'none',
        fontWeight: '500',
      },
      '.Input:focus': {
        borderColor: 'black',
        boxShadow: 'none',
      },
      '.Input::placeholder': {
        color: '#7A828F',
      },
    },
  }

  const fonts = [
    {
      family: 'PP Neue Montreal',
      src: 'url(https://d1pwidzl9kib4u.cloudfront.net/fonts/neue_montreal/WEB/PPNeueMontreal-Variable.woff2)',
    },
  ]

  const elementsOptions = {
    appearance: appearance,
    fonts: fonts,
    mode: 'subscription',
    currency: 'usd',
    // Stripe expects amount to conform to its data model, where this value would be in cents not dollars
    // Since we already transform the amount from cents to dollars, we need to reverse that here
    amount: selectedPlan
      ? (isTrialPlan(selectedPlan) ? TRIAL_PRICE : selectedPlan.amount) * 100
      : 0,
  }

  const stripeElements = stripe.elements(elementsOptions)

  const addressElementOptions = {
    mode: 'billing',
    allowedCountries: ['US'],
    autocomplete: { mode: 'automatic' },
    display: { name: 'split' },
  }
  const addressElement = stripeElements.create('address', addressElementOptions)
  addressElement.mount('#address-el')

  const paymentElementOptions = {
    business: {
      name: 'Fruitful',
    },
  }
  const paymentElement = stripeElements.create('payment', paymentElementOptions)
  paymentElement.mount('#payment-el')

  const onCheckoutSubmitClick = async (e) => {
    e.preventDefault() // prevent webflow form

    sendSignupFunnelEvent('SignupFunnel_CheckoutSubmit')

    const email = (localStorage.getItem('user.signup.email') ?? '').trim().toLowerCase()
    if (!isEmailValid(email)) {
      showErrorModal('Please provide a valid email address.', 'OK')
      return
    }

    setLoadingState(true)

    stripeElements.getElement('payment')?.update({
      defaultValues: {
        billingDetails: {
          email: email,
        },
      },
    })

    // Before confirming a payment, call elements.submit() to validate the form fields
    // This method returns a Promise which resolves with a result object. If this method succeeds,
    // the result object will be empty. If this method fails, the result object will contain a
    // localized error message in the error.message field.
    const { error } = await stripeElements.submit()
    if (error != null) {
      setLoadingState(false)
      console.warn(error)
      captureException(new Error(`Stripe submit() error: ${error.type} ${error.code}`))
      showErrorModal('Please check your billing and payment information.', 'OK')
      return
    } else {
      const guideSignUpId = selectedGuide.signupId

      const customerName = { first: '', last: '' }
      if (stripeElements) {
        const { value } = await stripeElements.getElement('address')?.getValue()
        customerName.first = capitalizeIfAllLowercase(value.firstName.trim())
        customerName.last = capitalizeIfAllLowercase(value.lastName.trim())
      }

      const email = (localStorage.getItem('user.signup.email') ?? '').trim().toLowerCase()
      const customerIdStorageKey = `user.${email}.signup.customerId`
      const stripeCustomerId = localStorage.getItem(customerIdStorageKey) ?? undefined
      const appliedPromoCode = localStorage.getItem('user.signup.appliedPromoCode') ?? ''
      const appliedCouponId =
        appliedPromoCode.trim() !== ''
          ? (localStorage.getItem('user.signup.appliedCouponId') ?? '')
          : undefined

      const checkoutResponse = await sendStripeCheckout(
        email,
        guideSignUpId,
        customerName.first,
        customerName.last,
        selectedPlan.type,
        selectedPlan.billingFrequency,
        appliedCouponId,
        stripeCustomerId
      )

      const { clientSecret, confirmMethod, customerId, subscriptionId } = checkoutResponse
      if (customerId != null) {
        localStorage.setItem(customerIdStorageKey, customerId)
      }

      if (clientSecret != null && confirmMethod != null) {
        // Firing the purchase event here, but ensuring we only do that once for a given email address
        const purchasePublishedStorageKey = `user.${email}.signup.purchasePublished`
        if (!localStorage.getItem(purchasePublishedStorageKey)) {
          const eventData = {
            membershipEmail: email,
            membershipPlanId: selectedPlan.id,
            membershipPlanType: selectedPlan.type,
            membershipPlanAmount: selectedPlan.amount,
            membershipPlanBillingFrequency: selectedPlan.billingFrequency,
            appliedPromoCode: appliedCouponId,
          }
          localStorage.setItem(
            purchasePublishedStorageKey,
            JSON.stringify({
              ...eventData,
              customerId: customerId,
              customerFirstName: customerName.first,
              customerLastName: customerName.last,
              guideSignUpId: guideSignUpId,
            })
          )
        }

        // we need to call a different method to wrap up the payment depending on the invoice total
        const stripeConfirm =
          confirmMethod === 'setup'
            ? stripe.confirmSetup.bind(this)
            : stripe.confirmPayment.bind(this)

        const returnUrlQueryParams = {
          customerId: customerId,
          email: email,
          guideSignUpId: guideSignUpId,
          hasPartner: (selectedPlan.type ?? '').toLowerCase() === 'joint' ? 'true' : 'false',
          plan: (selectedPlan.type ?? '').toLowerCase(),
        }

        // Important!: If stripe checkout is successful, stripe will automatically redirect to the
        // provided 'return_url'. Any code expected to run after this will not be executed in successful cases.
        const { error } = await stripeConfirm({
          clientSecret,
          elements: stripeElements,
          confirmParams: {
            return_url: `${FRUITFUL_APP_BASE_URL}/sign-up/checkout-pending?${toQueryString(returnUrlQueryParams)}`,
          },
        })
        if (error != null) {
          setLoadingState(false)
          showErrorModal(
            'There was a problem with submitting your payment. Please try again, or contact support@fruitful.com.',
            'Close'
          )
          console.warn(error)
          captureException(error)

          // Immediately cancel subscriptions where $0 is due and setup intent fails
          if (subscriptionId != null && confirmMethod === 'setup') {
            await cancelStripeSubscription(email, customerId, subscriptionId)
          }
        }
      } else {
        setLoadingState(false)
        const message = `Did not receive clientSecret or confirmMethod from subscription creation - 
            email: ${email}, 
            customerId: ${customerId}, 
            clientSecret: ${!!clientSecret}, 
            confirmMethod: ${!!confirmMethod}`
        console.warn(message)
        captureException({ message })
      }
    }
  }
  document.querySelector('#flow-checkout').addEventListener('click', onCheckoutSubmitClick)
  document.querySelector('#flow-checkout-mobile').addEventListener('click', onCheckoutSubmitClick)
}

async function initFlowMembershipSelection(next) {
  const container = document.querySelector('[data-barba-container]') || document
  const planLists = container.querySelectorAll('[data-membership]')

  const selectedPlan = JSON.parse(localStorage.getItem('user.signup.selectedPlan'))

  if (!selectedPlan) {
    captureMessage(
      'Required selectedPlan not found on membership-billing page - going back to /sign-up/membership-type'
    )
    window.location.href = '/sign-up/membership-type'
    return
  }

  const selectedAccountType = selectedPlan.type
  const planIds = []

  planLists.forEach((planList) => {
    if (planList.getAttribute('data-membership') !== selectedAccountType) {
      planList.remove()
    } else {
      const planElements = planList.querySelectorAll(`[${PLAN_ID_ATTRIBUTE}]`) ?? []
      planElements.forEach((p) => {
        planIds.push(p.getAttribute(PLAN_ID_ATTRIBUTE))
      })
    }
  })

  function updateMembershipPageWithAppliedPromos(appliedPromos) {
    try {
      if (appliedPromos?.[0]?.coupon?.id != null) {
        const promoNoticeElement = container.querySelector('[data-flow-promo-notice]')
        if (promoNoticeElement?.style) {
          promoNoticeElement.style.visibility = 'visible'
          promoNoticeElement.style.display = 'flex'
        }
      }
    } catch (err) {
      err.msg = 'Could not update page to reflect applied promo'
      console.warn(err)
      captureException(err)
    }
  }

  async function validateAndApplyPromos(promoCode, planType, planIds) {
    promoCode = (promoCode ?? '').trim()
    promoCode = getPromoCodeForPlanType(promoCode, planType)
    localStorage.setItem('user.signup.appliedPromoCode', promoCode)

    const appliedPromos = await sendPromoCodeToValidateForList(promoCode, planIds ?? [])
    updateMembershipPageWithAppliedPromos(appliedPromos)
  }

  const appliedPromoCode = (localStorage.getItem('user.signup.appliedPromoCode') ?? '').trim()
  if (appliedPromoCode !== '') {
    await validateAndApplyPromos(appliedPromoCode, selectedAccountType, planIds)
  }
}

const getPromoCodeForPlanType = (promoCode, planType) => {
  if (promoCode === BASE_FREE_MONTH_PROMO_CODE) {
    promoCode =
      planType.toLowerCase() === 'solo' ? SOLO_FREE_MONTH_PROMO_CODE : JOINT_FREE_MONTH_PROMO_CODE
  }
  return promoCode
}

//
//
// INIT
function initGeneral(container) {
  initLogger()
  initCursorAndButtons(container)
  initFlowProgress(container)
  updateTodayElements(container)
  initFlowInput(container)

  initToolTips()
  initCardsHover()
  initGuidesOverlay(container)
  initVideoControls(container)
  initVideoOnHover()
  initCustomButtons(container)
  initSheetOverlay(container)
  initAutoAppliedPromo()
  initDropdown(container)
  if (window.innerWidth < 768) {
    initMobileSliders()
    console.log('go')
  }
  initReferralLogic()
  const openingHours = initOpeningHours()

  initCopyToClipboard()

  initSignupSlider(container)
}

barba.hooks.after((data) => {
  $(data.next.container).removeClass('fixed')
  $('.is--transitioning').removeClass('is--transitioning')
  resetWebflow(data)
  ScrollTrigger.refresh()
})

barba.hooks.enter((data) => {
  $(data.next.container).addClass('fixed')
})

barba.hooks.leave((data) => {
  const eventName = data.current?.container?.getAttribute('data-page-event') ?? ''
  let eventData = {}
  const email = (localStorage.getItem('user.signup.email') ?? '').trim().toLowerCase()

  if (eventName === 'SignupFunnel_Survey_EmailSubmit') {
    eventData = {
      email: email,
    }
  }

  if (eventName === 'SignupFunnel_GuideSubmit') {
    const selectedGuideData = JSON.parse(localStorage.getItem('user.signup.selectedGuide') ?? '{}')
    eventData = {
      guideSignupId: selectedGuideData.signupId,
      indexOfChosenGuide: selectedGuideData.indexOfChosenGuide,
      countOfGuidesToChooseFrom: selectedGuideData.countOfGuidesToChooseFrom,
    }
  }

  if (eventName === 'SignupFunnel_MembershipSubmit') {
    const planData = JSON.parse(localStorage.getItem('user.signup.selectedPlan') ?? '{}')
    eventData = {
      planId: planData.id,
      planType: planData.type,
      planAmount: planData.amount,
      planBillingFrequency: planData.billingFrequency,
    }
  }

  // Handle all survey question events (each question = its own event with specific variable names)
  const surveyEventMapping = {
    SignupFunnel_Survey_IntentSubmit: {
      questionKey: 'surveyIntentQuestion',
      answerKey: 'surveyIntentAnswer',
    },
    SignupFunnel_Survey_GoalsSubmit: {
      questionKey: 'surveyGoalsQuestion',
      answerKey: 'surveyGoalsAnswer',
    },
    SignupFunnel_Survey_StyleSubmit: {
      questionKey: 'surveyStyleQuestion',
      answerKey: 'surveyStyleAnswer',
    },
  }

  if (surveyEventMapping[eventName]) {
    const currentStepKey = sessionStorage.getItem('currentSurveyStepKey')
    const surveyData = JSON.parse(localStorage.getItem('flowInputData') ?? '{}')
    const currentQuestion = surveyData[currentStepKey]
    if (currentQuestion) {
      const question = currentQuestion.titles?.[0]?.value || ''
      const answers = (currentQuestion.selections || []).map((s) => s.value)
      const { questionKey, answerKey } = surveyEventMapping[eventName]
      eventData = {
        [questionKey]: question,
        [answerKey]: answers,
      }
    }
  }

  sendSignupFunnelEvent(eventName, eventData)
})

barba.init({
  debug: true,
  preventRunning: true,
  prevent: function ({ el }) {
    return el.hasAttribute('data-barba-prevent')
  },
  transitions: [
    {
      name: 'default',
      sync: false,
      leave(data) {
        const nextName = data.next.namespace
        const currentName = data.current.container.getAttribute('data-barba-namespace')

        const tl = gsap.timeline({
          onComplete: () => {
            data.current.container.remove()
          },
        })
        tl.to(data.current.container, { autoAlpha: 0, duration: 0.5 })
        return tl
      },
      enter(data) {
        const tl = gsap.timeline()
        tl.from(data.next.container, {
          autoAlpha: 0,
          duration: 0.5,
        })
      },
      once(data) {
        sendSignupFunnelEvent('SignupFunnel_Init')
        initHideNavOnScroll()
      },
    },
  ],
  views: [
    {
      namespace: 'flow-default',
      afterEnter(data) {
        const next = data.next.container
        const name = data.next.namespace
        transitionIn(next, name)
        initGeneral(next)
      },
    },
    {
      namespace: 'flow-membership', // Membership type selection
      afterEnter(data) {
        const next = data.next.container
        const name = data.next.namespace
        transitionIn(next, name)
        initGeneral(next)
        initFlowMembershipSelection(next)
      },
    },
    {
      namespace: 'flow-testimonials', // Testimonial Section
      afterEnter(data) {
        const next = data.next.container
        const name = data.next.namespace
        transitionIn(next, name)
        initGeneral(next)
        initMemberStories()
      },
    },
    {
      namespace: 'flow-pricing', // New pricing page
      afterEnter(data) {
        const next = data.next.container
        const name = data.next.namespace
        transitionIn(next, name)
        initGeneral(next)
        initFlowCheckoutSurveryInput(next)
        initPriceCards(next)
      },
    },
    {
      namespace: 'flow-checkout',
      afterEnter(data) {
        const next = data.next.container
        const name = data.next.namespace
        transitionIn(next, name)
        initGeneral(next)
        initFlowCheckoutSurveryInput(next)
        initFlowCheckout(next)
        initSheetOverlay(next)

        // Note: there is also an `initStripe()` function that holds
        // all Stripe-dependent code. This function may be called on the "load"
        // event of the Stripe script (see the <script> element in <head>) or
        // otherwise here.
        if (window.stripeLoaded === true && !window.stripeInitialized) {
          initStripe()
        }
      },
    },
    {
      namespace: 'flow-checkout-pending',
      afterEnter(data) {
        const next = data.next.container
        const name = data.next.namespace
        transitionIn(next, name)
        initGeneral(next)
        initCheckoutPendingPage(next)
      },
    },
    {
      namespace: 'flow-guides', // Guide selection page
      afterEnter(data) {
        const next = data.next.container
        const name = data.next.namespace
        transitionIn(next, name)
        initGeneral(next)
      },
    },
    {
      namespace: 'flow-steps', // Page prior to checkout
      afterEnter(data) {
        const next = data.next.container
        const name = data.next.namespace
        transitionIn(next, name)
        initGeneral(next)
        initFlowPreCheckoutSteps(next)
      },
    },
  ],
})

function checkEmailTypo(email) {
  const EMAIL_TLD_TYPOS = {
    '.con': '.com',
    '.cmo': '.com',
    '.om': '.com',
    '.cm': '.com',
  }

  const EMAIL_PROVIDER_TYPOS = {
    'ao.': 'aol.',
    'aoll.': 'aol.',
    'oal.': 'aol.',
    'comast.': 'comcast.',
    'comcat.': 'comcast.',
    'comcst.': 'comcast.',
    'cocast.': 'comcast.',
    'comcats.': 'comcast.',
    'gmal.': 'gmail.',
    'gmil.': 'gmail.',
    'gmai.': 'gmail.',
    'gmial.': 'gmail.',
    'gamil.': 'gmail.',
    'gmaiil.': 'gmail.',
    'gmaill.': 'gmail.',
    'hotmal.': 'hotmail.',
    'hotmil.': 'hotmail.',
    'hotmai.': 'hotmail.',
    'homail.': 'hotmail.',
    'hotnail.': 'hotmail.',
    'hotmial.': 'hotmail.',
    'hotamil.': 'hotmail.',
    'homtail.': 'hotmail.',
    'iclod.': 'icloud.',
    'iclud.': 'icloud.',
    'iclou.': 'icloud.',
    'icould.': 'icloud.',
    'icolud.': 'icloud.',
    'outlok.': 'outlook.',
    'outlock.': 'outlook.',
    'outloook.': 'outlook.',
    'oulook.': 'outlook.',
    'oultook.': 'outlook.',
    'outlokk.': 'outlook.',
    'putlook.': 'outlook.',
    'yaho.': 'yahoo.',
    'yaoo.': 'yahoo.',
    'yhoo.': 'yahoo.',
    'yhaoo.': 'yahoo.',
    'yaahoo.': 'yahoo.',
    'yahhoo.': 'yahoo.',
    'yahooo.': 'yahoo.',
  }

  const COMMON_EMAIL_DOMAINS = {
    aol: 'aol.com',
    comcast: 'comcast.net',
    gmail: 'gmail.com',
    hotmail: 'hotmail.com',
    icloud: 'icloud.com',
    outlook: 'outlook.com',
    yahoo: 'yahoo.com',
  }

  const domain = email.split('@')[1]?.toLowerCase()
  let correctedDomain = domain
  if (!domain) return null

  // Check for TLD typos (like .con instead of .com)
  let tld = `.${domain.split('.').pop() ?? ''}`
  if (EMAIL_TLD_TYPOS[tld]) {
    tld = EMAIL_TLD_TYPOS[tld]
    correctedDomain = domain.replace(tld, EMAIL_TLD_TYPOS[tld])
  }

  // Check for provider typos (part between '@' and '.')
  let provider = `${correctedDomain.split('.')[0] ?? ''}.`
  if (EMAIL_PROVIDER_TYPOS[provider]) {
    provider = EMAIL_PROVIDER_TYPOS[provider]
    correctedDomain = correctedDomain.replace(provider, EMAIL_PROVIDER_TYPOS[provider])
  }

  // If using a common email provider, avoid other misc typos
  // by forcing the whole domain to what we know is correct
  if (COMMON_EMAIL_DOMAINS[provider]) {
    correctedDomain = COMMON_EMAIL_DOMAINS[provider]
  }

  if (correctedDomain !== domain) {
    console.log('')
    return email.replace(domain, correctedDomain)
  }

  return null
}
