# Taskboard Infrastructure - hastily written, no modules

provider "aws" {
  region = "us-east-1"
}

# No remote state backend configured - using local state
# No state locking

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  # No tags
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  # Only one AZ - no HA
  availability_zone = "us-east-1a"
}

# RDS in public subnet - security issue
resource "aws_db_instance" "postgres" {
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.t3.large"  # Oversized for a task board
  allocated_storage = 100             # Way too much for task data
  db_name           = "taskboard"
  username          = "admin"
  password          = "password123"   # Hardcoded password in terraform
  publicly_accessible = true          # DB accessible from internet!
  skip_final_snapshot = true
  subnet_group_name = ""              # No subnet group

  # No encryption at rest
  # No backup configuration
  # No multi-AZ
}

# ECS without auto-scaling
resource "aws_ecs_cluster" "main" {
  name = "taskboard"
}

resource "aws_ecs_service" "backend" {
  name            = "backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1  # Single instance, no redundancy
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = [aws_subnet.public.id]
    security_groups = [aws_security_group.allow_all.id]
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "backend"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"  # Oversized
  memory                   = "2048"  # Oversized
  network_mode             = "awsvpc"

  container_definitions = jsonencode([{
    name  = "backend"
    image = "taskboard-backend:latest"
    portMappings = [{ containerPort = 8000 }]
    environment = [
      { name = "DATABASE_URL", value = "postgresql://admin:password123@${aws_db_instance.postgres.endpoint}/taskboard" },
      { name = "SECRET_KEY", value = "hardcoded-jwt-secret-oops" }
    ]
    # No health check
    # No log configuration
  }])
}

# Security group allows all traffic
resource "aws_security_group" "allow_all" {
  name   = "allow-all"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]  # Open to the world
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# No ALB, no CloudFront, no WAF
# No monitoring or alerting
# No CI/CD pipeline defined
