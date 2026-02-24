# 🔄 CI/CD Pipeline - Diagrammes Visuels

Ce document contient des diagrammes visuels du pipeline CI/CD de ClubManager.

---

## 📊 Pipeline Complet

```mermaid
graph TB
    Start([Push vers main/develop]) --> Trigger{GitHub Actions}
    
    Trigger --> FrontendTest[🎨 Frontend Tests]
    Trigger --> APITest[🔧 API Tests]
    
    FrontendTest --> FrontendLint[Lint ESLint]
    FrontendLint --> FrontendUnit[Unit Tests Vitest]
    FrontendUnit --> FrontendCov[Coverage Check ≥70%]
    
    APITest --> APILint[Lint ESLint]
    APILint --> APIUnit[Unit Tests Jest]
    APIUnit --> APICov[Coverage Check]
    
    FrontendCov --> FrontendBuild[🏗️ Build Frontend]
    APICov --> APIBuild[🔨 Build API]
    
    FrontendBuild --> FrontendDocker[🐳 Docker Frontend]
    APIBuild --> APIDocker[🐳 Docker API]
    
    FrontendDocker --> GHCR1[Push to GHCR]
    APIDocker --> GHCR2[Push to GHCR]
    
    GHCR1 --> DeployS3{Deploy Frontend?}
    GHCR2 --> DeployAPI{Deploy Backend?}
    
    DeployS3 -->|main branch| S3Upload[📤 Upload to S3]
    DeployAPI -->|main branch| EC2Deploy[🚀 Deploy to EC2]
    
    S3Upload --> CFInvalidate[🔄 CloudFront Invalidation]
    EC2Deploy --> HealthCheck[✅ Health Check]
    
    CFInvalidate --> Notify[📢 Notification]
    HealthCheck --> Notify
    
    Notify --> Success([✅ Deployment Complete])
    
    DeployS3 -->|other branch| Skip1([⏭️ Skip Deploy])
    DeployAPI -->|other branch| Skip2([⏭️ Skip Deploy])
    
    style Start fill:#e1f5e1
    style Success fill:#c8e6c9
    style FrontendTest fill:#e3f2fd
    style APITest fill:#e3f2fd
    style FrontendDocker fill:#fff3e0
    style APIDocker fill:#fff3e0
    style S3Upload fill:#f3e5f5
    style EC2Deploy fill:#f3e5f5
    style Notify fill:#fce4ec
```

---

## 🏗️ Architecture de Déploiement

```mermaid
graph LR
    subgraph GitHub
        Repo[Repository]
        Actions[GitHub Actions]
        GHCR[Container Registry]
    end
    
    subgraph AWS
        S3[S3 Bucket]
        CF[CloudFront CDN]
        EC2[EC2 Instance]
        RDS[(RDS MySQL)]
        Redis[(ElastiCache Redis)]
    end
    
    subgraph Users
        Browser[🌐 Web Browser]
    end
    
    Repo --> Actions
    Actions --> GHCR
    Actions --> S3
    Actions --> EC2
    
    S3 --> CF
    CF --> Browser
    
    EC2 --> RDS
    EC2 --> Redis
    Browser --> CF
    Browser -.API Calls.-> EC2
    
    style GitHub fill:#e3f2fd
    style AWS fill:#fff3e0
    style Users fill:#f3e5f5
```

---

## 🔄 Workflow Détaillé Frontend

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant GA as GitHub Actions
    participant GHCR as Container Registry
    participant S3 as AWS S3
    participant CF as CloudFront
    participant User as End User
    
    Dev->>GH: git push origin main
    GH->>GA: Trigger workflow
    
    GA->>GA: Checkout code
    GA->>GA: Setup Node.js 18
    GA->>GA: npm ci (install deps)
    
    GA->>GA: npm run lint
    alt Lint fails
        GA-->>Dev: ❌ Failed - Fix linting
    end
    
    GA->>GA: npm run test:coverage
    alt Coverage < 70%
        GA-->>Dev: ❌ Failed - Increase coverage
    end
    
    GA->>GA: npm run build
    GA->>GA: Upload artifacts
    
    GA->>GHCR: Build Docker image
    GA->>GHCR: Push image (tag: latest, main-{sha})
    
    GA->>S3: aws s3 sync ./dist
    Note over GA,S3: Cache headers optimized
    
    GA->>CF: create-invalidation --paths "/*"
    CF->>CF: Invalidate cache
    
    GA-->>Dev: ✅ Deployment successful
    
    User->>CF: HTTP Request
    CF->>S3: Fetch updated content
    S3-->>CF: Return files
    CF-->>User: Serve with CDN
```

---

## 🔧 Workflow Détaillé Backend

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant GA as GitHub Actions
    participant GHCR as Container Registry
    participant EC2 as AWS EC2
    participant RDS as AWS RDS
    
    Dev->>GH: git push origin main
    GH->>GA: Trigger workflow
    
    GA->>GA: Checkout code
    GA->>GA: Setup services (MySQL, Redis)
    GA->>GA: npm ci
    GA->>GA: npx prisma generate
    
    GA->>GA: npm run test
    alt Tests fail
        GA-->>Dev: ❌ Failed tests
    end
    
    GA->>GA: npm run build
    
    GA->>GHCR: Build Docker image
    GA->>GHCR: Push image (tag: latest)
    
    GA->>EC2: SSH connection
    GA->>EC2: docker login ghcr.io
    GA->>EC2: docker pull latest image
    
    EC2->>EC2: Stop old container
    EC2->>EC2: Remove old container
    EC2->>EC2: Run new container
    
    EC2->>RDS: npx prisma migrate deploy
    RDS-->>EC2: Migrations applied
    
    EC2->>EC2: Health check
    alt Health check fails
        EC2-->>GA: ❌ Deployment failed
        GA->>EC2: Rollback to previous
    else Health check passes
        EC2-->>GA: ✅ Healthy
    end
    
    GA-->>Dev: ✅ Deployment successful
```

---

## 🌍 Flux de Trafic Utilisateur

```mermaid
graph TB
    User[👤 User Browser]
    
    subgraph DNS
        R53[Route 53]
    end
    
    subgraph Frontend
        CF[CloudFront CDN]
        S3[S3 Static Files]
    end
    
    subgraph Backend
        ALB[Application Load Balancer]
        EC2_1[EC2 Instance 1]
        EC2_2[EC2 Instance 2]
    end
    
    subgraph Data
        RDS[(RDS MySQL)]
        Redis[(ElastiCache Redis)]
    end
    
    User -->|1. DNS Query| R53
    R53 -->|2. CloudFront IP| User
    User -->|3. HTTPS Request| CF
    CF -->|Cache Hit| User
    CF -->|Cache Miss| S3
    S3 -->|Static Files| CF
    
    User -.4. API Calls.-> ALB
    ALB --> EC2_1
    ALB --> EC2_2
    EC2_1 --> RDS
    EC2_2 --> RDS
    EC2_1 --> Redis
    EC2_2 --> Redis
    
    style User fill:#e1f5e1
    style CF fill:#e3f2fd
    style RDS fill:#fff3e0
```

---

## 🔄 Processus de Rollback

```mermaid
graph TB
    Issue([🚨 Issue Detected])
    
    Issue --> Decision{Rollback Method?}
    
    Decision -->|Git Revert| Revert[git revert commit-sha]
    Decision -->|Script| Script[./deploy-to-s3.sh --rollback]
    Decision -->|GHCR Image| GHCR[Pull previous image]
    Decision -->|S3 Versioning| S3V[Restore S3 version]
    
    Revert --> Push[git push origin main]
    Push --> AutoDeploy[Auto-deploy triggered]
    
    Script --> LocalBackup[Restore from local backup]
    LocalBackup --> Upload[Upload to S3]
    
    GHCR --> PullImage[docker pull :main-abc1234]
    PullImage --> Extract[Extract files]
    Extract --> Upload
    
    S3V --> RestoreVersion[aws s3api copy-object]
    RestoreVersion --> Upload
    
    Upload --> Invalidate[CloudFront Invalidation]
    AutoDeploy --> Invalidate
    
    Invalidate --> Verify{Verify Fix?}
    Verify -->|Success| Fixed([✅ Issue Resolved])
    Verify -->|Failed| Issue
    
    style Issue fill:#ffebee
    style Fixed fill:#c8e6c9
    style Decision fill:#fff3e0
```

---

## 🔐 Secrets Management

```mermaid
graph LR
    subgraph Developer
        Dev[👨‍💻 Developer]
    end
    
    subgraph GitHub
        Secrets[GitHub Secrets]
        Actions[GitHub Actions]
    end
    
    subgraph AWS
        SM[Secrets Manager]
        SSM[Parameter Store]
    end
    
    subgraph Application
        FE[Frontend Build]
        BE[Backend Runtime]
    end
    
    Dev -->|Configure| Secrets
    Secrets -->|Inject at build| Actions
    Actions -->|VITE_* vars| FE
    Actions -->|Deploy| BE
    
    BE -->|Fetch at runtime| SM
    BE -->|Config values| SSM
    
    style Secrets fill:#ffebee
    style SM fill:#ffebee
    style SSM fill:#fff3e0
```

---

## 📊 Environnements de Déploiement

```mermaid
graph TB
    subgraph Development
        DevBranch[develop branch]
        DevS3[S3: clubmanager-dev]
        DevCF[CloudFront: dev]
        DevEC2[EC2: dev instance]
    end
    
    subgraph Staging
        StageBranch[staging branch]
        StageS3[S3: clubmanager-staging]
        StageCF[CloudFront: staging]
        StageEC2[EC2: staging instance]
    end
    
    subgraph Production
        MainBranch[main branch]
        ProdS3[S3: clubmanager-prod]
        ProdCF[CloudFront: app.clubmanager.com]
        ProdEC2[EC2: prod instance]
    end
    
    DevBranch --> DevS3
    DevS3 --> DevCF
    DevBranch --> DevEC2
    
    StageBranch --> StageS3
    StageS3 --> StageCF
    StageBranch --> StageEC2
    
    MainBranch --> ProdS3
    ProdS3 --> ProdCF
    MainBranch --> ProdEC2
    
    DevBranch -.promote.-> StageBranch
    StageBranch -.promote.-> MainBranch
    
    style Development fill:#e3f2fd
    style Staging fill:#fff3e0
    style Production fill:#c8e6c9
```

---

## 🚀 Scaling Strategy

```mermaid
graph TB
    Start([Traffic Increase])
    
    Start --> Monitor{CloudWatch Metrics}
    
    Monitor -->|CPU > 70%| FrontendScale{Frontend Scale}
    Monitor -->|Requests > 10k/min| BackendScale{Backend Scale}
    
    FrontendScale -->|Already on S3+CF| NoAction1[✅ Auto-scaled]
    
    BackendScale -->|Single EC2| Decision{Budget?}
    
    Decision -->|< $100/month| UpgradeEC2[Upgrade to t3.medium]
    Decision -->|> $100/month| MoveECS[Migrate to ECS]
    
    UpgradeEC2 --> Still{Still struggling?}
    Still -->|Yes| AddALB[Add Load Balancer]
    AddALB --> MultiEC2[Deploy multiple EC2]
    
    MoveECS --> AutoScaling[Configure Auto Scaling]
    AutoScaling --> Fargate[ECS Fargate Tasks]
    
    MultiEC2 --> Monitor
    Fargate --> Monitor
    NoAction1 --> Monitor
    
    style Start fill:#e1f5e1
    style NoAction1 fill:#c8e6c9
```

---

## 📈 Monitoring & Alerting

```mermaid
graph LR
    subgraph Application
        FE[Frontend]
        BE[Backend]
    end
    
    subgraph AWS Monitoring
        CW[CloudWatch]
        CWL[CloudWatch Logs]
        CWA[CloudWatch Alarms]
    end
    
    subgraph External
        Sentry[Sentry]
        Slack[Slack]
    end
    
    subgraph Dashboards
        GH[GitHub Actions]
        AWS_DB[AWS Dashboard]
    end
    
    FE --> CW
    FE --> Sentry
    BE --> CWL
    BE --> Sentry
    
    CW --> CWA
    CWL --> CWA
    
    CWA -->|Trigger| Slack
    Sentry -->|Error| Slack
    
    CW --> AWS_DB
    CWL --> AWS_DB
    GH --> AWS_DB
    
    style CWA fill:#ffebee
    style Slack fill:#fff3e0
```

---

## 💰 Cost Breakdown

```mermaid
pie title Monthly Costs (MVP - $50/month)
    "EC2 t3.small (Backend)" : 34
    "RDS MySQL t3.micro" : 32
    "S3 + CloudFront (Frontend)" : 4
    "Data Transfer" : 18
    "EBS Storage" : 8
    "CloudWatch & Monitoring" : 4
```

```mermaid
pie title Monthly Costs (Production - $200/month)
    "EC2 t3.medium x2 (Backend)" : 35
    "RDS MySQL Multi-AZ" : 30
    "ElastiCache Redis" : 10
    "S3 + CloudFront" : 5
    "Load Balancer" : 8
    "Data Transfer" : 7
    "Monitoring & Logs" : 5
```

---

## 🔄 CI/CD Timeline

```mermaid
gantt
    title Typical Deployment Timeline
    dateFormat  mm:ss
    axisFormat %M:%S
    
    section Frontend
    Checkout & Setup           :00:00, 00:30
    Install Dependencies       :00:30, 01:00
    Lint                       :01:30, 00:20
    Run Tests                  :01:50, 01:30
    Build Production           :03:20, 01:00
    Build Docker Image         :04:20, 01:30
    Push to GHCR              :05:50, 00:40
    Upload to S3              :06:30, 00:45
    CloudFront Invalidation   :07:15, 00:15
    
    section Backend
    Checkout & Setup           :00:00, 00:30
    Install Dependencies       :00:30, 01:00
    Setup Services             :01:30, 00:30
    Run Tests                  :02:00, 02:00
    Build TypeScript           :04:00, 00:45
    Build Docker Image         :04:45, 01:30
    Push to GHCR              :06:15, 00:40
    Deploy to EC2             :06:55, 01:00
    Health Check              :07:55, 00:15
    
    section Summary
    Total Pipeline Duration   :00:00, 08:10
```

---

## 📝 Notes

Ces diagrammes sont générés avec **Mermaid** et peuvent être visualisés directement dans GitHub.

Pour afficher ces diagrammes :
- Sur GitHub : ils s'affichent automatiquement
- Localement : utilisez l'extension VSCode "Markdown Preview Mermaid Support"
- En ligne : https://mermaid.live/

---

**Légende des couleurs :**
- 🟢 Vert : Succès / Complétion
- 🔵 Bleu : Tests / Validation
- 🟡 Jaune : Build / Processing
- 🟣 Violet : Déploiement
- 🔴 Rouge : Alertes / Rollback