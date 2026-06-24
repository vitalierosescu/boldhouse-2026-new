import {defineLocations} from 'sanity/presentation'

export const resolve = {
  locations: {
    // Page singletons — each maps to exactly one URL
    homePage: defineLocations({
      select: {title: 'hero.headline'},
      resolve: () => ({locations: [{title: 'Home', href: '/'}]}),
    }),
    clubPage: defineLocations({
      select: {title: 'hero.title'},
      resolve: () => ({locations: [{title: 'Club', href: '/club.html'}]}),
    }),
    spacesPage: defineLocations({
      select: {title: 'hero.title'},
      resolve: () => ({locations: [{title: 'Spaces', href: '/spaces.html'}]}),
    }),
    manifestoPage: defineLocations({
      select: {title: '_type'},
      resolve: () => ({locations: [{title: 'Manifesto', href: '/manifesto.html'}]}),
    }),
    membershipsPage: defineLocations({
      select: {title: 'heading'},
      resolve: () => ({locations: [{title: 'Memberships', href: '/memberships.html'}]}),
    }),
    applyPage: defineLocations({
      select: {title: 'hero.headline'},
      resolve: () => ({locations: [{title: 'Apply', href: '/apply.html'}]}),
    }),
    contactPage: defineLocations({
      select: {title: 'hero.heading'},
      resolve: () => ({locations: [{title: 'Contact', href: '/contact.html'}]}),
    }),
    shopPage: defineLocations({
      select: {title: 'hero.heading'},
      resolve: () => ({locations: [{title: 'Shop', href: '/shop.html'}]}),
    }),
    termsPage: defineLocations({
      select: {title: 'title'},
      resolve: () => ({locations: [{title: 'Terms & Conditions', href: '/terms-and-conditions.html'}]}),
    }),
    siteSettings: defineLocations({
      select: {title: 'footerHeading'},
      resolve: () => ({
        locations: [
          {title: 'Home (footer/CTA)', href: '/'},
          {title: 'Club (footer/CTA)', href: '/club.html'},
        ],
      }),
    }),

    // Shared document types — appear on multiple pages
    membershipTier: defineLocations({
      select: {title: 'name'},
      resolve: (doc) => ({
        locations: [
          {title: `${doc?.title || 'Tier'} — Memberships`, href: '/memberships.html'},
          {title: `${doc?.title || 'Tier'} — Apply`, href: '/apply.html'},
        ],
      }),
    }),
    testimonial: defineLocations({
      select: {title: 'authorName'},
      resolve: (doc) => ({
        locations: [
          {title: `${doc?.title || 'Testimonial'} — Home`, href: '/'},
          {title: `${doc?.title || 'Testimonial'} — Club`, href: '/club.html'},
        ],
      }),
    }),
    partnerLogo: defineLocations({
      select: {title: 'name'},
      resolve: (doc) => ({
        locations: [{title: `${doc?.title || 'Logo'} — Club`, href: '/club.html'}],
      }),
    }),
  },
}
