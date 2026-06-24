const { createClient } = require('@sanity/client')

const projectId = process.env.SANITY_PROJECT_ID

const client = projectId
  ? createClient({
      projectId,
      dataset: process.env.SANITY_DATASET || 'production',
      apiVersion: '2024-06-01',
      // Token (read access) covers private datasets at build time; harmless for public ones.
      token: process.env.SANITY_API_TOKEN || undefined,
      useCdn: false,
      perspective: 'published',
    })
  : null

module.exports = { client }
