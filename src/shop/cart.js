import { getCart, createCart, cartLinesAdd, cartLinesUpdate, cartLinesRemove } from './client.js'

const CART_ID_KEY = 'boldhouse_cart_id'

const state = {
  cart: null,
  isOpen: false,
}

function dispatch() {
  document.dispatchEvent(
    new CustomEvent('boldhouse:cart-update', {
      detail: { cart: state.cart, isOpen: state.isOpen },
    })
  )
}

export async function initCart() {
  const storedId = localStorage.getItem(CART_ID_KEY)
  if (!storedId) return

  try {
    const cart = await getCart(storedId)
    if (cart) {
      state.cart = cart
    } else {
      localStorage.removeItem(CART_ID_KEY)
    }
  } catch {
    localStorage.removeItem(CART_ID_KEY)
  }

  dispatch()
}

export function getState() {
  return state
}

export function openCart() {
  state.isOpen = true
  dispatch()
}

export function closeCart() {
  state.isOpen = false
  dispatch()
}

export function toggleCart() {
  state.isOpen = !state.isOpen
  dispatch()
}

export async function addToCart(merchandiseId, quantity = 1) {
  const cartId = localStorage.getItem(CART_ID_KEY)

  let cart
  if (cartId) {
    cart = await cartLinesAdd(cartId, [{ merchandiseId, quantity }])
  } else {
    cart = await createCart([{ merchandiseId, quantity }])
  }

  if (cart) {
    localStorage.setItem(CART_ID_KEY, cart.id)
    state.cart = cart
    state.isOpen = true
    dispatch()
  }
}

export async function updateLine(lineId, quantity) {
  const cartId = localStorage.getItem(CART_ID_KEY)
  if (!cartId) return

  const cart = await cartLinesUpdate(cartId, [{ id: lineId, quantity }])
  if (cart) {
    state.cart = cart
    dispatch()
  }
}

export async function removeLine(lineId) {
  const cartId = localStorage.getItem(CART_ID_KEY)
  if (!cartId) return

  const cart = await cartLinesRemove(cartId, [lineId])
  if (cart) {
    state.cart = cart
    dispatch()
  }
}
