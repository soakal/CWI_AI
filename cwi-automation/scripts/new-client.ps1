<#
.SYNOPSIS
    CWI AI — New Client Provisioning Script.

.DESCRIPTION
    Provisions a new client under cwi-automation\clients\{slug}\:
      - Validates required parameters
      - Creates the client folder
      - Copies .env.template -> clients\{slug}\.env and pre-fills client values
      - Prints DNS / Make.com / HubSpot / Next Steps instructions
      - Writes a per-client README.md with a setup checklist
      - Appends a timestamped line to clients\clients-log.txt

    Canonical values:
      Timezone:        America/New_York
      AI Model:        anthropic/claude-sonnet-4-6
      Email engine:    Resend (api.resend.com/emails)
      Owner email:     brian@cwiai.net
      Owner phone:     (734) 812-9971
      Business hours:  9 AM-6 PM ET, Monday-Friday

.EXAMPLE
    .\new-client.ps1 -ClientName "Joes Plumbing" -Domain "joesplumbing.com" `
        -OwnerEmail "joe@joesplumbing.com" -OwnerPhone "(313) 555-0100" -Tier "Growth"

.NOTES
    Secret references always use env.VARIABLE_NAME format.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ClientName,

    [Parameter(Mandatory = $true)]
    [string]$Domain,

    [Parameter(Mandatory = $true)]
    [string]$OwnerEmail,

    [Parameter(Mandatory = $true)]
    [string]$OwnerPhone,

    [Parameter(Mandatory = $true)]
    [ValidateSet('Starter', 'Growth', 'Pro')]
    [string]$Tier,

    [Parameter(Mandatory = $false)]
    [double]$MonthlyFee
)

$ErrorActionPreference = 'Stop'

# ── Canonical pricing table ───────────────────────────────────────────────────
$TierPricing = @{
    'Starter' = @{ Monthly = 197; Annual = 164; Setup = 499; Label = 'Starter' }
    'Growth'  = @{ Monthly = 397; Annual = 331; Setup = 499; Label = 'Growth (Most Popular)' }
    'Pro'     = @{ Monthly = 597; Annual = 497; Setup = 749; Label = 'Pro' }
}

# ── Paths (canonical) ─────────────────────────────────────────────────────────
# Derive root from this script's location (scripts\ is one level below the repo root).
$AutomationRoot = Split-Path -Parent $PSScriptRoot
$ClientsRoot    = Join-Path $AutomationRoot 'clients'
$EnvTemplate    = Join-Path $AutomationRoot '.env.template'
$ClientsLog     = Join-Path $ClientsRoot 'clients-log.txt'

# ── Helpers ───────────────────────────────────────────────────────────────────
function Write-Step { param([string]$Message) Write-Host $Message -ForegroundColor Green }
function Write-Head { param([string]$Message) Write-Host "`n$Message" -ForegroundColor Cyan }
function Write-Info { param([string]$Message) Write-Host $Message -ForegroundColor White }
function Write-Note { param([string]$Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Fail { param([string]$Message) Write-Host $Message -ForegroundColor Red }

# Build a filesystem-safe slug from the client name.
function Get-Slug {
    param([string]$Name)
    $s = $Name.ToLowerInvariant().Trim()
    $s = $s -replace "[']", ''          # drop apostrophes (Joe's -> joes)
    $s = $s -replace '[^a-z0-9]+', '-'  # non-alphanumerics -> hyphen
    $s = $s -replace '-+', '-'          # collapse repeats
    $s = $s.Trim('-')                   # trim leading/trailing hyphens
    return $s
}

# ── 1. Validate required parameters ───────────────────────────────────────────
Write-Head '=== VALIDATING PARAMETERS ==='

$validationErrors = @()

if ([string]::IsNullOrWhiteSpace($ClientName)) { $validationErrors += 'ClientName is required.' }
if ([string]::IsNullOrWhiteSpace($Domain))     { $validationErrors += 'Domain is required.' }
if ([string]::IsNullOrWhiteSpace($OwnerEmail))  { $validationErrors += 'OwnerEmail is required.' }
if ([string]::IsNullOrWhiteSpace($OwnerPhone))  { $validationErrors += 'OwnerPhone is required.' }
if ([string]::IsNullOrWhiteSpace($Tier))       { $validationErrors += 'Tier is required.' }

# Domain sanity check (basic): something.tld, no scheme, no spaces.
if (-not [string]::IsNullOrWhiteSpace($Domain)) {
    $cleanDomain = $Domain.Trim().ToLowerInvariant() -replace '^https?://', '' -replace '/.*$', ''
    if ($cleanDomain -notmatch '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$') {
        $validationErrors += "Domain '$Domain' does not look like a valid domain (expected e.g. joesplumbing.com)."
    }
    $Domain = $cleanDomain
}

# Email sanity check (basic).
if (-not [string]::IsNullOrWhiteSpace($OwnerEmail)) {
    if ($OwnerEmail -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
        $validationErrors += "OwnerEmail '$OwnerEmail' is not a valid email address."
    }
}

if (-not (Test-Path -LiteralPath $EnvTemplate)) {
    $validationErrors += ".env.template not found at: $EnvTemplate"
}

if ($validationErrors.Count -gt 0) {
    Write-Fail 'Validation failed:'
    foreach ($e in $validationErrors) { Write-Fail "  - $e" }
    exit 1
}

# Resolve fee: default from tier unless explicitly provided.
$pricing = $TierPricing[$Tier]
if (-not $PSBoundParameters.ContainsKey('MonthlyFee')) {
    $MonthlyFee = [double]$pricing.Monthly
}
$AnnualFee = $pricing.Annual
$SetupFee  = $pricing.Setup
$TierLabel = $pricing.Label

$slug      = Get-Slug -Name $ClientName
$clientDir = Join-Path $ClientsRoot $slug
$envPath   = Join-Path $clientDir '.env'
$readme    = Join-Path $clientDir 'README.md'

# Canonical, client-derived values.
$FromAddress = "info@$Domain"
$FromName    = $ClientName
$ReplyTo     = $OwnerEmail

Write-Step "OK  Parameters valid"
Write-Info "    Client : $ClientName  (slug: $slug)"
Write-Info "    Domain : $Domain"
Write-Info "    Owner  : $OwnerEmail  /  $OwnerPhone"
Write-Info "    Tier   : $Tier  -  `$$MonthlyFee/mo (annual `$$AnnualFee, setup `$$SetupFee)"

# ── 2. Create client folder ───────────────────────────────────────────────────
if (-not (Test-Path -LiteralPath $ClientsRoot)) {
    New-Item -ItemType Directory -Path $ClientsRoot -Force | Out-Null
}

if (Test-Path -LiteralPath $clientDir) {
    Write-Note "!  Folder already exists: $clientDir"
    Write-Note "   Existing files will be overwritten where this script writes them."
} else {
    New-Item -ItemType Directory -Path $clientDir -Force | Out-Null
}
Write-Step "OK  Folder created: $clientDir"

# ── 3 & 4. Copy template and pre-fill values ──────────────────────────────────
$envLines = Get-Content -LiteralPath $EnvTemplate

# Replace KEY=... lines in place; track which keys we updated.
$updates = [ordered]@{
    'RESEND_FROM_ADDRESS' = $FromAddress
    'RESEND_FROM_NAME'    = $FromName
    'RESEND_REPLY_TO'     = $ReplyTo
    'CLIENT_NAME'         = $ClientName
    'CLIENT_PHONE'        = $OwnerPhone
}

# Track keys still needing to be appended (not present in template).
$appendKeys = [ordered]@{
    'CLIENT_DOMAIN'      = $Domain
    'CLIENT_TIER'        = $Tier
    'CLIENT_MONTHLY_FEE' = $MonthlyFee
}

$seen = @{}
$out = foreach ($line in $envLines) {
    $matched = $false
    foreach ($key in $updates.Keys) {
        if ($line -match "^\s*$([regex]::Escape($key))\s*=") {
            $seen[$key] = $true
            $matched = $true
            "$key=$($updates[$key])"
            break
        }
    }
    if (-not $matched) {
        # If an append-key already exists in the template, update it instead of appending later.
        foreach ($key in @($appendKeys.Keys)) {
            if ($line -match "^\s*$([regex]::Escape($key))\s*=") {
                $matched = $true
                "$key=$($appendKeys[$key])"
                $appendKeys.Remove($key)
                break
            }
        }
    }
    if (-not $matched) { $line }
}

# Append any update keys that were not present in the template at all.
$missingUpdates = $updates.Keys | Where-Object { -not $seen[$_] }
if ($missingUpdates -or $appendKeys.Count -gt 0) {
    $out += ''
    $out += '# ── CLIENT PROVISIONING (added by new-client.ps1) ─────────────────────────────'
    foreach ($key in $missingUpdates) { $out += "$key=$($updates[$key])" }
    foreach ($key in $appendKeys.Keys) { $out += "$key=$($appendKeys[$key])" }
}

Set-Content -LiteralPath $envPath -Value $out -Encoding UTF8
Write-Step "OK  .env file created: $envPath"

# ── 5. Console output: instructions ───────────────────────────────────────────
Write-Head "=== RESEND DNS RECORDS TO ADD FOR $Domain ==="
Write-Info  "Add these 3 records at your DNS host (Cloudflare/Namecheap):"
Write-Info  "  (1) TXT  resend._domainkey.$Domain  [Get exact value from Resend dashboard after adding domain]"
Write-Info  "  (2) TXT  send.$Domain  v=spf1 include:amazonses.com ~all"
Write-Info  "  (3) MX   send.$Domain  feedback-smtp.us-east-1.amazonses.com (priority 10)"
Write-Note  "  Optional: TXT  _dmarc.$Domain  v=DMARC1; p=none; rua=mailto:brian@cwiai.net"

Write-Head "=== MAKE.COM SETUP ==="
Write-Info  "Update these env vars in Make.com for this client:"
Write-Info  "  RESEND_FROM_ADDRESS = $FromAddress"
Write-Info  "  RESEND_FROM_NAME    = $FromName"
Write-Info  "  RESEND_REPLY_TO     = $ReplyTo"
Write-Info  "  CLIENT_NAME         = $ClientName"

Write-Head "=== HUBSPOT SETUP ==="
Write-Info  "  1. Create company: $ClientName"
Write-Info  "  2. Set domain: $Domain"
Write-Info  "  3. Create deal: $ClientName - $Tier - `$$MonthlyFee/mo"
Write-Info  "  4. Move deal to Active Client stage"

Write-Head "=== NEXT STEPS ==="
Write-Info  "  1. Add domain $Domain in Resend -> copy DNS records above"
Write-Info  "  2. Wait for Resend to verify (green status) before going live"
Write-Info  "  3. Import Make.com scenarios with updated env vars"
Write-Info  "  4. Configure Freshchat bot for this client"
Write-Info  "  5. Send welcome email from Resend test"

# ── 6. Per-client README.md ───────────────────────────────────────────────────
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$readmeContent = @"
# $ClientName — CWI AI Client

**Provisioned:** $timestamp (America/New_York)
**Slug:** ``$slug``

## Client Details

| Field            | Value |
|------------------|-------|
| Business name    | $ClientName |
| Domain           | $Domain |
| Owner email      | $OwnerEmail |
| Owner phone      | $OwnerPhone |
| Tier             | $TierLabel |
| Monthly fee      | `$$MonthlyFee/mo |
| Annual fee       | `$$AnnualFee/mo (billed annually) |
| Setup fee        | `$$SetupFee one-time |
| Timezone         | America/New_York |
| Business hours   | 9 AM-6 PM ET, Monday-Friday |
| AI model         | anthropic/claude-sonnet-4-6 |
| Email engine     | Resend (api.resend.com/emails) |

## Email Configuration (in ``.env``)

| Variable               | Value |
|------------------------|-------|
| RESEND_FROM_ADDRESS    | $FromAddress |
| RESEND_FROM_NAME       | $FromName |
| RESEND_REPLY_TO        | $ReplyTo |
| CWI_ALERT_FROM_ADDRESS | ``env.CWI_ALERT_FROM_ADDRESS`` (internal alerts) |

> Client-facing mail FROM is ``env.RESEND_FROM_ADDRESS``. Never send client-facing mail from brian@cwiai.net.
> All secret references use the ``env.VARIABLE_NAME`` format.

## Resend DNS Records for $Domain

Add at your DNS host (Cloudflare/Namecheap), then verify (green) in Resend before going live:

- [ ] **TXT** ``resend._domainkey.$Domain`` — *(get exact value from Resend dashboard after adding domain)*
- [ ] **TXT** ``send.$Domain`` — ``v=spf1 include:amazonses.com ~all``
- [ ] **MX**  ``send.$Domain`` — ``feedback-smtp.us-east-1.amazonses.com`` (priority 10)
- [ ] *(Optional)* **TXT** ``_dmarc.$Domain`` — ``v=DMARC1; p=none; rua=mailto:brian@cwiai.net``

## Setup Status

### Resend
- [ ] Domain $Domain added in Resend
- [ ] DNS records added at host
- [ ] Domain verified (green status)
- [ ] Test email sent successfully

### Make.com
- [ ] ``RESEND_FROM_ADDRESS = $FromAddress``
- [ ] ``RESEND_FROM_NAME = $FromName``
- [ ] ``RESEND_REPLY_TO = $ReplyTo``
- [ ] ``CLIENT_NAME = $ClientName``
- [ ] Scenarios imported with updated env vars

### HubSpot
- [ ] Company created: $ClientName
- [ ] Domain set: $Domain
- [ ] Deal created: $ClientName - $Tier - `$$MonthlyFee/mo
- [ ] Deal moved to Active Client stage

### Freshchat
- [ ] Bot configured for this client

### Go-Live
- [ ] Welcome email sent
- [ ] Client confirmed live

## Owner / Escalation Contact (CWI AI)

- **Owner email:** brian@cwiai.net
- **Owner phone:** (734) 812-9971
"@

Set-Content -LiteralPath $readme -Value $readmeContent -Encoding UTF8
Write-Step "OK  README.md created: $readme"

# ── 7. Append to clients-log.txt ──────────────────────────────────────────────
$logLine = "$timestamp | PROVISIONED | $ClientName | slug=$slug | domain=$Domain | tier=$Tier | fee=`$$MonthlyFee/mo"
Add-Content -LiteralPath $ClientsLog -Value $logLine -Encoding UTF8
Write-Step "OK  Logged to: $ClientsLog"

Write-Host ''
Write-Step "Client '$ClientName' provisioned successfully."
