#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# MilkeKhao — Google Cloud Platform (GCP) Deployment Script
# Targets: Google Cloud Run (Serverless, scales to 0) + Cloud SQL PostgreSQL
# Ideal for Lowest MVP Baseline Cost (~$0-$10/month)
# ==============================================================================

GCP_PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo '')}"
GCP_REGION="${GCP_REGION:-asia-south1}" # Mumbai region
APP_NAME="milkekhao"
BACKEND_SERVICE="${APP_NAME}-api"
FRONTEND_SERVICE="${APP_NAME}-web"
ARTIFACT_REPO="${APP_NAME}-repo"

echo "==================================================================="
echo "🚀 Deploying MilkeKhao to Google Cloud Platform ($GCP_REGION)"
echo "==================================================================="

if [ -z "$GCP_PROJECT_ID" ]; then
  echo "❌ Error: No active GCP project configured."
  echo "👉 Run 'gcloud config set project <YOUR_PROJECT_ID>' first."
  exit 1
fi

echo "✅ GCP Project: $GCP_PROJECT_ID"
echo "✅ GCP Region:  $GCP_REGION"

# 1. Enable Required GCP APIs
echo "⚙️ Enabling necessary Google Cloud APIs..."
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  --project "$GCP_PROJECT_ID" >/dev/null 2>&1

# 2. Ensure Artifact Registry Exists
echo "📦 Ensuring Artifact Registry repository exists..."
gcloud artifacts repositories describe "$ARTIFACT_REPO" \
  --location="$GCP_REGION" --project="$GCP_PROJECT_ID" >/dev/null 2>&1 || \
gcloud artifacts repositories create "$ARTIFACT_REPO" \
  --repository-format=docker \
  --location="$GCP_REGION" \
  --description="MilkeKhao container images" \
  --project="$GCP_PROJECT_ID"

# 3. Configure Docker auth for GCP
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

BACKEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REPO}/${BACKEND_SERVICE}:latest"
FRONTEND_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REPO}/${FRONTEND_SERVICE}:latest"

# 4. Build and Push Backend Image via Cloud Build
echo "🏗️ Building & Submitting Backend to Google Cloud Build..."
gcloud builds submit --tag "$BACKEND_IMAGE" -f Dockerfile.backend .

# 5. Build and Push Frontend Image
echo "🏗️ Building & Submitting Frontend to Google Cloud Build..."
gcloud builds submit --tag "$FRONTEND_IMAGE" src/frontend

# 6. Deploy Backend to Cloud Run
echo "🚀 Deploying Backend API to Cloud Run..."
gcloud run deploy "$BACKEND_SERVICE" \
  --image "$BACKEND_IMAGE" \
  --region "$GCP_REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "ASPNETCORE_ENVIRONMENT=Production,Logging__LogLevel__Default=Information" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --project "$GCP_PROJECT_ID"

API_URL=$(gcloud run services describe "$BACKEND_SERVICE" --platform managed --region "$GCP_REGION" --format 'value(status.url)' --project "$GCP_PROJECT_ID")

# 7. Deploy Frontend to Cloud Run
echo "🚀 Deploying Frontend SPA to Cloud Run..."
gcloud run deploy "$FRONTEND_SERVICE" \
  --image "$FRONTEND_IMAGE" \
  --region "$GCP_REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --project "$GCP_PROJECT_ID"

WEB_URL=$(gcloud run services describe "$FRONTEND_SERVICE" --platform managed --region "$GCP_REGION" --format 'value(status.url)' --project "$GCP_PROJECT_ID")

echo "==================================================================="
echo "🎉 Google Cloud Deployment Completed Successfully!"
echo "🌐 Storefront & Staff Web App: $WEB_URL"
echo "🔌 Backend API & SignalR Hub:  $API_URL"
echo "==================================================================="
