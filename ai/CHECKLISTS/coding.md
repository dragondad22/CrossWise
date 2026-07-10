# Coding Checklist

Use this checklist before marking any implementation work complete.
Prune sections that don't apply to this project (e.g. UI, multi-tenant).

## Impact Analysis (consumer sweep)

Run this **first**. A change is not local until you have proven it is. For anything
shared being changed — a DB column/constraint, an enum or lookup vocabulary, a
default/seed value, a shared type or helper:

- [ ] Other definitions/constraints on the same thing identified (a change that "replaces" an old rule must also remove the old one)
- [ ] **Every write path** that creates/updates the entity swept, not just the one you touched (CRUD paths AND any provisioning/seed/demo-fixture paths — these drift independently)
- [ ] Every reader/validator swept: UI pickers, write-time validators, reports, exports
- [ ] The change actually completes the intent of the decision/ADR it implements (re-read it; verify the code matches)
- [ ] A tracked issue filed for any impacted consumer that can't be fixed in the same change
- [ ] Prefer one shared constant over duplicated literals

## Security & Authorization

- [ ] New/modified entry points enforce authorization with the correct permission/role
- [ ] Untrusted input (body/params/headers) validated before use
- [ ] Negative-path test: unprivileged actor is denied
- [ ] (Multi-tenant) all new data queries scoped server-side; no client-provided scoping IDs trusted
- [ ] (Multi-tenant) negative-path test: actor in tenant A cannot access tenant B data

## Audit & History

- [ ] Sensitive mutations are logged with actor, action, and what changed
- [ ] No destructive deletes for critical records (use soft-delete/restriction where applicable)

## UI/UX Quality (if there's a UI)

- [ ] Design tokens used — no hard-coded colors, radii, shadows, spacing
- [ ] Shared component primitives reused before creating new ones
- [ ] Loading, empty, and error states present for data-driven views
- [ ] Destructive actions require a confirmation
- [ ] Light and dark theme both work
- [ ] Responsive across the supported breakpoints

## Accessibility (if there's a UI)

- [ ] Keyboard navigation works for all interactive controls
- [ ] Visible focus rings preserved
- [ ] Semantic labels on icon-only actions
- [ ] Color not used as the sole indicator

## Testing

- [ ] Unit tests added/updated for new logic
- [ ] Tests cover happy path + auth/boundary cases
- [ ] Edge cases covered (empty inputs, boundary values)
- [ ] All tests passing (`npm test`)

## External Standards & Compliance

Run the trigger map in `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md` against this change (or run `/compliance`).

- [ ] Public/consumed API changed → OpenAPI spec updated in the same change; error shape + versioning consistent
- [ ] Web UI changed → WCAG 2.2 AA, semantic HTML, keyboard, visible focus
- [ ] Mobile release → privacy disclosure matches reality, account deletion, current target API level, honest age rating, permissions justified
- [ ] Messaging/UGC added or changed → report + block + moderation + a response path
- [ ] Personal data (especially about minors) → consent/age thresholds, high-privacy defaults, retention/deletion
- [ ] Any fired trigger not already in `docs/compliance/COMPLIANCE_REGISTER.md` → surfaced + tracked (not silently absorbed)

## Documentation

- [ ] Relevant UAT/acceptance doc created or updated
- [ ] ADRs updated if architectural decisions changed (`docs/architecture/decisions/`)
- [ ] Decision log updated if product/scope decisions changed (`docs/decision-log.md`)
- [ ] Schema/data docs updated if the data model changed
- [ ] `CHANGELOG.md` `[Unreleased]` updated when this change ships user-visible behavior (skip only for refactor/test/doc/comment-only)
- [ ] User docs updated for user-visible changes (see `ai/STANDARDS/DOCUMENTATION_STANDARD.md`)
