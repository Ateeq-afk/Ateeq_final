# 🚀 CI/CD Pipeline Documentation

## Overview

The DesiCargo project includes a comprehensive CI/CD pipeline built with GitHub Actions, providing automated testing, security scanning, deployment, and monitoring capabilities for a production-ready software delivery process.

## 🔄 Workflows Overview

### 1. Continuous Integration (`ci.yml`)
**Trigger**: Every push and pull request to `main` and `develop` branches

#### Features:
- **Frontend Testing**: Linting, building, and artifact generation
- **Backend Testing**: TypeScript compilation, unit tests, integration tests
- **Security Scanning**: Trivy vulnerability scanner and CodeQL analysis
- **Docker Image Building**: Multi-stage builds with caching
- **Quality Gates**: Automated pass/fail criteria with PR comments
- **Performance Testing**: Optional k6 load testing (triggered by label)

#### Environments:
- Redis service for caching tests
- Automated artifact management
- Matrix strategy for parallel execution

### 2. Deployment Pipeline (`deploy.yml`)
**Trigger**: Push to `main` branch, version tags, manual dispatch

#### Staging Deployment:
- **Database Migrations**: Automated Supabase migration execution
- **ECS Deployment**: Blue-green deployment to AWS ECS
- **Health Checks**: Comprehensive API and frontend validation
- **Smoke Tests**: Post-deployment functional verification

#### Production Deployment:
- **Environment Validation**: Staging verification before production
- **Database Backup**: Automated pre-deployment backup
- **Blue-Green Strategy**: Zero-downtime deployment
- **Performance Monitoring**: Real-time health and performance checks
- **Rollback Capability**: Automatic rollback on failure

### 3. Security & Dependencies (`security.yml`)
**Trigger**: Daily schedule, dependency file changes, manual dispatch

#### Security Features:
- **Dependency Scanning**: npm audit for vulnerabilities
- **Container Security**: Trivy scanning for Docker images
- **Secret Scanning**: TruffleHog for credential detection
- **Automated Updates**: Dependency updates with PR creation
- **Base Image Monitoring**: Docker base image update tracking

### 4. Database Operations (`database.yml`)
**Trigger**: Manual dispatch for specific operations

#### Operations:
- **Automated Backups**: Daily scheduled backups to S3
- **Migration Management**: Safe database schema updates
- **Restore Capability**: Point-in-time database restoration
- **Validation Tools**: Schema and data integrity verification
- **Retention Policies**: Automated cleanup of old backups

### 5. Monitoring & Health Checks (`monitoring.yml`)
**Trigger**: Every 15 minutes, manual dispatch

#### Monitoring Features:
- **API Health Checks**: Multi-environment endpoint monitoring
- **Database Performance**: Response time and connectivity monitoring
- **SSL Certificate Monitoring**: Expiration date tracking
- **Performance Testing**: Automated k6 performance validation
- **Alert Integration**: Slack notifications for issues

### 6. Release Management (`release.yml`)
**Trigger**: Version tags, manual release creation

#### Release Features:
- **Semantic Versioning**: Automated version calculation
- **Changelog Generation**: Git-based release notes
- **Asset Building**: Comprehensive release package creation
- **GitHub Releases**: Automated release publication
- **Post-Release Tasks**: Monitoring integration and notifications

## 🛠️ Required Secrets Configuration

### GitHub Repository Secrets

#### AWS Configuration
```bash
AWS_ACCESS_KEY_ID          # AWS access key for deployments
AWS_SECRET_ACCESS_KEY      # AWS secret key for deployments
AWS_REGION                 # AWS region (e.g., us-east-1)
BACKUP_BUCKET             # S3 bucket for database backups
```

#### Supabase Configuration
```bash
SUPABASE_URL                    # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role key
SUPABASE_ACCESS_TOKEN          # Supabase CLI access token
STAGING_PROJECT_REF            # Staging project reference
PRODUCTION_PROJECT_REF         # Production project reference
STAGING_DB_PASSWORD           # Staging database password
PRODUCTION_DB_PASSWORD        # Production database password
```

#### Application Secrets
```bash
JWT_SECRET                    # JWT signing secret
VITE_SUPABASE_ANON_KEY       # Frontend Supabase anon key
STAGING_API_KEY              # Staging environment API key
PRODUCTION_API_KEY           # Production environment API key
```

#### Monitoring & Alerting
```bash
SLACK_WEBHOOK_URL            # Slack webhook for notifications
SENTRY_AUTH_TOKEN           # Sentry API token for releases
SENTRY_ORG                  # Sentry organization name
```

#### Load Balancer Configuration
```bash
PRODUCTION_LISTENER_ARN      # AWS ALB listener ARN
GREEN_TARGET_GROUP_ARN      # Green environment target group
BLUE_TARGET_GROUP_ARN       # Blue environment target group
```

### Environment-Specific Secrets

#### Staging Environment
- Dedicated database and infrastructure
- Automated deployment from `main` branch
- Full monitoring and alerting

#### Production Environment
- Manual approval gates
- Blue-green deployment strategy
- Comprehensive backup and rollback

## 🔧 Setup Instructions

### 1. Repository Configuration

#### Enable Required GitHub Features
```bash
# Enable GitHub Actions
Settings → Actions → General → Allow all actions

# Enable Security Features
Settings → Security → Code scanning alerts
Settings → Security → Dependabot alerts
Settings → Security → Secret scanning alerts
```

#### Branch Protection Rules
```bash
# Main Branch Protection
Settings → Branches → Add rule
- Branch name: main
- Require status checks: ✅
- Require branches to be up to date: ✅
- Status checks: "Quality Gate", "Frontend Tests", "Backend Tests"
- Restrict pushes to matching branches: ✅
```

### 2. Environment Setup

#### Create GitHub Environments
```bash
# Staging Environment
Settings → Environments → New environment: "staging"
- No deployment protection rules
- Environment secrets: staging-specific values

# Production Environment  
Settings → Environments → New environment: "production"
- Required reviewers: repository maintainers
- Wait timer: 5 minutes
- Environment secrets: production-specific values
```

### 3. Infrastructure Requirements

#### AWS Resources
- **ECS Clusters**: `desicargo-staging`, `desicargo-production`
- **Application Load Balancer**: Blue-green target groups
- **S3 Bucket**: Database backup storage with versioning
- **IAM Roles**: ECS task execution and deployment permissions

#### Container Registry
- **GitHub Container Registry**: Automatic image building and storage
- **Image Scanning**: Enabled vulnerability scanning
- **Retention Policies**: Automated cleanup of old images

## 📊 Monitoring & Alerting

### Health Check Endpoints
- **Basic Health**: `/health` - Simple status check
- **Detailed Health**: `/health/detailed` - Comprehensive system status
- **Database Health**: Included in detailed health checks
- **Cache Status**: Redis connectivity and performance

### Alert Channels
- **#alerts**: Real-time system alerts
- **#deployments**: Deployment notifications
- **#production-deployments**: Production-specific alerts
- **#database-ops**: Database operation notifications
- **#security-alerts**: Security-related notifications
- **#releases**: Release announcements

### Performance Thresholds
- **API Response Time**: P95 < 2000ms
- **Error Rate**: < 10%
- **Database Response**: < 5000ms
- **SSL Certificate**: 30-day expiration warning

## 🔄 Deployment Process

### Staging Deployment
1. **Automated Trigger**: Push to `main` branch
2. **Quality Gates**: All CI checks must pass
3. **Database Migration**: Automatic schema updates
4. **Application Deployment**: Rolling update
5. **Health Verification**: Automated testing
6. **Notification**: Slack alert on completion

### Production Deployment
1. **Manual Trigger**: Create version tag or manual dispatch
2. **Staging Validation**: Verify staging environment health
3. **Approval Gate**: Manual approval required
4. **Pre-Deployment Backup**: Automatic database backup
5. **Blue-Green Deployment**: Zero-downtime switch
6. **Health Monitoring**: Comprehensive validation
7. **Success Notification**: Team and stakeholder alerts

### Rollback Process
1. **Automatic Detection**: Health check failures
2. **Traffic Switch**: Immediate rollback to blue environment
3. **Service Scaling**: Restore previous environment capacity
4. **Incident Creation**: Automatic GitHub issue creation
5. **Team Notification**: Urgent Slack alerts

## 🛡️ Security Features

### Automated Security Scanning
- **Daily Vulnerability Scans**: npm audit and Trivy
- **Secret Detection**: TruffleHog scanning
- **Dependency Updates**: Automated PR creation
- **Container Image Scanning**: Base image vulnerability detection

### Security Best Practices
- **Least Privilege**: Minimal IAM permissions
- **Secret Management**: GitHub Secrets for sensitive data
- **Network Security**: VPC and security group restrictions
- **Data Encryption**: At-rest and in-transit encryption

## 📈 Performance Optimization

### Build Optimization
- **Docker Layer Caching**: GitHub Actions cache
- **Dependency Caching**: npm and Docker build caches
- **Parallel Execution**: Matrix strategy for multiple jobs
- **Artifact Management**: Efficient storage and transfer

### Deployment Optimization
- **Blue-Green Strategy**: Zero-downtime deployments
- **Health Check Optimization**: Fast startup and readiness checks
- **Database Migration**: Non-blocking schema updates
- **CDN Integration**: Static asset optimization

## 🔍 Troubleshooting Guide

### Common Issues

#### Failed CI/CD Pipeline
```bash
# Check workflow logs
Actions → Failed workflow → View logs

# Common fixes
1. Update secrets if expired
2. Check branch protection rules
3. Verify test dependencies
4. Review security scan results
```

#### Deployment Failures
```bash
# Check deployment status
AWS Console → ECS → Service status

# Common fixes
1. Verify health check endpoints
2. Check database connectivity
3. Review environment variables
4. Validate load balancer configuration
```

#### Health Check Failures
```bash
# Manual health check
curl https://api.yourdomain.com/health/detailed

# Check components
1. Database connectivity
2. Redis availability  
3. External service dependencies
4. SSL certificate validity
```

### Emergency Procedures

#### Production Incident Response
1. **Immediate**: Check monitoring alerts
2. **Assess**: Determine impact and severity
3. **Communicate**: Notify stakeholders via Slack
4. **Rollback**: Use blue-green rollback if needed
5. **Investigate**: Analyze logs and metrics
6. **Document**: Create incident report

#### Security Incident Response
1. **Isolate**: Disable affected components
2. **Assess**: Determine scope of compromise
3. **Rotate**: Change all potentially affected secrets
4. **Patch**: Apply security updates immediately
5. **Monitor**: Enhanced monitoring post-incident

## 📚 Best Practices

### Development Workflow
1. **Feature Branches**: Create feature branches from `develop`
2. **Pull Requests**: Always use PRs for code review
3. **Testing**: Ensure all tests pass before merge
4. **Documentation**: Update docs with code changes

### Release Management
1. **Semantic Versioning**: Use semver for version numbers
2. **Release Notes**: Maintain comprehensive changelogs
3. **Testing**: Thorough testing in staging before production
4. **Communication**: Notify stakeholders of releases

### Security Practices
1. **Regular Updates**: Keep dependencies current
2. **Secret Rotation**: Regularly rotate sensitive credentials
3. **Access Review**: Periodic review of access permissions
4. **Monitoring**: Continuous security monitoring

The CI/CD pipeline provides a robust, secure, and automated software delivery process that ensures high code quality, system reliability, and efficient deployment workflows for the DesiCargo platform.