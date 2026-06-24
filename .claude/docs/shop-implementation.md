# Shop Implementation Notes

## Architecture Overview

The shop is a **headless Shopify** integration on top of the Webflow/Vite build.

| File | Role |
|------|------|
| `shop.html` | Shop listing page |
| `shop-product.html` | Product detail page (URL param: `?handle=<handle>`) |
| `css/shop.css` | All shop UI styles — light theme, cart drawer, product gallery |
| `src/shop/client.js` | Shopify Storefront API client |
| `src/shop/cart.js` | Cart state (localStorage key: `boldhouse_cart_id`) |
| `src/shop/cart-drawer.js` | Sliding cart drawer — global, survives Barba transitions |
| `src/shop/nav-cart-badge.js` | Nav badge item count — global |
| `src/shop/shop-page.js` | Listing page logic. Exports `formatMoney` + `buildProductCardHTML` for reuse |
| `src/shop/product-page.js` | PDP logic — 3-column editorial layout, related products, prev/next |
| `src/shop/queries.js` | GraphQL queries for products/carts |
| `src/shop/config.js` | Storefront domain + token |

**Shopify store:** `boldhouse-masnmd9c.myshopify.com` (Storefront API, headless)

---

## Theme: Light, but theme-token aware

The shop is **light** — which matches the site's *default* theme (`:root` maps
`--_theme---background--bg-primary: var(--brand--white)` /
`--_theme---text-color--text-primary: var(--brand--dark)`). The rest of the site is light
by default with dark sections (heroes, footer CTA) layered in via `.u-theme-dark` /
`data-theme-page-to="dark"`.

**Use the shared theme tokens — do NOT hardcode `rgba(13, 14, 14, X)`.** `shop.css` drives
every colour through the design system so the shop stays in sync (and a future dark variant
would "just work"):

| Use | Token |
|-----|-------|
| Page / surface background | `--_theme---background--bg-primary` (hero, PDP), `--_theme---background--bg-secondary` (grid) |
| Body / title text | `--_theme---text-color--text-primary` |
| Primary button bg / text | `--_theme---button-primary--background` / `--_theme---button-primary--text` |
| Opacity tints (borders, secondary copy) | `--swatch--dark-05 / -20 / -40 / -60 / -80` |
| Cyan accent (hover, active, markers) | `--brand--accent` (`#82eeff`) |
| Cyan selector tint (active option) | `--bh-accent-tint` (defined at top of `shop.css`, `color-mix` 12%) |
| Placeholder / skeleton bg | `--brand--light-secondary` |

`rgba(...)` only appears as the **fallback** inside `var(token, fallback)` — never as a
standalone value. The button hover stays the shop's signature dark→cyan swap (on-brand),
using the site easing `cubic-bezier(0.625, 0.05, 0, 1)`.

---

## Border Radius — Critical Rule

**All image and media containers use `border-radius: 0` (hard value, not a CSS variable).** This applies to:

- `.shop-card__media`
- `.product-gallery__main`, `.product-gallery__stack-item`, `.product-gallery--empty`
- `.bh-cart-line__img`

The CSS design system defines `--_responsive---radius--normal` etc., but these are **not applied to image elements anywhere on the site**. The entire site is uniformly sharp. Any rounding on images creates a visual inconsistency — always use hard `border-radius: 0`.

---

## Barba.js Integration

Shop pages participate in Barba page transitions.

```html
<!-- shop.html -->
<div data-barba-namespace="shop" data-barba="container" class="barba-container">

<!-- shop-product.html -->
<div data-barba-namespace="product" data-barba="container" class="barba-container">
```

Cart drawer and nav badge init **once** globally (outside Barba) and survive transitions. Shop/product page logic re-inits on each Barba `afterEnter`.

---

## Hero Heading Animation

Use `data-hero-heading=""` + `data-split=""` on the h1 to trigger the page-in animation:

```html
<h1 data-hero-heading="" data-split="" class="shop-hero__heading">Shop</h1>
```

This hooks into `initHeroEnter(container)` in `src/main.js` (line ~2692), which calls `splitReveal(heading, {delay: 0, duration: 1.2, stagger: 0.12})`.

---

## Footer Pattern

Both shop pages include the standard site footer. Structure placed **after `</main>`**, inside the barba container:

```html
</main>
<div data-theme-page-to="dark" class="footer_container">
  <section class="section_cta"> ... </section>
  <footer class="footer_component"> ... </footer>
</div>
```

`data-theme-page-to="dark"` triggers the dark theme transition on scroll into view. The footer renders on a dark canvas regardless of the page's light theme.

---

## Product Detail Page — editorial 3-column layout

Modeled on noartmusic.com/products. `product-page.js` renders into `[data-product-detail]`:

```
container-large
├─ .product-breadcrumb           Home / Shop / <title>
├─ .product-layout (grid 3-col)
│  ├─ .product-meta   (left, sticky)   editorial blocks: About, Materials, Care,
│  │                                    Size & fit, Delivery & returns
│  ├─ .product-gallery (center)        large main image + full-width stacked images
│  └─ .product-buy    (right, sticky)  brand, title, price, boxed size selector,
│                                       qty, Add to Cart (pill), reassurance note
├─ .product-related              "You might also like" — 4 reused .shop-card cards
└─ .product-pager                ‹ Prev  /  Next ›  (wraps around the catalogue)
```

On ≤991px it collapses to one column, reordered **gallery → buy → meta**, and sticky is
dropped.

Only `.product-buy` re-renders on variant/qty change (via `renderBuy()`); the gallery, meta,
related and pager are built once so the gallery doesn't reflow when switching options.

### Meta column data — Shopify metafields with fallback

The left column pulls per-product copy from **metafields** (namespace `custom`):

| Block | Source |
|-------|--------|
| About | `product.descriptionHtml` |
| Materials | metafield `custom.materials` |
| Care | metafield `custom.care` |
| Size & fit | metafield `custom.sizing` |
| Delivery & returns | static site-wide copy (`DELIVERY_COPY` in `product-page.js`) |

Blocks with no value are skipped. "About" + "Delivery & returns" mean the column is never
empty even before Dennis fills the metafields in Shopify admin.

### Related products + prev/next

- **Related:** `getRelatedProducts(product.id)` → Storefront `productRecommendations(intent: RELATED)`.
  Section is `hidden` until results arrive; stays hidden if the API returns none.
- **Prev/next:** reuses `getProducts(50)`, finds the current handle's index, links the
  neighbours (wrap-around). No extra query.

Active option/variant selection: `border-color: var(--brand--accent)` + `--bh-accent-tint` bg.

---

## What Lives Where

- **All shop CSS** → `css/shop.css` (do not bleed shop styles into the main webflow CSS)
- **Shopify API config** → `src/shop/config.js`
- **Cart persistence** → localStorage key `boldhouse_cart_id`
