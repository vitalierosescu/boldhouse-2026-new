const { createClient } = require('@sanity/client')

const projectId = process.env.SANITY_PROJECT_ID

const client = projectId
  ? createClient({
      projectId,
      dataset: process.env.SANITY_DATASET || 'production',
      apiVersion: '2024-06-01',
      useCdn: process.env.NODE_ENV === 'production',
      perspective: 'published',
    })
  : null

module.exports = { client }
