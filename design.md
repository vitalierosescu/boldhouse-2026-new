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
--_responsive---radius--small: 0.25rem
--_responsive---radius--normal: 0.5rem
--_responsive---radius--input: 0.25rem
--_responsive---radius--large: 2rem
--_responsive---radius--full:  999px
```

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

## Buttons

### `.button` (standard CTA)

- Padding: `0.5rem 0.88rem`
- Font-size: `text-regular` (0.875rem)
- Color: `--_theme---button-primary--text`
- Background via `.button_bg`: `--_theme---button-primary--background`
- Hover bg: `button primary bg @ 20%`

Variant (larger): `w-variant-b2c7e79d` — font-size `text-medium`

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

## Key Utility Classes

| Class | Effect |
|-------|--------|
| `.u-theme-dark` | Dark theme override on any element |
| `.u-theme-light` | Explicit light theme |
| `.theme-dark-text` | Forces white text + title colors without full bg swap |
| `.hide-tablet` | Hidden at ≤991px |
| `.hide-xs` | Hidden at ≤479px |
