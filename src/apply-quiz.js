// "Help me choose" quiz — a stepped lightbox modal launched from the apply
// tier step. It decides a membership tier and reports it via onRecommend; the
// wizard (apply.js) owns the actual tier selection. The quiz never touches the
// form or wizard navigation directly.

const TIER_LABEL = { member: 'Member', flexi: 'Flexi', fixed: 'Fixed' }

// Result copy lives here so wording can be edited without touching logic.
const RESULT_COPY = {
  member: 'A foot in the door — community, events, and a desk when you drop in.',
  flexi: 'A desk when you need it, no lock-in.',
  fixed: 'Your own desk, every day, with everything included.',
}

// frequency sets the base tier; a dedicated-desk "yes" overrides to Fixed.
// (Resident is inquire-only and not surfaced, so full-time maps to Fixed.)
function recommend({ frequency, desk }) {
  if (desk === 'yes') return 'fixed'
  if (frequency === 'occasionally') return 'member'
  if (frequency === 'couple') return 'flexi'
  return 'fixed' // 'most'
}

export function initApplyQuiz({ onRecommend } = {}) {
  const modal = document.querySelector('[data-quiz]')
  if (!modal || modal._quizInit) return
  modal._quizInit = true

  const prefersReducedMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const dialog = modal.querySelector('.apply-quiz-dialog')
  const backdrop = modal.querySelector('.apply-quiz-backdrop')
  const trigger = document.querySelector('[data-quiz-open]')
  const steps = [...modal.querySelectorAll('[data-quiz-step]')]
  const questionSteps = steps.filter((s) => s.dataset.quizStep !== 'result')
  const indicator = modal.querySelector('[data-quiz-indicator]')
  const backBtn = modal.querySelector('[data-quiz-back]')
  const chooseBtn = modal.querySelector('[data-quiz-choose]')
  const resultHeading = modal.querySelector('[data-quiz-result-heading]')
  const resultBody = modal.querySelector('[data-quiz-result-body]')

  const answers = {}
  let stepIndex = 0
  let recommended = null
  let lastFocused = null

  function showStep(which) {
    steps.forEach((s) => { s.hidden = s.dataset.quizStep !== String(which) })
    const isResult = which === 'result'
    if (indicator) {
      indicator.textContent = isResult ? 'Your match' : `${which + 1} / ${questionSteps.length}`
    }
    if (backBtn) backBtn.hidden = which === 0
    const active = steps.find((s) => !s.hidden)
    active?.querySelector('button, [href], input')?.focus({ preventScroll: true })
  }

  function renderResult() {
    const label = TIER_LABEL[recommended] || 'Flexi'
    if (resultHeading) resultHeading.textContent = `We think ${label} is your fit.`
    if (resultBody) resultBody.textContent = RESULT_COPY[recommended] || ''
    if (chooseBtn) chooseBtn.textContent = `Choose ${label}`
  }

  function answerAndAdvance(key, value) {
    answers[key] = value
    if (stepIndex < questionSteps.length - 1) {
      stepIndex += 1
      showStep(stepIndex)
    } else {
      recommended = recommend(answers)
      renderResult()
      showStep('result')
    }
  }

  function goBack() {
    // From the result, step back to the last question.
    if (stepIndex === questionSteps.length - 1 && recommended) {
      recommended = null
      showStep(stepIndex)
      return
    }
    if (stepIndex > 0) {
      stepIndex -= 1
      showStep(stepIndex)
    }
  }

  function open() {
    lastFocused = document.activeElement
    // reset state
    Object.keys(answers).forEach((k) => delete answers[k])
    stepIndex = 0
    recommended = null

    modal.hidden = false
    document.body.style.overflow = 'hidden'
    window.lenis?.stop?.()

    if (!prefersReducedMotion && window.gsap) {
      window.gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      window.gsap.fromTo(dialog, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
    }

    // Show the first step AFTER the modal is visible, so focus can land on it.
    showStep(0)
  }

  function close() {
    const finish = () => {
      modal.hidden = true
      document.body.style.overflow = ''
      window.lenis?.start?.()
      if (window.gsap) window.gsap.set(dialog, { clearProps: 'opacity,y' })
      lastFocused?.focus?.({ preventScroll: true })
    }
    if (!prefersReducedMotion && window.gsap) {
      window.gsap.to(dialog, { opacity: 0, y: 12, duration: 0.2, ease: 'power2.in' })
      window.gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: finish })
    } else {
      finish()
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return }
    if (e.key !== 'Tab') return
    const focusables = [...modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.hidden && el.offsetParent !== null)
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  // Wire events
  trigger?.addEventListener('click', open)
  modal.querySelectorAll('[data-quiz-close]').forEach((el) => el.addEventListener('click', close))
  modal.querySelectorAll('[data-quiz-answer]').forEach((btn) => {
    btn.addEventListener('click', () => answerAndAdvance(btn.dataset.quizAnswer, btn.dataset.value))
  })
  backBtn?.addEventListener('click', goBack)
  chooseBtn?.addEventListener('click', () => {
    if (recommended && typeof onRecommend === 'function') onRecommend(recommended, { ...answers })
    close()
  })
  modal.addEventListener('keydown', handleKeydown)
}
