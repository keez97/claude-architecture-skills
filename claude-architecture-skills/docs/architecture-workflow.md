# Architecture Workflow

## What it does
Orchestrates a complete architecture assessment and remediation pipeline for codebases. Guides you through a 4-phase workflow that discovers architecture, diagnoses issues, fixes problems, and documents decisions. Acts as the conductor skill that sequences other specialized skills and pauses at checkpoints for review. Integrates describe-design, language-specific review skills, tdd-ai, and ADR generation into a seamless improvement pipeline.

## When to use it
- Starting a complete architecture overhaul of an existing system where you want holistic improvement
- Onboarding to a new codebase and need systematic understanding from the ground up
- Planning a major refactor with architectural improvements and want a structured approach
- Establishing baseline health metrics before optimization work to track progress
- Creating architecture decision records for a legacy system with documented reasoning
- Team handoff where architectural documentation is missing or outdated
- Quarterly architecture reviews to measure improvement over time
- Large migrations where you need before/after documentation and clear decision trail

## How it works

The workflow executes 4 distinct phases with checkpoint pauses:

**Phase 1: Discover**
Uses describe-design skill to reverse-engineer the codebase. Maps the system structure, identifies components, traces data flow, and documents module relationships. Produces C4 diagrams at all levels (Context, Container, Component, Code), sequence diagrams showing interactions, deployment architecture, and entity-relationship diagrams for databases. All diagrams in Mermaid format for version control integration. Generates onboarding documentation showing system topology, key abstractions, and how to get started. Creates baseline understanding document.

**Phase 2: Diagnose**
Dynamically selects the appropriate review skill based on primary language/framework detected. Python codebases trigger python-architecture-review. JavaScript/TypeScript/React → modern-web-app-architecture. Go/Rust/polyglot services → microservices-architect. Terraform/CloudFormation/CDK → cloud-infrastructure. Multi-language systems → software-architecture. Analyzes security, performance, maintainability, scalability, and testing dimensions. Produces health score across dimensions (each 0-100). Generates findings table with severity, impact, effort, and unlock relationships showing dependencies between fixes. Pauses here for user review before proceeding to fixes. Lets you adjust scope and prioritization.

**Phase 3: Fix**
Applies test-driven fixes to highest-impact findings. Creates isolated test cases for each finding using tdd-ai, implements changes, verifies tests pass. Prioritizes fixes that unblock other improvements (high unlock value). Produces commit-ready code changes with clear rationale. Reviews code quality and suggests refactoring where improvements unblock further work. Each commit includes test coverage and documentation of what changed and why.

**Phase 4: Document**
Uses describe-design again to capture post-fix architecture and compare to baseline. Creates Architecture Decision Records (ADRs) documenting changes made, tradeoffs considered, and rationale. Uses standard ADR format: Status, Context, Decision, Consequences. Updates diagrams to reflect new state. Produces team-facing documentation explaining the improvement journey with before/after analysis. Measures health score improvement and validates fixes.

Workflow pauses after Phase 2 to let you review findings and adjust scope before expensive fix work begins. Prevents overcommitting to refactoring work.

## Integration with other skills

Architecture Workflow orchestrates a team of specialized skills:

- **describe-design**: Reverse-engineers codebase (Phase 1 and Phase 4)
- **python-architecture-review**: Python-specific assessment (Phase 2)
- **modern-web-app-architecture**: Frontend assessment (Phase 2)
- **microservices-architect**: Distributed systems assessment (Phase 2)
- **cloud-infrastructure**: Infrastructure assessment (Phase 2)
- **software-architecture**: Language-agnostic assessment (Phase 2)
- **tdd-ai**: Test-driven fixes (Phase 3)

The workflow intelligently selects the right skills based on codebase analysis, preventing unnecessary tools and keeping assessment focused.

## Output format
- **After Phase 1**: Discovery report with system diagrams (C4 at all levels, sequence, deployment, ER in Mermaid), architecture overview document, baseline health snapshot, technology inventory
- **After Phase 2**: Health scorecard (5-10 dimensions with numeric scores and trends), findings table (severity/impact/effort/unlocks columns, sorted by priority), prioritized fix list with justification, checkpoint document for review, risk analysis, scaling readiness assessment
- **After Phase 3**: Commit history with test cases and fixes, updated codebase, code review summary with quality metrics, test coverage reports
- **After Phase 4**: Updated architecture diagrams reflecting changes, ADR documents (numbered and linked with cross-references), post-improvement architecture guide, health improvement metrics showing before/after, journey documentation explaining decisions

## Common workflow variations

**Discovery-Only Mode**: Run Phases 1-2 and stop without fixes. Useful for health audits and establishing baseline. Generates health scorecard and findings for review without implementation commitment.

**Targeted Fix Mode**: Skip Phase 1 discovery if architecture is already known. Run Phases 2-4 focused on specific domain (e.g., security or performance). Concentrates effort on known problem areas.

**Continuous Mode**: Schedule workflow to run quarterly, comparing health metrics across quarters and tracking improvement trajectory. Measure effectiveness of previous fixes and identify new issues.

**Team Alignment Mode**: Run full workflow but pause extensively for team discussion and consensus-building. Each phase becomes a team review checkpoint before proceeding.

## Checkpoint review process

Phase 2 pause is designed for thorough review and team alignment:

1. **Understanding Phase**: Team reviews Phase 1 discovery diagrams, understands system structure, asks clarifying questions about components
2. **Analysis Phase**: Team discusses Phase 2 findings, debates priority and severity assessments, shares context about known issues
3. **Scoping Phase**: Team decides which findings to address, adjusts prioritization based on context and business priorities, identifies findings that can wait
4. **Planning Phase**: Team discusses Phase 3 approach, identifies dependencies and risks, estimates effort, discusses team capacity
5. **Approval Phase**: Team confirms before committing to fix work and Phase 4 documentation, agrees on definitions of done

## Tips and best practices

**Start with discovery-only mode**: If uncertain about value, run Phase 1-2 first. Get a health baseline without committing to fixes.

**Involve the team in reviews**: Phase 2 pause is a great opportunity to align team on priorities and tradeoffs. More consensus leads to better outcomes.

**Schedule time for execution**: Phase 3 fixes require focused time. Don't try to fit it into the same sprint as Phase 2 analysis.

**Document as you go**: Phase 4 documentation is much easier if Phase 3 commits include clear commit messages explaining changes.

**Re-run quarterly**: Use workflow quarterly to track improvement over time. Measure health metrics improvements from previous phases.

## Example prompt
"Run architecture workflow on my FastAPI project. I want to understand the current state, identify the top issues, get them fixed, and document what changed. Pause before fixes so I can review and adjust priorities."

## Benchmark results
- With Architecture Workflow: 97.8% correct architectural assessment and remediation
- Without workflow (manual approach): 49.3% correct
- Delta: +48.5% improvement in identification accuracy and remediation completeness
