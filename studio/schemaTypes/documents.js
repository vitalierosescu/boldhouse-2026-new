import {defineField, defineType} from 'sanity'

// Reusable, referenced document types (edited once, used on multiple pages).

const membershipTier = defineType({
  name: 'membershipTier',
  title: 'Membership tier',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (R) => R.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 24},
      description: 'Used in apply.html?tier=… links (member / flexi / fixed).',
      validation: (R) => R.required(),
    }),
    defineField({name: 'tagline', title: 'Tagline', type: 'string'}),
    defineField({name: 'priceMonthly', title: 'Price — monthly', type: 'string', description: 'e.g. €148'}),
    defineField({name: 'priceQuarterly', title: 'Price — quarterly', type: 'string'}),
    defineField({name: 'priceYearly', title: 'Price — yearly', type: 'string'}),
    defineField({name: 'highlight', title: 'Highlighted tier', type: 'boolean', initialValue: false}),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls position in the pricing list (1, 2, 3).',
    }),
    defineField({name: 'benefits', title: 'Benefits', type: 'array', of: [{type: 'benefit'}]}),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'priceMonthly'}},
})

const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'text', rows: 3, validation: (R) => R.required()}),
    defineField({name: 'authorName', title: 'Author name', type: 'string'}),
    defineField({name: 'authorRole', title: 'Author role', type: 'string'}),
    defineField({name: 'durationMonths', title: 'Months as member', type: 'number'}),
    defineField({name: 'avatar', title: 'Avatar', type: 'image', options: {hotspot: true}}),
  ],
  preview: {select: {title: 'authorName', subtitle: 'authorRole', media: 'avatar'}},
})

const partnerLogo = defineType({
  name: 'partnerLogo',
  title: 'Partner logo',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (R) => R.required()}),
    defineField({name: 'logo', title: 'Logo', type: 'image'}),
    defineField({name: 'order', title: 'Order', type: 'number'}),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', media: 'logo'}},
})

export default [membershipTier, testimonial, partnerLogo]
