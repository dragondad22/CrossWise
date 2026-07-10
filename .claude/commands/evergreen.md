Run a Standards & Process Evergreening review — periodically stop and look at *how* we're working: repeated patterns, new platform capabilities, drifted standards, stale dates, kit updates.

**Non-interruptive by design.** When the session-start cadence check triggers this, run it in the background or at a natural pause and **file an issue with the findings — never derail the task the human arrived with.** The interactive discussion happens when the issue is *worked*, not when it's filed.

1. **Check the seen-list first.** Read `docs/evergreen-log.md` and note the date of the last review. Prior **Aware**/**Rejected** verdicts are settled — re-surface an item only if something material changed (new version, constraint lifted, breakage fixed).

2. **Run the six lenses** against the repo and the history since the last review (`git log`, closed issues/PRs):
   - **Repetition** — are we writing the same code/fix/workaround repeatedly? Candidate for a shared helper, a standard, or a paved-road entry (`bootstrap/PAVED_ROAD.md`).
   - **Platform delta** — new Claude Code features, skills, or tool capabilities since the last review worth adopting?
   - **Standards drift** — do the written standards still match actual practice? Fix the standard or fix the practice — deliberately, either way.
   - **Date sweep** — currency-sensitive rows: paved-road "Last reviewed" dates, compliance register "Verified" dates, any standard whose "Last Updated" no longer reflects its content.
   - **Kit delta** — read `bootstrap/KIT_VERSION`; if the starter kit has a newer release, diff the changelog/modules this project uses against it and propose the relevant updates.
   - **Context economy** — is `CLAUDE.md` within its **~150-line budget**? On breach, demote detail into a standard behind a breadcrumb — never delete it (principles + trim test: `ai/STANDARDS/DOCUMENTATION_STANDARD.md` § Design principles).

3. **Give every finding a verdict** (new ≠ adopt — awareness has value on its own), noting compatibility/breakage risk:
   - **Adopt** — clear win, low risk.
   - **Sandbox** — promising; trial in an isolated branch/worktree before any standard changes.
   - **Aware** — know it exists, not adopting (say why — e.g. dependency pins make it break).
   - **Rejected** — evaluated, doesn't fit (recorded so it isn't re-litigated).

4. **File the outputs — findings never live only in conversation:**
   - One issue titled "Evergreen review <date>" (`type:task` + `evergreen` labels) with the findings, verdicts, and per-finding recommendations. The human reviews it from the board on their own schedule.
   - Accepted actionable findings → their own tracked issues, like all work.
   - Adoption/change decisions (when the issue is worked) → decision log / ADR, as any decision.
   - Improvements generic enough for the starter kit → port-back issues on the kit repo.

5. **Append the run record** to `docs/evergreen-log.md` (newest entry on top): date, lenses run, findings + verdicts, issue links — or "no findings". This entry is the cadence timestamp, the provenance breadcrumb, and the seen-list for the next run.

Cadence: if the last entry in `docs/evergreen-log.md` is older than ~30 days, the session-start protocol proposes a run (non-interruptively). Also runnable on demand at any time.
