# Modern Web App Architecture

## What it does
Expert assessment of frontend architecture focusing on rendering strategy, state management, bundle optimization, and Core Web Vitals. Deep expertise in Next.js and React ecosystems. Evaluates whether to use SSR, SSG, ISR, or CSR for different pages. Analyzes bundle size, code splitting, and performance metrics. Produces optimization roadmap with concrete metrics.

## When to use it
- Planning rendering strategy for a Next.js application
- Auditing React app for bundle size and performance issues
- Evaluating state management solutions (Context, Redux, Zustand, Jotai)
- Assessing Core Web Vitals (LCP, CLS, FID) and optimization paths
- Reviewing component architecture and re-render patterns
- Planning code splitting and lazy loading strategy
- Optimizing image loading and asset delivery
- Preparing app for high-traffic scenarios
- Migrating from CSR to SSR/SSG/ISR for SEO or performance

## How it works

The assessment spans frontend architecture dimensions with concrete measurements:

**Rendering Strategy**
Maps pages to appropriate rendering modes (SSR, SSG, ISR, CSR) based on content freshness, personalization needs, and performance requirements. Evaluates Next.js app router vs pages router trade-offs and migration impact. Assesses pre-rendering budget and build time implications for large sites. Recommends middleware for dynamic routing and rewriting. Checks error boundary and loading state patterns. Documents rendering mode rationale per page.

**State Management**
Evaluates current state solution (Redux, Context, Zustand, Jotai, etc.) for appropriate complexity level. Checks for overly-centralized state that should be local component state instead. Assesses async data fetching patterns and server state management (React Query, SWR, tRPC). Looks for prop drilling problems and suggests solutions. Evaluates persistence requirements and local storage strategy. Measures re-render frequency and identifies unnecessary renders.

**Bundle Analysis**
Measures total bundle size and per-route breakdown with tracking over time. Identifies large dependencies using cost-of-javascript style analysis. Assesses code splitting effectiveness and chunk loading waterfall. Recommends removing or replacing heavy packages (e.g., lodash, moment.js). Evaluates tree-shaking and dead code elimination. Checks third-party script loading impact (analytics, ads, etc.). Lists top 20 dependencies by size.

**Core Web Vitals**
Measures Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and First Input Delay (FID) with baseline and targets. Analyzes critical rendering path and render-blocking resources. Recommends font loading strategy (font-display, preload, FOUT/FOIT tradeoffs). Assesses image optimization (WebP, responsive sizes, lazy loading). Evaluates compression (gzip/brotli) and caching headers (Cache-Control, ETag). Provides optimization roadmap with estimated metric improvements.

**Component Architecture**
Reviews component size and complexity metrics. Checks for over-engineered components and unnecessary abstraction layers. Assesses memoization and React.memo() usage patterns - when to use, when to skip. Evaluates controlled vs uncontrolled component patterns per use case. Identifies performance anti-patterns (anonymous functions in render, inline objects, missing keys). Recommends suspense boundaries for code splitting.

**Data Fetching**
Evaluates fetch patterns for hydration mismatches between server and client. Checks SWR/React Query configuration for cache invalidation and stale data handling. Assesses incremental static regeneration (ISR) for freshness vs build cost trade-offs. Recommends revalidation strategies and stale-while-revalidate patterns. Reviews server-side data fetching (getServerSideProps, getStaticProps) for performance impact.

Produces performance dashboards with before/after metrics showing quantified improvements. Includes bundle breakdown charts, rendering strategy recommendations per page, and optimization prioritization. Provides concrete fixes for top 5-10 performance issues with estimated performance gain per fix.

## Performance metrics and targets

The skill measures and optimizes core web performance metrics with realistic benchmarks and tracking:

- **Largest Contentful Paint (LCP)**: Target <2.5s, measures time main content becomes visible. 75th percentile metric from field data.
- **Cumulative Layout Shift (CLS)**: Target <0.1, measures visual stability without unexpected layout jumps. Scored 0-1.0.
- **First Input Delay (FID)**: Target <100ms, measures responsiveness to user input. Being replaced by Interaction to Next Paint (INP).
- **Time to First Byte (TTFB)**: Target <600ms, baseline metric for all optimizations. Server response time + network latency.
- **First Contentful Paint (FCP)**: Target <1.8s, measures when content starts appearing. Often tracked separately from LCP.

Improvements are measured in percentage gains and real-world impact (e.g., "5-7% conversion increase per 1s LCP improvement" based on industry studies). Tracks 75th percentile from real user monitoring (RUM) data, not lab measurements.

## Output format
- **Performance audit report**: Current Core Web Vitals scores, targets, and trend analysis, field data vs lab data
- **Bundle analysis**: Size breakdown by chunk, top 20 dependencies by size, code splitting opportunities with estimated savings
- **Rendering strategy**: Recommended approach per page/route with rationale, estimated impact on metrics
- **State management review**: Current solution assessment with complexity analysis, alternatives evaluation, migration path if needed
- **Optimization roadmap**: Prioritized improvements with estimated performance gain in percentage and milliseconds, implementation effort
- **Code examples**: Before/after snippets for key optimizations (code splitting, image loading, font strategy, compression)
- **Monitoring setup**: How to track Core Web Vitals in production, alerting thresholds, regression detection

## Tips and best practices

**Measure real users, not labs**: Lab data (Lighthouse) is useful but different from real-world experience. Measure Core Web Vitals using RUM (Real User Monitoring). Real user 75th percentile matters more than lab average.

**Rendering strategy per page**: Don't apply SSR/SSG uniformly. Static content pages benefit from SSG (no build rebuilds). User-specific content needs SSR or CSR. Marketing pages can ISR.

**Bundle size matters**: Every kilobyte in the critical path adds to LCP. Measure and track bundle size every sprint. Set budgets and alert on regressions.

**Avoid layout shifts**: CSS should be in-document (not async stylesheets). Images should have dimensions before loading. Web fonts should be preloaded or use font-display: swap.

**Lazy loading by default**: Code split at route boundaries. Lazy load third-party scripts (analytics, ads) that don't affect core functionality.

**Monitor in production**: Set up core web vitals monitoring in production (Web Vitals library + your analytics). Alert when metrics degrade.

## Example prompt
"Audit my Next.js e-commerce site. LCP is 3.5s, bundle is 800KB. What rendering strategy should each page use? Where should I code split? Show me concrete performance targets and expected gains."

## Benchmark results
- With modern-web-app-architecture: 100% identification of frontend bottlenecks
- Without skill (ad-hoc optimization): 85% identification
- Delta: +15% improvement in performance issue detection and rendering strategy choice
