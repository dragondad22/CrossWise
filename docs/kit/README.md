# The Kit — reference

This project was scaffolded from the **Claude starter kit**: a stack-agnostic
process layer — standards, checklists, commands, and automation — for building
software with Claude Code. The journey through it (stages, flowchart, "where
am I?"): `docs/kit/WORKFLOW.md`. The kit version this project was scaffolded
from is recorded in `bootstrap/KIT_VERSION`.

## Commands

| Command | What it does | Reach for it when |
|---|---|---|
| `/bootstrap` | Runs inception: brief → interview → fill placeholders, founding docs, modules, tracker | Starting out; retrofitting kit pieces later |
| `/preflight` | Build + test + security + changelog check | Before every PR |
| `/qa` | QA validation against recent changes | Feature-complete work |
| `/security` | Security validation | Auth/authz/input-handling changes |
| `/compliance` | External-standards + obligation check | A change touches APIs, UI, mobile, messaging/UGC, payments, personal data, minors |
| `/perf` | Performance smoke | The perf signal that matters might have moved |
| `/release` | Version bump + CHANGELOG roll, in lockstep | `## [Unreleased]` has shipped enough |
| `/evergreen` | Six-lens standards & process review | ~30-day cadence, non-interruptive |
| `/conform` | Tidy to current kit standards, no behavior change (`github` = tracker only) | Adopting the kit into an untidy repo |
| `/rebaseline` | Harvest → pre-answered interview → critique → agreed rebuild plan | Sound concept, wrong implementation |

## Directory map

| Path | What lives there |
|---|---|
| `CLAUDE.md` | Root context, loaded every session: non-negotiables, commands, standards index |
| `ai/agent-setup.md` | Living orientation doc + session-start protocol |
| `ai/STANDARDS/` | How work is done per area — read the relevant one before working there |
| `ai/CHECKLISTS/` | Completion gates: coding, QA, validation |
| `ai/TEMPLATES/` | Issue bodies, feature specs, diagnostic bundles |
| `ai/scripts/` | Shipped automation: release, version sync, labels, review stubs |
| `bootstrap/` | The kit's own machinery: question bank, token map, paved-road registry, staged modules, `KIT_VERSION` |
| `docs/plans/` | Interviews + decision working docs (structured discovery only) |
| `docs/specs/` | Journey-first feature specs (created at promotion) |
| `docs/architecture/decisions/` | ADRs |
| `docs/decision-log.md` | Product/scope decisions |
| `docs/GLOSSARY.md` · `docs/PERSONAS.md` | Naming authority · persona registry |
| `docs/compliance/` | What externally binds this project |
| `docs/runbooks/` | Anything operational done twice |
| `.claude/commands/` | The slash commands above |
| `.github/workflows/` | PR-validation CI (from the shipped example) |

Modules installed later add their own pieces (e.g. the reports module ships
`docs/uat/` + acceptance/beta-guide templates).

## Where does X go?

| X | Home |
|---|---|
| An architectural decision | ADR (`docs/architecture/decisions/`) |
| A product/scope call | `docs/decision-log.md` |
| A feature idea | `type:feature` issue, Horizon on the board — never a document |
| Work to do | A tracked issue; branch `<type>/<issue#>-<slug>` |
| A term someone had to explain | `docs/GLOSSARY.md`, at coin time |
| A how-to you'll need twice | `docs/runbooks/` |
| What a feature does | Its spec in `docs/specs/` |
| Why the interview asked that | `docs/plans/<NNN>-*/` — history, never the spec |

**Keep this folder current:** these two files ride the same-PR rule — a change
to commands, flow, or structure updates them in the PR that makes it
(`ai/STANDARDS/DOCUMENTATION_STANDARD.md` keep-current rule).
