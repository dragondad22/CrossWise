# QA Checklist

Use this checklist when validating changes — after implementation or as a dedicated QA pass.

## Automated Tests

### Integrity Audit
- [ ] No skipped or `.only` tests in committed code
- [ ] No suspicious always-pass patterns (tests that pass regardless of input)
- [ ] No mocked-away security checks (auth/permissions bypassed in tests)

### Test Execution
- [ ] Test suite passes: `npm test`
- [ ] End-to-end passes (if flows changed): `N/A`

### Coverage Assessment
- [ ] New code paths have test coverage
- [ ] Edge cases covered (empty inputs, boundary values, concurrent access)
- [ ] Authorization tested (unprivileged actor denied)
- [ ] (Multi-tenant) isolation tested (cross-tenant access denied)

## Acceptance Validation

- [ ] UAT/acceptance doc identified
- [ ] Each acceptance criterion verified with evidence
- [ ] Happy path works end-to-end
- [ ] Error/edge cases handled gracefully

## UX Spot Check (if there's a UI)
- [ ] Copy is clear and operational (action verbs on buttons, helpful empty states)
- [ ] Forms: labels visible, validation inline, errors actionable
- [ ] Navigation: user can reach the feature and return without confusion
- [ ] Notifications placed correctly per convention
- [ ] Responsive at supported viewports
- [ ] Keyboard-only navigation works; focus visible; contrast adequate

## Evidence Capture
- [ ] Commands run and results recorded
- [ ] Failing tests documented with reproduction steps
- [ ] Screenshots/artifacts for UI changes if applicable

## Standards & Compliance
- [ ] `/compliance` run for feature changes; fired triggers checked against `docs/compliance/COMPLIANCE_REGISTER.md`
- [ ] No registered obligation regressed by this change
- [ ] Store-blocking items (privacy disclosure, account deletion, target API level, age rating) verified before a mobile release

## Issue Management
- [ ] Bugs found filed as tracked issues per `ai/STANDARDS/GITHUB_ISSUES.md`
- [ ] Issues linked to the relevant feature/change
- [ ] Severity assigned based on user impact
