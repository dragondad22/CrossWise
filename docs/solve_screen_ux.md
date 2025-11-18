# Solve Screen UX Suggestions & Triage

The list below reflects both the original UX ideas and the new requirement to remove redundant “Check/Clear” actions now that auto-checking is permanent. Items are grouped by priority with rough impact/effort estimates so they can be ticketed in sensible slices.

## Prioritized Backlog

| Priority | Item | Impact | Effort | Notes / Next Steps |
| --- | --- | --- | --- | --- |
| **P0** | Remove “Check letter/word/puzzle” + “Clear word” buttons from `PuzzleControls`; reinforce auto-check messaging. | High – declutters primary toolbar, eliminates redundant actions that confuse new solvers. | Low | Update `PuzzleControls.tsx`, associated tests, and add a short “Auto-check enabled” helper text near progress pill. |
| **P0** | Split `PuzzleControls` into grouped toolbar with sticky positioning + light divider (no heavy box shadow). | High – improves hierarchy and keeps key actions visible when scrolling. | Medium | Requires layout refactor plus responsive states; share state metadata in left cluster and progress actions in right. |
| **P0** | Display autosave/sync status alongside progress pill. | Medium – builds trust across devices. | Low | Hook into existing `autosaveManager` events; text fallback “Saved locally · Sync pending”. |
| **P1** | Convert main layout to CSS grid (e.g., 7fr/5fr) with shared surface wrapping grid + clues. | High – modernizes overall aesthetic. | Medium/High | Requires restructure of `SolvePage` container and removal of nested card borders. |
| **P1** | Add clue caption bar above the grid showing selected clue content + progress. | High – reduces eye travel. | Medium | Reuse `ClueEntry` data; include enumerations and “n of m letters filled”. |
| **P1** | Dual-layer highlighting (soft band for clue, strong accent for active cell) and WCAG-compliant focus ring. | Medium | Medium | Update `CrosswordGrid` styles; ensure tokens exist in Tailwind theme. |
| **P1** | Convert Across/Down toggle into segmented tabs with completion counts; add preset filters (Unsolved/Flagged/Errors). | Medium/High | Medium | Requires small store additions for flags; filters can piggyback on existing clue status map. |
| **P1** | Contextual loading overlay inside grid area for “Generating puzzle…”. | Medium | Low/Medium | Wrap grid container with conditional overlay; reuse spinner asset with seed/list copy. |
| **P2** | Adjustable cell sizing (slider or discrete sizes). | Medium | Medium | Manage via local state; respect minimum for accessibility. |
| **P2** | Resizable/collapsible clue sidebar on desktop/mobile. | Medium | Medium/High | Use CSS resize for desktop, accordion for mobile. |
| **P2** | Lightweight toast/snackbar system for “Word cleared”, “Export saved”, etc. | Medium | Medium | Could reuse Radix/Headless UI primitives or build simple stateful notifier. |
| **P2** | “Session Paused” state when auth expires instead of immediate redirect. | Medium | Medium/High | Requires auth interceptor + modal overlay. |
| **P2** | Keyboard shortcut help popover + remapping. | Medium | High | Inventory shortcuts, add settings modal to store overrides locally. |
| **P3** | Focus mode toggle (hide metadata, expand grid/clues). | Medium | Low/Medium | Use boolean flag to conditionally hide toolbar sections. |
| **P3** | Clue flagging with queue pill in toolbar. | Medium | Medium | Needs new store fields and UI indicator. |
| **P3** | Minimal timer badge with show/hide option. | Low/Medium | Low | Hook into existing timer utilities if any, else create simple elapsed timer. |
| **P3** | Alternate theme palette (high contrast + reduced motion). | Medium (specific audience) | Medium | Extend Tailwind config with CSS variables; expose toggle in settings. |

## Details (Reference)

### Layout & Visual Hierarchy (P1)
- Promote the crossword area by switching the main content wrapper to a CSS grid with explicit column ratios (e.g., 7fr/5fr) so the puzzle feels anchored instead of floating inside a bordered card; let the grid bleed into the background with only subtle inner shadows for depth.
- Introduce a sticky contextual rail on wide screens that keeps puzzle metadata (topic, list, seed, autosave status) visible without pushing the controls into multiple rows; collapse the rail below the grid on mobile to keep the first paint focused on the board.
- Replace the stacked card borders with a shared surface (single rounded container that holds grid + clues) to reduce the “panel soup” look and improve perceived cohesion between solving elements.

### Header & Utility Controls (P0–P1)
- Remove the redundant **Check letter/word/puzzle** and **Clear word** buttons now that auto-checking is always on; leverage the freed space for clearer messaging that feedback is automatic.
- Reframe `PuzzleControls` as a toolbar with grouped actions: navigation (Topics/back), progress (filled/total, timer), and utility actions (New puzzle, Export) so related buttons sit together and share iconography, making the top bar lighter and quicker to parse.
- Make the toolbar sticky with a blurred backdrop and subtle bottom divider; the current large drop shadow pulls attention away from the grid and makes the page feel cramped when scrolling on smaller laptops.
- Surface autosave sync + connection state next to the progress pill (e.g., “Synced just now · Saved locally”) to build trust when solving across devices.

### Puzzle Grid Interactions (P1–P2)
- Give the currently selected clue a dedicated caption above the grid (show clue text, enumerations, and remaining letters) so solvers do not need to dart between the board and the sidebar.
- Replace the flat yellow highlight with dual-layer highlighting (soft band for whole clue, stronger accent for the active cell) to improve focus for neurodiverse and low-vision users.
- Offer a zoom slider or fixed-size toggle (Small/Medium/Large cells) rather than coupling the cell size entirely to container width; this allows tablet users to adjust without pinching.
- When checking letters/words, animate the affected cells with a short pulse in addition to the static color change so the feedback is noticeable even with strict color filters.

### Clue Sidebar (P1–P2)
- Convert the Across/Down toggle buttons into segmented tabs with counts and completion rings (e.g., “Across · 18/35 done”) so the user sees immediate progress without opening each direction.
- Add sorting/filter presets (Show unsolved, Show flagged, Show errors) in addition to the free-text search; the existing status text is useful, but providing filter chips cuts down on scanning time late in the solve.
- Allow the sidebar width to be resizable on desktop and collapsible on mobile; currently the fixed max-width makes long clues wrap awkwardly while wasting space on ultra-wide displays.

### Feedback & System States (P1–P2)
- Inject lightweight toasts/snackbars for actions such as “Word cleared” or “Export saved” instead of relying solely on silent state changes—this reduces uncertainty when tapping on touch devices.
- When generating a new puzzle, overlay a contextual loading panel inside the grid area (with a progress indicator tied to seed/list) so users understand that a new board is being prepared rather than seeing a global spinner.
- Add a “Session Paused” state that blurs the grid when authentication expires (right now the redirect happens abruptly); provide a CTA to sign back in and reassure that autosave preserved progress.

### Accessibility & Input (P1–P3)
- Expose configurable keyboard shortcuts in a help popover (displayed via a “?” icon near the toolbar) and allow remapping for solvers using assistive keyboards.
- Ensure cell focus rings meet WCAG contrast by using a darker outline or dual border; the current `ring-primary` on pale yellow is hard to spot for many color-blind solvers.
- Offer an alternate high-contrast palette and option to disable animated focus for users prone to motion sensitivity.

### Personalization & Focus Tools (P2–P3)
- Provide a “Focus mode” toggle that hides navigation/list metadata and expands the grid/clue stack edge-to-edge, ideal for small screens or solvers who want maximum concentration.
- Let users flag clues for later review and surface a mini queue/pill count within the toolbar—this supports collaborative solving and mirrors expectations from premium crossword apps.
- Introduce a minimal timer badge that can be pinned or hidden; casual solvers may prefer not to see the countdown, while competitive users want precise timing feedback.
