import { getProductByHandle, getRelatedProducts, getProducts } from './client.js'
import { addToCart } from './cart.js'
import { formatMoney, buildProductCardHTML } from './shop-page.js'

// Static, site-wide editorial block shown on every product (No Art-style meta column).
const DELIVERY_COPY =
  'Free shipping on orders over &euro;50. Returns accepted within 14 days, unworn and with tags.'

function findVariant(product, selectedOptions) {
  return (
    product.variants.nodes.find((v) =>
      v.selectedOptions.every((opt) => selectedOptions[opt.name] === opt.value)
    ) ?? null
  )
}

function metafieldMap(product) {
  const map = {}
  ;(product.metafields || []).forEach((m) => {
    if (m && m.value) map[m.key] = m.value
  })
  return map
}

function metaBlock(label, bodyHTML) {
  if (!bodyHTML) return ''
  return `
    <div class="product-meta__block">
      <p class="product-meta__label"><span class="product-meta__marker">&#9670;</span>${label}</p>
      <div class="product-meta__body">${bodyHTML}</div>
    </div>
  `
}

function buildMetaColumn(product) {
  const meta = metafieldMap(product)
  return [
    metaBlock('About', product.descriptionHtml || ''),
    metaBlock('Materials', meta.materials),
    metaBlock('Care', meta.care),
    metaBlock('Size &amp; fit', meta.sizing),
    metaBlock('Delivery &amp; returns', `<p>${DELIVERY_COPY}</p>`),
  ].join('')
}

function buildGallery(product) {
  const images = product.images?.nodes?.length
    ? product.images.nodes
    : product.featuredImage
      ? [product.featuredImage]
      : []

  if (!images.length) {
    return `<div class="product-gallery product-gallery--empty"></div>`
  }

  const [first, ...rest] = images
  return `
    <div class="product-gallery">
      <div class="product-gallery__main">
        <img class="product-gallery__img" src="${first.url}" alt="${first.altText || product.title}">
      </div>
      ${rest
        .map(
          (img) => `
        <div class="product-gallery__stack-item">
          <img class="product-gallery__img" src="${img.url}" alt="${img.altText || product.title}" loading="lazy">
        </div>`
        )
        .join('')}
    </div>
  `
}

export async function initProductPage(container = document) {
  const root = container.querySelector('[data-product-detail]')
  if (!root) return

  const params = new URLSearchParams(window.location.search)
  const handle = params.get('handle')

  if (!handle) {
    root.innerHTML = '<p class="product-error">Product not found.</p>'
    return
  }

  root.innerHTML = '<p class="shop-loading">Loading...</p>'

  let product
  try {
    product = await getProductByHandle(handle)
  } catch (err) {
    console.error('Product page: fetch failed', err)
    root.innerHTML = '<p class="product-error">Unable to load product.</p>'
    return
  }

  if (!product) {
    root.innerHTML = '<p class="product-error">Product not found.</p>'
    return
  }

  // Fire off secondary fetches in parallel; the page renders without waiting on them.
  const relatedPromise = getRelatedProducts(product.id)
  const catalogPromise = getProducts(50)

  // Initial option selection (first value of each option).
  const selectedOptions = {}
  product.options.forEach((opt) => {
    selectedOptions[opt.name] = opt.values[0]
  })

  const hasRealOptions = !(
    product.options.length === 1 && product.options[0].name === 'Title'
  )

  let qty = 1

  // ---- Static layout (built once) ----
  root.innerHTML = `
    <div class="container-large">
      <nav class="product-breadcrumb">
        <a href="index.html" class="product-breadcrumb__link">Home</a>
        <span class="product-breadcrumb__sep">/</span>
        <a href="shop.html" class="product-breadcrumb__link">Shop</a>
        <span class="product-breadcrumb__sep">/</span>
        <span class="product-breadcrumb__current">${product.title}</span>
      </nav>

      <div class="product-layout">
        ${buildGallery(product)}
        <div class="product-buy" data-buy></div>
      </div>

      <section class="product-related" data-related hidden>
        <div class="product-related__head">
          <h2 class="product-related__title">You might also like</h2>
          <a href="shop.html" class="product-related__all">Explore all &rsaquo;</a>
        </div>
        <div class="product-related__grid" data-related-grid></div>
      </section>

      <nav class="product-pager" data-pager hidden></nav>
    </div>
  `

  const buyEl = root.querySelector('[data-buy]')

  function renderBuy() {
    const variant = findVariant(product, selectedOptions)
    const available = variant?.availableForSale ?? false
    const price = variant
      ? formatMoney(variant.price.amount, variant.price.currencyCode)
      : formatMoney(
          product.priceRange.minVariantPrice.amount,
          product.priceRange.minVariantPrice.currencyCode
        )

    const optionsHTML = hasRealOptions
      ? product.options
          .map(
            (opt) => `
        <div class="product-option">
          <p class="product-option__name">${opt.name}</p>
          <div class="product-option__values">
            ${opt.values
              .map(
                (val) => `
              <button class="product-option__box ${selectedOptions[opt.name] === val ? 'is-active' : ''}"
                data-option-name="${opt.name}" data-option-value="${val}">
                ${val}
              </button>`
              )
              .join('')}
          </div>
        </div>`
          )
          .join('')
      : ''

    buyEl.innerHTML = `
      <p class="product-buy__brand">Boldhouse</p>
      <h1 class="product-buy__title">${product.title}</h1>
      <p class="product-buy__price">${price}</p>

      ${optionsHTML}

      <div class="product-buy__qty">
        <p class="product-option__name">Quantity</p>
        <div class="product-buy__qty-control">
          <button class="product-buy__qty-btn" data-qty-decrease aria-label="Decrease quantity">&minus;</button>
          <span class="product-buy__qty-value" data-qty-value>${qty}</span>
          <button class="product-buy__qty-btn" data-qty-increase aria-label="Increase quantity">+</button>
        </div>
      </div>

      <button class="product-buy__add ${!available ? 'is-sold-out' : ''}" data-add-to-cart ${!available ? 'disabled' : ''}>
        ${!available ? 'Sold Out' : 'Add to Cart'}
      </button>

      <p class="product-buy__note">Free shipping over &euro;50 &middot; 14-day returns</p>

      <div class="product-buy__meta">${buildMetaColumn(product)}</div>
    `

    wireBuyEvents()
  }

  function wireBuyEvents() {
    buyEl.querySelectorAll('[data-option-name]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedOptions[btn.dataset.optionName] = btn.dataset.optionValue
        renderBuy()
      })
    })

    const qtyValue = buyEl.querySelector('[data-qty-value]')
    buyEl.querySelector('[data-qty-decrease]')?.addEventListener('click', () => {
      if (qty > 1) {
        qty--
        if (qtyValue) qtyValue.textContent = qty
      }
    })
    buyEl.querySelector('[data-qty-increase]')?.addEventListener('click', () => {
      qty++
      if (qtyValue) qtyValue.textContent = qty
    })

    const addBtn = buyEl.querySelector('[data-add-to-cart]')
    addBtn?.addEventListener('click', async () => {
      const variant = findVariant(product, selectedOptions)
      if (!variant) return

      addBtn.textContent = 'Adding...'
      addBtn.disabled = true

      try {
        await addToCart(variant.id, qty)
      } catch (err) {
        console.error('Add to cart failed', err)
      } finally {
        addBtn.textContent = 'Add to Cart'
        addBtn.disabled = false
      }
    })
  }

  renderBuy()

  // ---- Related products (async) ----
  relatedPromise.then((related) => {
    if (!related.length) return
    const section = root.querySelector('[data-related]')
    const grid = root.querySelector('[data-related-grid]')
    if (!section || !grid) return
    grid.innerHTML = related.map(buildProductCardHTML).join('')
    section.hidden = false
  })

  // ---- Prev / next product nav (async) ----
  catalogPromise.then((products) => {
    if (!products.length) return
    const idx = products.findIndex((p) => p.handle === handle)
    if (idx === -1) return

    const prev = products[(idx - 1 + products.length) % products.length]
    const next = products[(idx + 1) % products.length]
    const pager = root.querySelector('[data-pager]')
    if (!pager) return

    pager.innerHTML = `
      <a href="shop-product.html?handle=${prev.handle}" class="product-pager__link product-pager__link--prev">
        <span class="product-pager__dir">&lsaquo; Prev</span>
        <span class="product-pager__name">${prev.title}</span>
      </a>
      <a href="shop-product.html?handle=${next.handle}" class="product-pager__link product-pager__link--next">
        <span class="product-pager__dir">Next &rsaquo;</span>
        <span class="product-pager__name">${next.title}</span>
      </a>
    `
    pager.hidden = false
  })
}
