# specs — feature specs

Journey-first feature specifications: one document per feature
(`SPEC-<DOMAIN>-NNN`, template: `ai/TEMPLATES/FEATURE_SPEC_TEMPLATE.md`), two
layers in one file, ordered by audience:

- **Journey layer** (top) — persona (by name, from `docs/PERSONAS.md`), goal,
  plain-language steps, and a simple flow diagram of **user actions — never
  table names**. Written so a non-technical stakeholder can read it and confirm
  "yes, that's what should happen"; exportable/shareable standalone.
- **Technical layer** — preconditions, data touchpoints, business rules,
  edge cases — for the AI, developers, and UAT.

Specs are a generated founding artifact of a feature interview — derived from
its `Final:` fields with `Source:` Q-ID provenance (see
`ai/STANDARDS/INTERVIEW_STANDARD.md`). They outrank UAT docs in the
source-of-truth precedence when they exist.

Quality mechanisms (why v1 "workflow docs" rotted, designed against):

- **Keep-current:** spec updates ride the documentation standard's same-PR
  rule — behavior changes and their spec land together.
- **UAT traceability:** UAT acceptance criteria cite journey step numbers and
  edge-case row IDs, so a spec that misses reality fails visibly at UAT
  instead of silently.
- **Initial quality:** the feature interview stress-tests scenarios (invent
  edge cases during the interview, don't just transcribe answers).
