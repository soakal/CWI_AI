# =============================================================================
# CWI Automation — API Connection Verifier
# =============================================================================
# Hits lightweight endpoints for each integrated service to confirm live
# API connectivity using your configured credentials.
#
# Usage:  .\scripts\verify-connections.ps1
#
# Credential resolution order for each key:
#   1. Environment variable (already exported in shell)
#   2. .env file in the repository root (KEY=value lines)
#
# Output: Colored PASS/FAIL per service + scripts\verify-report.json
# Exit:   0 if all configured services pass, 1 if any configured service fails
# =============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'   # unexpected errors (file writes, etc.) must surface; per-service errors are caught in Invoke-Check

# Resolve repo root (parent of the scripts\ folder)
$RepoRoot = Split-Path -Parent $PSScriptRoot

# =============================================================================
# .env loader — reads KEY=value lines, ignores comments and blanks
# =============================================================================
$envVars = @{}
$envFilePath = Join-Path $RepoRoot '.env'
if (Test-Path $envFilePath) {
    Get-Content $envFilePath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and $line -notmatch '^\s*#') {
            $parts = $line -split '=', 2
            if ($parts.Count -eq 2) {
                $envVars[$parts[0].Trim()] = $parts[1].Trim()
            }
        }
    }
}

# Helper — get a value from env var or .env file
function Get-EnvValue {
    param([string]$Key)
    $val = [System.Environment]::GetEnvironmentVariable($Key)
    if (-not $val -and $envVars.ContainsKey($Key)) { $val = $envVars[$Key] }
    return $val
}

# Helper — determine whether a value is a real credential or a placeholder
function Is-PlaceholderOrEmpty {
    param([string]$val)
    if (-not $val) { return $true }
    # Common placeholder patterns used in .env.template
    if ($val -match '^(xxxx|placeholder|your[-_]|<|CHANGE|FILL|TODO)' -or $val -eq '') { return $true }
    # Placeholder API keys in the template end with xxxx
    if ($val -match 'xxxx$') { return $true }
    return $false
}

# =============================================================================
# Result accumulator
# =============================================================================
$results = @()

# Helper — record a service result
function Add-Result {
    param(
        [string]$Service,
        [string]$Status,    # PASS | FAIL | SKIP
        [string]$Message,
        [int]   $HttpStatus = 0,
        [double]$LatencyMs  = 0
    )
    $script:results += [PSCustomObject]@{
        service    = $Service
        status     = $Status
        message    = $Message
        http_code  = $HttpStatus
        latency_ms = [Math]::Round($LatencyMs, 1)
    }
}

# Helper — fire an HTTP request, return timing + response
function Invoke-Check {
    param(
        [string]$Uri,
        [string]$Method  = 'GET',
        [hashtable]$Headers = @{},
        [string]$Body    = $null,
        [int]   $TimeoutSec = 15
    )
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $params = @{
            Uri            = $Uri
            Method         = $Method
            Headers        = $Headers
            UseBasicParsing = $true
            TimeoutSec     = $TimeoutSec
            ErrorAction    = 'Stop'
        }
        if ($Body) {
            $params['Body']        = $Body
            $params['ContentType'] = 'application/json'
        }
        $resp = Invoke-WebRequest @params
        $sw.Stop()
        return @{ ok = $true; code = [int]$resp.StatusCode; ms = $sw.Elapsed.TotalMilliseconds; body = $resp.Content }
    }
    catch {
        $sw.Stop()
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        return @{ ok = $false; code = $code; ms = $sw.Elapsed.TotalMilliseconds; error = $_.Exception.Message }
    }
}

# =============================================================================
# SERVICE CHECKS
# =============================================================================

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  CWI Automation — API Connection Verifier' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

# ---------------------------------------------------------------------------
# 1. OpenRouter
#    Endpoint: GET /api/v1/models (public, but key validates auth tier)
#    A real key returns 200; wrong key returns 401.
# ---------------------------------------------------------------------------
$orKey = Get-EnvValue 'OPENROUTER_API_KEY'
if (Is-PlaceholderOrEmpty $orKey) {
    Add-Result -Service 'OpenRouter' -Status 'SKIP' -Message 'OPENROUTER_API_KEY not configured'
}
else {
    $r = Invoke-Check -Uri 'https://openrouter.ai/api/v1/models' `
                      -Headers @{ 'Authorization' = "Bearer $orKey" }
    if ($r.ok -and $r.code -eq 200) {
        Add-Result -Service 'OpenRouter' -Status 'PASS' `
            -Message "GET /api/v1/models → $($r.code)" -HttpStatus $r.code -LatencyMs $r.ms
    }
    else {
        $err = if ($r.error) { $r.error } else { "HTTP $($r.code)" }
        Add-Result -Service 'OpenRouter' -Status 'FAIL' `
            -Message "GET /api/v1/models → $err" -HttpStatus $r.code -LatencyMs $r.ms
    }
}

# ---------------------------------------------------------------------------
# 2. Freshchat
#    Endpoint: GET /v2/agents?items_per_page=1 (lightweight agent list)
#    Requires Bearer token.
# ---------------------------------------------------------------------------
$fcKey    = Get-EnvValue 'FRESHCHAT_API_KEY'
$fcDomain = Get-EnvValue 'FRESHCHAT_DOMAIN'
if (-not $fcDomain) { $fcDomain = 'https://api.freshchat.com' }
# Normalise — remove trailing slash
$fcDomain = $fcDomain.TrimEnd('/')

if (Is-PlaceholderOrEmpty $fcKey) {
    Add-Result -Service 'Freshchat' -Status 'SKIP' -Message 'FRESHCHAT_API_KEY not configured'
}
else {
    $r = Invoke-Check -Uri "$fcDomain/v2/agents?items_per_page=1" `
                      -Headers @{
                          'Authorization' = "Bearer $fcKey"
                          'Content-Type'  = 'application/json'
                      }
    if ($r.ok -and $r.code -in @(200, 204)) {
        Add-Result -Service 'Freshchat' -Status 'PASS' `
            -Message "GET /v2/agents → $($r.code)" -HttpStatus $r.code -LatencyMs $r.ms
    }
    else {
        $err = if ($r.error) { $r.error } else { "HTTP $($r.code)" }
        Add-Result -Service 'Freshchat' -Status 'FAIL' `
            -Message "GET /v2/agents → $err" -HttpStatus $r.code -LatencyMs $r.ms
    }
}

# ---------------------------------------------------------------------------
# 3. Apollo.io
#    Endpoint: POST /v1/auth/health (no body needed, key in header)
#    Returns 200 { is_logged_in: true } on valid key.
# ---------------------------------------------------------------------------
$apolloKey = Get-EnvValue 'APOLLO_API_KEY'
if (Is-PlaceholderOrEmpty $apolloKey) {
    Add-Result -Service 'Apollo' -Status 'SKIP' -Message 'APOLLO_API_KEY not configured'
}
else {
    $body = (@{ api_key = $apolloKey } | ConvertTo-Json -Compress)
    $r = Invoke-Check -Uri 'https://api.apollo.io/v1/auth/health' `
                      -Method 'POST' `
                      -Headers @{ 'Content-Type' = 'application/json' } `
                      -Body $body
    if ($r.ok -and $r.code -eq 200) {
        Add-Result -Service 'Apollo' -Status 'PASS' `
            -Message "POST /v1/auth/health → $($r.code)" -HttpStatus $r.code -LatencyMs $r.ms
    }
    else {
        $err = if ($r.error) { $r.error } else { "HTTP $($r.code)" }
        Add-Result -Service 'Apollo' -Status 'FAIL' `
            -Message "POST /v1/auth/health → $err" -HttpStatus $r.code -LatencyMs $r.ms
    }
}

# ---------------------------------------------------------------------------
# 4. HubSpot
#    Endpoint: GET /crm/v3/pipelines/deals (lightweight, uses private app token)
# ---------------------------------------------------------------------------
$hsKey = Get-EnvValue 'HUBSPOT_API_KEY'
if (Is-PlaceholderOrEmpty $hsKey) {
    Add-Result -Service 'HubSpot' -Status 'SKIP' -Message 'HUBSPOT_API_KEY not configured'
}
else {
    $r = Invoke-Check -Uri 'https://api.hubapi.com/crm/v3/pipelines/deals' `
                      -Headers @{
                          'Authorization' = "Bearer $hsKey"
                          'Content-Type'  = 'application/json'
                      }
    if ($r.ok -and $r.code -eq 200) {
        Add-Result -Service 'HubSpot' -Status 'PASS' `
            -Message "GET /crm/v3/pipelines/deals → $($r.code)" -HttpStatus $r.code -LatencyMs $r.ms
    }
    else {
        $err = if ($r.error) { $r.error } else { "HTTP $($r.code)" }
        Add-Result -Service 'HubSpot' -Status 'FAIL' `
            -Message "GET /crm/v3/pipelines/deals → $err" -HttpStatus $r.code -LatencyMs $r.ms
    }
}

# ---------------------------------------------------------------------------
# 5. Stripe
#    Endpoint: GET /v1/balance (authenticated, returns 200 on valid key)
# ---------------------------------------------------------------------------
$stripeKey = Get-EnvValue 'STRIPE_API_KEY'
if (Is-PlaceholderOrEmpty $stripeKey) {
    Add-Result -Service 'Stripe' -Status 'SKIP' -Message 'STRIPE_API_KEY not configured'
}
else {
    $r = Invoke-Check -Uri 'https://api.stripe.com/v1/balance' `
                      -Headers @{ 'Authorization' = "Bearer $stripeKey" }
    if ($r.ok -and $r.code -eq 200) {
        Add-Result -Service 'Stripe' -Status 'PASS' `
            -Message "GET /v1/balance → $($r.code)" -HttpStatus $r.code -LatencyMs $r.ms
    }
    else {
        $err = if ($r.error) { $r.error } else { "HTTP $($r.code)" }
        Add-Result -Service 'Stripe' -Status 'FAIL' `
            -Message "GET /v1/balance → $err" -HttpStatus $r.code -LatencyMs $r.ms
    }
}

# ---------------------------------------------------------------------------
# 6. Calendly
#    Endpoint: GET /api/v1/users/me  (requires Personal Access Token)
# ---------------------------------------------------------------------------
$calendlyKey = Get-EnvValue 'CALENDLY_API_KEY'
if (Is-PlaceholderOrEmpty $calendlyKey) {
    Add-Result -Service 'Calendly' -Status 'SKIP' -Message 'CALENDLY_API_KEY not configured'
}
else {
    $r = Invoke-Check -Uri 'https://api.calendly.com/users/me' `
                      -Headers @{
                          'Authorization' = "Bearer $calendlyKey"
                          'Content-Type'  = 'application/json'
                      }
    if ($r.ok -and $r.code -eq 200) {
        Add-Result -Service 'Calendly' -Status 'PASS' `
            -Message "GET /users/me → $($r.code)" -HttpStatus $r.code -LatencyMs $r.ms
    }
    else {
        $err = if ($r.error) { $r.error } else { "HTTP $($r.code)" }
        Add-Result -Service 'Calendly' -Status 'FAIL' `
            -Message "GET /users/me → $err" -HttpStatus $r.code -LatencyMs $r.ms
    }
}

# ---------------------------------------------------------------------------
# 7. Google Calendar (via Google APIs OAuth check)
#    We cannot do a full OAuth token check without a browser, so we verify
#    that the Google Calendar API domain is reachable.
# ---------------------------------------------------------------------------
$gcalId = Get-EnvValue 'GOOGLE_CALENDAR_ID'
if (Is-PlaceholderOrEmpty $gcalId) {
    Add-Result -Service 'Google Calendar' -Status 'SKIP' `
        -Message 'GOOGLE_CALENDAR_ID not configured — skipping reachability check'
}
else {
    $r = Invoke-Check -Uri 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
    if ($r.ok -and $r.code -eq 200) {
        Add-Result -Service 'Google Calendar' -Status 'PASS' `
            -Message "googleapis.com reachable (OAuth token required at runtime)" `
            -HttpStatus $r.code -LatencyMs $r.ms
    }
    else {
        $err = if ($r.error) { $r.error } else { "HTTP $($r.code)" }
        Add-Result -Service 'Google Calendar' -Status 'FAIL' `
            -Message "googleapis.com not reachable: $err" -HttpStatus $r.code -LatencyMs $r.ms
    }
}

# ---------------------------------------------------------------------------
# 8. Resend (email engine)
#    Endpoint: GET /domains (authenticated, returns 200 on valid key)
#    Resend is the canonical email engine — replaces all SMTP/Gmail sending.
# ---------------------------------------------------------------------------
$resendKey = Get-EnvValue 'RESEND_API_KEY'
if (Is-PlaceholderOrEmpty $resendKey) {
    Add-Result -Service 'Resend' -Status 'SKIP' -Message 'RESEND_API_KEY not configured'
}
else {
    Write-Host "Testing Resend..." -NoNewline
    $r = Invoke-Check -Uri 'https://api.resend.com/domains' `
                      -Headers @{ 'Authorization' = "Bearer $resendKey" }
    if ($r.ok -and $r.code -eq 200) {
        Write-Host " PASS" -ForegroundColor Green
        Add-Result -Service 'Resend' -Status 'PASS' `
            -Message "GET /domains → $($r.code)" -HttpStatus $r.code -LatencyMs $r.ms
    }
    else {
        $err = if ($r.error) { $r.error } else { "HTTP $($r.code)" }
        Write-Host " FAIL - $err" -ForegroundColor Red
        Add-Result -Service 'Resend' -Status 'FAIL' `
            -Message "GET /domains → $err" -HttpStatus $r.code -LatencyMs $r.ms
    }
}

# =============================================================================
# Console summary
# =============================================================================
$passCount = @($results | Where-Object { $_.status -eq 'PASS' }).Count
$failCount = @($results | Where-Object { $_.status -eq 'FAIL' }).Count
$skipCount = @($results | Where-Object { $_.status -eq 'SKIP' }).Count

foreach ($r in $results) {
    switch ($r.status) {
        'PASS' { $color = 'Green';  $icon = '[PASS]' }
        'FAIL' { $color = 'Red';    $icon = '[FAIL]' }
        'SKIP' { $color = 'Yellow'; $icon = '[SKIP]' }
    }
    $latency = if ($r.latency_ms -gt 0) { "  ($([Math]::Round($r.latency_ms))ms)" } else { '' }
    Write-Host "$icon  $($r.service)$latency" -ForegroundColor $color
    Write-Host "       $($r.message)" -ForegroundColor DarkGray
}

Write-Host ''
Write-Host '------------------------------------------------------------' -ForegroundColor Cyan
Write-Host "  Results: $passCount passed  |  $failCount failed  |  $skipCount skipped" -ForegroundColor $(
    if ($failCount -eq 0) { 'Green' } else { 'Red' }
)
Write-Host '------------------------------------------------------------' -ForegroundColor Cyan
Write-Host ''

# =============================================================================
# Export JSON report
# =============================================================================
$reportPath = Join-Path $PSScriptRoot 'verify-report.json'
$report = [PSCustomObject]@{
    generated = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
    env_file  = if (Test-Path $envFilePath) { $envFilePath } else { 'not found' }
    summary   = [PSCustomObject]@{
        total   = $results.Count
        passed  = $passCount
        failed  = $failCount
        skipped = $skipCount
    }
    services  = $results
}
$report | ConvertTo-Json -Depth 5 | Set-Content $reportPath -Encoding UTF8
Write-Host "Report written to: $reportPath" -ForegroundColor Cyan
Write-Host ''

# =============================================================================
# Exit code — only count configured (non-skipped) services in pass/fail
# =============================================================================
if ($failCount -gt 0) { exit 1 } else { exit 0 }
