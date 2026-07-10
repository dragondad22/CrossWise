*Generic standard from the Claude starter kit — adapt to this project. Replace `{{TOKENS}}`; see `bootstrap/PLACEHOLDERS.md`.*

# Roadmap Standard

> Written assuming GitHub Issues + Projects, but the model — intake as typed
> issues, ordering as a ranked board view, visibility as a shared read-only
> surface — ports to any tracker (`GitHub Issues` at
> `https://github.com/dragondad22/CrossWise/issues`).

## Purpose

How feature ideas and requests are captured, ordered into a roadmap, and made
visible to stakeholders — without creating a document that goes stale.

## The one rule that cannot be broken

**The roadmap is a view over live issues, never a separate document.** A
hand-maintained feature list with status or phase columns will drift from
reality, and a drifted roadmap is worse than none — readers can't tell the
current parts from the stale ones. Catalogs of ideas are fine as prose; the
moment a document carries status, phase, or ordering, that fact belongs on the
board instead. If an exported file is genuinely needed (see Visibility), it
must be *generated* from the board or issues — never edited by hand.

## Intake — where ideas land

- A feature idea or request = an issue with `type:feature`, board Status
  **Backlog** (out of scope unless deliberately promoted — see
  `ai/STANDARDS/TASK_ISSUE_STANDARD.md`).
- Capture it when it surfaces; a lightweight body is enough at intake: what it
  is, who asked for it, why it matters (2–4 sentences). The full two-layer
  implementation brief arrives when the feature is promoted to real work, not
  before.
- No `priority:*` label is required at intake — ordering happens on the
  Roadmap view, not in labels.
- If the tracker has a discussion space (e.g. GitHub Discussions, "Ideas"
  category), it can serve as an optional front door for raw or outside
  requests; convert a discussion to a `type:feature` issue once it's worth
  tracking. The issue, not the discussion, is the roadmap item.

## Ordering — the Horizon field

The repo's **single project board** (one per repo — see
`ai/STANDARDS/TASK_ISSUE_STANDARD.md`; the roadmap is a view on it, never a
second project) carries a single-select **Horizon** field:

| Horizon | Meaning |
|---|---|
| Now | Committed direction — being worked or queued next |
| Next | Coming after the Now items; direction agreed, order still movable |
| Later | Wanted, but no commitment on when |
| *(blank)* | Captured idea, not yet placed on the roadmap |

**Horizon is not Status.** Status tracks the execution lifecycle of scheduled
work (Backlog / Next / In progress / Done); Horizon tracks roadmap *intent*
for features. The scales are deliberately separate — same pattern as severity
vs priority in `ai/STANDARDS/GITHUB_ISSUES.md` — and "Next" appearing in both
is a name collision, not a link: a `Horizon: Now` feature may still sit at
`Status: Backlog` until someone schedules its work.

Fine-grained ordering within a Horizon bucket is the manual row order of the
Roadmap view. No dates, no promised quarters — the roadmap orders intent; it
does not commit schedule.

## The Roadmap view

A saved view named **Roadmap** on the single board: filter to open
`type:feature` issues, group by Horizon, manual ranking within groups. Epics
appear too when the roadmap item is epic-sized (`type:epic`); their sub-issues
don't — one roadmap row per capability, at whichever level the capability
lives.

## Visibility

- **Public repo:** make the project public — non-collaborators get a
  read-only view at a shareable URL. This is the default answer to "can
  people see the roadmap?".
- **Private repo:** stakeholders with repo read access see the board
  directly. If the roadmap must be visible to people without repo access,
  export a generated roadmap file from the board or issue list — generated
  output only, per the one rule; regenerate on change rather than editing.

## Lifecycle

- **Promotion:** when a feature's turn comes, it gets its full two-layer body
  per `ai/STANDARDS/TASK_ISSUE_STANDARD.md` (or is broken into sub-issues) and
  moves through the normal Status lifecycle. Horizon stays `Now` until it's
  done — the roadmap keeps showing what's being delivered.
- **Declined ideas:** close the issue with a comment saying why. Closed issues
  drop off the Roadmap view automatically; the reasoning stays findable.
- **Drift check:** an open `type:feature` with no Horizon is an unsorted idea,
  which is fine; a *stale* Horizon (a `Now` item nobody is delivering) is
  drift — fix it when the board-drift glance surfaces it.

## Setup (once per repo)

With `gh` and the `project` token scope (see the board-setup section of
`ai/STANDARDS/TASK_ISSUE_STANDARD.md` for the base board):

```bash
gh project field-create <number> --owner <owner> --name "Horizon" \
  --data-type SINGLE_SELECT --single-select-options "Now,Next,Later"
```

The rest is UI-only, matching the base board setup: create the **Roadmap**
saved view (filter open `type:feature`, group by Horizon), and set project
visibility to public if the repo is public and the roadmap should be
shareable.

## See Also

- `ai/STANDARDS/TASK_ISSUE_STANDARD.md` — the single board, Status lifecycle,
  two-layer briefs
- `ai/STANDARDS/GITHUB_ISSUES.md` — quality findings (severity, not priority)
- `ai/TEMPLATES/FEATURE_SPEC_TEMPLATE.md` — the spec a promoted feature grows
