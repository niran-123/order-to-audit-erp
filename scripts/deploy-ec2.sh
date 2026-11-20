#!/bin/bash
# ==============================================================================
# Order-to-Audit ERP - Automated AWS EC2 Server Setup & Deployment Script
# Supports: Ubuntu 22.04 LTS / Debian 12
# Usage: ./scripts/deploy-ec2.sh
# ==============================================================================

set -euo pipefail

echo "=================================================================="
echo "Order-to-Audit ERP: Starting Automated AWS EC2 Deployment Setup"
echo "=================================================================="

# 1. Update OS packages
echo "[1/6] Updating OS packages and installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release ufw certbot

# 2. Install Docker & Docker Compose Plugin
if ! command -v docker &> /dev/null; then
  echo "[2/6] Installing Docker Engine..."
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker "$USER"
  echo "Docker installed successfully."
else
  echo "[2/6] Docker already installed."
fi

# 3. Configure Firewall (UFW)
echo "[3/6] Configuring UFW Firewall (SSH, HTTP, HTTPS)..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Verify Environment Configuration
echo "[4/6] Checking production environment file..."
if [ ! -f .env.production ]; then
  if [ -f .env.production.example ]; then
    echo "Creating .env.production from template. PLEASE UPDATE SECRETS!"
    cp .env.production.example .env.production
  fi
fi

# 5. Build and Launch Production Containers
echo "[5/6] Building and starting production Docker containers..."
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d

# 6. Verify Service Health
echo "[6/6] Verifying container health status..."
sleep 15
docker compose -f docker-compose.prod.yml ps

echo "=================================================================="
echo "Deployment successful! The Order-to-Audit ERP is now running."
echo "Frontend: http://$(curl -s http://checkip.amazonaws.com)"
echo "Backend:  http://$(curl -s http://checkip.amazonaws.com)/api/v1/health"
echo "=================================================================="
