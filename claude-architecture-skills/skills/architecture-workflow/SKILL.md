---
name: architecture-workflow
description: >
  End-to-end codebase health workflow: discover architecture, review it, fix issues
  with TDD, and document the result. Chains describe-design, architecture review
  skills, and tdd-ai into a single phased workflow with checkpoint documents.
  Use this skill whenever the user says "audit my codebase", "do a full architecture
  review and fix things", "improve my codebase architecture", "health check this
  project", "review and refactor", "clean up this codebase", or any request that
  involves understanding an existing codebase, identifying architectural problems,
  fixing them, and documenting the result. Also trigger when the user wants a
  comprehensive codebase improvement that goes beyond a single review — they want
  the full loop of discover, diagnose, fix, and re-document. If the user seems to
  want both a review AND fixes applied, this is the right skill.
---

# Architecture Workflow: Discover, Diagnose, Fix, Document

This skill orchestrates a full codebase health cycle. Instead of running individual
architecture skills in isolation, it chains them into a coherent workflow where each
phase feeds the next. The output of discovery informs the diagnosis; the diagnosis
drives the fixes; the fixes get documented in the final state.

The workflow has four phases. Phases 1-2 run without stopping, then you pause for
the user to review the diagnosis before proceeding to Phases 3-4.

```
Phase 1: Discover    →  Phase 2: Diagnose    →  [USER REVIEW]  →  Phase 3: Fix    →  Phase 4: Document
(describe-design)       (architecture review)                      (tdd-ai)           (describe-design)
```

Each phase produces a checkpoint document saved to the project directory, so there's
a clear paper trail of what was found and what changed.

---

## Phase 1: Discover the Codebase

**Goal:** Build a complete mental model of the system before forming any opinions.

**Skill:** Use the `describe-design` skill's 8-step discovery methodology.

Follow the describe-design discovery process:
1. Project configuration (deps, runtime, external services)
2. Entry points & routing
3. Domain boundaries
4. Data model & storage
5. External integrations
6. Cross-cutting concerns (auth, logging, error handling)
7. Build & deployment
8. Test structure

**What to capture beyond the standard describe-design output:**

While discovering, keep a running list of "smells" — things that look off but you
haven't diagnosed yet. Don't judge them in this phase, just note them. Examples:
- A 500-line file in a project where most files are under 100
- A `utils.py` that half the codebase imports
- Database queries scattered across route handlers instead of a service layer
- No test directory, or tests that haven't been updated in months
- Configuration hardcoded where it should be environment-driven

**Checkpoint document:** Save `architecture-workflow/phase-1-discovery.md` to the
project root. Include:
- System overview (what it does, tech stack, scale)
- Architecture diagram (Mermaid C4 or container diagram)
- Data model (ER diagram)
- Key flows (sequence diagram for 1-2 critical paths)
- External dependencies map
- The "smells" list (undiagnosed observations)

---

## Phase 2: Diagnose the Architecture

**Goal:** Turn the discovery into a structured diagnosis with prioritized findings.

### Selecting the Right Review Lens

Based on what Phase 1 discovered, choose which architecture review approach to apply.
The codebase itself tells you which lenses are relevant — you don't need all of them
for every project.

**Decision tree:**

```
Is it a Python/FastAPI backend?
  → Apply python-architecture-review patterns
     (health score, findings table, dependency map, before/after code)

Is it a general backend or full-stack app with design pattern issues?
  → Apply software-architecture patterns
     (SOLID analysis, coupling/cohesion, layering, ADRs)

Does it have microservice boundaries or service-to-service communication?
  → Apply microservices-architect patterns
     (service boundaries, data ownership, resilience, communication patterns)

Does it have cloud infrastructure (Terraform, CDK, AWS/GCP configs)?
  → Apply cloud-infrastructure patterns
     (cost analysis, scaling, security posture, IaC review)

Does it have a frontend (Next.js, React, Vue)?
  → Apply modern-web-app-architecture patterns
     (rendering strategy, state management, bundle analysis, Core Web Vitals)
```

Multiple lenses can apply to the same project — a FastAPI backend with a Next.js
frontend would get both the Python architecture review and the web app review.
A monolith showing signs of needing decomposition might get both software-architecture
and microservices-architect.

Use your judgment. The point is to apply the review lens that matches the codebase,
not to force every project through every skill.

### Running the Diagnosis

For each relevant review lens, produce:

1. **Architecture Health Score** — Rate each relevant dimension (1-10 scale) with
   one-line justification. The dimensions depend on the lens:
   - Python backend: Security, API Design, Data Layer, Code Organization, Error Handling
   - General architecture: Coupling, Cohesion, Abstraction, Testability, Extensibility
   - Microservices: Service Boundaries, Data Ownership, Resilience, Observability, Deployment Independence
   - Cloud: Cost Efficiency, Security Posture, Scaling Readiness, IaC Coverage, Disaster Recovery
   - Frontend: Rendering Strategy, State Management, Bundle Efficiency, Accessibility, Performance

2. **Findings Table** — Every finding gets:
   - ID (F1, F2, ...)
   - What's wrong (specific, with file:line references from Phase 1)
   - Severity (CRITICAL / HIGH / MEDIUM / LOW)
   - Impact (quantified where possible — "N+1 query hits DB 50x per request", not just "slow")
   - Fix effort (Quick: <1hr, Moderate: 1-4hr, Significant: 4hr+)
   - Unlocks (which other findings become easier once this is fixed)

3. **Issue Dependency Map** — Show which fixes depend on or unlock others. This
   determines the order of work in Phase 3:
   ```
   F1 (extract config) ──unlocks──→ F3 (environment-based settings)
   F2 (add service layer) ──unlocks──→ F5 (proper error handling)
                                       F6 (unit testability)
   F4 (password hashing) ──independent──
   ```

4. **What's Working Well** — Acknowledge good patterns in the codebase. This isn't
   just politeness — it tells the developer which patterns to preserve and extend.

### Presenting the Diagnosis

**Checkpoint document:** Save `architecture-workflow/phase-2-diagnosis.md` with all
findings, scores, and the dependency map.

**This is where you pause.** Present the user with a structured checkpoint using
this template:

```markdown
## Architecture Diagnosis Summary

### Health Scores
| Dimension | Score | Key Issue |
|-----------|-------|-----------|
| Security | 2/10 | Plaintext passwords, hardcoded secrets |
| Data Layer | 3/10 | N+1 queries, no connection pooling |
| ... | ... | ... |
| **Overall** | **X/10** | |

### Top Findings (CRITICAL + HIGH)
| ID | Finding | Severity | Effort | Unlocks |
|----|---------|----------|--------|---------|
| F1 | ... | CRITICAL | Quick | F3, F5 |
| F2 | ... | HIGH | Moderate | F6 |

### Proposed Fix Order
Based on the dependency map, I'd work through these in this sequence:
1. **Foundation:** F1, F2 (unblock everything else)
2. **Security:** F4, F5 (critical risk reduction)
3. **Architecture:** F6, F7 (structural improvements)
4. **Polish:** F8-F10 (quality of life)

**Estimated total effort:** ~X hours

### What's Working Well
- [patterns to preserve]

---
**Want me to proceed with the fixes, adjust the priority, or skip any?**
```

Wait for the user's go-ahead before entering Phase 3. They might want to:
- Skip certain fixes ("don't touch the auth system, we're replacing it next month")
- Reprioritize ("do the database fixes first, the API naming can wait")
- Add context ("that hardcoded URL is intentional for local dev, ignore it")

### Adjusting the Plan

If the user skips or reprioritizes findings:
1. Update the dependency map — if a skipped finding was unlocking others, note those
   are now blocked or need an alternative approach
2. Move skipped findings to a "Deferred" list — they'll appear in Phase 4's
   "Remaining Work" section
3. Restate the adjusted fix order before proceeding

---

## Phase 3: Fix with TDD

**Goal:** Systematically fix the findings from Phase 2, using test-driven development
to ensure each fix is verified and doesn't break existing behavior.

**Skill:** Use the `tdd-ai` skill's red-green-refactor cycle.

### Traceability: Phase 2 → Phase 3

Every fix in Phase 3 must reference its finding ID from Phase 2 (F1, F2, etc.).
This creates a clear audit trail: the user can trace any code change back to the
specific finding that motivated it, and any finding forward to the fix that resolved
it. If a finding is skipped, it should appear in Phase 4's "Remaining Work" with
its original ID preserved.

### Fix Order

Work through findings in the order determined by the dependency map from Phase 2,
adjusted by any user priorities. The general principle:

1. **Foundation fixes first** — things that unblock other fixes (extract config,
   create service layer, set up proper project structure)
2. **Critical security fixes** — plaintext passwords, SQL injection, exposed secrets
3. **High-impact architectural fixes** — N+1 queries, missing error handling,
   coupling issues
4. **Medium improvements** — naming, code organization, documentation
5. **Low-priority polish** — style consistency, minor optimizations

### For Each Fix

Every fix follows the tdd-ai red-green-refactor cycle. This matters because
architecture changes are exactly the kind of refactoring where things silently
break — a test suite is the only way to know you haven't introduced regressions.

For each finding ID from Phase 2:

1. **RED — Write failing tests first**
   - **Characterization tests:** If no tests exist for this code, write tests that
     lock in the *current* behavior (even if it's buggy). These protect against
     unintended changes. Run them — they should pass against the current code.
   - **Fix tests:** Write tests that describe the *desired* behavior after the fix.
     These should fail against the current code. Example: `test_password_is_hashed_not_plaintext`
     fails now because passwords are stored as MD5.

2. **GREEN — Implement the minimum fix**
   - Write just enough code to make the fix tests pass.
   - Don't gold-plate it — that's what the refactor step is for.

3. **REFACTOR — Clean up with confidence**
   - All tests are green, so you can restructure safely.
   - Run the full suite after each refactor step.

### Tracking Progress

Keep a running log in `architecture-workflow/phase-3-fixes.md`. Every entry must
reference its finding ID from Phase 2 — this is how we trace from diagnosis to fix.

Use this exact template for each fix:

```markdown
## Fix Log

### F4: Password Hashing (CRITICAL) ← Finding ID from Phase 2
- **TDD Cycle:**
  - RED: 2 characterization tests (current MD5 behavior), 3 fix tests (bcrypt hashing, verification, migration)
  - GREEN: Implemented bcrypt hashing in auth/service.py
  - REFACTOR: Extracted password utilities to auth/security.py
- **Tests added:** 5 (test_password_hashed_on_register, test_password_verified_on_login, test_old_passwords_migrated, test_md5_login_still_works, test_password_not_in_response)
- **Files changed:** auth/service.py, auth/security.py (new), auth/models.py, migrations/003_hash_passwords.py
- **Regression check:** Full suite passing (47 tests, 0 failures)

### F1: Extract Configuration (HIGH) ← Finding ID from Phase 2
- **TDD Cycle:**
  - RED: 2 fix tests (config loads from env, config has sensible defaults)
  - GREEN: Created config.py with Pydantic Settings
  - REFACTOR: Replaced all hardcoded values across 3 files
- **Tests added:** 2 (test_config_from_env, test_config_defaults)
- **Files changed:** config.py (new), main.py, db.py
- **Regression check:** Full suite passing (49 tests, 0 failures)
```

After completing all agreed-upon fixes, briefly summarize what was done:
- Number of findings addressed
- Tests added
- Files changed
- Full test suite status

---

## Phase 4: Document the Result

**Goal:** Produce updated architecture documentation reflecting the improved codebase.

**Skill:** Use `describe-design` again, but this time with the context of what changed.

### What to Produce

1. **Updated architecture documentation** — re-run the describe-design discovery
   against the now-improved codebase. The architecture diagram, data model, and
   component structure may have changed.

2. **Before/After comparison** — a concise section showing the key architectural
   changes:
   ```markdown
   ## Architecture Changes

   | Area | Before | After |
   |------|--------|-------|
   | Config | Hardcoded in main.py | Pydantic Settings from .env |
   | Auth | Plaintext passwords | bcrypt hashing + migration |
   | DB queries | Scattered in routes | Service layer with repository |
   | Tests | None | 52 tests (unit + integration) |
   | Health Score | 3.8/10 avg | 7.2/10 avg |
   ```

3. **Updated health score** — re-rate the same dimensions from Phase 2 against the
   improved codebase. Show the delta.

4. **Remaining work** — if any findings were deferred or new issues emerged during
   fixing, document them as future work with priority levels.

**Checkpoint document:** Save `architecture-workflow/phase-4-final.md` with the
complete updated documentation, before/after comparison, and remaining work.

Present the user with:
- The before/after health score comparison
- A summary of all changes made
- The updated architecture diagram
- Any remaining work items

---

## Checkpoint Documents Summary

By the end of the workflow, the project has four documents in `architecture-workflow/`:

| Document | Contains | Produced by |
|----------|----------|-------------|
| `phase-1-discovery.md` | System overview, diagrams, smells list | describe-design |
| `phase-2-diagnosis.md` | Health scores, findings table, dependency map | architecture review |
| `phase-3-fixes.md` | Fix log with tests added, files changed | tdd-ai |
| `phase-4-final.md` | Updated docs, before/after comparison, remaining work | describe-design |

These documents serve as a project health record. They're useful for onboarding
("here's what the system looks like and what we recently improved"), for planning
("here's what's still on the list"), and for accountability ("here's what the
architecture review found and what we did about it").

---

## Adapting to Project Size

**Small projects (< 20 files):** Phases 1-2 can be combined into a single pass.
The discovery and diagnosis happen together since there's not much to map. Phase 3
might only have 2-3 fixes. Phase 4 can be a brief summary rather than full
re-documentation.

**Large projects (100+ files):** Phase 1 might need to focus on specific subsystems
rather than mapping everything. Phase 2 should prioritize — don't try to catalog
every issue, focus on the ones with the highest impact. Phase 3 should batch fixes
into logical groups (e.g., "all security fixes", then "all database fixes").
Phase 4 can document the specific subsystems that changed rather than the whole system.

**Monorepo / multi-service:** Run the workflow per service or per subsystem.
Phase 1 maps the overall structure, then Phases 2-4 can zoom into one service at
a time based on priority.
