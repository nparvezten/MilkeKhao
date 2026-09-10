#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# MilkeKhao — AWS Production Deployment Script
# Supports: AWS App Runner / ECS Fargate + ECR + RDS PostgreSQL + ElastiCache Redis
# ==============================================================================

AWS_REGION="${AWS_REGION:-ap-south-1}" # Default Mumbai region for low latency in India
APP_NAME="milkekhao"
ECR_BACKEND_REPO="${APP_NAME}-api"
ECR_FRONTEND_REPO="${APP_NAME}-web"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")

echo "==================================================================="
echo "🚀 Deploying MilkeKhao to AWS ($AWS_REGION)"
echo "==================================================================="

if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "❌ Error: AWS CLI is not authenticated or not installed."
  echo "👉 Run 'aws configure' first or export AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY"
  exit 1
fi

echo "✅ AWS Account ID: $AWS_ACCOUNT_ID"
echo "✅ Target Region:   $AWS_REGION"

# 1. Ensure ECR Repositories Exist
echo "📦 Ensuring Amazon ECR repositories exist..."
aws ecr describe-repositories --repository-names "$ECR_BACKEND_REPO" --region "$AWS_REGION" >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name "$ECR_BACKEND_REPO" --region "$AWS_REGION" >/dev/null

aws ecr describe-repositories --repository-names "$ECR_FRONTEND_REPO" --region "$AWS_REGION" >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name "$ECR_FRONTEND_REPO" --region "$AWS_REGION" >/dev/null

# 2. Login to ECR
echo "🔑 Logging into Amazon ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# 3. Build & Push Backend Container
echo "🏗️ Building and Pushing Backend Container..."
BACKEND_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest"
docker build -t "$BACKEND_IMAGE_URI" -f Dockerfile.backend .
docker push "$BACKEND_IMAGE_URI"

# 4. Build & Push Frontend Container
echo "🏗️ Building and Pushing Frontend Container..."
FRONTEND_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest"
docker build -t "$FRONTEND_IMAGE_URI" -f src/frontend/Dockerfile src/frontend || \
docker build -t "$FRONTEND_IMAGE_URI" -f - src/frontend << 'EOF'
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
docker push "$FRONTEND_IMAGE_URI"

echo "==================================================================="
echo "🎉 AWS ECR Images Built and Pushed Successfully!"
echo "Backend URI:  $BACKEND_IMAGE_URI"
echo "Frontend URI: $FRONTEND_IMAGE_URI"
echo "==================================================================="
echo "👉 Next Steps for AWS Deployment:"
echo "1. Run App Runner or ECS Fargate pointing to $BACKEND_IMAGE_URI and $FRONTEND_IMAGE_URI"
echo "2. Attach RDS PostgreSQL 16 (e.g., db.t4g.micro for cost-efficient MVP ~\$15/mo)"
echo "==================================================================="
