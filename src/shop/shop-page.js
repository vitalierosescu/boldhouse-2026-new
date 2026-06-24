import { getProducts } from './client.js'
import { initShopMotion } from './motion.js'

export function formatMoney(amount, currencyCode) {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}

export function buildProductCardHTML(product, index) {
  const img = product.featuredImage
  const price = product.priceRange.minVariantPrice
  const imgHTML = img
    ? `<img class="shop-card__img" src="${img.url}" alt="${img.altText || product.title}" loading="lazy">`
    : `<div class="shop-card__img shop-card__img--placeholder"></div>`
  const indexHTML =
    typeof index === 'number'
      ? `<span class="shop-card__index">${String(index + 1).padStart(2, '0')}</span>`
      : ''

  return `
    <a class="shop-card" href="shop-product.html?handle=${product.handle}">
      <div class="shop-card__media">
        ${indexHTML}
        ${imgHTML}
      </div>
      <div class="shop-card__info">
        <p class="shop-card__title">${product.title}</p>
        <p class="shop-card__price">${formatMoney(price.amount, price.currencyCode)}</p>
      </div>
    </a>
  `
}

// Number of placeholder cards shown while products load. Reserves the grid's
// full height immediately so there's no layout shift when the real cards arrive.
const SKELETON_COUNT = 9

function buildSkeletonCardHTML() {
  return `
    <div class="shop-card shop-card--skeleton" aria-hidden="true">
      <div class="shop-card__media"></div>
      <div class="shop-card__info">
        <span class="shop-card__sk-line shop-card__sk-line--title"></span>
        <span class="shop-card__sk-line shop-card__sk-line--price"></span>
      </div>
    </div>
  `
}

export async function initShopPage(container = document) {
  const grid = container.querySelector('[data-shop-grid]')
  if (!grid) return

  // Skeletons reserve the grid's full height -> zero layout shift on load.
  // They ship in the static HTML (and survive Barba fetches); only inject as a
  // fallback if the grid arrives empty.
  if (!grid.children.length) {
    grid.innerHTML = Array.from({ length: SKELETON_COUNT }, buildSkeletonCardHTML).join('')
  }

  try {
    const products = await getProducts(20)

    if (!products.length) {
      grid.innerHTML = '<p class="shop-empty">No products available.</p>'
      return
    }

    grid.innerHTML = products.map((p, i) => buildProductCardHTML(p, i)).join('')

    // Whisper cross-fade the real cards in over where the skeletons were.
    const cards = grid.querySelectorAll('.shop-card')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (window.gsap && !reduced) {
      window.gsap.fromTo(
        cards,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }
      )
    }

    initShopMotion(container)
  } catch (err) {
    console.error('Shop: failed to load products', err)
    grid.innerHTML = '<p class="shop-error">Unable to load products. Please try again later.</p>'
  }
}
