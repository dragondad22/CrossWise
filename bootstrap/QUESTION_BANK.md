# Inception Question Bank — the spine

The canonical question set for the inception interview. Machinery (file layout,
question block format, lifecycle, Q-IDs, provenance):
`ai/STANDARDS/INTERVIEW_STANDARD.md` — read it first.

**How this bank is used.** Inception opens with the approved project brief —
`000-inception/00-BRIEF.md`, the shared-understanding gate ("The Brief" in
`ai/STANDARDS/INTERVIEW_STANDARD.md`); no questions are generated before it.
Then the AI generates the `000-inception/`
interview directory under `docs/plans/` from this bank: one section file per section below,
each spine question expanded into the full question block (why-this-matters,
options with trade-offs, recommendation, default), with the brief's statements
baked into recommendations. The spine is the floor, not
the interview: spine questions are conversation starters, and the AI **must**
generate follow-up questions driven by the answers — and by what the brief
left vague — appending IDs within the section (`Q-ARCH-07`, `-08`…).

**Depth rule (when is a section done):** a section is complete when its
downstream founding artifact can be written **without invention** — if writing
the ADR, register row, or scaffold-plan line would require guessing, the
section needs another follow-up.

**Right-sizing rule:** recommendations must fit the project's actual scale —
smallest thing that works, moving up the ladder only with a reason. A small
tool does not get enterprise infrastructure; "I don't care what it looks like"
is a legitimate aesthetics answer. Where a house default exists (paved-road
registry: `bootstrap/PAVED_ROAD.md`), recommendations cite it by name.

**Reuse for epics/features:** an epic/feature interview (`001-…`, `002-…`)
picks the sections that apply (typically scope, architecture, data, testing,
operations) and adds its own; Identity and License are normally
inception-only. Same codes, same format — inception is just instance one.

**This bank improves by retrospective:** when an interview's outputs are
implemented, "what did the interview fail to ask?" is asked once and the gaps
are filed as port-back issues against the starter kit's copy of this bank
(rule: `ai/STANDARDS/INTERVIEW_STANDARD.md`).

---

## 1. Identity & Problem — `IDENT`

*Downstream: project README, `CLAUDE.md` header, glossary seeds, persona
registry (`docs/PERSONAS.md`).*

- **Q-IDENT-01 — What problem does this solve, and for whom?** The pain in
  plain words, and each distinct kind of user. Follow up until personas are
  nameable (who they are, goals, technical comfort).
- **Q-IDENT-02 — What is it called, in one line?** Name, tagline, owner
  (company / org / you).
- **Q-IDENT-03 — What domain words matter here?** Terms a newcomer wouldn't
  know, or that the project uses in a specific sense — these seed the glossary.

## 2. Scope — `SCOPE`

*Downstream: decision-log seeds, non-negotiables, the epic breakdown.*

- **Q-SCOPE-01 — What must the first usable version do?** The shortest list
  that makes it worth using.
- **Q-SCOPE-02 — What is explicitly out?** Non-goals, recorded so they aren't
  re-litigated feature by feature.
- **Q-SCOPE-03 — What might it grow into?** Later directions that would change
  today's design if known now (multi-user? public API? mobile?).
- **Q-SCOPE-04 — What must never be compromised?** Push for at least one real
  non-negotiable: security/isolation invariants, data-integrity rules, privacy
  boundaries, "we will never do X".

## 3. Architecture & Approach — `ARCH`

*Downstream: initial ADRs, `CLAUDE.md` architecture section, module triggers.*

- **Q-ARCH-01 — What shape is it?** CLI / library / service or API / web app /
  mobile / desktop / **game** / a mix. A console app is a real answer, not a
  fallback. A game answer redirects the follow-ups: engine or framework
  choice, target platform(s) and stores, the core loop, real-time
  constraints, and the art/asset pipeline — and shifts later sections (UI
  becomes art direction, TEST leans on the failure that matters for play,
  INFRA includes distribution).
- **Q-ARCH-02 — What are the major pieces and how do they talk?** Components,
  boundaries, sync vs async — at whiteboard altitude.
- **Q-ARCH-03 — Language and stack: preference or constraint?** Existing
  skills, existing code, team realities. Cite house defaults where they exist.
- **Q-ARCH-04 — What will you build vs. use off the shelf?** Auth, payments,
  search, email — buying is often the right call; deviations from obvious
  services deserve a reason.
- **Q-ARCH-05 — Runtime version policy: evergreen or pinned?** House default:
  **evergreen** — latest stable of each toolchain unless a dependency forces a
  pin (paved-road registry: `bootstrap/PAVED_ROAD.md`). Confirm the default
  rather than asking blind; capture any pins **with their reasons** — they
  feed `CLAUDE.md`, pin files (`.nvmrc` etc.), and an ADR when the pin is
  load-bearing. Never infer the policy from what happens to be installed.

## 4. Infrastructure — `INFRA`

*Downstream: hosting ADR, deploy-ci module shape, cost expectations,
locality non-negotiables, compliance register rows.*

- **Q-INFRA-01 — Where does it run?** The right-sizing ladder: local-only →
  single small host (Pi / VPS) → managed platform → full cloud. Recommend the
  smallest rung that works; each step up needs a stated reason.
- **Q-INFRA-02 — What scale, honestly?** Users, data volume, traffic — now and
  in a year. Design for the honest number, not the dream.
- **Q-INFRA-03 — What should it cost to run?** Monthly tolerance; free-tier
  constraints if any.
- **Q-INFRA-04 — Are there boundaries on where data or compute may go?**
  Local-only / self-hosted only / cloud OK / cloud with conditions (named
  providers, regions, no third-party processing). Ask **explicitly about
  third-party AI services**: is sending code, prompts, or user data to a
  hosted model acceptable, or must AI stay local/private? A boundary here is
  a prime non-negotiable candidate — it constrains hosting, stack, and
  feature design, and seeds compliance rows. (Port-back: in the first trial
  this was the project's defining requirement, and no spine question asked.)

## 5. UI & Aesthetics — `UI`

*Downstream: ui module trigger, design-source token, UI standard applicability.*

- **Q-UI-01 — Is there a UI at all?** If no: section closes, UI module never
  triggers.
- **Q-UI-02 — How much does its look matter?** Ladder: "I don't care —
  functional defaults" / clean-but-generic / branded / design-led. Every rung
  is legitimate; the answer changes what gets scaffolded, not the project's
  worth. Orthogonal to the rung: should it feel **playful/gamified** — fun
  graphics, delightful interactions, progression mechanics — even when the
  project isn't a game? Name that deliberately; it shapes the UI standard's
  adaptation, not just the visuals.
- **Q-UI-03 — Is there a design source of truth?** Figma or equivalent, or
  none. Accessibility floor for the audience.

## 6. Data & Lifecycle — `DATA`

*Downstream: db module trigger, schema ADR, backup/restore runbook decision,
compliance register rows.*

- **Q-DATA-01 — What data does it keep, and which of it is authoritative?**
  The record of truth vs. caches and derivations.
- **Q-DATA-02 — Where does it live?** Flat files / embedded DB (SQLite) /
  server DB — right-sized. ORM and migration tooling if a DB.
- **Q-DATA-03 — What happens when the data is lost?** Backup cadence, restore
  story, acceptable-loss window. Right-size it: "weekend CLI → no backups, and
  that's fine" is a legitimate recorded `Final:`. A backup/restore runbook is
  scaffolded only when the answer warrants one.
- **Q-DATA-04 — Must any of it be deleted or kept?** Retention rules, user
  deletion requests, export obligations.

## 7. Environments, Config & Secrets — `ENV`

*Downstream: `.env.example` shape(s), deploy-ci module shape, agent setup.*

- **Q-ENV-01 — What environments exist or will exist?** Local / dev / staging /
  prod — or honestly just local for now.
- **Q-ENV-02 — Where does config live, per environment?** Files, env vars,
  platform config — and what differs between environments.
- **Q-ENV-03 — Where do secrets live?** Baseline rule: `.env` is a local-dev
  convenience — gitignored, never real production secrets; deployed
  environments use the platform's secret store. Name the store.
- **Q-ENV-04 — Which surfaces need their own env files?** Multi-app repos get
  one `.env.example` per surface, documenting key *shapes* with placeholder
  values only.

## 8. License & Ownership — `LIC`

*Downstream: LICENSE file (or deliberately none), README ownership line.*

- **Q-LIC-01 — What license?** MIT / Apache-2.0 / proprietary / undecided-yet.
  Recommend MIT for intended-open work, no license file (all rights reserved)
  for closed work; "undecided" is allowed but gets a revisit marker.
- **Q-LIC-02 — Who is the copyright holder?** The name that goes on the
  LICENSE and README.

## 9. Security & Compliance — `SEC`

*Downstream: compliance register active rows, security standard applicability,
non-negotiable candidates.*

- **Q-SEC-01 — Who is the audience — and does it include minors?** If so,
  what age range: this fires real obligations.
- **Q-SEC-02 — What regulated or sensitive data is handled?** PII, health,
  payments, location — or genuinely none.
- **Q-SEC-03 — Any obligation-bearing features?** User-to-user messaging, UGC,
  payments, tracking/analytics, a public API consumed by others.
- **Q-SEC-04 — Who logs in, and how?** Auth approach, roles, tenancy/data
  boundaries. "Nobody — it's single-user local" is a legitimate answer that
  closes most of this section.

## 10. Testing — `TEST`

*Downstream: test commands, testing-standard adaptation, CI gate list.*

- **Q-TEST-01 — What breaking would hurt most?** The failure that matters
  drives where test depth goes first.
- **Q-TEST-02 — Unit/integration framework per language?** Cite the house
  default where one exists; confirm rather than re-derive.
- **Q-TEST-03 — Is end-to-end testing warranted?** A UI usually means yes
  (house E2E default); a library usually means no.

## 11. Operations — `OPS`

*Downstream: deploy-ci module trigger, logging-standard adaptation, runbooks,
dependency-maintenance paragraph.*

- **Q-OPS-01 — How does a change reach users?** The deploy story — even if
  it's "git pull on the box". This is what arms the deploy-ci trigger later.
- **Q-OPS-02 — How will you know it's broken?** Logs, monitoring, alerts —
  right-sized; "I'll notice" is honest for a personal tool.
- **Q-OPS-03 — Who keeps dependencies current?** Default for GitHub-hosted
  projects: Renovate or Dependabot; otherwise name a cadence and an owner.
- **Q-OPS-04 — What routine operations will recur?** Anything done twice gets
  a runbook: restores, rotations, data fixes, release steps.

---

## See Also

- `ai/STANDARDS/INTERVIEW_STANDARD.md` — format, lifecycle, Q-IDs, provenance
- `bootstrap/INTERVIEW.md` — the token-fill script that closes inception
- `docs/plans/README.md` — where interview directories live
