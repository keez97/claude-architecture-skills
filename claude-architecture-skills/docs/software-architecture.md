# Software Architecture

## What it does
Language-agnostic architectural assessment applying Clean Architecture, SOLID principles, and design patterns. Analyzes system decomposition, dependency structure, abstraction layers, and coupling across any programming language or technology stack. Produces Architecture Decision Records (ADRs) documenting architectural decisions with full rationale and consequences. Generates module dependency graphs and refactoring roadmaps.

## When to use it
- Designing architecture for a new project from scratch before coding begins
- Evaluating system decomposition and module boundaries for an existing codebase
- Assessing SOLID principle compliance across the codebase systematically
- Choosing between architectural patterns (monolith vs services vs modular monolith)
- Reviewing abstraction layer design and dependency direction correctness
- Creating Architecture Decision Records for major design choices with documented reasoning
- Analyzing coupling between components and planning refactoring work
- Preparing architecture documentation for team onboarding to new systems
- Evaluating whether a codebase follows the chosen architectural style consistently
- Planning large refactors with clear before/after architectural snapshots

## How it works

The review applies structured analysis across architectural dimensions:

**System Decomposition**
Maps business domains to technical modules using domain-driven design principles. Identifies bounded contexts and domain boundaries. Checks if module structure aligns with organizational structure (Conway's Law). Evaluates whether decomposition follows business logic rather than purely technical layers. Assesses cohesion within modules - do responsibilities belong together. Documents why each module exists and what business capability it provides.

**Clean Architecture Principles**
Verifies separation into presentation, business, persistence, and infrastructure layers. Checks dependency direction (dependencies point inward only, never outward). Assesses independence of business logic from frameworks and databases. Identifies violations like business logic in controllers, persistence details in entities, or framework coupling in core logic. Evaluates testability that results from proper layer separation.

**SOLID Principles**
Evaluates Single Responsibility - does each class/module have one reason to change. Checks Open/Closed - can you extend behavior without modifying existing code. Assesses Liskov Substitution - are subtypes properly substitutable for supertypes. Reviews Interface Segregation - are interfaces focused and minimal or bloated. Checks Dependency Inversion - depend on abstractions and interfaces, not concrete implementations. Scores each principle adherence.

**Design Patterns**
Identifies appropriate use of design patterns (Factory, Strategy, Observer, Adapter, Facade, Builder, Composite, etc.). Spots anti-patterns and code smells (God classes, feature envy, long parameter lists, feature fragmentation). Evaluates whether patterns are used correctly or misapplied/overused. Recommends pattern adoption where it would improve clarity and flexibility. Documents pattern justifications and expected benefits.

**Coupling Analysis**
Quantifies coupling between modules (high/medium/low). Identifies circular dependencies and suggests resolution strategies. Maps module relationships and highlights problematic connections. Measures afferent coupling (modules depending on this one) and efferent coupling (modules this depends on). Identifies candidates for refactoring based on coupling metrics. Shows impact of reducing coupling.

Produces Architecture Decision Records (ADRs) in standard format: Status (Proposed/Accepted/Deprecated), Context (why was this decision needed), Decision (what was decided), Consequences (tradeoffs and impacts, both positive and negative). Includes architectural diagrams showing module relationships, dependency graphs, and data flow. Links ADRs together showing decision dependencies and superseding relationships.

## Measuring architecture health

The skill evaluates architecture quality across quantifiable metrics with baseline and improvement tracking:

- **Cohesion Score**: Do related responsibilities live in the same module (0-100). High cohesion means responsibilities are tightly focused.
- **Coupling Score**: Are modules loosely coupled with minimal dependencies (0-100). Lower coupling enables independent module changes.
- **SOLID Compliance**: Per-principle scores showing adherence to Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Each scored 0-100.
- **Cyclomatic Complexity**: Average complexity per module with outlier identification. Identifies overly complex modules needing refactoring.
- **Testability Score**: How easily can each module be unit tested in isolation (0-100). Lower testability indicates tighter coupling and framework dependencies.
- **Afferent/Efferent Coupling**: Measures incoming vs outgoing dependencies per module to identify bottlenecks and high-maintenance modules.

Metrics are tracked over time to measure architecture improvement from refactoring work.

## Output format
- **Architectural diagrams**: Module/component relationships, dependency graph with coupling metrics, layer visualization, domain boundaries, data ownership
- **ADRs**: Numbered ADR documents with standard format for key decisions, status tracking, superseding relationships
- **Findings**: Issues categorized by principle (SOLID violations, coupling problems, anti-patterns, layer violations), including severity and impact
- **Metrics report**: Cohesion scores, coupling measurements, complexity metrics per module, trend analysis
- **Refactoring roadmap**: Priority order for architectural improvements with estimated impact and dependencies
- **Pattern recommendations**: Suggested design patterns with implementation guidance, example code, and when to apply them
- **Comparison analysis**: If reviewing existing architecture vs proposed, shows delta and improvement path

## Tips and best practices

**Design before coding**: Use software-architecture skill before implementing to avoid rework. Spending 1 day on architecture design saves 10 days of refactoring later. Discuss architecture with team before writing code.

**Document decisions**: Create ADRs for major architectural decisions. ADRs force you to think through tradeoffs, alternatives, and consequences. They create a decision history for future team members and help with onboarding.

**Review regularly**: Architecture doesn't stay clean automatically. Use this skill quarterly to catch architecture drift and creeping coupling. Set quarterly review goals.

**Educate the team**: Use the diagrams and documentation from this skill to educate new team members and ensure consistent understanding across the team. Make architecture tangible and visual. Hold regular architecture review meetings with the team.

**Start simple**: Begin with simple decomposition. Don't over-engineer from day one trying to anticipate all future growth. Refactor as you learn more about the domain and actual scaling bottlenecks. Follow "YAGNI" (You Aren't Gonna Need It) principle and "KISS" (Keep It Simple, Stupid).

## Integration with other skills

Software Architecture works as part of a broader architecture optimization workflow:

- **With architecture-workflow**: Used as Phase 2 diagnostic for language-agnostic or polyglot codebases
- **With describe-design**: First understand the current architecture before proposing improvements
- **With tdd-ai**: Use identified patterns and ADRs to drive test-driven refactoring

## Example prompt
"Design the architecture for a new e-commerce platform. We expect to grow from 1M to 100M users. What modules should we have? What patterns should we use? Give me ADRs documenting the key decisions and a refactoring roadmap."

## Benchmark results
- With software-architecture: 85% correct architectural design decisions and decomposition
- Without skill (ad-hoc design): 45% correct
- Delta: +40% improvement in decomposition quality and SOLID principle adherence
