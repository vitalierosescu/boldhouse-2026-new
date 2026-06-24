# Apply page — "Help me choose" quiz

**Date:** 2026-06-23
**Status:** Approved (design), pending implementation
**Files:** `apply.html`, `src/apply.js`, new `src/apply-quiz.js`, `design.md`

## Context

The apply wizard (`apply.html`) is hero → tier → form → success. The page brief
(`_work/Website & Strategy/Pages/apply.md`, Section 3) specs a "Help me choose"
quiz that recommends a membership tier for visitors who aren't sure. It was never
built; the original 5-segment progress bar was a placeholder for that fuller flow.
This spec adds the quiz. The ASOS-style quick-view modals on the tier cards
(brief Section 2) remain out of scope here.

## Decisions (locked with the user)

- **Entry:** a quiet "Not sure which fits? Help me choose" link on the **tier step**, below the cards. The main wizard flow and its 2-segment progress bar are unchanged.
- **Format:** a **stepped lightbox modal** over the tier cards. One question per view, auto-advance on select, Back to revise, its own small "1 / 3" indicator.
- **Questions & logic:** 3 questions; full-time maps to Fixed (Resident is inquire-only and not surfaced).
- **Result:** closes the modal and pre-selects the recommended tier on the tier step (cyan state + synced hidden field + Next enabled).

## Flow

1. User reaches the tier step. Below the three cards: `Not sure which fits? [ Help me choose ]`.
2. Click → modal opens over the tier cards (cards stay visible behind a backdrop).
3. Q1 → Q2 → Q3, one per view, selecting an answer auto-advances; Back revises.
4. Result view: "We think **[Tier]** is your fit." + one-line reason + light work-style nod. Buttons: **Choose [Tier]** (primary) and **See all options** (secondary).
5. **Choose [Tier]** → modal closes, the matching tier radio is checked, the hidden `tier` field syncs, the selected-card cyan state shows, Next enables, focus returns to the tier step. **See all options** → modal just closes, no selection forced.

## Questions

- **Q1 — How do you work?** Hybrid · Remote · Freelancer — *flavours the result line, not scored.*
- **Q2 — How often will you come in?** Occasionally → Member · A couple days a week → Flexi · Most days → Fixed.
- **Q3 — Want a desk that's always yours?** Yes → Fixed (override) · No → keep Q2 result.

### Recommendation logic

```
recommend({ work, frequency, desk }):
  if desk === 'yes'              → 'fixed'
  else if frequency === 'occasionally' → 'member'
  else if frequency === 'couple'       → 'flexi'
  else  /* frequency === 'most' */     → 'fixed'
```

`work` is captured but does not affect the result. Result copy is placeholder-quality,
kept in one map so Dennis can edit wording without touching logic:

- member: "A foot in the door — community, events, and a desk when you drop in."
- flexi: "A desk when you need it, no lock-in."
- fixed: "Your own desk, every day, with everything included."

Work-style nod (prefix, optional): hybrid → "For a hybrid week," · remote → "Working remotely," · freelancer → "As a freelancer,".

## Data

The recommended tier flows to the form via the existing hidden `tier` field. Additionally,
capture the quiz answers as optional hidden fields `quiz_work` and `quiz_frequency` in the
form so the application carries context for Dennis's "light filter." Empty when the quiz
isn't used. Easy to remove.

## Components & boundaries

- **`apply.html`** — add: the "Help me choose" link on the tier step; the quiz modal markup (backdrop, dialog, 3 question views, result view, close button); two hidden fields in the form; quiz styles in the existing inline `<style>` block using brand tokens (`var(--brand--accent)`, card/deep surfaces, radii, spacing).
- **`src/apply-quiz.js`** (new, focused module) — `initApplyQuiz({ onRecommend })`. Owns: open/close, focus trap, Escape/backdrop close, stepping + Back, the indicator, scoring, and rendering the result. Calls `onRecommend(tierValue)` when the user picks the recommendation. Guarded with `modal._quizInit`.
- **`src/apply.js`** — extract a `selectTier(value)` helper from the existing radio-sync logic (check radio → sync hidden field → selected class → enable Next). Import `initApplyQuiz` and pass `onRecommend: selectTier`. Also write `quiz_work`/`quiz_frequency` hidden fields when a recommendation is chosen. Existing `_applyInit` guard unchanged.

Boundary: the quiz decides a tier and reports it; the wizard owns tier selection and the form. The quiz never touches the form or wizard navigation directly.

## Accessibility & motion

- Modal: `role="dialog"`, `aria-modal="true"`, labelled by its heading. Focus moves to the first control on open and is trapped; Escape and backdrop-click close; focus returns to the trigger link on close.
- Answer choices are real buttons (keyboard + SR friendly); the step indicator is `aria-live` polite so the question change is announced.
- `prefers-reduced-motion`: open/close and step transitions are instant (no scale/fade), reusing the pattern already in `apply.js`.

## Docs

Update `design.md` Apply Page section: main flow = 2 steps (tier, form) with a 2-segment bar, plus a 3-question "Help me choose" lightbox modal launched from the tier step. Remove the stale "Progress bar: 5 segments" line.

## Verification

Run `yarn dev` + `yarn site:dev`, open `/apply.html`, Start → tier step:
- "Help me choose" opens the modal; focus is trapped; Escape/backdrop/× close it and return focus to the link.
- Each answer auto-advances; Back revises; indicator reads 1/2/3.
- Logic spot-checks: occasionally+no → Member; couple+no → Flexi; most+no → Fixed; any+yes → Fixed.
- "Choose [Tier]" closes the modal, pre-selects that card (cyan + Next enabled), and the hidden `tier` matches; "See all options" closes without selecting.
- Submitting the form carries `tier`, `quiz_work`, `quiz_frequency`.
- Keyboard-only pass and a `prefers-reduced-motion` pass (instant, no errors). Console clean. Responsive 991/767/479.

## Out of scope

- Quick-view modals on the tier cards (brief Section 2) — separate follow-up.
- Real submission endpoint (still the stubbed Archie integration point).
