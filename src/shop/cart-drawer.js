import { closeCart, updateLine, removeLine } from './cart.js'

function formatMoney(amount, currencyCode) {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}

function buildDrawerHTML() {
  return `
    <div class="bh-cart-overlay" data-cart-overlay></div>
    <div class="bh-cart-drawer" data-cart-drawer>
      <div class="bh-cart-drawer__header">
        <span class="bh-cart-drawer__title" data-cart-title>Cart</span>
        <button class="bh-cart-drawer__close" data-cart-close aria-label="Close cart">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="bh-cart-drawer__body" data-cart-body>
        <p class="bh-cart-drawer__empty">Your cart is empty.</p>
      </div>
      <div class="bh-cart-drawer__footer" data-cart-footer style="display:none">
        <div class="bh-cart-drawer__subtotal">
          <span class="bh-cart-drawer__subtotal-label">Subtotal</span>
          <span class="bh-cart-drawer__subtotal-value" data-cart-subtotal></span>
        </div>
        <a class="bh-cart-drawer__checkout" data-cart-checkout href="#">Checkout</a>
        <p class="bh-cart-drawer__note">Taxes and shipping calculated at checkout</p>
      </div>
    </div>
  `
}

function buildLineHTML(line) {
  const img = line.merchandise.product.featuredImage
  const isDefaultTitle = line.merchandise.title === 'Default Title'
  const imgHTML = img
    ? `<img class="bh-cart-line__img" src="${img.url}" alt="${img.altText || line.merchandise.product.title}" width="72" height="72" loading="lazy">`
    : `<div class="bh-cart-line__img bh-cart-line__img--placeholder"></div>`

  return `
    <div class="bh-cart-line" data-line-id="${line.id}">
      ${imgHTML}
      <div class="bh-cart-line__info">
        <p class="bh-cart-line__title">${line.merchandise.product.title}</p>
        ${!isDefaultTitle ? `<p class="bh-cart-line__variant">${line.merchandise.title}</p>` : ''}
        <div class="bh-cart-line__meta">
          <div class="bh-cart-line__qty">
            <button class="bh-cart-line__qty-btn" data-line-decrease="${line.id}" data-qty="${line.quantity}" aria-label="Decrease quantity">−</button>
            <span class="bh-cart-line__qty-value">${line.quantity}</span>
            <button class="bh-cart-line__qty-btn" data-line-increase="${line.id}" data-qty="${line.quantity}" aria-label="Increase quantity">+</button>
          </div>
          <span class="bh-cart-line__price">${formatMoney(line.cost.totalAmount.amount, line.cost.totalAmount.currencyCode)}</span>
        </div>
      </div>
    </div>
  `
}

let drawerEl = null
let overlayEl = null
let isAnimating = false

export function initCartDrawer() {
  if (drawerEl) return

  const wrapper = document.createElement('div')
  wrapper.innerHTML = buildDrawerHTML()
  document.body.appendChild(wrapper)

  overlayEl = document.querySelector('[data-cart-overlay]')
  drawerEl = document.querySelector('[data-cart-drawer]')

  // Initial GSAP state
  gsap.set(drawerEl, { x: '100%' })
  gsap.set(overlayEl, { opacity: 0, display: 'none' })

  // Close triggers
  overlayEl.addEventListener('click', closeCart)
  document.querySelector('[data-cart-close]').addEventListener('click', closeCart)

  // Cart update listener
  document.addEventListener('boldhouse:cart-update', (e) => {
    const { cart, isOpen } = e.detail
    renderCart(cart)
    animateDrawer(isOpen)
  })
}

function renderCart(cart) {
  if (!drawerEl) return

  const lines = cart?.lines?.nodes ?? []
  const title = drawerEl.querySelector('[data-cart-title]')
  const body = drawerEl.querySelector('[data-cart-body]')
  const footer = drawerEl.querySelector('[data-cart-footer]')
  const subtotal = drawerEl.querySelector('[data-cart-subtotal]')
  const checkoutLink = drawerEl.querySelector('[data-cart-checkout]')

  const qty = cart?.totalQuantity ?? 0
  if (title) title.textContent = qty > 0 ? `Cart (${qty})` : 'Cart'

  if (!lines.length) {
    body.innerHTML = '<p class="bh-cart-drawer__empty">Your cart is empty.</p>'
    if (footer) footer.style.display = 'none'
    return
  }

  body.innerHTML = lines.map(buildLineHTML).join('')

  if (footer) footer.style.display = ''
  if (subtotal && cart?.cost?.subtotalAmount) {
    subtotal.textContent = formatMoney(
      cart.cost.subtotalAmount.amount,
      cart.cost.subtotalAmount.currencyCode
    )
  }
  if (checkoutLink && cart?.checkoutUrl) {
    checkoutLink.href = cart.checkoutUrl
  }

  // Wire qty buttons (delegated after render)
  body.querySelectorAll('[data-line-decrease]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lineId = btn.dataset.lineDecrease
      const qty = parseInt(btn.dataset.qty, 10)
      if (qty > 1) updateLine(lineId, qty - 1)
      else removeLine(lineId)
    })
  })

  body.querySelectorAll('[data-line-increase]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lineId = btn.dataset.lineIncrease
      const qty = parseInt(btn.dataset.qty, 10)
      updateLine(lineId, qty + 1)
    })
  })
}

function animateDrawer(isOpen) {
  if (!drawerEl || isAnimating) return
  isAnimating = true

  if (isOpen) {
    gsap.set(overlayEl, { display: 'block' })
    gsap.to(overlayEl, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    })
    gsap.to(drawerEl, {
      x: '0%',
      duration: 0.4,
      ease: 'power3.out',
      onComplete: () => {
        isAnimating = false
      },
    })
  } else {
    gsap.to(overlayEl, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(overlayEl, { display: 'none' })
      },
    })
    gsap.to(drawerEl, {
      x: '100%',
      duration: 0.35,
      ease: 'power3.in',
      onComplete: () => {
        isAnimating = false
      },
    })
  }
}
