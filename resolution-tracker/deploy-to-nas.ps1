# Resolution Tracker - NAS Deployment Script
# Usage: .\deploy-to-nas.ps1 -nasIp "192.168.1.100" -nasUser "admin"

param(
    [Parameter(Mandatory=$true)]
    [string]$nasIp,
    
    [Parameter(Mandatory=$true)]
    [string]$nasUser,
    
    [Parameter(Mandatory=$false)]
    [string]$nasPath = "/docker/resolution-tracker",
    
    [Parameter(Mandatory=$false)]
    [string]$nasPassword = $null
)

# Color output
function Write-Success {
    Write-Host "✓ $args" -ForegroundColor Green
}

function Write-Error-Custom {
    Write-Host "✗ $args" -ForegroundColor Red
}

function Write-Info {
    Write-Host "→ $args" -ForegroundColor Cyan
}

# Check if WinSCP is available (alternative to scp)
function Test-SshConnectivity {
    Write-Info "Testing SSH connection to $nasIp..."
    
    # Try a simple SSH command
    $testResult = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${nasUser}@${nasIp}" "echo 'Connection successful'" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "SSH connection successful"
        return $true
    } else {
        Write-Error-Custom "SSH connection failed. Make sure:"
        Write-Host "  1. Your NAS has SSH enabled"
        Write-Host "  2. You can SSH into it: ssh ${nasUser}@${nasIp}"
        Write-Host "  3. OpenSSH is installed on your system"
        return $false
    }
}

# Deploy function
function Deploy-ToNas {
    Write-Info "Starting deployment to NAS..."
    Write-Info "Target: ${nasUser}@${nasIp}:${nasPath}"
    
    # Files to copy
    $filesToCopy = @(
        "docker-compose.yml",
        "Dockerfile",
        ".dockerignore",
        ".env.nas.example",
        "package.json",
        "package-lock.json",
        "tsconfig.json",
        "vite.config.ts"
    )
    
    Write-Info "Copying application files..."
    
    # Copy each file
    foreach ($file in $filesToCopy) {
        $localPath = "resolution-tracker\$file"
        
        if (Test-Path $localPath) {
            Write-Info "  Copying $file..."
            
            # Use scp to copy
            scp -r $localPath "${nasUser}@${nasIp}:${nasPath}/" 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "  $file copied"
            } else {
                Write-Error-Custom "  Failed to copy $file"
            }
        } else {
            Write-Error-Custom "  $file not found"
        }
    }
    
    # Copy directories
    $dirsToSync = @(
        "client",
        "server",
        "shared",
        "script"
    )
    
    foreach ($dir in $dirsToSync) {
        $localPath = "resolution-tracker\$dir"
        
        if (Test-Path $localPath) {
            Write-Info "  Syncing $dir/..."
            
            scp -r "$localPath" "${nasUser}@${nasIp}:${nasPath}/" 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "  $dir synced"
            } else {
                Write-Error-Custom "  Failed to sync $dir"
            }
        }
    }
    
    Write-Success "Deployment complete!"
    Write-Info "Next steps on NAS:"
    Write-Host "  1. SSH into NAS: ssh ${nasUser}@${nasIp}"
    Write-Host "  2. Navigate: cd $nasPath"
    Write-Host "  3. Copy env: cp .env.nas.example .env"
    Write-Host "  4. Edit: nano .env (fill in secrets)"
    Write-Host "  5. Deploy: docker-compose up -d"
}

# Main
Write-Host "================================================" -ForegroundColor Blue
Write-Host "  Resolution Tracker - NAS Deployment" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

# Test connectivity first
if (-not (Test-SshConnectivity)) {
    exit 1
}

Write-Host ""

# Deploy
Deploy-ToNas

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Deployment Script Complete" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
