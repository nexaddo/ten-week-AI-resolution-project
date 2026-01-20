#!/bin/bash

###############################################################################
# Deploy to Synology NAS Script
#
# This script automates the deployment process to your Synology NAS
#
# Usage:
#   ./script/deploy-to-nas.sh [NAS_IP] [NAS_USER]
#
# Example:
#   ./script/deploy-to-nas.sh 192.168.1.100 admin
###############################################################################

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAS_IP="${1:-}"
NAS_USER="${2:-admin}"
NAS_PATH="/volume1/docker/resolution-tracker"
DOCKER_IMAGE="resolution-tracker:latest"

# Functions
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Validate arguments
if [ -z "$NAS_IP" ]; then
    log_error "Usage: $0 <NAS_IP> [NAS_USER]"
    log_error "Example: $0 192.168.1.100 admin"
    exit 1
fi

echo "╔══════════════════════════════════════════════════╗"
echo "║   Resolution Tracker - NAS Deployment Script    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Target NAS: $NAS_USER@$NAS_IP"
echo "Deploy path: $NAS_PATH"
echo ""

# Step 1: Build application
log_info "Building application..."
npm run build

# Step 2: Create deployment package
log_info "Creating deployment package..."
DEPLOY_DIR="deploy-temp"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r dist "$DEPLOY_DIR/"
cp -r shared "$DEPLOY_DIR/"
cp package.json package-lock.json "$DEPLOY_DIR/"
cp Dockerfile .dockerignore "$DEPLOY_DIR/"
cp drizzle.config.ts "$DEPLOY_DIR/"
mkdir -p "$DEPLOY_DIR/script"
cp script/backup-db.ts "$DEPLOY_DIR/script/"
cp script/restore-db.ts "$DEPLOY_DIR/script/"
cp script/migrate.ts "$DEPLOY_DIR/script/"

log_info "Deployment package created"

# Step 3: Transfer files to NAS
log_info "Transferring files to NAS..."
ssh "$NAS_USER@$NAS_IP" "mkdir -p $NAS_PATH"
scp -r "$DEPLOY_DIR/"* "$NAS_USER@$NAS_IP:$NAS_PATH/"

log_info "Files transferred successfully"

# Step 4: Build Docker image on NAS
log_info "Building Docker image on NAS..."
ssh "$NAS_USER@$NAS_IP" << EOF
    cd $NAS_PATH
    sudo docker build -t $DOCKER_IMAGE .
EOF

log_info "Docker image built successfully"

# Step 5: Stop and remove old container
log_info "Stopping old container..."
ssh "$NAS_USER@$NAS_IP" << 'EOF'
    if sudo docker ps -a | grep -q resolution-tracker; then
        sudo docker stop resolution-tracker || true
        sudo docker rm resolution-tracker || true
    fi
EOF

# Step 6: Run new container
log_info "Starting new container..."
ssh "$NAS_USER@$NAS_IP" << EOF
    sudo docker run -d \
      --name resolution-tracker \
      --restart always \
      --link postgres-resolutions:postgres \
      -p 5000:5000 \
      -v $NAS_PATH/backups:/app/backups \
      --env-file $NAS_PATH/.env \
      $DOCKER_IMAGE
EOF

log_info "Container started successfully"

# Step 7: Wait for health check
log_info "Waiting for application to be ready..."
sleep 5

# Step 8: Test health endpoint
log_info "Testing health endpoint..."
if ssh "$NAS_USER@$NAS_IP" "curl -f http://localhost:5000/api/health" > /dev/null 2>&1; then
    log_info "Health check passed!"
else
    log_warn "Health check failed - check logs with: ssh $NAS_USER@$NAS_IP sudo docker logs resolution-tracker"
fi

# Cleanup
log_info "Cleaning up temporary files..."
rm -rf "$DEPLOY_DIR"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║          Deployment Completed Successfully!      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. View logs: ssh $NAS_USER@$NAS_IP sudo docker logs -f resolution-tracker"
echo "  2. Access app: http://$NAS_IP:5000"
echo "  3. Configure reverse proxy in DSM for HTTPS access"
echo ""
