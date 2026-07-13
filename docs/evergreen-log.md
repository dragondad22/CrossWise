# Evergreen Log

Rolling record of Standards & Process Evergreening reviews (`/evergreen`). One
dated entry per run, newest on top — append-only: entries are never rewritten,
a changed verdict gets a new entry.

This file does triple duty:

- **Cadence timestamp** — the session-start check compares the newest entry's
  date against the ~30-day cadence.
- **Seen-list** — before surfacing a finding, `/evergreen` checks prior
  **Aware**/**Rejected** verdicts here; an item re-surfaces only if something
  material changed (new version, constraint lifted).
- **Provenance breadcrumb** — why a standard/tool changed traces back to a
  dated review entry and its issue links.

Entry shape:

```markdown
## YYYY-MM-DD
- Lenses: repetition · platform delta · standards drift · date sweep · kit delta · context economy
- Review issue: #NN (or "no findings")
- Findings:
  - <finding> — **Adopt|Sandbox|Aware|Rejected** (<one-line reason / risk note>) → #NN
```

## 2026-07-13
- Lenses: kit delta only (scoped on-demand run for #70; next cadence run covers all six)
- Review issue: #74
- Findings:
  - Kit 0.6.0 → 0.8.0 delta (22 files: 12 wholesale, 10 three-way merged, 3 conflicts resolved; tokens `WORK_ITEM_PREFIX`→CW, `E2E_COMMAND`→`npm run test:e2e` pending #42; KIT_VERSION → 0.8.0) — **Adopt** (low risk: additive process docs, no behavior) → #70
  - Reports module staged-not-installed; 0.7.0 acceptance/beta split raises its value — **Aware** (install on first formal QA/UAT need, per manifest trigger)
  - Banner-strip gap in /conform//rebaseline//evergreen paths — **Aware** (upstream kit #112; CrossWise banners already stripped in #71)
  - UAT scripted-verification path depends on Playwright (#42) — **Aware** (E2E command filled as forward reference)
