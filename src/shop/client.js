import { SHOPIFY_DOMAIN, SHOPIFY_TOKEN, SHOPIFY_API_VERSION } from './config.js'
import {
  GET_CART,
  GET_PRODUCTS,
  GET_PRODUCT_BY_HANDLE,
  GET_ALL_PRODUCT_HANDLES,
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_UPDATE,
  CART_LINES_REMOVE,
} from './queries.js'

async function shopifyFetch(query, variables) {
  const url = `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`)
  }
  return json.data
}

export async function getProducts(first = 20) {
  const data = await shopifyFetch(GET_PRODUCTS, { first })
  return data?.products?.nodes ?? []
}

export async function getProductByHandle(handle) {
  const data = await shopifyFetch(GET_PRODUCT_BY_HANDLE, { handle })
  return data?.product ?? null
}

export async function getAllProductHandles() {
  const data = await shopifyFetch(GET_ALL_PRODUCT_HANDLES)
  return data?.products?.nodes?.map((p) => p.handle) ?? []
}

export async function getCart(cartId) {
  const data = await shopifyFetch(GET_CART, { cartId })
  return data?.cart ?? null
}

export async function createCart(lines = []) {
  const data = await shopifyFetch(CART_CREATE, { lines })
  return data?.cartCreate?.cart ?? null
}

export async function cartLinesAdd(cartId, lines) {
  const data = await shopifyFetch(CART_LINES_ADD, { cartId, lines })
  return data?.cartLinesAdd?.cart ?? null
}

export async function cartLinesUpdate(cartId, lines) {
  const data = await shopifyFetch(CART_LINES_UPDATE, { cartId, lines })
  return data?.cartLinesUpdate?.cart ?? null
}

export async function cartLinesRemove(cartId, lineIds) {
  const data = await shopifyFetch(CART_LINES_REMOVE, { cartId, lineIds })
  return data?.cartLinesRemove?.cart ?? null
}
