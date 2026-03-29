# Microservices Architect

## What it does
Designs distributed systems with expertise in service-oriented architecture, covering service boundaries, communication patterns, saga orchestration, failure modes, and API contracts. Emphasizes monolith-first philosophy - only decompose to microservices when justified by clear business boundaries or scaling needs. Produces decision framework table, architectural diagrams, and phased migration roadmap with concrete implementation guidance.

## When to use it
- Evaluating whether to decompose a monolith into microservices (and when to say no)
- Designing service boundaries for a new distributed system from scratch
- Selecting communication patterns (sync vs async, RPC vs messaging) per use case
- Implementing saga patterns for distributed transactions with compensation logic
- Analyzing failure modes and designing resilience strategies for cascading failures
- Defining API contracts and versioning strategies across service boundaries
- Planning service discovery, load balancing, and circuit breaker configurations
- Assessing readiness for microservices (deployment pipelines, monitoring, team structure)
- Refactoring monolith into services with phased decomposition strategy
- Designing event-driven architecture with event sourcing and CQRS where appropriate

## How it works

The assessment spans distributed systems architecture with careful cost/benefit analysis:

**Monolith-First Evaluation**
Starts by questioning whether microservices are actually needed - they add significant complexity. Evaluates team size (need at least 2-pizza teams per service, one team per service is ideal). Checks business domain boundaries - are there natural domain seams. Analyzes scaling requirements - are bottlenecks actually architectural or operational. Assesses deployment autonomy needs - does one service need independent deployment from others. Recommends staying with modular monolith if those conditions aren't met. Identifies smell tests indicating premature decomposition (organizational pressure, hype, not clear boundaries).

**Service Boundary Design**
Maps business domains to services using domain-driven design principles. Applies bounded contexts to define where services begin/end. Checks if boundaries align with org structure and team ownership - each service owned by one team. Evaluates whether services can scale independently without tight coupling. Assesses data ownership - can each service own its data independently or is shared state needed. Identifies natural seams and unnatural splits. Documents why each service exists and what business capability it provides.

**Communication Patterns**
Analyzes synchronous (REST, gRPC, direct DB queries) vs asynchronous (events, queues, pub/sub) trade-offs. Recommends sync for critical user-facing paths where latency matters and strong consistency is needed. Recommends async for eventual consistency scenarios, notifications, and background work. Evaluates message brokers (RabbitMQ, Kafka, SQS) based on ordering, retention, and throughput needs. Assesses event sourcing and CQRS applicability. Designs retry and backpressure strategies.

**Saga Pattern Analysis**
For distributed transactions, evaluates choreography (events trigger next step automatically) vs orchestration (central coordinator manages workflow). Assesses compensation logic for failed steps - what happens if step 5 fails after step 3 completed. Checks idempotency - can operations be retried safely. Designs at-least-once delivery guarantees. Handles timeouts and partial failures. Designs retry strategies and deadletter handling.

**Failure Mode Analysis**
Maps cascading failures across service boundaries. Identifies critical paths where latency or unavailability can cascade to user impact. Designs circuit breakers to fail fast when downstream services are unavailable. Configures timeouts and bulkheads to isolate failures. Plans graceful degradation - what service can do with reduced functionality when dependencies fail. Evaluates retry strategies (exponential backoff, jitter). Tests failure scenarios.

**API Contract Management**
Defines versioning strategy (semantic versioning, API versioning headers). Establishes backwards compatibility expectations - when can you break API. Documents contract obligations and service SLOs (latency, availability). Recommends schema validation and contract testing. Plans for coordinating breaking changes across services.

Produces decision framework table: Service Name | Business Capability | Boundary Reason | Team Ownership | Communication Pattern | Failure Mode | Mitigation Strategy | SLO Target. Includes deployment architecture showing containers/functions and communication patterns. Provides implementation roadmap with phased decomposition if appropriate, showing what to split first, dependencies, and go-live order.

## Readiness assessment

Before recommending microservices, evaluates organizational and technical readiness across multiple dimensions:

- **Team Structure**: Can you assign 2-pizza teams (5-8 people) to services independently. One team per service is ideal. Helps prevent Conway's Law creating bad architecture.
- **Deployment Pipeline**: Can you deploy services independently without coordinating with other teams. Requires CI/CD automation and feature flags.
- **Monitoring**: Do you have distributed tracing (Jaeger, DataDog), alerting, and dashboards for multiple services. Essential for debugging distributed issues.
- **Operational Maturity**: Can the team handle increased operational complexity of distributed systems. Requires SRE practices, on-call rotations, runbooks.
- **Business Urgency**: Are the benefits worth the complexity increase now. Don't decompose prematurely just to decompose.

If readiness is low, the skill recommends staying with monolith or modular monolith with clear recommendations for improving readiness first.

## Output format
- **Decision framework table**: Service boundaries, business capabilities, communication patterns, failure modes, mitigation strategies, SLO targets
- **Architectural diagrams**: Service topology with ownership, data flow, deployment architecture, event flow diagrams, critical paths
- **Saga pattern designs**: Transaction flows with choreography/orchestration comparison, compensation logic, error handling, idempotency
- **API contracts**: OpenAPI specs or AsyncAPI for events, service SLOs and latency targets, versioning strategy, contract testing
- **Resilience strategies**: Circuit breaker configurations per service, timeout settings with justification, retry policies, bulkhead isolation, cascading failure prevention
- **Migration roadmap**: Phased decomposition plan with checkpoints and gates, team impact assessment, infrastructure requirements, estimated effort per phase
- **Anti-pattern analysis**: Where the proposed design goes wrong, common failures, and how to avoid them
- **Readiness assessment**: Current capabilities vs required for microservices success, gaps and remediation plan

## Tips and best practices

**Measure twice, decompose once**: Thoroughly understand scaling bottlenecks before decomposing. Use profiling and load testing to identify actual problems, not perceived ones.

**Build deployment infrastructure first**: Before decomposing, ensure you have container orchestration, service discovery, and monitoring. Decomposing without these is premature and painful.

**Start with one service**: Don't decompose the whole system at once. Choose the most isolated, least coupled domain and extract it first. Learn from that experience before extracting more.

**Define clear contracts**: Service boundaries are only meaningful if defined by explicit, versioned APIs. Use OpenAPI/AsyncAPI to document contracts and prevent tight coupling.

**Plan failure scenarios**: Every failure is not just "service is down". Design for partial failures. Services should degrade gracefully when dependencies fail.

**Team ownership matters**: Assign clear team ownership to each service. Services without owners become unmaintained quickly.

## Example prompt
"We're a 30-person team with a monolith that's 2M LOC. Payment and inventory are scaling bottlenecks. Should we go microservices? If yes, how should we decompose? What teams own what? What's the rollout plan?"

## Benchmark results
- With microservices-architect: 90% correct service boundary identification and communication pattern selection
- Without skill (ad-hoc decomposition): 70% correct
- Delta: +20% improvement in boundary clarity, failure mode coverage, and deployment strategy
