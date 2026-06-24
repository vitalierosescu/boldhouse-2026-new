import { initApplyQuiz } from './apply-quiz.js'

export function initApplyPage() {
  const wizard = document.querySelector('.apply-wizard')
  if (!wizard) return
  // Guard against double-init: initAfterEnterFunctions() runs in both Barba's
  // `once` and `afterEnter` hooks, so without this the listeners (and the form
  // submit) would bind twice. Matches the codebase's _xInit pattern.
  if (wizard._applyInit) return
  wizard._applyInit = true

  const prefersReducedMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let currentScreen = null

  const tierParam = new URLSearchParams(location.search).get('tier')?.toLowerCase()

  function doScroll() {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (window.lenis) window.lenis.scrollTo(0, { immediate: true })
  }

  function updateProgress() {
    if (typeof currentScreen !== 'number') return
    wizard.querySelectorAll('.apply-progress').forEach((bar) => {
      bar.querySelectorAll('.apply-progress-segment').forEach((seg, i) => {
        seg.classList.toggle('is--active', i < currentScreen)
      })
    })
  }

  // Move focus to the new screen's heading so screen-reader / keyboard users
  // hear the step change. tabindex=-1 makes the heading programmatically
  // focusable without adding it to the tab order.
  function focusScreen(screenEl) {
    if (!screenEl) return
    const target = screenEl.querySelector('.apply-step-title, .apply-success-heading, .apply-hero-headline')
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }

  function showScreen(n, animate = true, manageFocus = true) {
    const allScreens = wizard.querySelectorAll('[data-apply-screen]')
    const current = [...allScreens].find(el => !el.hidden)
    const next = wizard.querySelector(`[data-apply-screen="${n}"]`)

    if (!next || current === next) return

    const isForward = typeof currentScreen === 'number' && typeof n === 'number'
      ? n > currentScreen
      : true

    currentScreen = n
    updateProgress()

    if (!current || !animate || prefersReducedMotion || !window.gsap) {
      allScreens.forEach(el => { el.hidden = el.dataset.applyScreen !== String(n) })
      doScroll()
      if (manageFocus) focusScreen(next)
      return
    }

    const yOut = isForward ? -24 : 24
    const yIn  = isForward ?  24 : -24

    window.gsap.to(current, {
      opacity: 0,
      y: yOut,
      duration: 0.25,
      ease: 'power2.in',
      onComplete() {
        current.hidden = true
        window.gsap.set(current, { clearProps: 'opacity,y' })

        next.hidden = false
        doScroll()

        window.gsap.fromTo(next,
          { opacity: 0, y: yIn },
          {
            opacity: 1, y: 0, duration: 0.35, ease: 'power2.out',
            onComplete() { if (manageFocus) focusScreen(next) },
          }
        )
      }
    })
  }

  // ---- Tier selection (accessible radio group) ----
  const tierInput = document.getElementById('apply-tier-value')
  const tierRadios = wizard.querySelectorAll('.apply-tier-radio')
  const nextButtons = wizard.querySelectorAll('[data-apply-next]')

  function syncTier(radio) {
    if (!radio) return
    wizard.querySelectorAll('.apply-tier-card').forEach((card) => {
      card.classList.toggle('is--selected', card.contains(radio))
    })
    if (tierInput) tierInput.value = radio.value
    // A tier is chosen — allow advancing to the form.
    nextButtons.forEach((btn) => { btn.disabled = false })
  }

  tierRadios.forEach((radio) => {
    radio.addEventListener('change', () => syncTier(radio))
    if (tierParam && radio.value === tierParam) {
      radio.checked = true
      syncTier(radio)
    }
  })

  // The "Help me choose" quiz recommends a tier; apply it the same way a click
  // would, and stash the quiz answers as optional context for the application.
  function selectTier(value, quizAnswers) {
    const radio = [...tierRadios].find((r) => r.value === value)
    if (!radio) return
    radio.checked = true
    syncTier(radio)
    if (quizAnswers) {
      const workEl = document.getElementById('apply-quiz-work')
      const freqEl = document.getElementById('apply-quiz-frequency')
      if (workEl) workEl.value = quizAnswers.work || ''
      if (freqEl) freqEl.value = quizAnswers.frequency || ''
    }
  }

  initApplyQuiz({ onRecommend: selectTier })

  // ---- Wizard navigation ----
  nextButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (typeof currentScreen === 'number') showScreen(currentScreen + 1)
    })
  })

  wizard.querySelectorAll('[data-apply-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (typeof currentScreen === 'number' && currentScreen > 0) showScreen(currentScreen - 1)
    })
  })

  wizard.querySelectorAll('[data-apply-start]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      showScreen(1)
    })
  })

  // ---- Form validation ----
  const form = wizard.querySelector('.apply-form')
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function setFieldError(input, message) {
    if (!input) return
    const describedBy = input.getAttribute('aria-describedby')
    const errorEl = describedBy ? document.getElementById(describedBy) : null
    if (message) {
      input.setAttribute('aria-invalid', 'true')
      if (errorEl) { errorEl.textContent = message; errorEl.hidden = false }
    } else {
      input.removeAttribute('aria-invalid')
      if (errorEl) errorEl.hidden = true
    }
  }

  function validateForm() {
    if (!form) return { valid: true, firstInvalid: null }
    let firstInvalid = null

    const checks = [
      { el: form.querySelector('#apply-name'), test: (v) => v.trim().length > 0, msg: 'Please enter your name.' },
      { el: form.querySelector('#apply-email'), test: (v) => EMAIL_RE.test(v.trim()), msg: 'Please enter a valid email address.' },
      { el: form.querySelector('#apply-discipline'), test: (v) => v.trim().length > 0, msg: 'Tell us what you do.' },
    ]

    checks.forEach(({ el, test, msg }) => {
      if (!el) return
      const ok = test(el.value || '')
      setFieldError(el, ok ? null : msg)
      if (!ok && !firstInvalid) firstInvalid = el
    })

    return { valid: !firstInvalid, firstInvalid }
  }

  // Clear a field's error as soon as the user starts correcting it.
  if (form) {
    form.querySelectorAll('.apply-field-input').forEach((input) => {
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') setFieldError(input, null)
      })
    })
  }

  // ---- Submission ----
  async function submitApplication(data) {
    // ===================== ARCHIE INTEGRATION POINT =====================
    // Applications are destined for Archie. When the endpoint is ready,
    // POST the payload below and delete the stub log underneath.
    // Payload shape: { tier, name, company, email, discipline, message }
    //
    // await fetch(ARCHIE_ENDPOINT, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // })
    // ====================================================================
    console.log('Apply submission (stubbed → Archie):', data)
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()

      const errorEl = wizard.querySelector('.apply-form-error')
      if (errorEl) errorEl.hidden = true

      const { valid, firstInvalid } = validateForm()
      if (!valid) {
        firstInvalid?.focus()
        return
      }

      const submitBtn = form.querySelector('[type="submit"]')
      const textEl = submitBtn?.querySelector('.button_text')
      const originalText = textEl?.textContent

      if (submitBtn) submitBtn.disabled = true
      if (textEl) textEl.textContent = 'Sending...'

      try {
        const data = Object.fromEntries(new FormData(form))
        await submitApplication(data)
        showScreen('success')
      } catch (err) {
        console.error('Apply form error:', err)
        if (errorEl) errorEl.hidden = false
        if (submitBtn) submitBtn.disabled = false
        if (textEl && originalText) textEl.textContent = originalText
      }
    })
  }

  // Initial screen — no animation, and don't steal focus on page load.
  showScreen(0, false, false)
}
