// Seed Sanity with the site's current content + content images.
// Idempotent: uses createOrReplace with stable IDs. Run: node scripts/seed-sanity.mjs
import 'dotenv/config'
import {createClient} from '@sanity/client'
import {readFileSync, existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, join, basename} from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = join(__dirname, '..', 'images')

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-06-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

if (!process.env.SANITY_API_TOKEN) {
  console.error('Missing SANITY_API_TOKEN in .env'); process.exit(1)
}

// --- image upload (cached by filename) ------------------------------------
const assetCache = new Map()
async function uploadImage(filename) {
  if (!filename) return null
  if (assetCache.has(filename)) return assetCache.get(filename)
  const filePath = join(IMAGES_DIR, filename)
  if (!existsSync(filePath)) {
    console.warn(`  ! image not found, skipping: ${filename}`)
    assetCache.set(filename, null)
    return null
  }
  const asset = await client.assets.upload('image', readFileSync(filePath), {filename: basename(filename)})
  console.log(`  ↑ uploaded ${filename}`)
  assetCache.set(filename, asset._id)
  return asset._id
}
const imageField = (assetId) =>
  assetId ? {_type: 'image', asset: {_type: 'reference', _ref: assetId}} : undefined

// --- portable text helpers -------------------------------------------------
let _k = 0
const key = () => `k${_k++}`
const span = (text, marks = []) => ({_type: 'span', _key: key(), text, marks})
const block = (children, style = 'normal') => ({_type: 'block', _key: key(), style, markDefs: [], children})
const para = (text) => block([span(text)])
const strongPara = (text) => block([span(text, ['strong'])])
const keyed = (arr) => arr.map((o) => ({_key: key(), ...o}))

async function run() {
  console.log('Uploading images…')
  // logical name -> filename
  const F = {
    homeHero: 'home-hero.avif',
    homeIntro: 'Club---1.avif',
    catClub: 'gallery-1.avif',
    catSpaces: 'space-vibe.avif',
    room1: 'image-3.avif', room2: 'home-hero.avif', room3: 'home-outro_1home-outro.avif',
    room4: 'image-4.avif', room5: 'h-room-1-new.avif',
    tab1: 'tab-1.jpg', tab2: 'hero.jpg', tab3: 'tab-1.jpg', tab4: 'focus_img.jpg',
    clubHero: 'Frame-1430105787.jpg',
    pillar1: 'Club---2.avif', pillar2: 'Club---1.avif', pillar3: 'Club---3.avif',
    gallery1: 'gallery-1.avif', gallery2: 'gallery-2.jpg', gallery3: 'gallery-3.jpg',
    perkWifi: 'image-26_1image 26.avif', perkBasement: 'image-3.avif', perkPhone: 'image-4.avif',
    perkFocus: 'Rectangle-2.avif', perkCommunity: 'image-28_1image 28.avif',
    perkPrint: 'image-20_1image 20.avif', perkBike: 'image-30_1image 30.avif',
    perkCenter: 'image-41_1image 41.avif',
    spacesHero: 'hero.jpg', spaceCard: 'WhatsApp-Image-2026-05-29-at-14.21.07.jpg',
    basement1: 'basement.jpg', basement2: 'osmo-slideshow-img-1_1osmo-slideshow-img-1.avif',
    basement3: 'osmo-slideshow-img-2_1osmo-slideshow-img-2.avif', basement4: 'osmo-slideshow-img-4_1osmo-slideshow-img-4.avif',
    logo1: 'Logo.png', logo2: 'Logo-5.png', logo3: 'Logo-3.png', logo4: 'Logo-7.png',
    logo5: 'Logo-6.png', logo6: 'Logo-1.png', logo7: 'Logo-4.png', logo8: 'Logo-2.png',
  }
  const A = {}
  for (const [k, file] of Object.entries(F)) A[k] = await uploadImage(file)
  const im = (k) => imageField(A[k])

  console.log('Writing shared documents…')
  // Membership tiers ------------------------------------------------------
  const tiers = [
    {
      _id: 'tier-member', _type: 'membershipTier', name: 'Member', slug: {_type: 'slug', current: 'member'},
      tagline: 'A foot in the door. A community on your side.',
      priceMonthly: '€148', priceQuarterly: '€90', priceYearly: '€70', highlight: false, order: 1,
      benefits: keyed([
        {_type: 'benefit', title: 'Community membership access', detail: 'Full member network and directory listing'},
        {_type: 'benefit', title: 'Member event invitations'},
        {_type: 'benefit', title: 'Barista coffee and all common areas'},
        {_type: 'benefit', title: 'Meeting room access (credits-based)'},
      ]),
    },
    {
      _id: 'tier-flexi', _type: 'membershipTier', name: 'Flexi', slug: {_type: 'slug', current: 'flexi'},
      tagline: 'Show up when it suits you.',
      priceMonthly: '€295', priceQuarterly: '€275', priceYearly: '€220', highlight: false, order: 2,
      benefits: keyed([
        {_type: 'benefit', title: 'Drop-in desk, first-come basis', detail: 'No lock-in, no minimum commitment'},
        {_type: 'benefit', title: 'High-speed wifi'},
        {_type: 'benefit', title: 'Barista-grade coffee'},
        {_type: 'benefit', title: 'Access to all common areas'},
        {_type: 'benefit', title: 'Member event invitations'},
        {_type: 'benefit', title: 'Print, scan, phone booths'},
      ]),
    },
    {
      _id: 'tier-fixed', _type: 'membershipTier', name: 'Fixed', slug: {_type: 'slug', current: 'fixed'},
      tagline: 'Your desk. Every day.',
      priceMonthly: '€395', priceQuarterly: '€375', priceYearly: '€335', highlight: true, order: 3,
      benefits: keyed([
        {_type: 'benefit', title: 'Dedicated desk — yours, every day', detail: '24/7 building access'},
        {_type: 'benefit', title: 'High-speed wifi'},
        {_type: 'benefit', title: 'Barista-grade coffee'},
        {_type: 'benefit', title: 'Access to all common areas'},
        {_type: 'benefit', title: 'Monthly meeting room credits'},
        {_type: 'benefit', title: 'Member events + priority booking'},
        {_type: 'benefit', title: 'Bold Basement member rates'},
        {_type: 'benefit', title: 'Community profile in member directory'},
      ]),
    },
  ]

  // Testimonials ----------------------------------------------------------
  const testimonials = [
    {_id: 'testimonial-home-jana', _type: 'testimonial', quote: 'I joined for the desk. I stayed for the people.', authorName: 'Jana V.', authorRole: 'Brand Designer', durationMonths: 32},
    {_id: 'testimonial-home-liam', _type: 'testimonial', quote: "It's the only place I've ever been genuinely excited to go to work.", authorName: 'Liam D.', authorRole: 'Architect', durationMonths: 32},
    {_id: 'testimonial-club-jana', _type: 'testimonial', quote: 'An inspiring co-working space with great people help me think inside the box and out of the box. I was becoming drained at home, but having a community driven coworking like this has really improved my overall mental.', authorName: 'Jana V.', authorRole: 'Brand Designer', durationMonths: 32},
    {_id: 'testimonial-club-liam', _type: 'testimonial', quote: 'An inspiring co-working space with great people help me think inside the box and out of the box. I was becoming drained at home.', authorName: 'Liam D.', authorRole: 'Architect', durationMonths: 32},
  ]

  // Partner logos ---------------------------------------------------------
  const logos = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    _id: `logo-${n}`, _type: 'partnerLogo', name: `Partner ${n}`, order: n, logo: im(`logo${n}`),
  }))

  const ref = (id) => ({_type: 'reference', _ref: id, _key: key()})

  for (const doc of [...tiers, ...testimonials, ...logos]) await client.createOrReplace(doc)

  console.log('Writing site settings…')
  await client.createOrReplace({
    _id: 'siteSettings', _type: 'siteSettings',
    footerHeading: 'Come as you are,\nleave bolder.',
    address: 'Sint-baafsplein 10,\nGent 9000,\nBelgium',
    email: 'info@bold.house',
    vatNumber: 'BE0438.558.081',
    copyright: '© 2026 Boldhouse. All rights reserved.',
    legalLinks: keyed([
      {_type: 'legalLink', label: 'Cookie Policy', href: 'terms-and-conditions.html'},
      {_type: 'legalLink', label: 'Privacy Policy', href: '#'},
    ]),
    memberCount: '124',
    locationText: 'Sint Baafsplein 10, in the heart of Ghent.',
    cta: {
      _type: 'ctaBlock',
      eyebrow: "Join the creative club and let's make it real",
      heading: "You're in the\nright place.",
      buttonLabel: 'Apply for membership',
      buttonLink: 'apply.html',
    },
  })

  console.log('Writing pages…')
  const OG = 'https://cdn.prod.website-files.com/69e0fdfc6da92a5c220bbe58/69ee24394fe5acc3c9655fb8_OG_Bold.jpg'

  await client.createOrReplace({
    _id: 'homePage', _type: 'homePage',
    seo: {_type: 'seo', metaTitle: 'Boldhouse'},
    hero: {
      headline: 'Come as you are,\nleave bolder.',
      subhead: 'A building in the centre of Ghent, where talented entrepreneurs do their thing. From freelance videographers over copywriters to IT geniuses.',
      ctaLabel: 'Apply for membership', ctaLink: 'apply.html', image: im('homeHero'),
    },
    heroLinks: keyed([
      {_type: 'heroLink', label: 'Club', number: '(01)', href: 'club.html'},
      {_type: 'heroLink', label: 'Spaces', number: '(02)', href: 'spaces.html'},
      {_type: 'heroLink', label: 'Manifesto', number: '(03)', href: 'manifesto.html'},
      {_type: 'heroLink', label: 'Apply', number: '(04)', href: 'contact.html'},
    ]),
    tagline: 'A coworking club for Bold entrepreneurs.',
    missionStatement: 'BOLDHOUSE EXISTS TO BRING TOGETHER PEOPLE WHO ARE BUILDING THINGS WORTH TALKING ABOUT. THROUGH SPACES, EVENTS, EXPERIENCES AND A COMMUNITY DESIGNED TO MAKE THINGS HAPPEN.',
    intro: {
      heading: 'A building in the centre of Ghent, where talented entrepreneurs do their thing.',
      body: "We keep the community intentionally small. Not because we're precious about it — but because we know that who's around you shapes what you make.\n\nWhen you share space with the right people, something happens. Collaboration. Referrals. Friendships. Ideas that wouldn't have existed anywhere else. That's what this building is for.",
      image: im('homeIntro'),
    },
    categoryCards: keyed([
      {_type: 'categoryCard', title: 'Club', description: "Discover what's in store for you.", buttonLabel: 'Apply for membership', buttonLink: 'club.html', image: im('catClub')},
      {_type: 'categoryCard', title: 'Spaces', description: "Discover what's in store for you.", buttonLabel: 'Explore spaces', buttonLink: 'spaces.html', image: im('catSpaces')},
    ]),
    rooms: {
      heading: 'In the center of everything, plenty of room.',
      roomItems: keyed([
        {_type: 'roomItem', name: 'The Open Floor', number: '01', image: im('room1')},
        {_type: 'roomItem', name: 'Private Desks', number: '02', image: im('room2')},
        {_type: 'roomItem', name: 'Meeting Room', number: '03', image: im('room3')},
        {_type: 'roomItem', name: 'The Kitchen', number: '04', image: im('room4')},
        {_type: 'roomItem', name: 'Bold Basement', number: '05', image: im('room5')},
      ]),
    },
    reviews: {
      eyebrow: 'Words from our members', heading: 'A growing community',
      testimonials: [ref('testimonial-home-jana'), ref('testimonial-home-liam')],
      memberCountDesc: 'active members. Designers, architects, founders, makers. People who choose who they work next to.',
    },
    location: {
      label: '[ Locations ]',
      text: 'Sint Baafsplein 10, in the heart of Ghent. A building with edges, in the centre of everything. More locations coming — 2027–2028.',
    },
    allSection: {
      heading: "More than a coworking.\nDiscover what's going on.",
      subtext: 'Club, shop, studio, events — all of it in one building.',
      tabs: keyed([
        {_type: 'homeTab', title: "What's planned", description: "Member events, basement rentals, workshops, and open sessions. Check what's on — and what's coming up.", image: im('tab1'), exampleLabel: 'Skincare Soiree by Nourist'},
        {_type: 'homeTab', title: 'Bold Lab', description: 'The creative agency behind Boldhouse. Video, content, social, and brand — for companies that take craft seriously.', image: im('tab2')},
        {_type: 'homeTab', title: 'Shop', description: 'Bold objects for bold people. The same coffee we drink every morning at Sint Baafsplein, plus caps, hoodies, and limited drops.', image: im('tab3')},
        {_type: 'homeTab', title: 'Network benefits', description: 'A curated community of designers, architects, filmmakers, and strategists. Collaboration happens because of proximity — this is the proximity.', image: im('tab4')},
      ]),
    },
  })

  await client.createOrReplace({
    _id: 'clubPage', _type: 'clubPage',
    seo: {_type: 'seo', metaTitle: 'Club', ogImage: undefined},
    hero: {title: 'A community for the likeminded, right nextdoor', body: "Boldhouse is home to designers, architects, filmmakers, strategists, and builders. We don't take just.", image: im('clubHero')},
    heroLinks: keyed([
      {_type: 'heroLink', label: 'Perks of joining', number: '01', href: 'spaces.html'},
      {_type: 'heroLink', label: 'The three pillars', number: '02', href: 'spaces.html'},
      {_type: 'heroLink', label: 'Bold members', number: '03', href: 'spaces.html'},
      {_type: 'heroLink', label: 'Community', number: '04', href: 'spaces.html'},
    ]),
    perksEyebrow: 'What everyone gets',
    perks: keyed([
      {_type: 'perk', title: 'High-speed wifi', label: '[ OPEN CASE ]', image: im('perkWifi')},
      {_type: 'perk', title: 'Barista-grade coffee', label: '[ OPEN CASE ]', image: im('perkWifi')},
      {_type: 'perk', title: 'Stocked drinks fridge', label: '[ OPEN CASE ]', image: im('perkWifi')},
      {_type: 'perk', title: 'Member events access', label: '[ OPEN CASE ]', image: im('perkWifi')},
      {_type: 'perk', title: 'The Bold Basement', label: '[ OPEN CASE ]', image: im('perkBasement')},
      {_type: 'perk', title: 'Phone booths', label: '[ OPEN CASE ]', image: im('perkPhone')},
      {_type: 'perk', title: 'Focus areas', label: '[ OPEN CASE ]', image: im('perkFocus')},
      {_type: 'perk', title: 'Community member', label: '[ OPEN CASE ]', image: im('perkCommunity')},
      {_type: 'perk', title: 'Partner perks', label: '[ OPEN CASE ]', image: im('perkWifi')},
      {_type: 'perk', title: 'Printing + scanning', label: '[ OPEN CASE ]', image: im('perkPrint')},
      {_type: 'perk', title: 'Bike storage', label: '[ OPEN CASE ]', image: im('perkBike')},
      {_type: 'perk', title: 'Located in the center', label: '[ OPEN CASE ]', image: im('perkCenter')},
    ]),
    partnerLogos: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ref(`logo-${n}`)),
    pillars: keyed([
      {_type: 'pillar', title: 'Network', subtitle: 'that gains you an unfair advantage on moving your business', image: im('pillar1'),
        items: ['Monthly lunch by Balls & Glory', 'Massage Tuesday', 'Wine-downs in the evening', 'Event type 4', 'Event type 5', 'Event type 6', 'Event type 7', 'Event type 8', 'Event type 9', 'Event type 10']},
      {_type: 'pillar', title: 'Events', subtitle: 'On a regular basis that keep you engaged', image: im('pillar2'),
        items: Array(10).fill('Monthly lunch by Balls & Glory')},
      {_type: 'pillar', title: 'Workstation', subtitle: "that you'll actually enjoy coming to", image: im('pillar3'),
        items: Array(9).fill('Monthly lunch by Balls & Glory')},
    ]),
    reviews: {
      eyebrow: 'Words from our members', heading: 'A growing community',
      testimonials: [ref('testimonial-club-jana'), ref('testimonial-club-liam')],
    },
    stepsSection: {
      eyebrow: 'How it works', heading: 'Tons of benefits',
      body: "Boldhouse is home to designers, architects, filmmakers, strategists, and builders. We don't take just anyone - not because we're precious, but because we know who's around you shapes what you make. This is the club.",
      benefitCards: keyed([
        {_type: 'benefitCard', title: 'Benefit 1', description: "Boldhouse is home to designers, architects, filmmakers, strategists, and builders. We don't take just anyone - not because we're preciou.", icon: 'pencil'},
        {_type: 'benefitCard', title: 'Benefit 2', description: "Boldhouse is home to designers, architects, filmmakers, strategists, and builders. We don't take just anyone - not because we're preciou.", icon: 'pencil-pink'},
        {_type: 'benefitCard', title: 'Benefit 3', description: "Boldhouse is home to designers, architects, filmmakers, strategists, and builders. We don't take just anyone - not because we're preciou.", icon: 'wrench-green'},
      ]),
    },
    gallery: keyed([
      {_type: 'galleryImage', image: im('gallery1')},
      {_type: 'galleryImage', image: im('gallery2')},
      {_type: 'galleryImage', image: im('gallery3')},
      {_type: 'galleryImage', image: im('gallery1')},
      {_type: 'galleryImage', image: im('gallery1')},
    ]),
    faqHeading: 'FAQs',
    faqs: keyed([
      {_type: 'faqItem', question: 'How do I become a member?', answer: "Browse our membership tiers, pick one that fits, and apply directly. We'll be in touch within 48 hours."},
      {_type: 'faqItem', question: 'Can I visit before committing?', answer: "Yes. Book a tour and we'll show you around."},
      {_type: 'faqItem', question: 'Who are the members at Boldhouse?', answer: "Designers, architects, filmmakers, strategists, copywriters, developers. People who take their craft seriously. We curate the community — that's the point."},
      {_type: 'faqItem', question: "What's the difference between Flexi and Fixed?", answer: 'Flexi is drop-in — come when you want, no commitment. Fixed gives you a dedicated desk, yours to keep.'},
      {_type: 'faqItem', question: 'Is the Resident membership open?', answer: "We keep Resident capacity small on purpose. Inquire and we'll let you know what's available."},
      {_type: 'faqItem', question: 'Can I host an event at Boldhouse?', answer: 'Yes. The Bold Basement is available for seminars, screenings, shoots, workshops, and more. Email us at hello@boldhouse.space.'},
      {_type: 'faqItem', question: 'Where are you located?', answer: 'Sint Baafsplein 10, in the heart of Ghent. Hard to miss.'},
      {_type: 'faqItem', question: 'Is Boldhouse only for freelancers?', answer: 'No. We have freelancers, founders, agencies, and small teams. If you make things worth talking about, you belong here.'},
    ]),
  })

  await client.createOrReplace({
    _id: 'spacesPage', _type: 'spacesPage',
    seo: {_type: 'seo', metaTitle: 'Spaces'},
    hero: {title: 'the space to launch your next idea', body: 'A restored townhouse on Sint Baafsplein. Rooms shaped for deep work, conversations that matter, and the "occasional" long lunch.', image: im('spacesHero')},
    heroLinks: keyed([
      {_type: 'heroLink', label: 'Room', number: '01', href: 'spaces.html'},
      {_type: 'heroLink', label: 'Link 2', number: '02', href: 'spaces.html'},
      {_type: 'heroLink', label: 'Link 3', number: '03', href: 'spaces.html'},
      {_type: 'heroLink', label: 'Another one', number: '04', href: 'spaces.html'},
    ]),
    spaceCards: keyed(Array.from({length: 7}, () => ({
      _type: 'spaceCard', title: 'Dining', number: '01',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', image: im('spaceCard'),
    }))),
    location: {
      eyebrow: '[ Locations ]',
      text: "One location, built with intention. Sint Baafsplein 10, Ghent — a building that earns its place. More locations coming in 2027–2028. We're building this the way everything here gets built: deliberately.",
      locationItems: keyed([
        {_type: 'locationItem', title: 'Ghent', text: 'Sint Baafsplein 10,\nBelgium', cta: 'Show me the way', href: '#'},
        {_type: 'locationItem', title: '[...loading...]', text: 'Going global,\nstay tuned.'},
      ]),
    },
    basement: {
      eyebrow: '[ The basement ]', heading: 'Basement',
      description: "Boldhouse is home to designers, architects, filmmakers, strategists, and builders. We don't take just anyone - not because we're precious, but because we know who's around you shapes what you make. This is the club.",
      slides: keyed([
        {_type: 'galleryImage', image: im('basement1')},
        {_type: 'galleryImage', image: im('basement2')},
        {_type: 'galleryImage', image: im('basement3')},
        {_type: 'galleryImage', image: im('basement4')},
      ]),
    },
    faqHeading: 'FAQs',
    faqs: keyed([
      {_type: 'faqItem', question: 'What spaces are available?', answer: 'Drop-in desks, fixed desks, meeting rooms, and the Bold Basement event venue. Each serves a different kind of work.'},
      {_type: 'faqItem', question: 'How do I book a meeting room?', answer: 'Via Archie, our member platform. Booking is available to all active members.'},
      {_type: 'faqItem', question: 'What is the Bold Basement?', answer: '200m² of flexible event space in the heart of Ghent. Seminars, screenings, shoots, workshops — it fits whatever you bring. Email hello@boldhouse.space to inquire.'},
      {_type: 'faqItem', question: 'Is the Basement available for non-members?', answer: 'Yes. External rental is possible. Email us at hello@boldhouse.space for rates and availability.'},
      {_type: 'faqItem', question: "What's included with every desk?", answer: 'High-speed wifi, barista-grade coffee, printing, phone booths, and access to all common areas.'},
      {_type: 'faqItem', question: 'Do you offer day passes?', answer: 'Yes, via a Flexi membership. Drop in when it suits you — no commitment, no minimum.'},
      {_type: 'faqItem', question: 'Is there 24/7 access?', answer: 'Fixed and Resident members have 24/7 building access. Flexi members work during standard hours.'},
      {_type: 'faqItem', question: 'Where are you located?', answer: 'Sint Baafsplein 10, in the heart of Ghent. Hard to miss.'},
    ]),
  })

  await client.createOrReplace({
    _id: 'manifestoPage', _type: 'manifestoPage',
    seo: {_type: 'seo', metaTitle: 'Manifesto'},
    body: [
      block([span('We are '), span('creators, entrepreneurs, and visionaries.', ['strong']), span(' We challenge the status quo, break the mold, and build without permission.')]),
      block([span('At Boldhouse, we believe in the power of '), span('creative entrepreneurship', ['strong']), span('. where ideas are free to grow, risks are meant to be taken, and failure is just another step forward.')]),
      block([span('We stand for '), span('diversity, inclusion, and equal opportunity.', ['strong']), span(' Gay rights, human rights, and the right to be unapologetically yourself, here, identity is celebrated, not tolerated.')]),
      block([span('We are '), span('a global community.', ['strong']), span(' From local dreamers to worldwide changemakers, we connect bold minds across borders. '), span('Ideas have no boundaries. Neither do we.', ['strong'])]),
      block([span('We thrive on '), span('collaboration over competition.', ['strong']), span(' Success isn’t a solo journey; it’s a shared experience.')]),
      block([span('We reject the ordinary. We embrace the messy, the disruptive, and the unknown. '), span('Innovation happens in discomfort. Growth happens when we dare.', ['strong'])]),
      block([span('This is not just a workspace.')]),
      block([span('This is a movement.'), span('Create. Connect. Be Bold.', ['strong'])]),
    ],
  })

  await client.createOrReplace({
    _id: 'membershipsPage', _type: 'membershipsPage',
    seo: {_type: 'seo', metaTitle: 'Memberships'},
    heading: 'Memberships',
    toggleDescription: 'Credits are used to schedule the meeting rooms.',
    tiers: [ref('tier-member'), ref('tier-flexi'), ref('tier-fixed')],
    faqHeading: 'FAQs',
    faqs: keyed([
      {_type: 'faqItem', question: 'How do I become a member?', answer: "Browse our membership tiers, pick one that fits, and apply directly. We'll be in touch within 48 hours."},
      {_type: 'faqItem', question: "What's the difference between Flexi and Fixed?", answer: 'Flexi is drop-in — come when you want, no commitment. Fixed gives you a dedicated desk, yours to keep.'},
      {_type: 'faqItem', question: 'Is the Resident membership open?', answer: "We keep Resident capacity small on purpose. Inquire and we'll let you know what's available."},
      {_type: 'faqItem', question: 'Can I visit before committing?', answer: "Yes. Book a tour and we'll show you around."},
      {_type: 'faqItem', question: 'Can I upgrade my membership tier?', answer: "Yes. Upgrades are always possible, subject to availability. Get in touch and we'll sort it."},
      {_type: 'faqItem', question: 'Is there a minimum commitment?', answer: 'Flexi has none — pay per visit. Fixed and Resident are monthly commitments. Minimum contract periods apply.'},
      {_type: 'faqItem', question: 'Do you offer team memberships?', answer: 'For small teams, we can arrange multiple Fixed desks. Reach out at hello@boldhouse.space.'},
      {_type: 'faqItem', question: 'What happens if I want to cancel?', answer: 'Fixed and Resident memberships require notice as stated in your membership agreement. Flexi has no cancellation — just stop coming.'},
    ]),
  })

  await client.createOrReplace({
    _id: 'applyPage', _type: 'applyPage',
    seo: {_type: 'seo', metaTitle: 'Apply'},
    hero: {tagline: 'Takes about 3 minutes', headline: 'Your Boldhouse\nApplication\nStarts Here.', startLabel: 'Start'},
    tierStepTitle: '1. Choose your membership',
    tiers: [ref('tier-member'), ref('tier-flexi'), ref('tier-fixed')],
    quizTriggerLabel: 'Not sure which fits? Help me choose',
    formStepTitle: '2. About you',
    formLabels: {
      name: 'Name & last name', nameError: 'Please enter your name.',
      company: 'Company', email: 'E-mail', emailError: 'Please enter a valid email address.',
      discipline: 'What do you do?', disciplinePlaceholder: 'e.g. Brand Designer, Architect', disciplineError: 'Tell us what you do.',
      message: 'Message',
    },
    successScreen: {label: 'Application received', heading: "We'll be in touch\nwithin 48 hours.", body: "Got it. We'll review your application and follow up shortly.", buttonLabel: 'Back to home'},
    quiz: {
      questions: keyed([
        {_type: 'quizQuestion', question: 'How do you work?', answers: ['Hybrid', 'Remote', 'Freelancer']},
        {_type: 'quizQuestion', question: 'How often will you come in?', answers: ['Occasionally', 'Couple days', 'Most days']},
        {_type: 'quizQuestion', question: "Want a desk that's always yours?", answers: ['Yes', 'No']},
      ]),
      resultText: 'We think Flexi is your fit.',
    },
  })

  await client.createOrReplace({
    _id: 'contactPage', _type: 'contactPage',
    seo: {_type: 'seo', metaTitle: 'Contact'},
    hero: {tagline: 'See what fits you', heading: 'Apply now', buttonLabel: 'Go back to home'},
    formHeading: 'Get in touch',
    formLabels: {name: 'name & last name', company: 'company', email: 'e-mail', phone: 'Phone', message: 'Message', submit: 'Send'},
    successMessage: "Success! We'll be in touch soon.",
    errorMessage: 'Something went wrong while submitting.',
  })

  await client.createOrReplace({
    _id: 'shopPage', _type: 'shopPage',
    seo: {_type: 'seo', metaTitle: 'Shop'},
    hero: {eyebrow: 'Goods for people who make things', heading: 'Shop', subhead: 'Coffee, caps, hoodies and limited drops.'},
    gridLabel: 'All goods',
  })

  await client.createOrReplace({
    _id: 'termsPage', _type: 'termsPage',
    seo: {_type: 'seo', metaTitle: 'Terms & Conditions | Boldhouse', metaDescription: 'Boldhouse terms and conditions. Creative coworking space at Sint-Baafsplein 10, 9000 Ghent.'},
    title: 'Algemene verkoopsvoorwaarden',
    body: TERMS_SECTIONS.flatMap(([h, b]) => [strongPara(h), para(b)]),
  })

  console.log('\nSeed complete.')
}

const TERMS_SECTIONS = [
  ['1. Toepasselijkheid', 'Deze algemene verkoopsvoorwaarden zijn van toepassing op alle aanbiedingen, verkopen en leveringen van RÖLING IMPORT aan professionele klanten (B2B), tenzij uitdrukkelijk en schriftelijk anders overeengekomen. Door het plaatsen van een bestelling erkent de koper kennis te hebben genomen van deze voorwaarden en ze volledig te aanvaarden. Afwijkingen zijn enkel geldig indien zij voorafgaand en schriftelijk door RÖLING IMPORT werden bevestigd en gelden uitsluitend voor de betrokken overeenkomst.'],
  ['2. Vertegenwoordiging', 'Bemiddelaars, agenten of vertegenwoordigers zijn niet gemachtigd om RÖLING IMPORT rechtsgeldig te verbinden, tenzij zij beschikken over een schriftelijke volmacht.'],
  ['3. Prijzen', 'Alle prijzen zijn exclusief BTW en andere heffingen. RÖLING IMPORT behoudt zich het recht voor om prijzen aan te passen in geval van wijzigingen in grondstofprijzen, transportkosten, douanerechten, belastingen of andere externe factoren die onafhankelijk zijn van haar wil.'],
  ['4. Levering en overmacht', 'Leveringstermijnen zijn indicatief en niet bindend, tenzij uitdrukkelijk anders overeengekomen. Vertraging in de levering kan geen aanleiding geven tot ontbinding of schadevergoeding RÖLING IMPORT is niet aansprakelijk voor niet-nakoming van haar verplichtingen in geval van overmacht of onvoorziene omstandigheden in de zin van artikel 5.226 e.v. van het Burgerlijk Wetboek (zoals o.m. staking, brand, diefstal, panne, transportproblemen, vertraging bij leveranciers, enz.).'],
  ['5. Annulering', 'De koper kan een bestelling niet annuleren zonder schriftelijk akkoord van RÖLING IMPORT. Bij niet-toegelaten annulering blijft de volledige koopprijs verschuldigd, onverminderd het recht van RÖLING IMPORT op bijkomende schadevergoeding.'],
  ['6. Risico en levering', 'Het risico op verlies of beschadiging van de goederen gaat over op de koper zodra de goederen het magazijn van RÖLING IMPORT verlaten, ook bij levering franco huis. De goederen worden geacht te zijn aanvaard bij ontvangst, tenzij de koper uiterlijk binnen acht (8) dagen na levering een schriftelijke klacht indient.'],
  ['7. Klachten en verborgen gebreken', 'Klachten over zichtbare gebreken moeten binnen acht (8) dagen na levering per aangetekend schrijven worden meegedeeld. Klachten over verborgen gebreken moeten worden gemeld binnen een redelijke termijn en uiterlijk acht (8) dagen na ontdekking ervan. Elke klacht schorst de betalingsverplichting niet. De aansprakelijkheid van RÖLING IMPORT voor gebrekkige producten is beperkt tot kosteloze vervanging of terugbetaling van de betrokken goederen, naar keuze van RÖLING IMPORT.'],
  ['8. Aansprakelijkheid', 'De aansprakelijkheid van RÖLING IMPORT is in elk geval beperkt tot de directe schade en tot maximaal het bedrag van de betreffende factuur, exclusief BTW. RÖLING IMPORT is nooit aansprakelijk voor indirecte of gevolgschade, zoals winstderving, productieverlies, of bedrijfsstilstand.'],
  ['9. Betalingsvoorwaarden', '9.1. Betalingen gebeuren uitsluitend op de rekening van RÖLING IMPORT vermeld op de factuur. 9.2. Facturen zijn betaalbaar binnen dertig (30) dagen na factuurdatum, tenzij schriftelijk anders overeengekomen. 9.3. Bij laattijdige betaling is van rechtswege en zonder ingebrekestelling een nalatigheidsinterest verschuldigd overeenkomstig de Wet van 2 augustus 2002 betreffende de bestrijding van betalingsachterstand in handelstransacties (de toepasselijke handelsrente gepubliceerd door de FOD Financiën). Daarnaast is een forfaitaire schadevergoeding verschuldigd van 10% van het openstaande bedrag, met een minimum van €150. 9.4. Elke niet-betaling op vervaldag maakt alle andere, zelfs nog niet vervallen facturen onmiddellijk opeisbaar. RÖLING IMPORT behoudt zich het recht voor verdere leveringen op te schorten of voorafbetaling te eisen.'],
  ['10. Eigendomsvoorbehoud', 'De geleverde goederen blijven eigendom van RÖLING IMPORT tot volledige betaling van de hoofdsom, intresten en kosten. Tot die tijd mag de koper de goederen niet doorverkopen, verpanden of verwerken zonder schriftelijke toestemming. In geval van wanbetaling heeft RÖLING IMPORT het recht de goederen terug te nemen, zonder voorafgaande ingebrekestelling.'],
  ['11. Insolventie', 'Indien de koper in staat van kennelijk onvermogen verkeert, beslag ondergaat of een procedure van gerechtelijke reorganisatie of faillissement aanvraagt, worden alle openstaande facturen onmiddellijk opeisbaar en kan RÖLING IMPORT de lopende overeenkomsten van rechtswege en zonder voorafgaande kennisgeving ontbinden.'],
  ['12. Toepasselijk recht en bevoegde rechtbank', 'Op alle overeenkomsten is uitsluitend het Belgisch recht van toepassing. Voor alle geschillen zijn uitsluitend de rechtbanken van Antwerpen (afdeling Antwerpen) bevoegd. RÖLING IMPORT behoudt zich evenwel het recht voor te dagvaarden voor de rechtbank van de woonplaats of zetel van de koper.'],
]

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
