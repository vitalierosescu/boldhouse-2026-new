// Desk structure: page documents are singletons (one editable item each),
// shared content (tiers, testimonials, logos) are normal lists.

const SINGLETONS = [
  {id: 'homePage', title: 'Home'},
  {id: 'clubPage', title: 'Club'},
  {id: 'spacesPage', title: 'Spaces'},
  {id: 'manifestoPage', title: 'Manifesto'},
  {id: 'membershipsPage', title: 'Memberships'},
  {id: 'applyPage', title: 'Apply'},
  {id: 'contactPage', title: 'Contact'},
  {id: 'shopPage', title: 'Shop'},
  {id: 'termsPage', title: 'Terms & Conditions'},
]

const singletonItem = (S, {id, title}) =>
  S.listItem()
    .title(title)
    .id(id)
    .child(S.document().schemaType(id).documentId(id).title(title))

export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site Settings')),
      S.divider(),
      S.listItem()
        .title('Pages')
        .child(S.list().title('Pages').items(SINGLETONS.map((s) => singletonItem(S, s)))),
      S.divider(),
      S.documentTypeListItem('membershipTier').title('Membership tiers'),
      S.documentTypeListItem('testimonial').title('Testimonials'),
      S.documentTypeListItem('partnerLogo').title('Partner logos'),
    ])

// Hide singleton + global types from the default "create new document" menu.
export const singletonTypes = new Set([...SINGLETONS.map((s) => s.id), 'siteSettings'])
