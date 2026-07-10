*Generic standard from the Claude starter kit — adapt to this project. Replace `{{TOKENS}}`; see `bootstrap/PLACEHOLDERS.md`.*

# Interview Standard

## Purpose

Define the machinery for **structured async interviews**: deep question-driven
discovery that precedes building. The interview produces the founding artifacts
the AI follows afterward — non-negotiables, initial ADRs, decision-log entries,
glossary seeds, compliance rows, and a scaffold plan (inception) or an issue
breakdown (epics/features).

The process is async-first by design: questions live in files with a standard
structure; the human answers at their own pace (answers often need research,
other people, or time to think); the AI re-ingests as answers land. Sessions
are resumable — never force synchronous Q&A.

This standard governs the *machinery* — file layout, question format,
lifecycle, IDs, provenance, and the supersede model. It applies to every
interview: project inception is just the first instance, not a special case.

---

## Directory Convention

Each interview is a directory under `docs/plans/`:

```
docs/plans/<NNN>-<slug>/
  00-INDEX.md          # status summary + derived artifacts (the provenance hub)
  01-<section>.md      # one file per section, each holding its questions
  02-<section>.md
  ...
```

- `<NNN>` is a zero-padded sequence number across all interviews in the repo;
  `<slug>` is a short kebab-case name.
- `000-inception` is the project-inception interview. Each later epic/feature
  interview takes the next number (e.g. `001-foster-users/`) and cross-links
  to its epic issue once created.
- Section files are numbered in interview order. Sections vary by interview;
  the inception spine defines the canonical set (see `bootstrap/QUESTION_BANK.md`).

---

## Question Format

Questions live inside section files. Every question — shipped spine question or
AI-generated follow-up — uses the same block structure:

```markdown
## Q-ARCH-03 — How will services communicate?

**Status:** open

**Why this matters:** <1–3 sentences: what this decision drives, what goes
wrong if it's skipped.>

**Options:**
- **A — <option>** — <trade-offs>
- **B — <option>** — <trade-offs>

**Recommendation:** <the AI's recommended answer for THIS project, with a one-line why.>
**Default:** <what applies if the question is never answered — usually the recommendation.>

**Answer:**
<empty — the human writes here, async, in their own words>

**Discussion:**
- YYYY-MM-DD: <dated running log of back-and-forth, follow-ups spawned, research found>

**Final:** <the settled decision, stated plainly — distinct from the discussion log>
Derived: <artifacts produced from this answer: ADR-003, decision log #7, epic #42>
```

Format rules:

- **Context is mandatory.** Never ask a bare question — "why this matters"
  plus options with trade-offs is what makes async answering possible.
- **Recommendation and default are mandatory.** An unanswered question falls
  back to its default instead of blocking. Recommendations must be
  right-sized to the project (a small tool doesn't get enterprise
  infrastructure; "I don't care what it looks like" is a legitimate answer).
- **`Final:` is not `Answer:`.** The answer is the human's raw input; the
  discussion is the working log; `Final:` is the settled outcome after
  discussion, written so a reader needs nothing else.
- **Follow-ups use the same format.** The AI generates follow-up questions
  driven by answers, appending IDs within the section (`Q-ARCH-07`, `-08`…).
  Depth is standard; content is per-project.

---

## Question Lifecycle

Every question carries exactly one status:

| Status | Meaning |
|---|---|
| `open` | Asked, not yet answered |
| `in-discussion` | Answer landed; follow-ups or refinement in flight |
| `needs-research` | Blocked on investigation before it can be answered |
| `waiting-on-<who>` | Blocked on a named external party |
| `deferred` | Deliberately postponed — the **default applies** and that is recorded in `Final:` |
| `finalized` | `Final:` holds the settled outcome; derived artifacts listed |
| `superseded` | A later decision overrode the final answer — see the supersede stamp |

An interview is complete when every question is `finalized`, `deferred`, or
`superseded`. `deferred` is a legitimate end state, not a failure — it means
the default was consciously accepted.

---

## Q-IDs

- **In-file:** short — `Q-<SECTION>-<NN>` (e.g. `Q-ARCH-03`). The section code
  comes from the section file's name.
- **Everywhere else:** qualified — `<NNN>/Q-<SECTION>-<NN>` (e.g.
  `000/Q-ARCH-03`). Cross-document references always use the qualified form:
  it is collision-proof across interviews and grep-able.

Q-IDs are stable and intentional — they are how derived documents cite their
origin. Never renumber.

---

## Provenance — Bidirectional Breadcrumbs

Every artifact derived from an interview must be traceable in both directions:

- **Forward:** each question's `Final:` block lists its derived artifacts on a
  `Derived:` line ("Derived: ADR-003, decision log #7, epic #42").
- **Backward:** ADRs and decision-log entries carry a `Source:` field citing
  the originating question(s) by qualified Q-ID (the ADR template and
  `docs/decision-log.md` entry format both have the field).
- **Hub:** the interview's `00-INDEX.md` summarizes per-section status and
  aggregates all derived artifacts — the provenance hub for that interview.

---

## Append-Only and the Supersede Model

Finalized question files are **append-only**, with exactly two mechanical
edits allowed: status flips and supersede stamps.

When new information overrides a finalized answer:

1. Record the override where decisions live — an ADR or decision-log entry —
   explicitly citing the overridden question (`000/Q-ARCH-03`).
2. At the same moment, stamp the question: status → `superseded`, plus one
   line: `Superseded YYYY-MM-DD by ADR-007 — see ADR-007 for current direction.`

History stays intact; the stale answer is labeled stale at the point of
reading. This is the same pattern the decision log already mandates ("never
edit a recorded decision to mean something different — supersede it") and ADR
statuses already implement.

**Rule of altitude:** current truth lives in the derived docs (ADRs,
standards, decision log); question files are context/history — they explain
*why*, they are never the spec.

---

## Interview Retrospective

A shipped question bank fixes the quality *floor*; the retrospective is what
raises it — without one it fossilizes at launch quality.

When an interview's outputs have been **implemented** — inception: at the
project's first release; epic/feature: when its epic closes — ask one
question:

> **What did the interview fail to ask?**

Gaps that surfaced during the work (a decision made mid-build that a question
would have caught, rework a standard answer would have avoided) are the
answers. Each becomes a **port-back issue against the starter kit's question
bank** (the same channel as other kit port-backs), and the retrospective is
noted in the interview's `00-INDEX.md`. Every project's interview makes the
next project's interview better.

The triggers are wired where those moments live: the release flow (first
release) and the epic-close lifecycle rule.

---

## See Also

- `docs/plans/README.md` — the plans charter (interviews live there)
- `bootstrap/QUESTION_BANK.md` — the inception spine (sections + questions)
- `bootstrap/INTERVIEW.md` — the token-fill script that closes inception
- `docs/architecture/decisions/ADR_TEMPLATE.md` — `Source:` field (backward link)
- `docs/decision-log.md` — entry format with `Source:` field
