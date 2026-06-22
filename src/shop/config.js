const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}

export const SHOPIFY_DOMAIN =
  env.VITE_SHOPIFY_STORE_DOMAIN || 'boldhouse-masnmd9c.myshopify.com'
export const SHOPIFY_TOKEN =
  env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '750499849a2a3f67373eecac0eea8e5b'
export const SHOPIFY_API_VERSION = env.VITE_SHOPIFY_API_VERSION || '2025-01'
