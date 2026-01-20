# Resolution Tracker - NAS Deployment Script
# Usage: .\deploy-to-nas.ps1 -nasIp "192.168.1.100" -nasUser "admin"
# Split deployment: docker config → /volume3/docker/projects/resolution-tracker
#                   app files → /volume3/docker/resolution-tracker

param(
    [Parameter(Mandatory=$true)]
    [string]$nasIp,
    
    [Parameter(Mandatory=$true)]
    [string]$nasUser,
    
    [Parameter(Mandatory=$false)]
    [string]$nasPath = "/volume3/docker",
    
    [Parameter(Mandatory=$false)]
    [string]$nasPassword = $null
)

# Color output
function Write-Success {
    Write-Host "[OK] $args" -ForegroundColor Green
}

function Write-Error-Custom {
    Write-Host "[ERROR] $args" -ForegroundColor Red
}

function Write-Info {
    Write-Host ">> $args" -ForegroundColor Cyan
}

# Check if WinSCP is available (alternative to scp)
function Test-SshConnectivity {
    Write-Info "Testing SSH connection to $nasIp..."
    
    # Try a simple SSH command
    $testResult = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${nasUser}@${nasIp}" "echo Connection successful" 2>$null
    
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
    Write-Info "Starting split deployment to NAS..."
    Write-Info "Base path: ${nasUser}@${nasIp}:${nasPath}"
    
    # Ensure scp is available
    if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "scp not found. Please install OpenSSH Client (Windows Optional Feature) or PuTTY's pscp."
        Write-Host "  - Windows: Settings > Optional features > Add a feature > OpenSSH Client"
        Write-Host "  - Or install PuTTY and use pscp"
        return
    }
    
    # Resolve a writable NAS base path (auto-detect common locations)
    function Resolve-RemotePath {
        param(
            [string]$requestedPath,
            [string]$nasUser,
            [string]$nasIp
        )

        $candidates = @()
        if ($requestedPath -and $requestedPath.Trim().Length -gt 0) {
            $candidates += $requestedPath
        } else {
            $candidates += "/volume3/docker"
            $candidates += "/docker"
        }

        foreach ($p in $candidates) {
            Write-Info "Checking NAS base path $p..."
            ssh -o StrictHostKeyChecking=no "${nasUser}@${nasIp}" "mkdir -p $p"
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Using NAS base path: $p"
                return $p
            } else {
                Write-Error-Custom "Cannot create $p (permission denied or invalid path)"
            }
        }

        throw "No writable NAS path found. Try passing -nasPath with a path like /volume3/docker or /docker"
    }

    $basePath = Resolve-RemotePath -requestedPath $nasPath -nasUser $nasUser -nasIp $nasIp
    $projectsPath = "$basePath/projects/resolution-tracker"
    
    # Ensure project directory exists
    Write-Info "Creating project directory..."
    ssh -o StrictHostKeyChecking=no "${nasUser}@${nasIp}" "mkdir -p $projectsPath"
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to create directory"
        return
    }
    Write-Success "Directory created"
    
    # Only config files needed for Docker deployment (pulls pre-built image from GHCR)
    $configFiles = @(
        "docker-compose.yml",
        ".env.nas.example"
    )
    
    Write-Info "Copying configuration files to $projectsPath..."
    
    # Copy config files
    foreach ($file in $configFiles) {
        $localPath = $file
        
        if (Test-Path $localPath) {
            Write-Info "  Copying $file..."
            
            # Use scp to copy (legacy protocol for Synology compatibility)
            scp -O $localPath "${nasUser}@${nasIp}:${projectsPath}/"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "  $file copied"
            } else {
                Write-Error-Custom "  Failed to copy $file"
            }
        } else {
            Write-Error-Custom "  $file not found"
        }
    }
    
    Write-Success "Deployment complete!"
    Write-Host ""
    Write-Info "Deployment summary:"
    Write-Host "  Config location: $projectsPath"
    Write-Host ""
    Write-Info "Next steps on NAS:"
    Write-Host "  1. SSH into NAS: ssh ${nasUser}@${nasIp}"
    Write-Host "  2. Go to config: cd $projectsPath"
    Write-Host "  3. Create .env: cp .env.nas.example .env"
    Write-Host "  4. Edit secrets: nano .env (fill in all required values)"
    Write-Host "  5. Login to GHCR: echo \$GITHUB_TOKEN | docker login ghcr.io -u nexaddo --password-stdin"
    Write-Host "     (Get token from: https://github.com/settings/tokens - needs read:packages scope)"
    Write-Host "  6. Pull image: docker-compose pull"
    Write-Host "  7. Start services: docker-compose up -d"
    Write-Host "  8. Check logs: docker-compose logs -f"
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
