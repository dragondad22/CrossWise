*Generic template from the Claude starter kit — adapt to this project. Replace `{{TOKENS}}`; see `bootstrap/PLACEHOLDERS.md`.*

# <Feature name, in the tester's words> — beta test guide

<!--
WHAT: the human-facing UAT artifact — a hand-off for beta testers, who may be
non-technical and may never have tested software before. Everything below this
comment is user-facing text: the audience-first rules apply in full
(ai/STANDARDS/DOCUMENTATION_STANDARD.md — persona voice, no internal leakage,
no jargon, no AI-tell prose). The tester never sees this comment block.

GOALS, NOT STEPS — the rule that makes this artifact work. Each task gives a
scenario, a starting point, and what "done" looks like; NEVER a click-path.
A step-by-step script explains the joke: the tester succeeds at your steps and
you learn nothing about whether the UI is discoverable. What a human tester
uniquely offers is their naïve first pass — it is nonrenewable, and steps
destroy it. Everything scripted belongs in the acceptance doc
(ai/TEMPLATES/ACCEPTANCE_DOC_TEMPLATE.md) and the E2E suite instead.

DERIVED, NOT INVENTED: tasks come from the feature spec's journey layer
(docs/specs/) — the journey with the steps deleted. If a task cannot be stated
without explaining how to do it, that is a design finding before any tester
sees it — route it per the "how do I…?" rule in ai/STANDARDS/UI_STANDARD.md
(ui module) rather than shipping the explanation.

WHEN: drafted at feature-complete; reviewed by a human before testers get it;
refreshed at release time (the CHANGELOG's Unreleased section is the delta of
guides to create or update). Testers receive guides only after acceptance
verification and the E2E smoke are green on a build they can reach.

FEEDBACK ROUTING: a tester asking how to do something → UX/design issue against
the flow, not help text (ai/STANDARDS/UI_STANDARD.md). Bugs → normal intake
(ai/STANDARDS/GITHUB_ISSUES.md), with the tester's words quoted as evidence.

NAME + HOME: docs/uat/beta/BETA-<DOMAIN>-NNN-<slug>.md, mirroring the feature
spec ID. One guide per feature; 3–6 tasks is plenty.
-->

**For:** <persona name — pick from `docs/PERSONAS.md` and write for them> ·
**Takes about:** <15> minutes

## Before you start

- You'll need: <plain-language prerequisites — an account, a phone or computer,
  sample data already set up for you>
- If you can't even get started, that's a result too — tell us where it stopped.

## What we're asking

Use {{PROJECT_NAME}} the way you naturally would. There are no wrong moves, and
you can't break anything — <confirm or adjust>. We're testing the product, not
you: anything confusing is a problem with the product, and it's exactly what we
want to hear about.

One favor: **please don't ask anyone how to do these tasks.** Working that out
on your own — or not managing to — is the most useful thing you can show us.

## Task 1 — <plain-language name>

- **The situation:** <a scenario from the persona's world — "You just got back
  from a home visit and need to record what happened.">
- **Start from:** <"the main screen — then go wherever feels natural">
- **You're done when:** <the outcome, from the tester's point of view — "you
  can find that visit again later">

Afterwards, jot down:

- Did you finish? If you gave up, where?
- Where did you pause, guess, or feel unsure?
- Did anything happen that you didn't expect — or not happen that you expected?

## Task 2 — <…>

<Repeat the shape: situation / start from / done when, then the same three
questions. Cover the sad path as a scenario too — "you typed the wrong thing /
changed your mind halfway" — without saying what will happen.>

## Wander off the path

When the tasks are done (or you're fed up — also useful to know), spend a few
minutes exploring anywhere you like. Try whatever you're curious about. If
something looks odd, slow, or confusing, write it down — unplanned finds are
often the best ones.

## Sending us your notes

<One obvious channel: a form link, an email address, or a chat — with any
screenshots you took.> Rough notes are perfect. Thank you — what you send
genuinely shapes what we build next.
