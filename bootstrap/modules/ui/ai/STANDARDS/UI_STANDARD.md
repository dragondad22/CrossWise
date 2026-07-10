*Generic standard from the Claude starter kit — adapt to this project's stack. Replace `{{TOKENS}}`; see `bootstrap/PLACEHOLDERS.md`.*
*Optional — keep only if this project has a UI.*

# UI/UX Standard

This document is the visual and interaction source of truth for implementing UI.
Read it before implementing any new screen, component, or visual change.

The **principles** below are stack-agnostic and apply to any UI. The concrete
values shown are marked **(example — set your project's choices)**: replace them
with your project's real tokens, fonts, and components during bootstrap. Do not
ship the example values verbatim.

## 1. Authority and Scope

- **Design baseline reference:** `{{DESIGN_SOURCE}}` *(example — set your project's
  choices: a design file, a Figma/Sketch/Penpot board, or `N/A`)*.
- **Implementation token source of truth:** the project's central token/theme
  definition (one file or module that holds every color, radius, shadow, spacing,
  and font choice).
- Applies to all user-facing surfaces in `{{APP_LAYOUT}}`.
- If documents conflict:
  - Product behavior/workflow comes from ADRs / workflow docs / UAT.
  - Visual/interaction decisions come from this standard.

## 2. Non-Negotiable Rules

- **Use design tokens, never hard-coded values.** Do not hard-code colors, radii,
  shadows, or spacing in feature code. Reference the central token set. Hard-coded
  values are how a UI drifts out of theme and breaks dark mode.
- **Reuse shared component primitives before creating new ones.** Look in the shared
  component library first; extend an existing primitive rather than inventing a
  parallel one.
- **Support every theme the product ships** (e.g. light **and** dark) for all new UI.
- **One icon set, one type system.** Pick a single icon library and a single
  typographic system and use only those.
- **Numeric/metric displays and timers use tabular (monospaced) numerals** so values
  don't jitter as digits change.
- **Destructive actions require explicit confirmation** (delete / archive / end an
  irreversible process).
- **Data-driven views provide visible loading, empty, and error states.** Never show
  a blank or a frozen screen while data resolves or after it fails.
- **Accessibility is not optional**: keyboard/focus access and semantic labels for
  icon-only controls.

## 3. Core UX Principles

- **Clarity first:** users should immediately understand where they are, what
  changed, and what to do next.
- **Predictable structure:** keep page patterns consistent across the product.
- **Fast scanning:** clear hierarchy, concise labels, readable tables.
- **Progressive disclosure:** hide advanced filters/settings behind toggles or
  secondary surfaces.
- **Low-friction actions:** primary actions are obvious and close to related content.
- **Safe operations:** make risky actions deliberate and reversible when possible.

## 4. Foundations

### 4.1 Typography

- **One font family** across the product *(example — set your project's choices:
  Inter, system-ui)*.
- Define a clear hierarchy (page title → section/card title → body → support/meta)
  using size and weight, not ad-hoc styling.
- Base size around `16px` for body *(example — set your project's choices)*.
- Use **sentence case** for all UI text (rules and examples: Section 9.1).

### 4.2 Radius, Shadow, and Density

- A single base radius token, with derived `sm/md/lg/xl` steps *(example — set your
  project's choices)*.
- Cards and panels: soft, low elevation — not heavy shadows.
- Data tables: density appropriate to the content; roomy enough to scan.

### 4.3 Color and Theme Tokens

Use token variables only; never raw values in feature code. Define the full token
set (background, foreground, card, primary, secondary, muted, accent, destructive,
border, input, focus ring, chart series, and any shell/sidebar tokens) **once**, with
a value per theme.

> **(example — set your project's choices)** A minimal token set with light + dark
> values: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`,
> `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--border`,
> `--input`, `--ring`, `--chart-1..n`. Replace names and values with your own.

### 4.4 Status Semantics

- Success/in-progress: green.
- Warning/archive: orange/amber.
- Destructive/error: the destructive/red token.
- Informational/neutral: blue or muted neutral — never red/orange.
- **Never use color alone**; always pair status color with an icon, text, or badge
  label (color-blind users and grayscale contexts must still read the state).

### 4.5 Date and Time Formatting

- User-facing timestamps should use a **single shared formatter**, not inline
  locale calls scattered through the code. Decide the default precision once
  *(example — set your project's choices: date + time to the minute, seconds
  omitted)*.
- Audit/security/export views may retain full precision (with seconds); use a
  distinct "precise" formatter for those.
- Elapsed-duration timers are not clock timestamps — format them separately.
- Use tabular numerals for time values (Section 2).

## 5. Shell and Page Architecture

Define the product's standard layouts once and reuse them. *(The patterns below are
examples — set your project's choices.)*

### 5.1 App Shell (example)

- Navigation region (e.g. a collapsible left sidebar) with icon-only collapsed state
  and tooltips/`title` for icon-only nav.
- Account/profile block and theme toggle in a consistent location.
- Main content scrolls independently from navigation.
- A neutral canvas behind elevated card surfaces.

### 5.2 Dashboard Pattern (example)

- Header row: title + filter/time control + account context.
- A row of metric cards, responsive (e.g. 4-up → stacked).
- A primary chart paired with a secondary list, then a detail/activity row.

### 5.3 List Page Pattern (example)

- Top: title, short description, primary action.
- Search + filter toggle + clear-filters action.
- Optional expandable filter panel.
- Results summary line (e.g. "showing X of Y").
- Main data table with sortable columns and row actions.

## 6. Component Standards

### 6.1 Buttons

- Use the shared `Button` primitive and its variants (default / secondary / outline /
  ghost / destructive).
- One primary CTA per section; secondary actions should not compete visually.
- Icon-only buttons must have a tooltip or accessible label.

### 6.2 Forms

- Labels are always visible; placeholders are supplemental, not a replacement.
- Inline validation near the field; blocking errors may also use a top banner.
- Inputs/selects use tokenized background/border/focus-ring states.
- **Prefer the shared themed select/dropdown component over the platform-native
  control** when the native control can't be themed and renders unreadably (a common
  problem in dark mode). Keep the control's `id`/label association intact. Genuinely
  native pickers that can't be replaced (e.g. an OS date picker) are exempt.

### 6.3 Tables

- Header uses a muted background with clear column labels.
- Support sorting where meaningful; show the sort affordance.
- Row hover state required.
- Row/table actions default to icon-only buttons (to keep dense tables scannable),
  each with hover text **and** an accessible label.
- Reserve text buttons for primary page-level actions.

### 6.4 Cards and Metrics

- Use card primitives for grouped content.
- Metric values use tabular numerals.
- Supporting labels are muted and concise.

### 6.5 Dialogs and Confirmation

- Centered modal/dialog with a dimmed overlay.
- Use a dedicated confirmation dialog for destructive or irreversible actions.
- The primary destructive action uses the destructive visual style.

### 6.6 Feedback and Notifications

- **Toast:** success and minor updates.
- **Inline:** form validation and row-level states.
- **Top banner:** blocking warnings/errors that require attention.
- Error copy follows "Errors say what, why, and what's next" in
  `ai/STANDARDS/DOCUMENTATION_STANDARD.md`: anchored to the offending
  field/item, blameless, security-sensitive causes kept generic, and any
  user-visible error code documented in the central error reference.

### 6.7 Charts

- Thin lines, subtle fills, low-noise gridlines.
- Keep the palette within the chart tokens.
- Axis labels and legends must stay legible in every theme.

## 7. Accessibility and Interaction

- Meet WCAG AA contrast targets where applicable.
- Keyboard access for all interactive controls.
- Preserve clear, visible focus rings.
- Touch targets comfortably tappable (about 40px+ when possible).
- Avoid color-only communication; include text/icon indicators.
- Respect reduced-motion preferences for non-essential animations.

## 8. Responsive Behavior

- Choose a primary form factor for the product's main workflows and degrade cleanly
  to the others.
- Do not hide critical actions on small screens without equivalent access.
- Navigation should collapse to an overlay/sheet on small screens.
- Tables on small screens: prefer horizontal scroll for dense data; switch to a
  condensed card/list view only when it genuinely improves readability.

## 9. Content and Microcopy

- **All copy follows the audience-first rules** — written for the surface's
  persona, no internal leakage (back-end field names, internal IDs, ADR/issue
  references), human voice, no AI-tell prose. Single home:
  `ai/STANDARDS/DOCUMENTATION_STANDARD.md` → "Audience-first user-facing text".
- Keep language direct and operational.
- Buttons use action verbs (e.g. `Add item`, `Save changes`, `End activity`).
- Confirmation copy states the object **and** the consequence.
- Empty states explain what happened and the next best action.

### 9.1 Capitalization

- Default to **sentence case** for all UI text: page/section/card titles, table
  column headers, form labels, buttons, menu items, tabs, badges, tooltips, dialog
  titles, empty states, and placeholder text.
- Sentence case = capitalize only the first word and any proper nouns.
  - Correct: `Survey responses`, `Add item`, `Date of intake`
  - Incorrect: `Survey Responses`, `Add Item`, `Date Of Intake`
- Proper nouns keep their real capitalization everywhere (people, places, orgs).
- Product/brand names keep their branded styling (e.g. `{{PROJECT_NAME}}`).
- Acronyms/initialisms stay uppercase: `ID`, `CSV`, `API`, `RBAC`.
- Do not use Title Case or ALL CAPS for emphasis; use typographic hierarchy instead.

## 10. Implementation Checklist

Before marking UI work complete, verify:

- Layout matches the design baseline (`{{DESIGN_SOURCE}}`) where applicable.
- Tokens and shared primitives are used (no ad-hoc styling drift).
- Every shipped theme (e.g. light and dark) looks acceptable.
- Keyboard navigation and focus states are functional.
- Loading / empty / error states are present.
- Destructive actions are confirmed.
- Table action columns use icon-only buttons with tooltip text and accessible labels.
- Table, filter, and form patterns follow this standard.
- All visible text uses sentence case per Section 9.1 (proper nouns, brands, and
  acronyms excepted).
- Visible text passes the audience-first rules (persona-targeted, no internal
  leakage — Section 9).
