# Shop Motion & Scroll Experience — Spec

## Context

The shop is visually consistent with the site (see `shop-implementation.md`). This adds a
**restrained, premium scroll experience** across the shop journey. An earlier, bolder
"cinematic reveal" direction was prototyped and rejected in checkpoint review — the per-item
clip/scale reveals read cheap. The agreed direction is **restraint**: lean on smooth scroll,
typography, layout, and refined hover/transition states; no poppy per-item scroll reveals.

Taste anchors: **Soho House / The Hoxton / Gil Huybrechts** (stillness, whitespace, premium
pacing), with **No Art** for the product gallery rhythm.

## Direction (the rules)

- **Smooth scroll** is the core experience — Lenis (already global, `window.lenis`).
- **No scroll-triggered per-item reveals.** Content is simply present and well-composed.
- **Refined hovers/transitions only** — short, eased (`cubic-bezier(0.625,0.05,0,1)`), small.
- Respect `prefers-reduced-motion`; Lenis already disabled on mobile.
- Any future motion lives in `src/shop/motion.js`, hooks into the existing rig (ScrollTriggers
  auto-killed by barba `afterLeave`; other teardown via `window.__bhRegisterCleanup`), and must
  pass the leak check (`ScrollTrigger.getAll()` returns to baseline after navigation).

## Listing page (done)

- Full white background (was grey `bg-secondary` — removed).
- Editorial static index numbers `01..NN` on each card (white, `mix-blend-mode: difference`).
- Static item count in the grid header.
- Refined hover: info shifts right, price darkens to full strength, image scales 1.03.
- No reveal animation.

## Product page (done)

- **2 columns**: gallery (left) + sticky buy column (right).
- Meta blocks (About / Materials / Care / Size & fit / Delivery & returns) live **inside the buy
  column, below the CTA**, separated by a hairline rule. Sourced from `custom.*` metafields with
  static fallback (About + Delivery always present).
- Gallery is the stacked-image layout (large image + stacked images below). No cinematic reveal.
- Collapses to one column (gallery → buy) at ≤991px.

## Remaining (open — to confirm with client)

The bold checkpoint-3 ideas (add-to-cart Flip of the product image into the cart badge; a
shared-element page transition) are **on hold** pending the restraint decision. Options to
confirm: keep it to smooth scroll only, or add one or two *quiet* delight beats (e.g. a soft
cart-badge pulse on add, a clean cross-fade page transition) that stay within the restrained
language.

## Definition of done

- Clean, restrained, premium feel; nothing reads cheap.
- Smooth Lenis scroll across listing, PDP, cart.
- No ScrollTrigger leaks across barba navigation.
- `prefers-reduced-motion` and mobile graceful.
- Cart / variant / navigation regression checks from `shop-implementation.md` still pass.
- Fixed in passing: `main.js` `initPriceCards` undefined `prefersReducedMotion()` → `reducedMotion`.
