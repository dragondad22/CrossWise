
- [ ] In the game itself
      - [ ] Change the buttons to emojis or icons with hover text
## On the Topics page
  - [ ] Add ability to delete a Topic and everything related to that topic with user confirmation.

## On individual Topic page
  - [ ] Add ability to delete import lists and everything associate with that list with user confirmation

## Solve screen P0 tickets (ready for GitHub)

- [ ] Remove redundant check/clear controls now that auto-check is always on  
  - Acceptance: `PuzzleControls` no longer renders “Check letter/word/puzzle” or “Clear word”; helper text near progress indicator explains that checking is automatic; existing tests updated/added to cover new UI state.

- [ ] Restructure `PuzzleControls` into a grouped, sticky toolbar with lighter divider  
  - Acceptance: Toolbar groups navigation/metadata on the left and actions on the right; sticky behavior works on desktop/tablet with subtle divider (no heavy shadow); layout remains single-row on large screens and stacks gracefully on narrow viewports.

- [ ] Surface autosave/sync status next to progress pill  
  - Acceptance: Autosave state displays live text (e.g., “Synced just now” / “Saved locally · Sync pending”); integrates with `autosaveManager` events; status is visible in the toolbar without overlapping other controls.
