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

<!-- No reviews recorded yet. The first /evergreen run adds its entry below. -->
