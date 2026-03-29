# Claude Architecture Skills

A collection of 7 Claude Code skills for software architecture review, design, and improvement. Chain them into a complete workflow or use individually to analyze code, document systems, and refactor architectures.

## What This Is

These skills give Claude deep expertise in software architecture across multiple domains: Python backends, web apps, cloud infrastructure, and distributed systems. Each skill produces detailed analysis with concrete findings, migration sequences, and decision frameworks. The `architecture-workflow` skill chains all others into a 4-phase pipeline (Discover → Diagnose → Fix → Document) that pauses for user review before applying changes.

## Skills Overview

| Skill | What It Does | Benchmark Delta |
|-------|--------------|-----------------|
| **architecture-workflow** | 4-phase orchestrator: discover design, diagnose issues, fix with TDD, document with diagrams | +48.5% |
| **python-architecture-review** | FastAPI, SQLAlchemy, async patterns, project structure analysis for Python backends | +50% |
| **software-architecture** | Language-agnostic design: Clean Architecture, SOLID, ADRs, system decomposition | +40% |
| **microservices-architect** | Distributed systems: service boundaries, saga patterns, monolith vs microservices decisions | +20% |
| **cloud-infrastructure** | AWS infrastructure: Terraform/CDK, cost optimization, security with concrete trade-offs | +65% |
| **modern-web-app-architecture** | Frontend: rendering strategy, state management, bundle efficiency, Core Web Vitals | +15% |
| **describe-design** | Reverse-engineer codebases into architecture docs with C4/sequence/ER/deployment diagrams | +15% |

## Architecture Workflow Pipeline

The `architecture-workflow` skill orchestrates a 4-phase pipeline with intelligent skill selection:

```
Phase 1: Discover
  └─> describe-design
      (reverse-engineer codebase into docs)

Phase 2: Diagnose
  └─> Dynamic skill selection based on codebase type:
      ├─ Python backend? → python-architecture-review
      ├─ Frontend (React/Next.js)? → modern-web-app-architecture
      ├─ AWS/Terraform/CDK? → cloud-infrastructure
      ├─ Microservices/distributed? → microservices-architect
      └─ General/other? → software-architecture

Phase 3: Fix (USER REVIEW CHECKPOINT)
  └─> tdd-ai integration
      (implement fixes with test-driven development)

Phase 4: Document
  └─> describe-design
      (generate architecture docs for refactored system)
```

After Phase 2, the workflow pauses and generates a checkpoint document. You review findings and approve fixes before Phase 3 executes. This prevents unexpected changes and keeps you in control.

## Installation

All skills are provided as `.skill` files in the `skills/` directory. In Claude Code:

1. Navigate to **Settings** > **Skills**
2. Click **Install from file**
3. Select any `.skill` file from `skills/`
4. The skill is now available in your workspace

Alternatively, extract any `.skill` file (it's a zip archive) to inspect the source `SKILL.md` before installing.

## Evaluation Test Cases

Three realistic test apps benchmark the `architecture-workflow` skill:

### 1. Messy Flask E-commerce (`evals/architecture-workflow/messy_flask_app/`)
A monolithic Flask app with intentional issues: MD5 passwords, SQL injection, hardcoded secrets, N+1 queries, race conditions, no error handling. Tests single-stack Python review with the `python-architecture-review` lens.

### 2. Messy FastAPI Service (`evals/architecture-workflow/messy_fastapi_app/`)
A growing FastAPI backend with hardcoded JWT secrets, broken auth, N+1 query patterns, and no input validation. Tests the `python-architecture-review` lens on a different Python framework.

### 3. Full-Stack Taskboard (`evals/architecture-workflow/fullstack_app/`)
FastAPI backend + Next.js frontend + Terraform infrastructure. Backend has N+1 queries and broken auth. Frontend has prop drilling, no caching, inline styles. Terraform has hardcoded passwords, public DB, open security groups. Tests multi-lens selection: `python-architecture-review` + `modern-web-app-architecture` + `cloud-infrastructure` simultaneously.

## Benchmark Results

Each skill was evaluated on 5 realistic architecture prompts with assertion-based grading. Scores: % of assertions passed (higher is better).

### Benchmark Summary

| Skill | With Skill | Without Skill | Delta |
|-------|-----------|---------------|-------|
| architecture-workflow | 97.8% | 49.3% | **+48.5%** |
| python-architecture-review | 97.0% | 47.0% | **+50.0%** |
| cloud-infrastructure | 100% | 35.0% | **+65.0%** |
| software-architecture | 85.0% | 45.0% | **+40.0%** |
| microservices-architect | 90.0% | 70.0% | **+20.0%** |
| modern-web-app-architecture | 100% | 85.0% | **+15.0%** |
| describe-design | 95.0% | 80.0% | **+15.0%** |

**Methodology:** Each skill tested with 5 unique prompts on production-like codebases. Assertions check for: correct identification of issues, sound recommendations, concrete actionable steps, and correct architecture patterns. Scores report % of assertions passing, not subjective ratings.

### Raw Results

Detailed benchmark JSON available in `benchmarks/`:
- `benchmarks/architecture-workflow/` — iteration 1 and 2 results with per-eval breakdowns
- `benchmarks/{skill-name}/benchmark.json` — per-skill assertion details and pass rates

## Dashboards

Interactive HTML dashboards in `dashboards/` visualize benchmark results and allow filtering by skill, project type, and assertion category. Open locally:

```bash
open dashboards/architecture-skills-eval-dashboard.html
```

Available dashboards:
- `architecture-skills-eval-dashboard.html` — consolidated view across all 6 specialist skills
- `architecture-workflow-eval-viewer-v2.html` — architecture-workflow pipeline results with iteration comparison
- `python-architecture-review-eval-viewer-v3.html` — python-architecture-review detailed assertion breakdown

## Docs

Detailed documentation per skill in `docs/`:
- `docs/architecture-workflow.md` — full pipeline walkthrough, checkpoint format, user review guidance
- `docs/python-architecture-review.md` — how it analyzes Python projects, patterns checked, health score calculation
- `docs/software-architecture.md` — Clean Architecture principles, SOLID analysis, ADR generation
- `docs/microservices-architect.md` — service boundary definition, saga patterns, deployment topologies
- `docs/cloud-infrastructure.md` — AWS review checklist, Terraform/CDK analysis, cost calculation methodology
- `docs/modern-web-app-architecture.md` — rendering strategies (SSR/SSG/ISR), bundle analysis, state management patterns
- `docs/describe-design.md` — diagram generation, reverse-engineering process, supported diagram types

## Safety: Structural Refactoring Protection

These skills recommend architectural improvements, and some recommendations involve
structural changes — splitting large files, extracting modules, reorganizing
directories. These are **the most dangerous refactoring operations** because they
touch import chains across the entire codebase and can silently corrupt code.

### What's Protected

The `architecture-workflow` skill includes mandatory safety protocols:

- **Compilation gates** after every fix — the project must build before proceeding
- **Git checkpoints** after every verified fix — clean rollback points
- **File-split protocol** (`skills/architecture-workflow/references/file-split-protocol.md`) — a step-by-step protocol for safely splitting large files
- **Risk classification** in Phase 2 — every structural recommendation is flagged with a risk level
- **Integration gate** at the end of Phase 3 — full build + test verification before documenting

All review skills (python-architecture-review, modern-web-app-architecture,
software-architecture, describe-design) include risk assessment guidance for
structural recommendations.

### The Core Rule

**A working monolith is always better than a broken set of small files.**

Never split a file by line ranges. Never delete the original until all split files
compile. Never skip the compilation check. See the file-split protocol for details.

## Quick Start

1. Install `architecture-workflow` skill
2. Open your codebase in Claude Code
3. Invoke the skill with: `/architecture-workflow`
4. Workflow discovers your system design, diagnoses issues, pauses for review
5. Approve fixes and watch Phase 3 apply TDD-driven changes
6. Review final architecture documentation in Phase 4

Or use individual skills standalone for targeted analysis:
- `/python-architecture-review` on a Python backend
- `/cloud-infrastructure` on your Terraform
- `/describe-design` to generate architecture diagrams

## License

MIT

---

**Repository:** [keez97/claude-architecture-skills](https://github.com/keez97/claude-architecture-skills)
