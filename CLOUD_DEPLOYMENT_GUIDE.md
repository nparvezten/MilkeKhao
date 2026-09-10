# ☁️ MilkeKhao — Multi-Cloud Deployment & Operations Guide

This guide details how to deploy and operate **MilkeKhao** across **Google Cloud Platform (GCP)**, **Microsoft Azure**, and **Amazon Web Services (AWS)** using the automated scripts in `infra/`.

---

## 📊 Cloud Cost & Architecture Comparison

| Cloud Provider | Compute Service | Database Tier | Redis / Cache Tier | Est. Cost (MVP / Initial) | When to Recommend |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GCP (Google Cloud)** | Cloud Run *(Scales to 0)* | Cloud SQL PostgreSQL *(db-f1-micro)* | In-Memory / Cloud Run Valkey | **$0 – $12 / mo** | 🏆 **Cheapest MVP:** Zero compute charge when restaurants are closed overnight. |
| **Azure** | Azure Container Apps *(180k vCPU-s free/mo)* | Azure Flexible Postgres *(B1ms)* | Redis Basic *(C0)* | **$10 – $18 / mo** | 🏢 **Best for Enterprise:** Azure AD / Microsoft-aligned restaurant chains. |
| **AWS** | AWS App Runner or ECS Fargate | Amazon RDS Postgres *(db.t4g.micro)* | ElastiCache Redis *(t4g.micro)* | **$15 – $28 / mo** | 🌐 **High Scale & Ecosystem:** Existing AWS infrastructure or AWS credits. |
| **Ultra-Low Cost (Hybrid)** | Cloud Run / Render | Supabase / Neon (Serverless Postgres) | Upstash Redis (Free Tier) | **$0 / mo** | 🚀 **Zero-dollar Sandbox:** For client demonstrations and pilots. |

---

## 🚀 Quick Launch Commands

You can run the interactive selector at any time:

```bash
# Interactive orchestrator
./infra/deploy-cloud.sh

# Or directly specify the cloud target:
./infra/deploy-cloud.sh gcp     # Google Cloud Run
./infra/deploy-cloud.sh azure   # Azure Container Apps
./infra/deploy-cloud.sh aws     # AWS ECS / App Runner
./infra/deploy-cloud.sh cost    # Print cost comparison matrix
```

---

## 🛠️ Provider-Specific Prerequisites

### 1. Google Cloud Platform (GCP)
1. Install the Google Cloud SDK: `brew install google-cloud-sdk`
2. Authenticate: `gcloud auth login`
3. Set your active project: `gcloud config set project <your-project-id>`
4. Deploy: `./infra/gcp/deploy-gcp.sh`

### 2. Microsoft Azure
1. Install Azure CLI: `brew install azure-cli`
2. Authenticate: `az login`
3. Deploy: `./infra/azure/deploy-azure.sh`

### 3. Amazon Web Services (AWS)
1. Install AWS CLI: `brew install awscli`
2. Configure credentials: `aws configure`
3. Deploy: `./infra/aws/deploy-aws.sh`

---

## 🔒 Production Security Checklist
- [x] AES-256 field encryption for customer PII configured in production `appsettings.Production.json`.
- [x] HMAC-SHA256 blind indexing for customer phone lookups.
- [x] Global EF Core tenant query filter enforced on all queries.
- [x] SSL/TLS certificates automated via Cloud Run / Azure Container Apps / AWS ACM.
- [x] Non-root container execution in production Dockerfiles.
