<!-- Generic template from the Claude starter kit. Seeded by /bootstrap from the inception audience answers; extended by feature interviews. -->
# Personas — CrossWise

The central persona registry: every persona this project designs for, defined
once. Specs, UAT docs, and issues reference personas from here **by name — never
redefine one inline**. Glossary role-term entries cross-link here; the
role/permission mapping is the bridge to RBAC when the project has one.

Seeded at inception from the audience answers; extended when a feature
interview surfaces a new kind of user. Update a persona here (one place) when
reality changes — not in the documents that cite it.

Each persona records:

- **Who they are** — one or two plain sentences.
- **Goals** — what they are trying to get done with the product.
- **Role / permission mapping** — the system role(s) they hold, if the project
  has roles or RBAC ("n/a" is fine).
- **Context & constraints** — environment, device, technical comfort, and
  anything that shapes how they use the product (time pressure, accessibility
  needs, offline field work, …).

> **Roles note:** CrossWise has no RBAC — every account holds the same
> authenticated `user` role, with hard per-user data isolation (ADR-001): full
> CRUD on your own topics, lists, puzzles, and solves; no access to anyone
> else's. Personas below differ by intent and context, not by permissions.
> ADR-003 (curated library, planned) would introduce the first publisher-style
> role; add that persona when the feature is interviewed.

---

## Teacher

**Who:** A classroom teacher (language arts, foreign language, science…) who
turns each unit's vocabulary into practice material. Comfortable with everyday
web tools, has no time to learn puzzle-construction software.

**Goals:**
- Turn a unit's term list into a solvable crossword in minutes, not evenings.
- Organize lists by topic/unit and keep versions as the list evolves
  mid-semester.
- Import lists prepared elsewhere (JSON today; CSV upload is planned, #31)
  rather than retyping them.
- Regenerate a fresh-but-equivalent puzzle from the same list (seeded
  generation) for different class periods or retakes.

**Role / permissions:** `user` — owns their topics/lists/puzzles; students
cannot see them (no sharing surface exists yet; public/share links are
explicitly out of scope until child-safety design gates are met — see
Decision 1 and the compliance register's UGC row).

**Context & constraints:** Desktop or school laptop during planning periods;
works in short interrupted bursts, so drafts must never be lost. Distributes
puzzles outside the app for now (students solve on their own accounts or on
paper). Lowest tolerance for a generator that silently drops words — they need
to trust that the puzzle covers the unit.

## Student

**Who:** A school-age learner — **plausibly under 13** — solving vocabulary
puzzles for class or study. CrossWise is formally treated as a service likely
accessed by minors (Decision 1); this persona is why.

**Goals:**
- Solve a puzzle across several short sessions without ever losing progress
  (local autosave + server sync, newest-wins reconciliation).
- Move through the grid fluidly by keyboard on a laptop or touch on a
  tablet/phone.
- Check a letter/word/puzzle when stuck and see clear win feedback.

**Role / permissions:** `user` — same as every account; owns their solves and
any lists they create. Child-safety posture applies: high-privacy defaults,
minimal data collection, age-appropriate design (Decision 1 / CW-C-005).

**Context & constraints:** School Chromebooks, shared family tablets, and
phones — often low-power devices and small screens; touch input must be as
first-class as keyboard. May solve offline-ish (flaky school Wi-Fi), so local
autosave is the safety net. Accessibility matters here first: keyboard-only
navigation and focus management in the grid (WCAG pass tracked in #27).

## Self-directed learner

**Who:** An adult learning on their own — a language learner drilling
vocabulary, a certification candidate memorizing terminology, a crossword
hobbyist making themed puzzles. The "anyone" in "students, teachers, and
anyone."

**Goals:**
- Maintain a growing personal collection of topics and lists over months.
- Generate a quick puzzle from any list and solve it in spare minutes.
- Get their data in and out freely: JSON import/export today; account-level
  export and deletion are compliance commitments (#26).

**Role / permissions:** `user` — owns everything they create; nothing shared.

**Context & constraints:** Personal devices, frequently the phone in stolen
moments (commute, lunch) — the strongest pull toward the planned native mobile
apps (Decision 2). Technically able but convenience-driven: friction in
import or a lost solve session is enough to drop the habit.
