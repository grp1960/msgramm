# Handoff: Ms. Gramm — Sentence Breakdown Screen

## Overview
Ms. Gramm takes a single sentence in a foreign language and pulls it apart word by word, explaining what each word is doing and why it is built the way it is. This handoff covers the **core product screen**: the breakdown of one rich German sentence. It is the heart of the product — an editorial "specimen" view where one sentence is treated like a museum object, with a dictionary-style lexicon of per-word analysis beneath it.

The demo sentence is:
> **Am Montag bringt sie ihrer Schwester das Geschenk zum Bahnhof mit.**
> *"On Monday she brings her sister the present to the train station."*

It was chosen because it exercises all three German cases, all three genders, two preposition/article fusions (`am`, `zum`), and a separable verb (`mitbringen` → `bringt … mit`).

## About the Design Files
The files in this bundle are **design references created in HTML/React-via-Babel** — a working prototype showing the intended look and behaviour, **not production code to ship directly**. Babel-in-the-browser, CDN React, and the inline `window.claude.complete` call are prototyping conveniences, not architecture decisions.

Your task is to **recreate this design in the target codebase's environment** using its established patterns, component library, and state management. If no front-end environment exists yet, choose an appropriate framework (React + TypeScript would map cleanly to the component breakdown below) and implement it there.

## Fidelity
**High-fidelity.** Colours, typography, spacing, and interactions are final and intentional. Recreate the UI pixel-accurately. The look is deliberately editorial: a single typeface (Inter Tight) doing all the work via weight/size/tracking, mono (JetBrains Mono) for all metadata labels, hairline rules instead of cards, **no shadows, no rounded corners, no colour fills except one gold accent**. Do not "modernise" it with card chrome, drop shadows, or pastel chips — that would break the concept.

---

## Screen: Sentence Breakdown

### Purpose
A learner reads a sentence, then studies how each word works. They can hover/click words to cross-reference, filter by part of speech, flip into a self-test "Quiz" mode, and ask follow-up questions of an AI assistant ("Ask Ms. Gramm") that answers in the context of this exact sentence.

### Layout (top to bottom)
A single centred column, `max-width: 1120px`, padding `32px 40px 200px`, on a cool-grey background (`--bone` `#F4F5F8`).

1. **Header** (flex row, space-between, bottom hairline, 56px margin below)
   - Left: wordmark "Ms▪ Gramm" (the `▪` is a 6×6px ink square, `display:inline-block`, `vertical-align:middle`)
   - Centre: mono meta — language + word count (e.g. `GERMAN   11 WORDS`), uppercase, `--ink-60`, letter-spacing `0.04em`
   - Right: **Study / Quiz** segmented toggle — 1px `--ink-20` border, mono uppercase labels; the active segment is filled `--ink` background with `--bone` text

2. **Specimen block**
   - Eyebrow: mono uppercase "A SENTENCE, BROKEN DOWN" with a hairline that flex-grows to the right (`::after` content rule)
   - The sentence: `font-family: Inter Tight; font-weight: 300; font-size: clamp(40px, 5.2vw, 64px); line-height: 1.08; letter-spacing: -0.035em`. Each word is an inline-block `.mg-word` with `padding: 0 4px; margin: 0 -4px`. On hover or active, the word inverts (background `--ink`, text `--bone`). A small mono position number (01–11) appears above each word on hover of the sentence.

3. **Plaque** (flex row, space-between, hairline top + bottom, padding `14px 0`, 56px above)
   - Left: mono stats — `GERMAN · 11 WORDS · 3 CASES · 3 GENDERS`. The leading value of each is `--ink` weight 500, the label `--ink-60`.
   - Right: three mono uppercase text buttons — **Translate**, **In paragraph**, **Save**. `aria-pressed` toggles a `--bone-d` background.
   - When **Translate** is on: an italic Inter Tight pull-quote of the English translation appears below (`clamp(20px,2vw,26px)`, `--ink-60`).
   - When **In paragraph** is on: a `--bone-d` block with a 2px `--ink` left border shows the surrounding paragraph (the target sentence inside it rendered `--ink` weight 500), with the English under a hairline.

4. **Filters** (flex row, wraps, 80px above)
   - Mono label "FILTER" then chips: All · Nouns · Verbs · Articles · Pronouns · Fusions · Particles. Each chip shows a count in `--ink-40`. Active chip is filled `--ink` / `--bone`. Chips with zero matches are not rendered (except "All").

5. **Lexicon** — `.mg-entries`, a **two-column CSS grid** (`grid-template-columns: 1fr 1fr; column-gap: 64px`). Collapses to one column under 880px. Each entry (`.mg-entry`) is a flex column with a top hairline, `padding: 32px 0`:
   - **Number + POS line**: mono, `01 · PREPOSITION + ARTICLE`
   - **Headline row** (flex, baseline-aligned, gap 14px): the word (`clamp(28px,2.6vw,34px)`, weight 300) + its gloss in italic (`"On"`, 17px, `--ink-60`)
   - **Lemma line**: mono `LEMMA   an + dem`
   - **Property strip** (flex, gap 28px, bottom hairline): each property is a mono uppercase key (CASE, GENDER, NUMBER, TENSE, PERSON, SEPARABLE, ATTACHES TO, POSITION) over an Inter Tight value (18px). In Quiz mode each value is replaced by a dashed-border `?` button.
   - **Role line**: Inter Tight 19px weight 300 — what the word is doing in this sentence
   - **Note**: italic Inter Tight 15px, 1px `--ink-20` left border, 18px left padding — the "why"
   - **Common slip** (only some words): same block but gold (`--gold`) left border and a mono uppercase "COMMON SLIP" label in gold
   - **Learn-more link**: sans 13px weight 500, underline that darkens on hover, trailing ` →` arrow

6. **Insight band** (`.mg-insight`, 96px above, 1px `--ink` top + bottom borders, padding `56px 0`)
   - Mono eyebrow "THE PATTERN", a display title (`clamp(32px,3.4vw,44px)` weight 300), a body paragraph (Inter Tight 20px weight 300, `--ink-70`)

7. **Grammar Trap** (`.mg-trap`, full-bleed `--ink` block, `--bone` text, padding `64px 56px`)
   - Gold mono eyebrow "GRAMMAR TRAP"
   - Two-column grid: the wrong sentence (struck through, muted, dusty-red strike `#d49b9b`) beside the right one
   - A "why" paragraph under a faint hairline (sans 17px, `rgba(236,238,242,0.78)`)

8. **Ask Ms. Gramm** — see Interactions.

9. **Tweaks panel** — a prototype-only control panel (Study/Quiz, density, theme). This is a *prototype harness*, not product UI; do not ship it. The Study/Quiz toggle and the density/theme options it exposes should become real product settings only if the team wants them.

### Ask Ms. Gramm (assistant)
- **Closed state**: a fixed launcher button, bottom-right (`bottom:24px; right:24px`), `--ink` background, `--bone` mono uppercase label, with a small gold dot.
- **Open state**: a fixed right-hand **drawer**, `width: min(480px, 100vw)`, full height, `--mist` background, 1px `--ink-20` left border. Contains:
  - Header: title "● Ask Ms. Gramm" (gold dot) + close ×
  - A context strip echoing the current sentence under a mono "ABOUT THIS SENTENCE" label
  - A scrolling thread. Empty state shows an italic prompt plus four tappable suggested questions (hairline-separated list rows with trailing →).
  - User messages render in Inter Tight; assistant messages in sans with a gold "MS. GRAMM" role label; a mono "thinking…" indicator while awaiting a response.
  - Composer pinned to the bottom: auto-growing textarea + mono "SEND" button. Enter sends, Shift+Enter newlines.
- **Backend**: the prototype calls `window.claude.complete({ messages })` with a system preamble that embeds the full sentence + word breakdown and instructs the assistant to answer **in the context of this specific sentence**, in Ms. Gramm's voice (a knowledgeable friend, playful but grown-up, British English, 2–4 short paragraphs). In production, replace with your own LLM endpoint; **preserve the system preamble's structure** (sentence + per-word data + tone rules) — see `ask.jsx`.

---

## Interactions & Behaviour
- **Word ↔ entry cross-highlight**: hovering a word in the specimen highlights it and (via shared `hoveredId` state) marks its lexicon entry active; hovering an entry highlights its word in the specimen. Clicking a word smooth-scrolls to its entry (offset 80px) and flashes it active for 1400ms (`activeId`).
- **Filter**: selecting a POS hides non-matching entries (`data-filtered-out`). State: `filter` string, default `'all'`.
- **Study vs Quiz**:
  - *Study* (default): everything visible.
  - *Quiz*: every property value is hidden behind a dashed `?` button; the role line is hidden behind a "What's it doing in this sentence? ↓" cover. Clicking reveals that single item. A per-entry "Reveal all →" reveals the whole entry. Switching back to Study clears all reveals. State: `revealed` object keyed `"<wordId>.<prop>"` and `"<wordId>.role"`.
- **Translate / In paragraph / Save**: independent boolean toggles. Translate defaults **on**.
- **Ask drawer**: `open` boolean. Drawer visibility is toggled by an `.is-open` class that flips `display:none` → `display:flex` (a transform-based slide was removed because it animated unreliably; a simple show/hide is intentional). Textarea autofocuses ~280ms after open.

## Animations & Transitions
Keep these subtle. Motion tokens: `--ease: cubic-bezier(0.2,0,0,1)`, `--dur: 240ms`, `--dur-fast: 120ms`.
- Word hover/active: colour + background transition at `--dur-fast`.
- Filter/active entry: opacity/filter transitions at `--dur`.
- **Do not** add a slide/fade keyframe to the property-value reveal or the drawer — earlier versions did and the animations stalled; instant show is the shipped behaviour.

## State Management
| State | Type | Default | Purpose |
|---|---|---|---|
| `mode` | `'study' \| 'quiz'` | `'study'` | reading vs self-test |
| `hoveredId` | number \| null | null | word/entry cross-highlight |
| `activeId` | number \| null | null | click-to-scroll flash |
| `filter` | string | `'all'` | POS filter |
| `showTranslation` | bool | `true` | translation pull-quote |
| `showContext` | bool | `false` | surrounding paragraph |
| `saved` | bool | `false` | bookmark this sentence |
| `askOpen` | bool | `false` | assistant drawer |
| `revealed` | object | `{}` | quiz reveals, keyed per word/prop |

Data fetching: the screen renders from a single sentence-analysis object (see **Data shape**). In production this comes from the analysis API; the prototype hard-codes one in `data.js`.

## Data shape
The screen is driven by one object (`window.MS_GRAMM_DATA`). It is intentionally language-agnostic. Key fields:
- `language`, `sentence`, `translation`
- `context: { paragraph, paragraphEn }`
- `words[]`: each `{ id, surface, pos, posLabel, lemma, gloss, role, props{}, note, ruleId, trap }`
  - `pos` is the machine value used by the filter (`noun`, `verb`, `article`, `pronoun`, `contraction`, `particle`); `posLabel` is the human label.
  - `props` is an open key/value map; render only the keys present, in this order: case, gender, number, tense, person, separable, attachesTo, position.
  - `ruleId` maps to a grammar-reference article (link targets are stubbed — wire to real reference pages).
  - `trap` (nullable) is the per-word "common slip".
- `insight: { title, body }` and `trap: { wrong, right, why }` for the two trailing bands.

See `data.js` for the full populated example.

## Design Tokens (from design-system.css)

### Colour
| Token | Hex | Use |
|---|---|---|
| `--bone` | `#F4F5F8` | primary surface |
| `--bone-d` | `#E8EAF0` | layered / pull sections, active toggles |
| `--mist` | `#FAFBFD` | drawer surface |
| `--white` | `#FFFFFF` | composer input bg |
| `--ink` | `#1E1E2E` | primary text, inverted blocks (never pure black) |
| `--ink-90` | `#2A2A3A` | assistant message text |
| `--ink-70` | `#4A4A5A` | secondary text, explanations |
| `--ink-60` | `#6B6B78` | captions, metadata, mono labels |
| `--ink-40` | `#9A9AA4` | dividers, counts, disabled |
| `--ink-20` | `#C9CDD5` | hairlines / dashed quiz borders |
| `--ink-10` | `#DDE0E6` | lighter hairlines (`--border-rule`) |
| `--gold` | `#B8893A` | the single accent — "common slip" + assistant dot |
| `--gold-on-ink` | `#C49A4A` | gold on dark blocks (trap eyebrow) |
| Dark theme bg | `#16161F` | (Ink theme, tweak-only) |
| Dark trap bg | `#0c0c14` | (Ink theme, tweak-only) |

### Type
- Single family: **Inter Tight** (`--display`, `--sans` are the same). Metadata: **JetBrains Mono** (`--mono`).
- Mono sizes: `--t-mono-sm: 13px`, `--t-mono-xs: 11px`; eyebrow tracking `--tr-label: 0.12em`, uppercase.
- Specimen: `clamp(40px,5.2vw,64px)` / 300 / lh 1.08 / ls -0.035em.
- Entry word: `clamp(28px,2.6vw,34px)` / 300. Entry gloss: 17px italic. Role: 19px / 300. Note: 15px italic. Property value: 18px. Explanation/body: 15px sans / lh 1.6.
- Insight title: `clamp(32px,3.4vw,44px)` / 300. Insight body: 20px / 300.

### Spacing / borders / motion
- 4px base scale. Column gap between lexicon columns: 64px (48px in compact).
- `--border-rule: 1px solid #DDE0E6`; `--border-hair: 1px solid #C9CDD5`. **No border-radius, no box-shadow** (one faint drawer shadow aside).
- `--ease: cubic-bezier(0.2,0,0,1)`, `--dur: 240ms`, `--dur-fast: 120ms`.

### Fonts
Inter Tight and JetBrains Mono. In production, self-host or load via your font pipeline (the prototype assumes they are available; the design system declares the stacks in `design-system.css`).

## Voice & Microcopy
Ms. Gramm speaks as a knowledgeable friend, not a textbook: playful curiosity, grown-up, British English, specific. No gamification language (no streaks/XP/confetti). Examples shipped: empty-assistant prompt, "What's it doing in this sentence? ↓", "COMMON SLIP", "A SENTENCE, BROKEN DOWN", "THE PATTERN", "GRAMMAR TRAP". Note: the broader brand system bans mid-sentence em dashes and the "X, not Y" pattern in marketing copy; that constraint was **relaxed for pedagogical prose** inside breakdowns. Keep chrome/label copy restrained; let the explanatory copy be warm.

## Assets
No images or icons. The only graphical marks are CSS: the wordmark square, the gold dots, and the arrow glyphs (`→`, `↓`, `×`) as text. No icon library needed.

## Files in this bundle
| File | Contents |
|---|---|
| `Ms Gramm Breakdown.html` | Entry point; script/style load order |
| `design-system.css` | Brand tokens (colour, type, spacing, motion) — the foundation |
| `breakdown.css` | All screen-specific styles incl. the two-column lexicon, quiz states, drawer, and dark theme |
| `data.js` | The sentence-analysis data object (the data contract) |
| `header-and-specimen.jsx` | Header, Specimen, Plaque, Filters components |
| `word-entry.jsx` | The per-word lexicon entry (Study + Quiz behaviour) |
| `trailers.jsx` | Insight band + Grammar Trap |
| `ask.jsx` | Ask Ms. Gramm drawer + assistant prompt construction |
| `app.jsx` | Top-level state, composition, and the prototype Tweaks panel |
| `tweaks-panel.jsx` | Prototype harness only — **not product UI** |

To run the prototype as-is: serve the folder and open `Ms Gramm Breakdown.html` (it needs the `window.claude.complete` host to answer assistant questions; everything else works standalone).
