#!/bin/bash

# Resolution Tracker - NAS Deployment Script
# Usage: ./deploy-to-nas.sh -i 192.168.1.100 -u admin [-p /docker/resolution-tracker]

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default path
NAS_PATH="/docker/resolution-tracker"

# Parse arguments
while getopts "i:u:p:" opt; do
  case $opt in
    i)
      NAS_IP=$OPTARG
      ;;
    u)
      NAS_USER=$OPTARG
      ;;
    p)
      NAS_PATH=$OPTARG
      ;;
    *)
      echo "Usage: $0 -i <nas-ip> -u <nas-user> [-p /docker/resolution-tracker]"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$NAS_IP" ] || [ -z "$NAS_USER" ]; then
  echo -e "${RED}✗ Missing required arguments${NC}"
  echo "Usage: $0 -i <nas-ip> -u <nas-user> [-p /docker/resolution-tracker]"
  exit 1
fi

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  Resolution Tracker - NAS Deployment${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# Test SSH connectivity
echo -e "${CYAN}→ Testing SSH connection to $NAS_IP...${NC}"
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_IP}" "echo 'Connection successful'" 2>/dev/null

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ SSH connection successful${NC}"
else
  echo -e "${RED}✗ SSH connection failed${NC}"
  echo "Make sure:"
  echo "  1. Your NAS has SSH enabled"
  echo "  2. You can SSH into it: ssh ${NAS_USER}@${NAS_IP}"
  echo "  3. SSH is installed on your system"
  exit 1
fi

echo ""
echo -e "${CYAN}→ Starting deployment to NAS...${NC}"
echo -e "${CYAN}→ Target: ${NAS_USER}@${NAS_IP}:${NAS_PATH}${NC}"
echo ""

# Create directory on NAS if it doesn't exist
echo -e "${CYAN}→ Ensuring destination directory exists...${NC}"
ssh -o StrictHostKeyChecking=no "${NAS_USER}@${NAS_IP}" "mkdir -p $NAS_PATH" 2>/dev/null
echo -e "${GREEN}✓ Directory ready${NC}"
echo ""

# Files to copy
declare -a FILES=(
  "docker-compose.yml"
  "Dockerfile"
  ".dockerignore"
  ".env.nas.example"
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "vite.config.ts"
)

echo -e "${CYAN}→ Copying application files...${NC}"

# Copy files
for file in "${FILES[@]}"; do
  if [ -f "resolution-tracker/$file" ]; then
    echo -e "${CYAN}  → Copying $file...${NC}"
    scp -r "resolution-tracker/$file" "${NAS_USER}@${NAS_IP}:${NAS_PATH}/" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}  ✓ $file copied${NC}"
    else
      echo -e "${RED}  ✗ Failed to copy $file${NC}"
    fi
  else
    echo -e "${RED}  ✗ $file not found${NC}"
  fi
done

echo ""

# Directories to sync
declare -a DIRS=(
  "client"
  "server"
  "shared"
  "script"
)

echo -e "${CYAN}→ Syncing directories...${NC}"

for dir in "${DIRS[@]}"; do
  if [ -d "resolution-tracker/$dir" ]; then
    echo -e "${CYAN}  → Syncing $dir/...${NC}"
    scp -r "resolution-tracker/$dir" "${NAS_USER}@${NAS_IP}:${NAS_PATH}/" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}  ✓ $dir synced${NC}"
    else
      echo -e "${RED}  ✗ Failed to sync $dir${NC}"
    fi
  else
    echo -e "${RED}  ✗ $dir directory not found${NC}"
  fi
done

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo -e "${CYAN}Next steps on NAS:${NC}"
echo "  1. SSH into NAS: ssh ${NAS_USER}@${NAS_IP}"
echo "  2. Navigate: cd $NAS_PATH"
echo "  3. Copy env: cp .env.nas.example .env"
echo "  4. Edit: nano .env (fill in secrets)"
echo "  5. Deploy: docker-compose up -d"
echo ""
echo -e "${CYAN}================================================${NC}"
echo -e "${GREEN}  Deployment Script Complete${NC}"
echo -e "${CYAN}================================================${NC}"
