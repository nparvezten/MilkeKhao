#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# MilkeKhao — Microsoft Azure Deployment Script
# Targets: Azure Container Apps (Serverless containers) + Azure Database for PostgreSQL
# Cost-Efficient Tier (~$10-$20/month with Container Apps free grant)
# ==============================================================================

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-milkekhao-prod}"
AZURE_LOCATION="${AZURE_LOCATION:-centralindia}" # Pune/Central India region
APP_NAME="milkekhao"
ACR_NAME="${APP_NAME}registry$RANDOM"
ENV_NAME="${APP_NAME}-env"

echo "==================================================================="
echo "🚀 Deploying MilkeKhao to Microsoft Azure ($AZURE_LOCATION)"
echo "==================================================================="

# Check Azure CLI login
az account show >/dev/null 2>&1 || {
  echo "❌ Error: Azure CLI is not logged in."
  echo "👉 Run 'az login' first."
  exit 1
}

echo "✅ Resource Group: $RESOURCE_GROUP"
echo "✅ Azure Location: $AZURE_LOCATION"

# 1. Create Resource Group
echo "📁 Creating/verifying Azure Resource Group..."
az group create --name "$RESOURCE_GROUP" --location "$AZURE_LOCATION" --output none

# 2. Create Azure Container Registry (ACR)
echo "📦 Creating Azure Container Registry ($ACR_NAME)..."
az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true --output none || true

# Get ACR Login Server & Password
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query "loginServer" --output tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query "passwords[0].value" --output tsv)

# 3. Build & Push Images using ACR Tasks (cloud native build)
echo "🏗️ Building backend image directly inside ACR..."
az acr build --registry "$ACR_NAME" --image "${APP_NAME}-api:latest" --file Dockerfile.backend . --output none

echo "🏗️ Building frontend image directly inside ACR..."
az acr build --registry "$ACR_NAME" --image "${APP_NAME}-web:latest" src/frontend --output none

# 4. Create Azure Container Apps Environment
echo "🌐 Creating Azure Container Apps Environment..."
az containerapp env create \
  --name "$ENV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$AZURE_LOCATION" \
  --output none || true

# 5. Deploy Backend Container App
echo "🚀 Deploying Backend API Container App..."
az containerapp create \
  --name "${APP_NAME}-api" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENV_NAME" \
  --image "$ACR_LOGIN_SERVER/${APP_NAME}-api:latest" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3 \
  --cpu 0.5 --memory 1.0Gi \
  --env-vars "ASPNETCORE_ENVIRONMENT=Production" \
  --output none

API_FQDN=$(az containerapp show --name "${APP_NAME}-api" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" --output tsv)

# 6. Deploy Frontend Container App
echo "🚀 Deploying Frontend Web Container App..."
az containerapp create \
  --name "${APP_NAME}-web" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENV_NAME" \
  --image "$ACR_LOGIN_SERVER/${APP_NAME}-web:latest" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 80 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3 \
  --cpu 0.25 --memory 0.5Gi \
  --output none

WEB_FQDN=$(az containerapp show --name "${APP_NAME}-web" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" --output tsv)

echo "==================================================================="
echo "🎉 Azure Container Apps Deployment Completed!"
echo "🌐 Web Storefront URL: https://$WEB_FQDN"
echo "🔌 API & SignalR URL:  https://$API_FQDN"
echo "==================================================================="
