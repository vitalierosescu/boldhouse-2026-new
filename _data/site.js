const { client } = require('./sanity.js')

// Build-time constants; merged under the Sanity siteSettings singleton.
const STATIC = {
  name: 'Boldhouse',
  url: 'https://bold.house',
  description: 'Creative coworking space in Ghent. Sint Baafsplein 10.',
}

module.exports = async function () {
  if (!client) return STATIC
  const settings = await client.fetch(`*[_id == "siteSettings"][0]`)
  return { ...STATIC, ...(settings || {}) }
}
