Check a change (or a described feature) for external-standards and context-driven compliance obligations.

Run this when a change adds or alters a feature, before shipping a mobile release, or whenever you're unsure whether something pulls in extra requirements.

1. **Establish scope.** If given a feature description, use that. Otherwise run `git diff --name-only` (and skim the diff) to understand what changed.
2. **Read the catalog and the register:**
   - `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md` — the trigger map + obligations.
   - `docs/compliance/COMPLIANCE_REGISTER.md` — what already binds this project.
3. **Match triggers.** For each row in the trigger map, decide whether this change fires it. Pay special attention to the high-cost, easy-to-miss triggers:
   - New/changed **public API** → OpenAPI spec updated in the same change? Error shape + versioning consistent?
   - New/changed **web UI** → WCAG 2.2 AA, semantic HTML, keyboard, focus.
   - **Mobile release** → store privacy disclosure matches reality, account deletion, target API level, age rating, permissions justified.
   - **Messaging / UGC** → report + block + moderation + response path.
   - **Personal data**, especially about **minors** → consent thresholds, high-privacy defaults, DPIA.
4. **Reconcile against the register.** For each fired trigger:
   - Already an active obligation → check its status and whether this change keeps it met or regresses it.
   - Fired but **not** in the register → this is the important case: surface it, and recommend adding a register row + a tracked issue. Do not silently absorb or skip it.
5. **Currency check.** For any store/platform/legal obligation, note if the register's `Verified` date is stale; recommend re-checking the live official source (these change frequently — your training data may be out of date, so prefer verifying against current sources).
6. **Report.** List: triggers fired, obligation status for each, gaps (fired-but-unregistered, or registered-but-regressed), and concrete next actions. Flag anything that would block a store submission separately and loudly.
