# setup-env.ps1
# CWI AI LLC — Environment Setup Script
# Loads .env variables into the current PowerShell session from a .env file.
# If .env does not exist, it is copied from .env.template.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path $scriptDir -Parent
$envTemplate = Join-Path $projectDir ".env.template"
$envFile = Join-Path $projectDir ".env"

$ErrorActionPreference = 'Stop'

# Check if .env.template exists
if (-not (Test-Path $envTemplate)) {
    Write-Host "[ERROR] .env.template not found at: $envTemplate" -ForegroundColor Red
    exit 1
}

# Check if .env exists; if not, copy from template and warn
if (-not (Test-Path $envFile)) {
    Copy-Item -Path $envTemplate -Destination $envFile
    Write-Host "[WARN] .env not found. Copied from .env.template. Please fill in your values before continuing." -ForegroundColor Yellow
}

# Load .env into `$env:` variables by splitting on the first '=' only
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -ne "" -and -not $line.StartsWith("#")) {
        $idx = $line.IndexOf("=")
        if ($idx -gt 0) {
            $key = $line.Substring(0, $idx).Trim()
            $value = $line.Substring($idx + 1).Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Required variables to validate
$requiredVars = @(
    "OPENROUTER_API_KEY",
    "FRESHCHAT_API_KEY",
    "FRESHCHAT_DOMAIN",
    "HUBSPOT_API_KEY",
    "APOLLO_API_KEY",
    "STRIPE_API_KEY",
    "GOOGLE_CALENDAR_ID",
    "ALERT_EMAIL",
    "RESEND_API_KEY",
    "CALENDLY_API_KEY"
)

$missingCount = 0

Write-Host ""
Write-Host "CWI AI — Environment Setup Check" -ForegroundColor Cyan
Write-Host "Checking required environment variables..." -ForegroundColor Cyan
Write-Host ""

foreach ($var in $requiredVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var, "Process")
    if ([string]::IsNullOrWhiteSpace($value) -or $value -like "*your_*") {
        Write-Host "  [MISSING] $var" -ForegroundColor Yellow
        $missingCount++
    } else {
        Write-Host "  [OK]      $var" -ForegroundColor Green
    }
}

Write-Host ""
if ($missingCount -eq 0) {
    Write-Host "All required variables are set — ready to run!" -ForegroundColor Green
} else {
    Write-Host "$missingCount variable(s) missing or contain placeholder values. Set the missing vars in .env before proceeding." -ForegroundColor Yellow
}
Write-Host ""

# API Connection Tests
Write-Host "Running API connection tests..." -ForegroundColor Cyan
Write-Host ""

$passCount = 0
$failedServices = @()

# OpenRouter
$openrouterKey = [System.Environment]::GetEnvironmentVariable("OPENROUTER_API_KEY", "Process")
if (-not [string]::IsNullOrWhiteSpace($openrouterKey) -and $openrouterKey -notlike "*your_*") {
    try {
        $resp = Invoke-WebRequest -Uri "https://openrouter.ai/api/v1/models" -Headers @{Authorization = "Bearer $openrouterKey"} -TimeoutSec 5 -ErrorAction Stop
        if ($resp -and $resp.StatusCode -eq 200) {
            Write-Host "  [OK]   OpenRouter" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "  [FAIL] OpenRouter — check key" -ForegroundColor Yellow
            $failedServices += "OpenRouter"
        }
    } catch {
        Write-Host "  [FAIL] OpenRouter — $($_.Exception.Message)" -ForegroundColor Yellow
        $failedServices += "OpenRouter"
    }
} else {
    Write-Host "  [SKIP] OpenRouter — key not set" -ForegroundColor Yellow
    $failedServices += "OpenRouter"
}

# Freshchat
$freshchatKey = [System.Environment]::GetEnvironmentVariable("FRESHCHAT_API_KEY", "Process")
$freshchatDomain = [System.Environment]::GetEnvironmentVariable("FRESHCHAT_DOMAIN", "Process")
if (-not [string]::IsNullOrWhiteSpace($freshchatKey) -and $freshchatKey -notlike "*your_*" -and -not [string]::IsNullOrWhiteSpace($freshchatDomain)) {
    # Normalise domain — FRESHCHAT_DOMAIN may already include the scheme (https://...)
    $fcDomain = $freshchatDomain.TrimEnd('/')
    if ($fcDomain -notmatch '^https?://') { $fcDomain = "https://$fcDomain" }
    try {
        $resp = Invoke-WebRequest -Uri "$fcDomain/v2/agents" -Headers @{Authorization = "Bearer $freshchatKey"} -TimeoutSec 5 -ErrorAction Stop
        if ($resp -and $resp.StatusCode -eq 200) {
            Write-Host "  [OK]   Freshchat" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "  [FAIL] Freshchat — check key" -ForegroundColor Yellow
            $failedServices += "Freshchat"
        }
    } catch {
        Write-Host "  [FAIL] Freshchat — $($_.Exception.Message)" -ForegroundColor Yellow
        $failedServices += "Freshchat"
    }
} else {
    Write-Host "  [SKIP] Freshchat — key or domain not set" -ForegroundColor Yellow
    $failedServices += "Freshchat"
}

# HubSpot
$hubspotKey = [System.Environment]::GetEnvironmentVariable("HUBSPOT_API_KEY", "Process")
if (-not [string]::IsNullOrWhiteSpace($hubspotKey) -and $hubspotKey -notlike "*your_*") {
    try {
        $resp = Invoke-WebRequest -Uri "https://api.hubapi.com/crm/v3/objects/contacts?limit=1" -Headers @{Authorization = "Bearer $hubspotKey"} -TimeoutSec 5 -ErrorAction Stop
        if ($resp -and $resp.StatusCode -eq 200) {
            Write-Host "  [OK]   HubSpot" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "  [FAIL] HubSpot — check key" -ForegroundColor Yellow
            $failedServices += "HubSpot"
        }
    } catch {
        Write-Host "  [FAIL] HubSpot — $($_.Exception.Message)" -ForegroundColor Yellow
        $failedServices += "HubSpot"
    }
} else {
    Write-Host "  [SKIP] HubSpot — key not set" -ForegroundColor Yellow
    $failedServices += "HubSpot"
}

# Stripe
$stripeKey = [System.Environment]::GetEnvironmentVariable("STRIPE_API_KEY", "Process")
if (-not [string]::IsNullOrWhiteSpace($stripeKey) -and $stripeKey -notlike "*your_*") {
    try {
        $resp = Invoke-WebRequest -Uri "https://api.stripe.com/v1/balance" -Headers @{Authorization = "Bearer $stripeKey"} -TimeoutSec 5 -ErrorAction Stop
        if ($resp -and $resp.StatusCode -eq 200) {
            Write-Host "  [OK]   Stripe" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "  [FAIL] Stripe — check key" -ForegroundColor Yellow
            $failedServices += "Stripe"
        }
    } catch {
        Write-Host "  [FAIL] Stripe — $($_.Exception.Message)" -ForegroundColor Yellow
        $failedServices += "Stripe"
    }
} else {
    Write-Host "  [SKIP] Stripe — key not set" -ForegroundColor Yellow
    $failedServices += "Stripe"
}

# Apollo
$apolloKey = [System.Environment]::GetEnvironmentVariable("APOLLO_API_KEY", "Process")
if (-not [string]::IsNullOrWhiteSpace($apolloKey) -and $apolloKey -notlike "*your_*") {
    $apolloBody = (@{ api_key = $apolloKey } | ConvertTo-Json -Compress)
    try {
        $resp = Invoke-WebRequest -Uri "https://api.apollo.io/v1/auth/health" -Method POST `
            -Headers @{'Content-Type' = 'application/json'} -Body $apolloBody -TimeoutSec 5 -ErrorAction Stop
        if ($resp -and $resp.StatusCode -eq 200) {
            Write-Host "  [OK]   Apollo" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "  [FAIL] Apollo — check key" -ForegroundColor Yellow
            $failedServices += "Apollo"
        }
    } catch {
        Write-Host "  [FAIL] Apollo — $($_.Exception.Message)" -ForegroundColor Yellow
        $failedServices += "Apollo"
    }
} else {
    Write-Host "  [SKIP] Apollo — key not set" -ForegroundColor Yellow
    $failedServices += "Apollo"
}

# Calendly
$calendlyKey = [System.Environment]::GetEnvironmentVariable("CALENDLY_API_KEY", "Process")
if (-not [string]::IsNullOrWhiteSpace($calendlyKey) -and $calendlyKey -notlike "*your_*") {
    try {
        $resp = Invoke-WebRequest -Uri "https://api.calendly.com/users/me" `
            -Headers @{Authorization = "Bearer $calendlyKey"; 'Content-Type' = 'application/json'} -TimeoutSec 5 -ErrorAction Stop
        if ($resp -and $resp.StatusCode -eq 200) {
            Write-Host "  [OK]   Calendly" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "  [FAIL] Calendly — check key" -ForegroundColor Yellow
            $failedServices += "Calendly"
        }
    } catch {
        Write-Host "  [FAIL] Calendly — $($_.Exception.Message)" -ForegroundColor Yellow
        $failedServices += "Calendly"
    }
} else {
    Write-Host "  [SKIP] Calendly — key not set" -ForegroundColor Yellow
    $failedServices += "Calendly"
}

# Resend
$resendKey = [System.Environment]::GetEnvironmentVariable("RESEND_API_KEY", "Process")
if (-not [string]::IsNullOrWhiteSpace($resendKey) -and $resendKey -notlike "*your_*") {
    try {
        $resp = Invoke-WebRequest -Uri "https://api.resend.com/domains" `
            -Headers @{Authorization = "Bearer $resendKey"} -TimeoutSec 5 -ErrorAction Stop
        if ($resp -and $resp.StatusCode -eq 200) {
            Write-Host "  [OK]   Resend" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "  [FAIL] Resend — check key" -ForegroundColor Yellow
            $failedServices += "Resend"
        }
    } catch {
        Write-Host "  [FAIL] Resend — $($_.Exception.Message)" -ForegroundColor Yellow
        $failedServices += "Resend"
    }
} else {
    Write-Host "  [SKIP] Resend — key not set" -ForegroundColor Yellow
    $failedServices += "Resend"
}

# Google Calendar
$gcalId = [System.Environment]::GetEnvironmentVariable("GOOGLE_CALENDAR_ID", "Process")
if (-not [string]::IsNullOrWhiteSpace($gcalId) -and $gcalId -notlike "*your_*" -and $gcalId -notlike "*\[calendar-id\]*") {
    # OAuth flow requires a browser — verify API domain reachability only
    try {
        $resp = Invoke-WebRequest -Uri "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest" -TimeoutSec 5 -ErrorAction Stop
    } catch {
        $resp = $null
    }
    if ($resp -and $resp.StatusCode -eq 200) {
        Write-Host "  [SKIP] Google Calendar — googleapis.com reachable; full OAuth token required at runtime" -ForegroundColor Yellow
        Write-Host "         Instructions: run 'gcloud auth application-default login' or configure a service account key." -ForegroundColor DarkGray
    } else {
        Write-Host "  [FAIL] Google Calendar — googleapis.com not reachable" -ForegroundColor Yellow
        $failedServices += "Google Calendar"
    }
} else {
    Write-Host "  [SKIP] Google Calendar — GOOGLE_CALENDAR_ID not set (expected during initial setup)" -ForegroundColor Yellow
    Write-Host "         Instructions: set GOOGLE_CALENDAR_ID in .env, then run 'gcloud auth application-default login'." -ForegroundColor DarkGray
}

Write-Host ""
$totalServices = 8
Write-Host "$passCount/$totalServices API connections verified" -ForegroundColor Cyan

if ($failedServices.Count -gt 0) {
    Write-Host "Failed/skipped: $($failedServices -join ', ')" -ForegroundColor Yellow
}
Write-Host ""
