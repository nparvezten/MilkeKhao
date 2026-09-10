#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# MilkeKhao — Universal Multi-Cloud Deployment Orchestrator
# Lets you deploy to AWS, GCP, Azure, or review live cost matrix anytime.
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_cost_matrix() {
  cat << "EOF"
===================================================================================================
                   📊 MILKIKHAO CLOUD COST ESTIMATE MATRIX (PER CLIENT / MVP)
===================================================================================================
 Provider | Primary Compute           | Database Tier             | Est. Monthly Cost | Best Fit
----------|---------------------------|---------------------------|-------------------|------------------
 GCP      | Cloud Run (Scale to 0)    | Cloud SQL (db-f1-micro)   | $0 - $12 / mo     | 🏆 Lowest cost MVP
 Azure    | Container Apps (Free tier)| Flexible Server (B1ms)    | $10 - $18 / mo    | Enterprise Azure clients
 AWS      | App Runner / ECS Fargate  | RDS Postgres (db.t4g.micro)| $15 - $28 / mo   | AWS-locked ecosystems
 Hybrid   | Cloud Run / App Runner    | Supabase / Neon DB (Free) | $0 - $5 / mo      | 🚀 Ultimate low-budget
===================================================================================================
EOF
}

show_menu() {
  echo ""
  echo "🍛 MilkeKhao Cloud Deployment Assistant"
  echo "======================================="
  echo "1) 🟡 Deploy to Google Cloud Platform (GCP Cloud Run - Cheapest MVP)"
  echo "2) 🔵 Deploy to Microsoft Azure (Azure Container Apps)"
  echo "3) 🟠 Deploy to Amazon Web Services (AWS App Runner / ECS)"
  echo "4) 📊 View Cloud Cost Comparison Matrix"
  echo "5) ❌ Exit"
  echo ""
}

TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  show_menu
  read -p "Select an option [1-5]: " CHOICE
  case "$CHOICE" in
    1) TARGET="gcp" ;;
    2) TARGET="azure" ;;
    3) TARGET="aws" ;;
    4) show_cost_matrix; exit 0 ;;
    5) exit 0 ;;
    *) echo "Invalid option"; exit 1 ;;
  esac
fi

case "$TARGET" in
  gcp)
    echo "▶️ Launching GCP deployment..."
    chmod +x "$DIR/gcp/deploy-gcp.sh"
    "$DIR/gcp/deploy-gcp.sh"
    ;;
  azure)
    echo "▶️ Launching Azure deployment..."
    chmod +x "$DIR/azure/deploy-azure.sh"
    "$DIR/azure/deploy-azure.sh"
    ;;
  aws)
    echo "▶️ Launching AWS deployment..."
    chmod +x "$DIR/aws/deploy-aws.sh"
    "$DIR/aws/deploy-aws.sh"
    ;;
  cost|compare|matrix)
    show_cost_matrix
    ;;
  *)
    echo "Usage: ./deploy-cloud.sh [gcp|azure|aws|cost]"
    exit 1
    ;;
esac
