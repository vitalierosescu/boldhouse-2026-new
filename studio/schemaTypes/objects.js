import {defineField, defineType} from 'sanity'

// Shared, inline object types reused across page documents.
// Editable content images use {hotspot: true}; decorative assets stay in templates.

const seo = defineType({
  name: 'seo',
  title: 'SEO & social',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'metaTitle', title: 'Meta title', type: 'string'}),
    defineField({name: 'metaDescription', title: 'Meta description', type: 'text', rows: 2}),
    defineField({name: 'ogImage', title: 'Social share image (OG)', type: 'image', options: {hotspot: true}}),
  ],
})

const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'Call to action',
  type: 'object',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow / tagline', type: 'string'}),
    defineField({name: 'heading', title: 'Heading', type: 'text', rows: 2, description: 'Use line breaks where the design wraps lines.'}),
    defineField({name: 'buttonLabel', title: 'Button label', type: 'string'}),
    defineField({name: 'buttonLink', title: 'Button link', type: 'string'}),
  ],
})

const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ item',
  type: 'object',
  fields: [
    defineField({name: 'question', title: 'Question', type: 'string', validation: (R) => R.required()}),
    defineField({name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (R) => R.required()}),
  ],
  preview: {select: {title: 'question'}},
})

const heroLink = defineType({
  name: 'heroLink',
  title: 'Hero quick link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string'}),
    defineField({name: 'number', title: 'Number', type: 'string', description: 'e.g. 01'}),
    defineField({name: 'href', title: 'Link', type: 'string'}),
  ],
  preview: {select: {title: 'label', subtitle: 'number'}},
})

const perk = defineType({
  name: 'perk',
  title: 'Perk',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'image', title: 'Hover image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'label', title: 'Hover label', type: 'string', initialValue: '[ OPEN CASE ]'}),
  ],
  preview: {select: {title: 'title', media: 'image'}},
})

const pillar = defineType({
  name: 'pillar',
  title: 'Pillar',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2}),
    defineField({name: 'items', title: 'List items', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
  ],
  preview: {select: {title: 'title', media: 'image'}},
})

const spaceCard = defineType({
  name: 'spaceCard',
  title: 'Space card',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'number', title: 'Number', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
  ],
  preview: {select: {title: 'title', subtitle: 'number', media: 'image'}},
})

const categoryCard = defineType({
  name: 'categoryCard',
  title: 'Category card',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'string'}),
    defineField({name: 'buttonLabel', title: 'Button label', type: 'string'}),
    defineField({name: 'buttonLink', title: 'Button link', type: 'string'}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
  ],
  preview: {select: {title: 'title', media: 'image'}},
})

const homeTab = defineType({
  name: 'homeTab',
  title: 'Tab',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'exampleLabel', title: 'Example label', type: 'string', description: 'Optional, e.g. an example event name'}),
  ],
  preview: {select: {title: 'title', media: 'image'}},
})

const roomItem = defineType({
  name: 'roomItem',
  title: 'Room',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'number', title: 'Number', type: 'string'}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
  ],
  preview: {select: {title: 'name', subtitle: 'number', media: 'image'}},
})

const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Gallery image',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'thumbnail', title: 'Thumbnail (optional)', type: 'image', options: {hotspot: true}, description: 'Used by the basement slider thumbnails. Falls back to Image if empty.'}),
  ],
  preview: {select: {media: 'image'}},
})

const legalLink = defineType({
  name: 'legalLink',
  title: 'Legal link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string'}),
    defineField({name: 'href', title: 'Link', type: 'string'}),
  ],
  preview: {select: {title: 'label'}},
})

const benefit = defineType({
  name: 'benefit',
  title: 'Benefit',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (R) => R.required()}),
    defineField({name: 'detail', title: 'Detail (optional)', type: 'string'}),
  ],
  preview: {select: {title: 'title', subtitle: 'detail'}},
})

const locationItem = defineType({
  name: 'locationItem',
  title: 'Location',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'text', title: 'Text', type: 'text', rows: 2, description: 'Use line breaks where the design wraps lines.'}),
    defineField({name: 'cta', title: 'CTA label (optional)', type: 'string'}),
    defineField({name: 'href', title: 'CTA link (optional)', type: 'string'}),
  ],
  preview: {select: {title: 'title'}},
})

const quizQuestion = defineType({
  name: 'quizQuestion',
  title: 'Quiz question',
  type: 'object',
  fields: [
    defineField({name: 'question', title: 'Question', type: 'string'}),
    defineField({name: 'answers', title: 'Answers', type: 'array', of: [{type: 'string'}]}),
  ],
  preview: {select: {title: 'question'}},
})

const benefitCard = defineType({
  name: 'benefitCard',
  title: 'Benefit card',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      options: {list: [
        {title: 'Pencil', value: 'pencil'},
        {title: 'Pencil (pink)', value: 'pencil-pink'},
        {title: 'Wrench (green)', value: 'wrench-green'},
      ]},
      initialValue: 'pencil',
    }),
  ],
  preview: {select: {title: 'title'}},
})

export default [
  seo,
  ctaBlock,
  faqItem,
  heroLink,
  perk,
  pillar,
  spaceCard,
  categoryCard,
  homeTab,
  roomItem,
  galleryImage,
  legalLink,
  benefit,
  locationItem,
  benefitCard,
  quizQuestion,
]
