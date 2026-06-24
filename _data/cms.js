const { client } = require('./sanity.js')

// One combined query for all page singletons. References (tiers, testimonials,
// logos) are dereferenced; images are returned as raw objects for the
// `sanityImage` Nunjucks filter to turn into optimised URLs.
const TIER = `{name, "slug": slug.current, tagline, priceMonthly, priceQuarterly, priceYearly, highlight, order, benefits}`
const TESTIMONIAL = `{quote, authorName, authorRole, durationMonths, avatar}`

const QUERY = `{
  "home": *[_id == "homePage"][0]{
    ...,
    reviews{..., testimonials[]->${TESTIMONIAL}}
  },
  "club": *[_id == "clubPage"][0]{
    ...,
    partnerLogos[]->{name, logo},
    reviews{..., testimonials[]->${TESTIMONIAL}}
  },
  "spaces": *[_id == "spacesPage"][0],
  "manifesto": *[_id == "manifestoPage"][0],
  "memberships": *[_id == "membershipsPage"][0]{
    ...,
    tiers[]->${TIER}
  },
  "apply": *[_id == "applyPage"][0]{
    ...,
    tiers[]->${TIER}
  },
  "contact": *[_id == "contactPage"][0],
  "shop": *[_id == "shopPage"][0],
  "terms": *[_id == "termsPage"][0]
}`

module.exports = async function () {
  if (!client) return {}
  return client.fetch(QUERY)
}
