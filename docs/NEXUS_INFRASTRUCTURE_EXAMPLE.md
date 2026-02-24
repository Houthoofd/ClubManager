# 🎯 Nexus - Infrastructure de Base de Données

Guide complet pour déployer une infrastructure de bases de données généraliste avec Terraform sur AWS.

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Configuration Terraform](#configuration-terraform)
4. [Déploiement](#déploiement)
5. [Gestion](#gestion)
6. [Monitoring](#monitoring)

---

## 🏗️ Vue d'ensemble

**Nexus** est une plateforme d'infrastructure de bases de données généraliste permettant d'héberger :

- MySQL / MariaDB
- PostgreSQL
- Redis
- MongoDB
- Autres bases de données

---

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VPC: nexus-vpc                        │
│                      CIDR: 10.0.0.0/16                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Availability Zone 1a                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐           │   │
│  │  │ nexus-mysql-01  │  │ nexus-redis-01  │           │   │
│  │  │ (EC2/RDS)       │  │ (EC2/ElastiCache)│          │   │
│  │  └─────────────────┘  └─────────────────┘           │   │
│  │  Subnet: 10.0.1.0/24                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Availability Zone 1b                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐           │   │
│  │  │ nexus-mysql-02  │  │ nexus-redis-02  │           │   │
│  │  │ (Replica)       │  │ (Replica)       │           │   │
│  │  └─────────────────┘  └─────────────────┘           │   │
│  │  Subnet: 10.0.2.0/24                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Configuration Terraform

### Structure du Projet

```
nexus-infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── production/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   ├── outputs.tf
│   │   │   └── terraform.tfvars
│   │   ├── staging/
│   │   └── development/
│   ├── modules/
│   │   ├── vpc/
│   │   ├── ec2-database/
│   │   ├── rds/
│   │   └── security-groups/
│   └── backend.tf
├── ansible/
│   ├── playbooks/
│   └── roles/
└── docs/
    └── README.md
```

### 1. Provider Configuration (`provider.tf`)

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "nexus-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "nexus-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "nexus"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}
```

### 2. Variables (`variables.tf`)

```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "nexus"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "mysql_instance_type" {
  description = "MySQL EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "mysql_volume_size" {
  description = "MySQL EBS volume size in GB"
  type        = number
  default     = 50
}

variable "enable_backups" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 7
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access databases"
  type        = list(string)
  default     = []
}
```

### 3. VPC Configuration (`vpc.tf`)

```hcl
# VPC
resource "aws_vpc" "nexus" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "nexus" {
  vpc_id = aws_vpc.nexus.id
  
  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Subnets (Multi-AZ)
resource "aws_subnet" "database_1a" {
  vpc_id            = aws_vpc.nexus.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  
  tags = {
    Name = "${var.project_name}-db-subnet-1a"
    Type = "database"
  }
}

resource "aws_subnet" "database_1b" {
  vpc_id            = aws_vpc.nexus.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  
  tags = {
    Name = "${var.project_name}-db-subnet-1b"
    Type = "database"
  }
}

# Route Table
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.nexus.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.nexus.id
  }
  
  tags = {
    Name = "${var.project_name}-db-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "database_1a" {
  subnet_id      = aws_subnet.database_1a.id
  route_table_id = aws_route_table.database.id
}

resource "aws_route_table_association" "database_1b" {
  subnet_id      = aws_subnet.database_1b.id
  route_table_id = aws_route_table.database.id
}
```

### 4. Security Groups (`security-groups.tf`)

```hcl
# MySQL Security Group
resource "aws_security_group" "mysql" {
  name        = "${var.project_name}-mysql-sg"
  description = "Security group for MySQL databases"
  vpc_id      = aws_vpc.nexus.id
  
  ingress {
    description = "MySQL from allowed CIDR"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }
  
  ingress {
    description = "MySQL from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-mysql-sg"
  }
}

# PostgreSQL Security Group
resource "aws_security_group" "postgres" {
  name        = "${var.project_name}-postgres-sg"
  description = "Security group for PostgreSQL databases"
  vpc_id      = aws_vpc.nexus.id
  
  ingress {
    description = "PostgreSQL from allowed CIDR"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }
  
  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-postgres-sg"
  }
}

# Redis Security Group
resource "aws_security_group" "redis" {
  name        = "${var.project_name}-redis-sg"
  description = "Security group for Redis cache"
  vpc_id      = aws_vpc.nexus.id
  
  ingress {
    description = "Redis from VPC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-redis-sg"
  }
}

# SSH Security Group
resource "aws_security_group" "ssh" {
  name        = "${var.project_name}-ssh-sg"
  description = "Security group for SSH access"
  vpc_id      = aws_vpc.nexus.id
  
  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-ssh-sg"
  }
}
```

### 5. RDS MySQL Instance (`rds-mysql.tf`)

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "nexus" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.database_1a.id, aws_subnet.database_1b.id]
  
  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS MySQL Instance
resource "aws_db_instance" "mysql" {
  identifier     = "${var.project_name}-mysql-${var.environment}"
  engine         = "mysql"
  engine_version = "8.0"
  
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true
  
  db_name  = "nexus"
  username = "admin"
  password = random_password.mysql_password.result
  
  vpc_security_group_ids = [aws_security_group.mysql.id]
  db_subnet_group_name   = aws_db_subnet_group.nexus.name
  
  # High Availability
  multi_az = var.environment == "production" ? true : false
  
  # Backups
  backup_retention_period = var.backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  # Performance Insights
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  performance_insights_enabled    = true
  
  # Protection
  deletion_protection = var.environment == "production" ? true : false
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = "${var.project_name}-mysql-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  tags = {
    Name        = "${var.project_name}-mysql-${var.environment}"
    Environment = var.environment
    Engine      = "mysql"
  }
}

# Random password for MySQL
resource "random_password" "mysql_password" {
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "mysql_password" {
  name = "${var.project_name}/mysql/${var.environment}/master-password"
  
  tags = {
    Name = "${var.project_name}-mysql-password"
  }
}

resource "aws_secretsmanager_secret_version" "mysql_password" {
  secret_id = aws_secretsmanager_secret.mysql_password.id
  secret_string = jsonencode({
    username = aws_db_instance.mysql.username
    password = random_password.mysql_password.result
    endpoint = aws_db_instance.mysql.endpoint
    port     = aws_db_instance.mysql.port
    dbname   = aws_db_instance.mysql.db_name
  })
}
```

### 6. EC2 Instance (Alternative to RDS) (`ec2-database.tf`)

```hcl
# AMI Data Source (Ubuntu 22.04)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Key Pair
resource "aws_key_pair" "nexus" {
  key_name   = "${var.project_name}-key"
  public_key = file("~/.ssh/nexus.pub") # Créer cette clé avant
  
  tags = {
    Name = "${var.project_name}-key"
  }
}

# EC2 Instance for MySQL
resource "aws_instance" "mysql_ec2" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.mysql_instance_type
  subnet_id     = aws_subnet.database_1a.id
  
  vpc_security_group_ids = [
    aws_security_group.mysql.id,
    aws_security_group.ssh.id
  ]
  
  key_name = aws_key_pair.nexus.key_name
  
  # EBS Volume for data
  ebs_block_device {
    device_name = "/dev/sdf"
    volume_size = var.mysql_volume_size
    volume_type = "gp3"
    encrypted   = true
    
    tags = {
      Name = "${var.project_name}-mysql-data"
    }
  }
  
  user_data = file("${path.module}/scripts/install-mysql.sh")
  
  tags = {
    Name        = "${var.project_name}-mysql-${var.environment}"
    Environment = var.environment
    Role        = "database"
    Type        = "mysql"
  }
}

# Elastic IP for MySQL EC2
resource "aws_eip" "mysql" {
  instance = aws_instance.mysql_ec2.id
  domain   = "vpc"
  
  tags = {
    Name = "${var.project_name}-mysql-eip"
  }
}
```

### 7. ElastiCache Redis (`elasticache-redis.tf`)

```hcl
# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-redis-subnet-group"
  subnet_ids = [aws_subnet.database_1a.id, aws_subnet.database_1b.id]
  
  tags = {
    Name = "${var.project_name}-redis-subnet-group"
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-redis-${var.environment}"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]
  
  # Backups
  snapshot_retention_limit = var.environment == "production" ? 5 : 0
  snapshot_window         = "03:00-05:00"
  
  tags = {
    Name        = "${var.project_name}-redis-${var.environment}"
    Environment = var.environment
  }
}
```

### 8. Outputs (`outputs.tf`)

```hcl
# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.nexus.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.nexus.cidr_block
}

# RDS MySQL Outputs
output "mysql_endpoint" {
  description = "MySQL RDS endpoint"
  value       = aws_db_instance.mysql.endpoint
}

output "mysql_port" {
  description = "MySQL RDS port"
  value       = aws_db_instance.mysql.port
}

output "mysql_database_name" {
  description = "MySQL database name"
  value       = aws_db_instance.mysql.db_name
}

output "mysql_secret_arn" {
  description = "ARN of the Secrets Manager secret containing MySQL credentials"
  value       = aws_secretsmanager_secret.mysql_password.arn
}

# EC2 MySQL Outputs
output "mysql_ec2_public_ip" {
  description = "MySQL EC2 public IP"
  value       = aws_eip.mysql.public_ip
}

output "mysql_ec2_private_ip" {
  description = "MySQL EC2 private IP"
  value       = aws_instance.mysql_ec2.private_ip
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_cluster.redis.port
}

# Security Groups
output "mysql_security_group_id" {
  description = "MySQL security group ID"
  value       = aws_security_group.mysql.id
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}
```

### 9. Terraform Variables File (`terraform.tfvars`)

```hcl
# Production Environment
aws_region   = "us-east-1"
environment  = "production"
project_name = "nexus"

vpc_cidr = "10.0.0.0/16"

# MySQL Configuration
mysql_instance_type = "t3.small"
mysql_volume_size   = 100

# Backups
enable_backups         = true
backup_retention_days  = 14

# Security
allowed_cidr_blocks = [
  "203.0.113.0/24",  # Office IP
  "198.51.100.0/24"  # VPN IP
]
```

---

## 🚀 Déploiement

### 1. Prérequis

```bash
# Installer Terraform
brew install terraform  # macOS
# ou
sudo apt-get install terraform  # Ubuntu

# Installer AWS CLI
brew install awscli

# Configurer AWS CLI
aws configure
```

### 2. Initialiser Terraform

```bash
cd nexus-infrastructure/terraform/environments/production

# Générer les clés SSH
ssh-keygen -t rsa -b 4096 -f ~/.ssh/nexus -C "nexus-infrastructure"

# Initialiser Terraform
terraform init
```

### 3. Planifier le Déploiement

```bash
# Vérifier ce qui sera créé
terraform plan -out=tfplan

# Examiner le plan
terraform show tfplan
```

### 4. Appliquer la Configuration

```bash
# Déployer l'infrastructure
terraform apply tfplan

# Ou directement (avec confirmation)
terraform apply
```

### 5. Vérifier les Outputs

```bash
# Afficher tous les outputs
terraform output

# Output spécifique
terraform output mysql_endpoint
terraform output redis_endpoint
```

---

## 🔧 Scripts d'Installation

### Script MySQL (`scripts/install-mysql.sh`)

```bash
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install MySQL
apt-get install -y mysql-server

# Configure MySQL
cat > /etc/mysql/mysql.conf.d/nexus.cnf <<EOF
[mysqld]
bind-address = 0.0.0.0
max_connections = 200
innodb_buffer_pool_size = 1G
EOF

# Mount data volume
mkfs -t ext4 /dev/xvdf
mkdir -p /data/mysql
mount /dev/xvdf /data/mysql
echo '/dev/xvdf /data/mysql ext4 defaults,nofail 0 2' >> /etc/fstab

# Move MySQL data directory
systemctl stop mysql
rsync -av /var/lib/mysql/ /data/mysql/
sed -i 's|/var/lib/mysql|/data/mysql|g' /etc/mysql/mysql.conf.d/mysqld.cnf
systemctl start mysql

# Create backup user
mysql -e "CREATE USER 'backup'@'localhost' IDENTIFIED BY 'CHANGE_ME';"
mysql -e "GRANT SELECT, LOCK TABLES, SHOW VIEW ON *.* TO 'backup'@'localhost';"

# Enable monitoring
apt-get install -y prometheus-mysqld-exporter
systemctl enable prometheus-mysqld-exporter
systemctl start prometheus-mysqld-exporter

echo "MySQL installation completed!"
```

---

## 📊 Monitoring

### CloudWatch Alarms

```hcl
# RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "mysql_cpu" {
  alarm_name          = "${var.project_name}-mysql-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.mysql.id
  }
  
  alarm_description = "MySQL CPU utilization is too high"
  alarm_actions     = [] # Add SNS topic ARN here
}

# RDS Free Storage Space Alarm
resource "aws_cloudwatch_metric_alarm" "mysql_storage" {
  alarm_name          = "${var.project_name}-mysql-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5000000000" # 5 GB in bytes
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.mysql.id
  }
  
  alarm_description = "MySQL free storage space is low"
  alarm_actions     = [] # Add SNS topic ARN here
}
```

---

## 💰 Estimation des Coûts

### Configuration Production

| Service | Configuration | Prix/mois |
|---------|--------------|-----------|
| RDS MySQL | db.t3.micro Multi-AZ | ~$32 |
| ElastiCache Redis | cache.t3.micro | ~$13 |
| VPC | Standard | $0 |
| Data Transfer | 100 GB | ~$9 |
| Backups (snapshots) | 50 GB | ~$5 |
| **Total** | | **~$59/mois** |

### Configuration Alternative (EC2)

| Service | Configuration | Prix/mois |
|---------|--------------|-----------|
| EC2 MySQL | t3.small | ~$17 |
| EBS Storage | 100 GB gp3 | ~$8 |
| Elastic IP | 1 IP | $0 |
| Data Transfer | 100 GB | ~$9 |
| **Total** | | **~$34/mois** |

---

## 🔒 Sécurité

### Checklist

- [ ] ✅ VPC isolé pour les bases de données
- [ ] ✅ Security Groups restrictifs
- [ ] ✅ Encryption at rest (RDS + EBS)
- [ ] ✅ Encryption in transit (SSL/TLS)
- [ ] ✅ Secrets Manager pour credentials
- [ ] ✅ Backups automatiques activés
- [ ] ✅ Multi-AZ pour haute disponibilité
- [ ] ✅ CloudWatch monitoring
- [ ] ✅ IAM roles avec least privilege
- [ ] ✅ Pas d'accès public direct

---

## 📝 Commandes Utiles

```bash
# Connexion SSH à EC2
ssh -i ~/.ssh/nexus ubuntu@$(terraform output -raw mysql_ec2_public_ip)

# Récupérer le mot de passe MySQL depuis Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id nexus/mysql/production/master-password \
  --query SecretString \
  --output text | jq -r .password

# Connexion MySQL RDS
mysql -h $(terraform output -raw mysql_endpoint | cut -d: -f1) \
      -u admin \
      -p

# Test Redis
redis-cli -h $(terraform output -raw redis_endpoint)

# Détruire l'infrastructure (ATTENTION!)
terraform destroy
```

---

## 🔄 Backup & Recovery

### Backup Automatique RDS

- Snapshots quotidiens automatiques
- Rétention: 7-14 jours
- Window: 03:00-04:00 UTC

### Backup Manuel EC2

```bash
# Script de backup MySQL sur EC2
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
S3_BUCKET="nexus-backups"

mysqldump -u backup -p --all-databases | gzip > ${BACKUP_DIR}/mysql_${TIMESTAMP}.sql.gz
aws s3 cp ${BACKUP_DIR}/mysql_${TIMESTAMP}.sql.gz s3://${S3_BUCKET}/mysql/

# Nettoyer les backups locaux > 7 jours
find ${BACKUP_DIR} -name "mysql_*.sql.gz" -mtime +7 -delete
```

---

## 📚 Ressources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [ElastiCache Redis](https://docs.aws.amazon.com/elasticache/)

---

**Nexus Infrastructure - Database Platform as Code** 🚀