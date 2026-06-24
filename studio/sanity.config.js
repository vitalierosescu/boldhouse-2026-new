import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure, singletonTypes} from './structure'
import {resolve} from './presentation/resolve'

export default defineConfig({
  name: 'default',
  title: 'Boldhouse',

  projectId: 'szr2k18n',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    presentationTool({
      resolve,
      previewUrl: {
        // Points at the Eleventy dev server locally. Set SANITY_STUDIO_PREVIEW_URL
        // in studio/.env to override when the site is deployed to a real host.
        origin: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:8080',
      },
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Remove singletons from the global "create new" action.
    templates: (prev) => prev.filter((t) => !singletonTypes.has(t.schemaType)),
  },

  document: {
    // Hide duplicate / delete actions on singleton documents.
    actions: (prev, {schemaType}) =>
      singletonTypes.has(schemaType)
        ? prev.filter(({action}) => action && !['duplicate', 'delete', 'unpublish'].includes(action))
        : prev,
  },
})
