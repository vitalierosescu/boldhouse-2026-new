/* ============================================================
   BOLDHOUSE SHOP — MOTION
   Restrained by design: the shop leans on Lenis smooth scroll,
   typography, and refined hover/transition states rather than
   per-item scroll reveals (which read cheap). This module is the
   home for the small, tasteful motion that remains.
   ============================================================ */

/**
 * Listing page. Sets the static product count in the grid header.
 * Called at the end of initShopPage, after the grid HTML is injected.
 */
export function initShopMotion(container = document) {
  const count = container.querySelector('[data-shop-count]')
  if (!count) return
  const n = container.querySelectorAll('.shop-card').length
  count.textContent = String(n).padStart(2, '0')
}
