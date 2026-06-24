import { toggleCart } from './cart.js'

export function initNavCartBadge() {
  const actionsList = document.querySelector('.mega-nav__bar-list.is--actions')
  if (!actionsList) return

  const li = document.createElement('li')
  li.className = 'mega-nav__bar-action bh-cart-nav'
  li.innerHTML = `
    <button class="bh-cart-nav__btn" data-cart-toggle aria-label="Open cart (0 items)">
      <svg class="bh-cart-nav__icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M2.5 2.5h1.667l2.266 8.508a1.25 1.25 0 0 0 1.204.909h6.196a1.25 1.25 0 0 0 1.2-.9L16.25 6.25H5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="8.125" cy="15.625" r="0.625" fill="currentColor" stroke="currentColor" stroke-width="1.25"/>
        <circle cx="13.125" cy="15.625" r="0.625" fill="currentColor" stroke="currentColor" stroke-width="1.25"/>
      </svg>
      <span class="bh-cart-nav__badge" data-cart-count style="display:none">0</span>
    </button>
  `

  // Insert before the first child (the Apply CTA)
  actionsList.insertBefore(li, actionsList.firstChild)

  const btn = li.querySelector('[data-cart-toggle]')
  const badge = li.querySelector('[data-cart-count]')

  btn.addEventListener('click', toggleCart)

  let prevQty = 0
  const reduced = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Soft pulse when the count goes up — quiet feedback, nothing poppy.
  const pulse = () => {
    if (!badge || !window.gsap || reduced()) return
    window.gsap.fromTo(
      badge,
      { scale: 1 },
      {
        scale: 1.35,
        duration: 0.18,
        ease: 'power2.out',
        transformOrigin: '50% 50%',
        yoyo: true,
        repeat: 1,
      }
    )
  }

  document.addEventListener('boldhouse:cart-update', (e) => {
    const qty = e.detail.cart?.totalQuantity ?? 0
    if (badge) {
      badge.textContent = qty > 9 ? '9+' : String(qty)
      badge.style.display = qty > 0 ? '' : 'none'
    }
    btn.setAttribute('aria-label', `Open cart (${qty} item${qty !== 1 ? 's' : ''})`)
    if (qty > prevQty) pulse()
    prevQty = qty
  })
}
