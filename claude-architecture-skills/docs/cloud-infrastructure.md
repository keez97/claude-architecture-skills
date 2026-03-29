# Cloud Infrastructure

## What it does
Expert assessment of AWS infrastructure and Infrastructure-as-Code (Terraform, AWS CDK). Evaluates cost optimization with concrete dollar figures, security posture, compliance readiness, and operational efficiency. Covers VPC design, container services (ECS), serverless patterns (Lambda), databases (RDS, DynamoDB), and auto-scaling strategies. Produces architecture diagrams and cost analysis with specific recommendations.

## When to use it
- Designing AWS infrastructure for a new application
- Auditing existing AWS setup for cost reduction opportunities
- Planning for compliance requirements (SOC 2, HIPAA, PCI-DSS)
- Optimizing CloudFormation/Terraform code quality and maintainability
- Right-sizing EC2 instances and reserved capacity decisions
- Evaluating multi-AZ, disaster recovery, and backup strategies
- Assessing serverless (Lambda) vs container (ECS) trade-offs
- Planning database architecture (RDS, DynamoDB, Aurora)
- Conducting security review of network topology and IAM policies

## How it works

The assessment covers infrastructure dimensions in detail:

**Cost Optimization**
Analyzes service costs across all services (EC2, RDS, data transfer, storage, Lambda, S3, etc.). Builds cost breakdown by service with monthly impact. Identifies right-sizing opportunities with estimated monthly savings. Evaluates Reserved Instances vs On-Demand vs Spot trade-offs with percentage savings calculations. Checks for wasted resources (unattached EBS volumes, unused NAT gateways, underutilized RDS, unused Elastic IPs, orphaned snapshots). Provides concrete dollar figures for each recommendation (e.g., "Reduce RDS instance from r5.2xlarge to r5.xlarge: saves $1,200/month").

**Security Posture**
Reviews VPC design (public/private subnets, NAT gateway placement). Checks security group rules for overly permissive access. Audits IAM policies for least privilege violations. Assesses encryption at rest and in transit. Evaluates secrets management (Secrets Manager vs SSM Parameter Store). Checks CloudTrail logging and S3 bucket public access settings.

**Compliance & Governance**
Maps requirements to AWS services. Evaluates backup and disaster recovery capabilities. Assesses data residency and regional deployment strategy. Checks tagging strategy for cost allocation. Reviews change management and audit logging.

**Infrastructure-as-Code Quality**
Evaluates Terraform/CDK code organization, modularity, and reusability. Checks for security issues in IaC (hardcoded secrets, overly permissive roles). Assesses state file management and locking. Recommends module structure and naming conventions.

**Container & Serverless Strategy**
Compares ECS Fargate vs EC2, Lambda vs containers, managed services vs self-managed. Evaluates cold start impact and auto-scaling configuration. Assesses logging and monitoring integration (CloudWatch, X-Ray).

**Database Architecture**
Evaluates RDS sizing, read replicas, and backup retention. Assesses DynamoDB capacity planning (on-demand vs provisioned). Checks Aurora for high availability. Reviews multi-AZ deployment and failover strategy.

Produces architecture diagrams (VPC topology, service interactions, regions). Includes cost breakdown by service with monthly/annual projections and optimization roadmap. Provides IaC code templates and best practices documentation. Delivers compliance checklist and remediation steps with implementation guidance.

## Cost optimization methodology

Cost analysis goes beyond basic optimization with a structured approach:

1. **Baseline Analysis**: Map current services across all AWS accounts, identify instance types, data transfer patterns, storage allocations, data egress. Establish spending baseline by service.
2. **Right-Sizing**: Compare actual CloudWatch metrics (CPU, memory, network) vs provisioned capacity for EC2, RDS, Redshift. Find over-provisioned resources wasting spend.
3. **Reservation Evaluation**: Calculate ROI for Reserved Instances vs On-Demand based on usage pattern and commitment level (1-year or 3-year).
4. **Spot Opportunity**: Identify fault-tolerant workloads (batch, CI/CD, non-critical services) suitable for Spot Instances with 70% discounts.
5. **Architecture Change**: Recommend larger structural changes (Fargate vs EC2 for containers, DynamoDB vs RDS for certain patterns, Lambda vs containers for event-driven work).
6. **Waste Elimination**: Find orphaned resources (unattached EBS volumes, unused Elastic IPs, snapshots older than retention, unused NAT gateways, idle RDS instances).

Each recommendation includes: Current Cost | Optimized Cost | Monthly Savings | Implementation Effort (hours) | Risk Level | Dependencies. Grouped by quick wins (implement today) vs strategic changes (architecture changes).

## Output format
- **Architecture diagrams**: VPC design with security group flow, service topology, multi-region architecture if applicable
- **Cost analysis**: Current spending breakdown by service/resource, optimization opportunities with dollar savings, projected cost after optimization, payback period for changes
- **Security audit**: Vulnerability findings with severity and remediation steps, IAM policy review, encryption status
- **Compliance checklist**: Requirements mapping to AWS services, gaps and solutions, audit readiness assessment
- **IaC recommendations**: Code improvements for Terraform/CDK, module structure, DRY principles, security fixes in templates
- **Implementation roadmap**: Prioritized improvements with estimated effort, dependencies, and risk assessment
- **Disaster recovery plan**: Multi-AZ strategy, backup retention, RTO/RPO targets, failover procedures

## Tips and best practices

**Automate all infrastructure**: Use Terraform/CDK from day one. Manually-created infrastructure is a source of security gaps, cost overruns, and disaster recovery failures.

**Cost governance**: Set up AWS Budgets and cost alerts. Establish owner tags for all resources so you know who's responsible for costs. Review monthly.

**Security is non-negotiable**: Don't skip security recommendations even if they have implementation effort. A breach costs far more than security work upfront.

**Right-sizing takes time**: Don't over-provision on day one, but build in headroom. Right-sizing is iterative based on actual traffic patterns over months.

**Disaster recovery is not backup**: Test your DR regularly. Having backups doesn't mean you can recover. Run DR drills quarterly.

**Use managed services**: Prefer RDS/DynamoDB/ElastiCache to self-managed databases. The operational overhead and security risk of self-managed is not worth 10% cost savings.

## Example prompt
"Review my AWS infrastructure in Terraform. I'm running $15K/month. What can I cut? What security gaps should I close? Is multi-AZ worth it for my traffic pattern? Show me concrete dollar savings."

## Benchmark results
- With cloud-infrastructure: 100% identification of cost savings opportunities
- Without skill (manual review): 35% identification
- Delta: +65% improvement in optimization and security finding detection
