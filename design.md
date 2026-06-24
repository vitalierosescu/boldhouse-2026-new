# Boldhouse Design System

Source of truth: `css/boldhouse-2026.webflow.css` (CSS variables in `:root`)

---

## Fonts

| Name | File | Weight | Role |
|------|------|--------|------|
| Trade Gothic | `TradeGothicNextLTPro.woff2` | 400 | Headings (display) |
| Helvetica Neue | `HelveticaNeueMedium.woff2` | 500 | Body |
| Fraunces Variable | `Fraunces-VariableFont_SOFTWONKopszwght.woff2` | 100–900 | Serif accent |
| National 2 Condensed | `national-2-condensed-extrabold.woff2` | 400 | Display / hero |

CSS tokens:
```
--_typography---font--font-body:  "Helvetica Neue", Arial, sans-serif
--_typography---font--font-title: "Trade Gothic", Impact, sans-serif
--_typography---font--font-serif: "Fraunces Variable", "Times New Roman", sans-serif
```

---

## Brand Colors

```
--brand--dark:           #0d0e0e   (near-black, primary)
--brand--dark-secondary: #2b2b2b   (secondary dark)
--brand--white:          white     (#fff)
--brand--light:          #f9f9f9   (off-white bg)
--brand--light-secondary:#d8d8d8   (light gray)
--brand--light-tertiary: whitesmoke
--brand--accent:         #82eeff   (cyan highlight)
--brand--accent-bright:  #82eeff   (same as accent)
--brand--beige:          #e3dbd0
--brand--beige-light:    #f2f0e6
--brand--blue:           #cddfff
--brand--pink:           #e7c9f5
--brand--green:          #6cdbbd   (border-highlight)
--brand--green-lightest: #e5e6de
```

### Opacity swatches (color-mix)

| Token | Value |
|-------|-------|
| `--swatch--dark-05` | brand--dark @ 5% |
| `--swatch--dark-20` | brand--dark @ 20% |
| `--swatch--dark-40` | brand--dark @ 40% |
| `--swatch--dark-60` | brand--dark @ 60% |
| `--swatch--dark-80` | brand--dark @ 80% |
| `--swatch--light-05` | brand--white @ 5% |
| `--swatch--light-20` | brand--white @ 20% |
| `--swatch--light-40` | brand--white @ 40% |
| `--swatch--light-60` | brand--white @ 60% |
| `--swatch--light-80` | brand--white @ 80% |
| `--swatch--text-20` | currentColor @ 20% |
| `--swatch--text-60` | currentColor @ 60% |
| `--swatch--text-80` | currentColor @ 80% |
| `--swatch--text-100` | currentColor |
| `--swatch--transparent` | transparent |

---

## Typography Scale

### Font sizes (desktop → tablet 991px → mobile 767px)

| Token | Desktop | Tablet | Mobile |
|-------|---------|--------|--------|
| `--h0` | 6rem | 6rem | 4.5rem |
| `--h1` | 5rem | 4rem | 3rem |
| `--h2` | 4.25rem | 3.5rem | 2.5rem |
| `--h3` | 2.625rem | 2rem | 1.75rem |
| `--h4` | 2rem | 1.5rem | 1.5rem |
| `--h5` | 1.5rem | 1.375rem | 1.25rem |
| `--h6` | 1.25rem | 1.125rem | 1.125rem |
| `text-xxlarge` | 1.5rem | 1.5rem | 1.25rem |
| `text-xlarge` | 1.25rem | 1.25rem | 1.125rem |
| `text-large` | 1.125rem | 1.125rem | 1rem |
| `text-medium` | 1rem | 1rem | 1rem |
| `text-regular` | 0.875rem | 0.875rem | 0.875rem |
| `text-small` | 0.75rem | 0.75rem | 0.75rem |
| `text-tiny` | 0.625rem | 0.625rem | 0.625rem |

Note: h1 at 479px = 2.5rem (hardcoded override on `h1` tag).

### Line heights

```
--_typography---line-height--0-9:  0.9   (tight / display)
--_typography---line-height--1:    1
--_typography---line-height--1-1:  1.1
--_typography---line-height--1-2:  1.2
--_typography---line-height--1-3:  1.3   (body default)
--_typography---line-height--1-4:  1.4
--_typography---line-height--1-5:  1.5
```

Shorthand aliases:
```
--_typography---line-height--title: 0.9
--_typography---line-height--body:  1.3
```

### Letter spacing

```
--_typography---letter-spacing--title:    0em
--_typography---letter-spacing--subtitle: -0.03em
--_typography---letter-spacing--text:     -0.01em
--_typography---letter-spacing--0em:      0em
```

### Font weights

```
--_typography---font-weight--light:    300
--_typography---font-weight--regular:  400
--_typography---font-weight--medium:   500
--_typography---font-weight--semibold: 600
--_typography---font-weight--bold:     700
```

Aliases:
```
--_typography---font-weight--title: 400 (regular)
--_typography---font-weight--body:  400 (regular)
```

---

## Spacing

### Component spacing

| Token | Desktop | Tablet | Mobile |
|-------|---------|--------|--------|
| `--spacing--tiny` | 0.25rem | 0.25rem | — |
| `--spacing--xxsmall` | 0.5rem | 0.5rem | — |
| `--spacing--xsmall` | 1rem | 1rem | — |
| `--spacing--small` | 1.5rem | 1.5rem | — |
| `--spacing--medium` | 2rem | 2rem | — |
| `--spacing--large` | 3rem | 2.5rem | — |
| `--spacing--xlarge` | 4rem | 3.5rem | — |
| `--spacing--xxlarge` | 5rem | 4.5rem | — |
| `--spacing--huge` | 6rem | 5rem | — |
| `--spacing--xhuge` | 7rem | 6rem | — |
| `--spacing--xxhuge` | 10rem | 7.5rem | — |

### Gap

```
--spacing--gap-xsmall:  0.5rem
--spacing--gap-small:   1rem
--spacing--gap-regular: 1.25rem
--spacing--gap-medium:  2.5rem
--spacing--gap-large:   3rem
```

### Section padding

| Token | Desktop | Tablet | Mobile |
|-------|---------|--------|--------|
| `--section-space--small` | 3rem | 3rem | 2rem |
| `--section-space--medium` | 5rem | 4rem | 3rem |
| `--section-space--large` | 7rem | 6rem | 5rem |
| `--section-space--none` | 0rem | 0rem | 0rem |

### Global padding

```
--_responsive---padding-global: 1.5rem (desktop/tablet) → 1rem (mobile)
```

---

## Layout / Containers

```
--container--small:  60rem  (960px)
--container--medium: 80rem  (1280px)
--container--large:  100rem (1600px)
--container--nav:    calc(100rem + 6rem)
```

---

## Border Radius

```
--_responsive---radius--0:     0px
--_responsive---radius--small: 0rem
--_responsive---radius--normal: 0rem
--_responsive---radius--input: 0.25rem
--_responsive---radius--large: 0rem
--_responsive---radius--full:  999px
```

### Actual usage convention

**Image and media containers always use 0 radius (hard `border-radius: 0`).** Do not use `--_responsive---radius--normal` on product images, gallery containers, photo cards, or any image wrapper — the rest of the site is uniformly sharp and any rounding creates an inconsistency. The CSS variables exist but are not applied to image elements.

| Element type | Radius |
|---|---|
| Image / media container | `0` (always) |
| Tags, badges, input borders | `--_responsive---radius--small` (0.25rem) |
| Pill buttons / CTAs | `--_responsive---radius--full` (999px) |
| Modals / overlays (if ever) | `--_responsive---radius--large` (2rem) |

---

## Breakpoints

| Name | Max-width |
|------|-----------|
| Tablet | 991px |
| Mobile landscape | 767px |
| Mobile portrait | 479px |

---

## Themes

### Light (default)

```
bg-primary:    brand--white
bg-secondary:  brand--light (#f9f9f9)
bg-alt:        brand--dark
bg-highlight:  brand--accent (#82eeff)
text-primary:  brand--dark
text-title:    brand--dark
text-secondary: currentColor @ 60%
text-alt:      brand--white
text-highlight: brand--accent-bright
border-primary: brand--dark
border-secondary: currentColor @ 20%
button bg:     brand--dark
button text:   brand--white
```

### Dark — `.u-theme-dark`

Apply `.u-theme-dark` to any section/wrapper to invert.

```
bg-primary:    brand--dark
bg-secondary:  brand--dark-secondary (#2b2b2b)
bg-alt:        brand--white
bg-highlight:  brand--accent
text-primary:  brand--white
text-title:    brand--white
text-secondary: currentColor @ 60%
text-alt:      brand--dark
text-highlight: brand--accent-bright
border-primary: brand--dark
border-alt:    white
button bg:     brand--white
button text:   brand--dark
input border:  light-60
input border focused: brand--white
```

`.u-theme-light` is also available to explicitly reset to light.

---

## Apply Page

The apply page (`apply.html`) is a multi-step wizard. Full Figma source: `https://www.figma.com/design/bMO5vR3bE5MwGxASX1sz2V/Boldhouse`

Figma node map:
- Hero screen: `10736:1836` — content frame: `10736:3225`
- Hero tagline text: `10736:2277`
- Hero headline text: `10736:2278`
- Step 1 (choose membership): `10736:2897`
- Step 2 (about you): `10736:3235`

### Golden rule: always fetch Figma before writing CSS

**Never estimate, calculate, or guess typography values.** Use `figma_get_component_for_development` on the exact text node. The Figma dev panel gives exact rem values — use them verbatim. Past mistakes from calculating instead of reading the panel: wrong letter-spacing sign, wrong font-style (added italic when Figma says normal), wrong font-weight.

### Wizard structure

- Screens: `data-apply-screen="0|1|2|success"` on each `<section>` (hero, choose membership, about you, success)
- JS toggles the `hidden` attribute — do not use classes or display toggles
- **Critical CSS**: `.apply-screen[hidden] { display: none !important; }` — prevents `display: flex` overriding `[hidden]`
- Progress bar: **2** `.apply-progress-segment` divs — one per real step (choose membership, about you). `is--active` fills segment `i` when `i < currentScreen`. (The "Help me choose" quiz is a side-trip modal with its own indicator, not part of this bar.)
- Tier selection is an accessible radio group: a visually-hidden `.apply-tier-radio` inside each `<label class="apply-tier-card">`, wrapped in `role="radiogroup"`. Selected state via `:has(.apply-tier-radio:checked)` (and `.is--selected` fallback). "Next" is gated `disabled` until a tier is chosen.
- Form validation is JS-side (the form keeps `novalidate`): required name/email/discipline, inline `.apply-field-error` messages + `aria-invalid`, focus first invalid. Submission is stubbed at the `ARCHIE INTEGRATION POINT` in `submitApplication()`.
- JS: `src/apply.js` exports `initApplyPage()`, called from `main.js` via Barba namespace `"apply"`. Guarded with `wizard._applyInit` (initAfterEnterFunctions runs in both Barba `once` and `afterEnter`, so without the guard listeners bind twice).
- Animations: GSAP fade + y-translate between screens (0.25s out power2.in, 0.35s in power2.out), direction reverses on back. Respects `prefers-reduced-motion` (instant) and moves focus to the new step's heading.

### "Help me choose" quiz

A stepped lightbox modal launched from the tier step via the `[data-quiz-open]` link. Code: `src/apply-quiz.js` (`initApplyQuiz({ onRecommend })`, guarded with `modal._quizInit`); markup is the `[data-quiz]` block in `apply.html`.

- 3 questions, one per view (`[data-quiz-step="0|1|2"]`), auto-advance on choice, Back to revise, `[data-quiz-indicator]` shows `n / 3`.
- Logic (`recommend()`): `desk=yes → fixed`; else by frequency `occasionally → member`, `couple → flexi`, `most → fixed`. Q1 (work style) only flavours the result copy. Resident is inquire-only, so full-time maps to Fixed.
- Result (`[data-quiz-step="result"]`): "We think [Tier] is your fit." **Choose [Tier]** calls `onRecommend(tier, answers)` → `apply.js` `selectTier()` checks the matching radio, syncs the hidden `tier` field, and writes the `quiz_work`/`quiz_frequency` hidden fields. **See all options** just closes.
- a11y: `role="dialog"` + `aria-modal`, focus trap, Escape/backdrop close, focus returns to the trigger. Open/close GSAP fade+slide, instant under `prefers-reduced-motion`.

### Typography — exact Figma values

**Hero tagline** (node 10736:2277):
```css
font-family: "Fraunces Variable", "Times New Roman", serif;
font-size: 1.25rem;
font-style: normal;          /* NOT italic */
font-weight: 353;
line-height: 80%;
letter-spacing: -0.0375rem; /* exact from panel — do not recalculate */
text-align: center;
color: #fff;
opacity: 0.6;
```

**Hero headline** (node 10736:2278 — Trade Gothic Next LT Pro Heavy 800):
```css
font-family: var(--_typography---font--font-title); /* "Trade Gothic", Impact, sans-serif */
font-weight: 400;            /* site only has one Trade Gothic file — use 400 regardless */
font-size: clamp(2.5rem, 4.75vw, 4.25rem); /* 4.25rem = 68px, matches Figma at 1440px */
text-transform: uppercase;
line-height: 85%;
letter-spacing: -0.0425rem;
text-align: center;
```

**Step titles** (e.g. "1. Choose your membership"):
```css
font-family: var(--_typography---font--font-serif); /* Fraunces Variable */
font-weight: 400;
text-transform: none;        /* NOT uppercase — global h2 adds uppercase, must override */
font-size: clamp(1.75rem, 3vw, 2.25rem);
text-align: center;
color: #fff;
```

**Success heading** (Trade Gothic, all-caps — NOT Fraunces):
```css
font-family: var(--_typography---font--font-title);
font-weight: 400;
text-transform: uppercase;
line-height: 1;
letter-spacing: -0.0425rem;
```

### Font system — what's actually used

| CSS token | Value | File |
|---|---|---|
| `--font-title` | `"Trade Gothic", Impact, sans-serif` | `TradeGothicNextLTPro.woff2` (one weight, use 400 always) |
| `--font-serif` | `"Fraunces Variable", "Times New Roman", serif` | `Fraunces-VariableFont_SOFTWONKopszwght.woff2` (variable, supports weight 353) |
| `--font-body` | `"Helvetica Neue", Arial, sans-serif` | `HelveticaNeueMedium.woff2` |

**"National 2 Consensed" is NEVER used on this site.** It exists in the @font-face and in fonts/ but is not applied to any class anywhere. Do not reference it in new code.

### Tier card design tokens (from Figma node 10736:2897)

- `border-radius: 0` (Figma cornerRadius = 0)
- `border: 3px solid transparent` (Figma strokeWeight: 3)
- `padding: 2rem` (Figma padding: 32px)
- Selected: `border-color: #82eeff` + `.apply-tier-check { background: #82eeff; border-color: #82eeff }`
- Card gap: `1rem` (Figma itemSpacing: 16px)
- Progress bar height: `4px`

---

## Buttons

### `.button` (standard CTA)

- Padding: `0.5rem 0.88rem`
- Font-size: `text-regular` (0.875rem)
- Color: `--_theme---button-primary--text`
- Background via `.button_bg`: `--_theme---button-primary--background`
- Hover bg: `button primary bg @ 20%`

Variant (larger): `w-variant-b2c7e79d` — font-size `text-medium`

**ALWAYS wrap `.button.w-inline-block` in `<div data-wf--button--variant="base">`**. Every button on every page uses this wrapper. Without it the button may not render correctly. Example:

```html
<div data-wf--button--variant="base">
  <a href="..." class="button w-inline-block">
    <div data-button-text="" class="button_text">Label</div>
    <div class="button_bg"></div>
  </a>
</div>
```

The `data-button-text=""` attribute on `.button_text` is also required — `initButtonHover()` in `main.js` uses it to split text into character spans for the hover animation. If missing, the animation won't initialise.

Button theme behaviour (inherits from ancestor):
- Inside `.u-theme-dark`: white background, dark text
- Default (light): dark background, white text

### `.btn` (bordered button with slide animation)

- Border: `1px solid #000`
- Radius: `0.25rem`
- Padding: `0.75rem`
- Background: transparent
- Animated background layer: `.btn_bg`

Form variant `.btn.is-form`:
- Padding: `1.25rem 8rem`
- Font-size: `text-small`
- Text-transform: uppercase

---

## Shop

The shop (shop.html + shop-product.html) uses the **light theme**:

- Hero section: `background: var(--brand--white, #fff)` — white
- Grid section: `background: var(--brand--light, #f9f9f9)` — off-white, creates subtle contrast with the hero
- Product detail section: `background: var(--brand--white, #fff)` — white
- Placeholder / skeleton backgrounds: `var(--brand--light-secondary, #d8d8d8)` — mid gray
- All image containers: `border-radius: 0` (no rounding, consistent with rest of site)
- Cart drawer: white bg, dark text. Checkout button: dark bg + white text (flips to accent on hover).

Styles live in `css/shop.css`.

---

## Key Utility Classes

| Class | Effect |
|-------|--------|
| `.u-theme-dark` | Dark theme override on any element |
| `.u-theme-light` | Explicit light theme |
| `.theme-dark-text` | Forces white text + title colors without full bg swap |
| `.hide-tablet` | Hidden at ≤991px |
| `.hide-xs` | Hidden at ≤479px |
