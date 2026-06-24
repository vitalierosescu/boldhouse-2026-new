## Dev Setup

- This folder (`boldhouse-2026.webflow`) is the primary development project — it is both the Webflow export AND the Vite source.
- **Build**: `yarn dev` (Vite at `:4000`, HMR), `yarn build` (UMD → `dist/main.js`).
- HTML pages use a smart script loader: tries `localhost:4000` first, falls back to `https://boldhouse.vercel.app/main.js` (production).
- If something is running on port 4000 and returning errors, kill it so the loader falls back to Vercel.
- `src/main.js` is the Vite entry point (UMD, externalises gsap/three/barba/lenis/jquery).
- `src/shop/` contains the Shopify headless integration (client, cart state, drawer, nav badge, shop/product pages).
- `dev-webflow/` is the OLD source project — it is now superseded by this one.

## Shop / Shopify

- Shopify store: `boldhouse-masnmd9c.myshopify.com` (Storefront API, headless).
- Cart state persists via localStorage key `boldhouse_cart_id`.
- Cart drawer and nav badge are global (init once, survive Barba page transitions).
- Shop listing page: `shop.html` (`data-barba-namespace="shop"`).
- Product detail page: `shop-product.html?handle=<handle>` (`data-barba-namespace="product"`).
- Styles for all shop UI live in `css/shop.css`. It drives every colour through the shared theme tokens (`--_theme---*`, `--swatch--dark-*`, `--brand--accent`) — **do not hardcode `rgba(13,14,14,X)`**; `rgba()` only as a `var()` fallback.
- **The shop is light** — which matches the site's *default* theme (the site is light by default with dark sections layered in). The PDP (`shop-product.html`) is a No Art-style editorial 3-column layout: meta blocks (Materials/Care/Size & fit/Delivery, from `custom.*` metafields) · stacked gallery · buy column; plus "You might also like" (Shopify `productRecommendations`) and prev/next nav.
- See `.claude/docs/shop-implementation.md` for the full implementation reference.

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
