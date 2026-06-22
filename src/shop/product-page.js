import { getProductByHandle } from './client.js'
import { addToCart } from './cart.js'

function formatMoney(amount, currencyCode) {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}

function findVariant(product, selectedOptions) {
  return (
    product.variants.nodes.find((v) =>
      v.selectedOptions.every((opt) => selectedOptions[opt.name] === opt.value)
    ) ?? null
  )
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

  // Build initial selected options (first value of each option)
  const selectedOptions = {}
  product.options.forEach((opt) => {
    selectedOptions[opt.name] = opt.values[0]
  })

  const hasRealOptions =
    !(product.options.length === 1 && product.options[0].name === 'Title')

  let qty = 1

  function render() {
    const variant = findVariant(product, selectedOptions)
    const available = variant?.availableForSale ?? false
    const price = variant
      ? formatMoney(variant.price.amount, variant.price.currencyCode)
      : formatMoney(
          product.priceRange.minVariantPrice.amount,
          product.priceRange.minVariantPrice.currencyCode
        )

    const images = product.images?.nodes?.length ? product.images.nodes : []
    const featuredImg = product.featuredImage

    const galleryHTML =
      images.length > 1
        ? `
          <div class="product-gallery">
            <div class="product-gallery__main">
              <img class="product-gallery__active" data-active-img src="${images[0].url}" alt="${images[0].altText || product.title}">
            </div>
            <div class="product-gallery__thumbs">
              ${images
                .map(
                  (img, i) =>
                    `<button class="product-gallery__thumb ${i === 0 ? 'is-active' : ''}" data-thumb="${i}">
                      <img src="${img.url}" alt="${img.altText || product.title}" loading="lazy">
                    </button>`
                )
                .join('')}
            </div>
          </div>
        `
        : featuredImg
          ? `<div class="product-gallery">
               <div class="product-gallery__main">
                 <img class="product-gallery__active" src="${featuredImg.url}" alt="${featuredImg.altText || product.title}">
               </div>
             </div>`
          : `<div class="product-gallery product-gallery--empty"></div>`

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
                <button class="product-option__btn ${selectedOptions[opt.name] === val ? 'is-active' : ''}"
                  data-option-name="${opt.name}" data-option-value="${val}">
                  ${val}
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('')
      : ''

    root.innerHTML = `
      <div class="product-detail">
        ${galleryHTML}
        <div class="product-detail__content">
          <p class="product-detail__brand">Boldhouse</p>
          <h1 class="product-detail__title">${product.title}</h1>
          <p class="product-detail__price">${price}</p>

          ${optionsHTML}

          <div class="product-detail__qty">
            <button class="product-detail__qty-btn" data-qty-decrease aria-label="Decrease quantity">−</button>
            <span class="product-detail__qty-value" data-qty-value>${qty}</span>
            <button class="product-detail__qty-btn" data-qty-increase aria-label="Increase quantity">+</button>
          </div>

          <button class="product-detail__add-btn btn ${!available ? 'is-sold-out' : ''}" data-add-to-cart
            ${!available ? 'disabled' : ''}>
            ${!available ? 'Sold Out' : 'Add to Cart'}
          </button>

          ${
            product.descriptionHtml
              ? `<div class="product-detail__description">${product.descriptionHtml}</div>`
              : ''
          }
        </div>
      </div>
    `

    wireEvents(root, product, images)
  }

  function wireEvents(el, prod, images) {
    // Gallery thumbnails
    el.querySelectorAll('[data-thumb]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.thumb, 10)
        const activeImg = el.querySelector('[data-active-img]')
        if (activeImg) {
          activeImg.src = images[idx].url
          activeImg.alt = images[idx].altText || prod.title
        }
        el.querySelectorAll('[data-thumb]').forEach((b) => b.classList.remove('is-active'))
        btn.classList.add('is-active')
      })
    })

    // Option buttons
    el.querySelectorAll('[data-option-name]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedOptions[btn.dataset.optionName] = btn.dataset.optionValue
        render()
      })
    })

    // Qty
    const qtyValue = el.querySelector('[data-qty-value]')
    el.querySelector('[data-qty-decrease]')?.addEventListener('click', () => {
      if (qty > 1) {
        qty--
        if (qtyValue) qtyValue.textContent = qty
      }
    })
    el.querySelector('[data-qty-increase]')?.addEventListener('click', () => {
      qty++
      if (qtyValue) qtyValue.textContent = qty
    })

    // Add to cart
    const addBtn = el.querySelector('[data-add-to-cart]')
    addBtn?.addEventListener('click', async () => {
      const variant = findVariant(prod, selectedOptions)
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

  render()
}
