import {defineField, defineType} from 'sanity'

// Helpers ------------------------------------------------------------------

const seoField = defineField({name: 'seo', title: 'SEO & social', type: 'seo'})

const obj = (name, title, fields, extra = {}) =>
  defineField({name, title, type: 'object', options: {collapsible: true, collapsed: false}, fields, ...extra})

const str = (name, title, extra = {}) => defineField({name, title, type: 'string', ...extra})
const txt = (name, title, rows = 2, extra = {}) => defineField({name, title, type: 'text', rows, ...extra})
const img = (name, title) => defineField({name, title, type: 'image', options: {hotspot: true}})
const refs = (name, title, to) =>
  defineField({name, title, type: 'array', of: [{type: 'reference', to: [{type: to}]}]})
const arr = (name, title, of) => defineField({name, title, type: 'array', of: [{type: of}]})

const pageDoc = (name, title, fields) =>
  defineType({
    name,
    title,
    type: 'document',
    groups: [
      {name: 'content', title: 'Content', default: true},
      {name: 'seo', title: 'SEO'},
    ],
    fields: [{...seoField, group: 'seo'}, ...fields.map((f) => ({...f, group: f.group || 'content'}))],
    preview: {prepare: () => ({title})},
  })

// Site Settings (global singleton) -----------------------------------------

const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    txt('footerHeading', 'Footer heading', 2, {description: 'e.g. "Come as you are, leave bolder."'}),
    txt('address', 'Address', 3, {description: 'Use line breaks where the design wraps lines.'}),
    str('email', 'Email'),
    str('vatNumber', 'VAT / company number'),
    str('copyright', 'Copyright line'),
    arr('legalLinks', 'Legal links', 'legalLink'),
    str('memberCount', 'Member count stat', {description: 'e.g. 124'}),
    txt('locationText', 'Location text', 3),
    defineField({name: 'cta', title: 'Shared call-to-action (every page footer)', type: 'ctaBlock'}),
  ],
  preview: {prepare: () => ({title: 'Site Settings'})},
})

// Page singletons ----------------------------------------------------------

const homePage = pageDoc('homePage', 'Home', [
  obj('hero', 'Hero', [
    txt('headline', 'Headline', 2),
    txt('subhead', 'Subheading', 3),
    str('ctaLabel', 'CTA label'),
    str('ctaLink', 'CTA link'),
    img('image', 'Hero image'),
  ]),
  arr('heroLinks', 'Hero quick links', 'heroLink'),
  str('tagline', 'Tagline / eyebrow'),
  txt('missionStatement', 'Mission statement', 4),
  obj('intro', 'Intro section', [txt('heading', 'Heading', 2), txt('body', 'Body', 5), img('image', 'Image')]),
  arr('categoryCards', 'Category cards', 'categoryCard'),
  obj('rooms', 'Rooms section', [txt('heading', 'Heading', 2), arr('roomItems', 'Rooms', 'roomItem')]),
  obj('reviews', 'Reviews section', [
    str('eyebrow', 'Eyebrow'),
    str('heading', 'Heading'),
    refs('testimonials', 'Testimonials', 'testimonial'),
    txt('memberCountDesc', 'Member count description', 3),
  ]),
  obj('location', 'Location', [str('label', 'Label'), txt('text', 'Text', 3)]),
  obj('allSection', '"More than a coworking" section', [
    txt('heading', 'Heading', 2),
    txt('subtext', 'Subtext', 2),
    arr('tabs', 'Tabs', 'homeTab'),
  ]),
])

const clubPage = pageDoc('clubPage', 'Club', [
  obj('hero', 'Hero', [txt('title', 'Title', 2), txt('body', 'Body', 3), img('image', 'Hero image')]),
  arr('heroLinks', 'Hero quick links', 'heroLink'),
  str('perksEyebrow', 'Perks eyebrow'),
  arr('perks', 'Perks', 'perk'),
  refs('partnerLogos', 'Partner logos', 'partnerLogo'),
  arr('pillars', 'Three pillars', 'pillar'),
  obj('reviews', 'Reviews section', [
    str('eyebrow', 'Eyebrow'),
    str('heading', 'Heading'),
    refs('testimonials', 'Testimonials', 'testimonial'),
  ]),
  obj('stepsSection', 'Benefits / steps section', [
    str('eyebrow', 'Eyebrow'),
    txt('heading', 'Heading', 2),
    txt('body', 'Body', 4),
    arr('benefitCards', 'Benefit cards', 'benefitCard'),
  ]),
  arr('gallery', 'Gallery', 'galleryImage'),
  str('faqHeading', 'FAQ heading'),
  arr('faqs', 'FAQs', 'faqItem'),
])

const spacesPage = pageDoc('spacesPage', 'Spaces', [
  obj('hero', 'Hero', [txt('title', 'Title', 2), txt('body', 'Body', 3), img('image', 'Hero image')]),
  arr('heroLinks', 'Hero quick links', 'heroLink'),
  arr('spaceCards', 'Space cards', 'spaceCard'),
  obj('location', 'Location section', [
    str('eyebrow', 'Eyebrow'),
    txt('text', 'Text', 4),
    arr('locationItems', 'Locations', 'locationItem'),
  ]),
  obj('basement', 'Basement section', [
    str('eyebrow', 'Eyebrow'),
    str('heading', 'Heading'),
    txt('description', 'Description', 4),
    arr('slides', 'Slides', 'galleryImage'),
  ]),
  str('faqHeading', 'FAQ heading'),
  arr('faqs', 'FAQs', 'faqItem'),
])

const manifestoPage = pageDoc('manifestoPage', 'Manifesto', [
  defineField({
    name: 'body',
    title: 'Manifesto body',
    type: 'array',
    of: [{type: 'block'}],
    description: 'Rich text. Bold the emphasised phrases.',
  }),
])

const membershipsPage = pageDoc('membershipsPage', 'Memberships', [
  str('heading', 'Heading'),
  str('toggleDescription', 'Toggle description'),
  refs('tiers', 'Tiers', 'membershipTier'),
  str('faqHeading', 'FAQ heading'),
  arr('faqs', 'FAQs', 'faqItem'),
])

const applyPage = pageDoc('applyPage', 'Apply', [
  obj('hero', 'Hero', [str('tagline', 'Tagline'), txt('headline', 'Headline', 3), str('startLabel', 'Start button label')]),
  str('tierStepTitle', 'Tier step title'),
  refs('tiers', 'Tiers', 'membershipTier'),
  str('quizTriggerLabel', 'Quiz trigger label'),
  str('formStepTitle', 'Form step title'),
  obj('formLabels', 'Form labels', [
    str('name', 'Name field label'),
    str('nameError', 'Name error'),
    str('company', 'Company field label'),
    str('email', 'Email field label'),
    str('emailError', 'Email error'),
    str('discipline', 'Discipline field label'),
    str('disciplinePlaceholder', 'Discipline placeholder'),
    str('disciplineError', 'Discipline error'),
    str('message', 'Message field label'),
  ]),
  obj('successScreen', 'Success screen', [
    str('label', 'Label'),
    txt('heading', 'Heading', 2),
    txt('body', 'Body', 2),
    str('buttonLabel', 'Button label'),
  ]),
  obj('quiz', 'Quiz', [
    arr('questions', 'Questions', 'quizQuestion'),
    str('resultText', 'Result text'),
  ]),
])

const contactPage = pageDoc('contactPage', 'Contact', [
  obj('hero', 'Hero', [str('tagline', 'Tagline'), str('heading', 'Heading'), str('buttonLabel', 'Button label')]),
  str('formHeading', 'Form heading'),
  obj('formLabels', 'Form labels', [
    str('name', 'Name field label'),
    str('company', 'Company field label'),
    str('email', 'Email field label'),
    str('phone', 'Phone field label'),
    str('message', 'Message field label'),
    str('submit', 'Submit button label'),
  ]),
  str('successMessage', 'Success message'),
  str('errorMessage', 'Error message'),
])

const shopPage = pageDoc('shopPage', 'Shop', [
  obj('hero', 'Hero', [str('eyebrow', 'Eyebrow'), str('heading', 'Heading'), str('subhead', 'Subheading')]),
  str('gridLabel', 'Grid label'),
])

const termsPage = pageDoc('termsPage', 'Terms & Conditions', [
  str('title', 'Title'),
  defineField({name: 'body', title: 'Body', type: 'array', of: [{type: 'block'}], description: 'Legal copy as rich text.'}),
])

export default [
  siteSettings,
  homePage,
  clubPage,
  spacesPage,
  manifestoPage,
  membershipsPage,
  applyPage,
  contactPage,
  shopPage,
  termsPage,
]
