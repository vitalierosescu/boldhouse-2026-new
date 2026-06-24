const { client } = require('./sanity.js')

module.exports = async function () {
  if (!client) return []

  return client.fetch(
    `*[_type == "event"] | order(date asc) {
      _id,
      title,
      "slug": slug.current,
      date,
      endDate,
      category,
      description,
      ticketsUrl,
      featured,
      "image": image.asset->url
    }`
  )
}
