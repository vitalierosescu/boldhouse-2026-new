import { getProducts } from './client.js'

function formatMoney(amount, currencyCode) {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}

function buildProductCardHTML(product) {
  const img = product.featuredImage
  const price = product.priceRange.minVariantPrice
  const imgHTML = img
    ? `<img class="shop-card__img" src="${img.url}" alt="${img.altText || product.title}" loading="lazy">`
    : `<div class="shop-card__img shop-card__img--placeholder"></div>`

  return `
    <a class="shop-card" href="shop-product.html?handle=${product.handle}">
      <div class="shop-card__media">
        ${imgHTML}
      </div>
      <div class="shop-card__info">
        <p class="shop-card__title">${product.title}</p>
        <p class="shop-card__price">${formatMoney(price.amount, price.currencyCode)}</p>
      </div>
    </a>
  `
}

export async function initShopPage(container = document) {
  const grid = container.querySelector('[data-shop-grid]')
  if (!grid) return

  grid.innerHTML = '<p class="shop-loading">Loading products...</p>'

  try {
    const products = await getProducts(20)

    if (!products.length) {
      grid.innerHTML = '<p class="shop-empty">No products available.</p>'
      return
    }

    grid.innerHTML = products.map(buildProductCardHTML).join('')
  } catch (err) {
    console.error('Shop: failed to load products', err)
    grid.innerHTML = '<p class="shop-error">Unable to load products. Please try again later.</p>'
  }
}
