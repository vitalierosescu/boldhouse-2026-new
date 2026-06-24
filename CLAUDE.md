## Dev Setup

- This folder (`boldhouse-2026.webflow`) is the primary development project — it is both the Webflow export AND the Vite source.
- **Build**: `yarn dev` (Vite at `:4747`, HMR), `yarn build` (UMD → `dist/main.js`). **Deploy build**: `yarn build:deploy` (Vite + Eleventy → `_site/`, then copies `main.js` to the site root) — this is what Vercel runs.
- HTML pages use a smart script loader: tries `localhost:4747` first, falls back to the relative `/main.js` (production, same-origin — works on any domain).
- If `:4747` isn't running, the loader falls back to `/main.js`, which only resolves on a full build (`yarn build:deploy` or the deployed site) — `yarn site:dev` alone does NOT serve it. Run `yarn dev` for local JS.
- `src/main.js` is the Vite entry point (UMD, externalises gsap/three/barba/lenis/jquery).
- `src/shop/` contains the Shopify headless integration (client, cart state, drawer, nav badge, shop/product pages).
- `dev-webflow/` is the OLD source project — it is now superseded by this one.

### Local dev & verification gotchas

- **Viewing pages locally needs BOTH servers**: `yarn dev` (Vite `:4747`, serves `src/main.js`) **and** `yarn site:dev` (Eleventy, serves the built HTML at `:8383`). Vite alone isn't enough — it only serves the JS bundle.
- **Vite MUST be on `:4747`.** The page loader only checks `localhost:4747`; if `:4747` is taken, Vite silently uses `:4001` and the loader's `/main.js` fallback won't resolve on the Eleventy dev server, so pages load **no JS** instead of your local changes. If a page seems to ignore your edits, free `:4747` and restart `yarn dev` (`lsof -ti :4747 | xargs kill -9`).
- **Don't run `yarn site:build` while `yarn site:dev` is running** — it can SIGTERM the serve. Eleventy `--serve` also occasionally misses root `.html` edits; restart it or do a one-off `yarn site:build` (after stopping the serve) to force a rebuild.
- **Vercel deploys the full site** (`vercel.json` → `yarn build:deploy`, output `_site`). Pushing to `main` rebuilds + deploys HTML + CSS + JS (incl. `/main.js`) and re-fetches Sanity CMS at build time. Production project `boldhouse-2026-new` (alias `boldhouse-2026-new.vercel.app`); custom domain `bold.house`. Build-time env vars (Sanity + Shopify) are set in Vercel project settings (Production).
- **To screenshot a loading/skeleton state**, localhost serves the fetch instantly. Throttle with chrome-devtools `emulate` `cpuThrottlingRate: 20` + navigate `ignoreCache: true` + short timeout. Network throttling alone won't hold it (cache serves fast).

## Shop / Shopify

- Shopify store: `boldhouse-masnmd9c.myshopify.com` (Storefront API, headless).
- Cart state persists via localStorage key `boldhouse_cart_id`.
- Cart drawer and nav badge are global (init once, survive Barba page transitions).
- Shop listing page: `shop.html` (`data-barba-namespace="shop"`).
- Product detail page: `shop-product.html?handle=<handle>` (`data-barba-namespace="product"`).
- Styles for all shop UI live in `css/shop.css`. It drives every colour through the shared theme tokens (`--_theme---*`, `--swatch--dark-*`, `--brand--accent`) — **do not hardcode `rgba(13,14,14,X)`**; `rgba()` only as a `var()` fallback.
- **The shop is light** — which matches the site's *default* theme (the site is light by default with dark sections layered in). The PDP (`shop-product.html`) is a No Art-style editorial 2-column layout: gallery (left) + buy column + meta blocks (Materials/Care/Size & fit/Delivery, from `custom.*` metafields) below the CTA (right); plus "You might also like" (Shopify `productRecommendations`) and prev/next nav.
- See `.claude/docs/shop-implementation.md` for the full implementation reference.

## Sanity CMS

All 9 site pages are wired to Sanity (project `szr2k18n`, dataset `production`) at build time. Content flows: Sanity → `_data/cms.js` (GROQ) → Nunjucks templates. No client-side Sanity calls.

- **`_data/cms.js`** — one combined GROQ query, returns `{home, club, spaces, manifesto, memberships, apply, contact, shop, terms}`. Templates use `{{ cms.home.hero.headline }}` etc.
- **`_data/site.js`** — fetches `siteSettings` singleton (footer, CTA block, memberCount). Falls back to static object if no token.
- **`studio/`** — Sanity Studio. Run `npm run dev` from inside `studio/` to start on `:3939`. Open in Chrome/Safari (Arc has auth issues).
- **`scripts/seed-sanity.mjs`** — idempotent seed script. Populates all singletons + shared docs from current HTML copy. Re-run to reset to baseline: `node scripts/seed-sanity.mjs`.
- **Shared document types**: `membershipTier`, `testimonial`, `partnerLogo` — edited once, referenced from multiple pages.
- **Events are NOT in Sanity** — they come from Archie. No `event` schema, no `_data/events.js`.
- **Studio is deployed** → `https://boldhouse.sanity.studio` (appId in `studio/sanity.cli.js`, `autoUpdates: true`). Re-deploy after schema changes: `cd studio && npx sanity deploy`. The Presentation preview targets `https://bold.house` via `SANITY_STUDIO_PREVIEW_URL` in `studio/.env`.
- **The full site is hosted on Vercel** via `yarn build:deploy` (`_site/`). Content auto-rebuild: a Sanity publish webhook (manage.sanity.io → API → Webhooks) POSTs to a Vercel Deploy Hook (project Settings → Git → Deploy Hooks, branch `main`) on create/update/delete in `production`.
- **Terms page**: currently seeded with placeholder RÖLING IMPORT legal text. Dennis needs to replace via Studio.

Nunjucks filters (in `eleventy.config.js`): `sanityImage(img, w, h?)` (optimized CDN URL), `portableText(blocks)` (rich text → HTML), `breaks(str)` (newlines → `<br>`), `richInline(blocks)` (portable text, blocks joined by double-br).

## Design & Collaboration Workflow

- **The site is LIGHT by default**, with dark sections layered in via theme tokens (`.u-theme-dark`, `data-theme-page-to="dark"` on heroes/footer CTA). The auto-synced **Brand Guidelines block below is aspirational** — its "#000000 background / #ffffff text" does NOT describe the built site. For any theme/colour decision, read the real pages + `css/boldhouse-2026.webflow.css` (`--_theme---*` / `--swatch--*`), never the brand-guide summary.
- **Favour restraint** for this brand (Soho House / The Hoxton / Gil Huybrechts): smooth scroll, whitespace, refined hovers, photography-led. Heavy per-item scroll reveals read cheap here. When a stated brief ("bold") conflicts with the brand references (restraint), weight the references and confirm.
- **Show a concrete proof early.** For design/motion, get one element in front of the user (screenshot / single interaction) before building a whole direction — taste is calibrated on concrete output, not on abstract questionnaire answers.
- **Build in verified checkpoints.** Ship a slice, prove it with a real browser screenshot + console check + (for motion) a perf trace, get a quick thumbs-up, then expand.
- **Spec locations:** brainstorming specs → `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`; living reference docs → `.claude/docs/`.

<!-- BRAND-GUIDELINES-START -->
## Brand Guidelines

### Colors

- **Page Background**: `#000000`
- **Primary Text**: `#ffffff`
- **Card Surface**: `#222222`
- **Deep Surface**: `#131313`
- **Brand Dark**: `#0d0e0e`
- **Dark Secondary**: `#2b2b2b`
- **Electric Cyan (Brand Accent)**: `#82eeff`
- **Muted Border**: `#dddddd`
- **Secondary Text**: `#333333`
- **Warm Beige**: `#e3dbd0`
- **Beige Light**: `#f2f0e6`
- **Powder Blue**: `#cddfff`
- **Soft Pink**: `#e7c9f5`
- **Sage Green**: `#e5e6de`

### Fonts

- **Display**: Trade Gothic
- **Display**: National 2 Consensed
- **Heading**: Fraunces Variable
- **Body**: Montserrat
- **Body**: Source Serif 4

### Voice & Tone

- Tone: Bold, confident, and aspirational — speaks with authority without feeling corporate or cold
- Vocabulary: Declarative and concise. Short punchy sentences. Active, action-oriented language that assumes the reader belongs here
- Personality: Ambitious but human. Community-first. Premium without being exclusive or stiff. Slightly editorial in register
- Do: Use imperative verbs and strong declarations ('Come as you are', 'Apply', 'Build things worth talking about'). Lean into contrast and duality. Speak to belonging and becoming. Use bracketed asides [ like this ] for editorial emphasis
- Don't: Use corporate buzzwords or jargon. Avoid passive voice, hedging language, or excessive qualifiers. Never be generic ('Lorem ipsum' placeholders are a red flag). Don't oversell — let the community and space speak for themselves
- Formatting note: All-caps sparingly for mission-level statements. Numbered navigation items signal intentionality and editorial craft

### Border Radii

- **Sharp**: `2px`
- **Subtle**: `3px`
- **Card**: `20px`
- **Pill**: `100px`
- **Circle**: `50%`

### Spacing

- **Tight**: `8px`
- **Base**: `1rem`
- **Comfortable**: `24px`
- **Relaxed**: `40px`
- **Section**: `4rem`
- **Spacious**: `6rem`

### Usage Guide

#### Colors

This is a dark-themed brand. Use Page Background #000000 for the main canvas, Deep Surface #131313 and Card Surface #222222 for layered sections and component backgrounds, and Primary Text #ffffff for all body and headline copy against dark surfaces. Electric Cyan #82eeff is the sole brand accent — reserve it for interactive highlights, hover states, and signature moments. The warm palette (Warm Beige #e3dbd0, Beige Light #f2f0e6, Sage Green #e5e6de, Soft Pink #e7c9f5, Powder Blue #cddfff) functions as a content-layer accent system for cards, tags, and community section backgrounds — never use these on the main dark canvas. Muted Border #dddddd and Secondary Text #333333 handle supporting UI: dividers, placeholder states, and de-emphasised copy.

#### Fonts

Trade Gothic and National 2 Consensed are the primary display voices — use them for hero headlines, section labels, and all-caps mission statements where condensed weight creates impact. Fraunces Variable functions as a serif display accent for editorial moments and pull-quotes where warmth and contrast are needed against the dark canvas. Montserrat covers functional body copy and UI labels, while Source Serif 4 can be used for long-form text sections that require readability and typographic variety. Avoid mixing more than two typefaces in a single section — the pairing of a condensed sans with a serif provides sufficient contrast.

#### Border Radii

Sharp (2px) and Subtle (3px) are the default radii for tags, form inputs, and small UI elements — the near-square treatment reinforces the brand's architectural, premium feel. Card (20px) applies to content panels, image containers, and modal surfaces where a softer containment is appropriate without feeling casual. Pill (100px) is reserved for primary CTA buttons and membership apply actions, giving interactive elements a distinct rounded silhouette. Circle (50%) is used exclusively for avatar and profile image treatments in community and member directory contexts.

#### Spacing

The scale anchors around Base (1rem / 16px) for component-level padding and Comfortable (24px) for intra-section breathing room. Tight (8px) handles micro-gaps between inline elements, labels, and icon-text pairings. Relaxed (40px) separates distinct content blocks within a section, while Section (4rem) and Spacious (6rem) define the macro rhythm between full page sections — the generous vertical spacing is key to the editorial, gallery-like pacing of the layout.
<!-- BRAND-GUIDELINES-END -->
