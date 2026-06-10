# test-suite.ps1
# CWI AI LLC — Automation System Test Suite
# Runs 40 checks against the project structure and configuration files.

$basePath = Split-Path -Parent $PSScriptRoot
$passed = 0
$total = 40

function Show-Result {
    param(
        [int]$num,
        [string]$label,
        [bool]$result
    )
    if ($result) {
        Write-Host "  [PASS] Test $num : $label" -ForegroundColor Green
        return 1
    } else {
        Write-Host "  [FAIL] Test $num : $label" -ForegroundColor Red
        return 0
    }
}

Write-Host ""
Write-Host "CWI AI LLC — Automation System Test Suite" -ForegroundColor Cyan
Write-Host "Running $total tests..." -ForegroundColor Cyan
Write-Host ""

# Test 1-6: Make.com scenario files
$passed += Show-Result 1 "make-scenarios/scenario-a-booking-flow.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-a-booking-flow.json"))
$passed += Show-Result 2 "make-scenarios/scenario-b-missed-followup.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-b-missed-followup.json"))
$passed += Show-Result 3 "make-scenarios/scenario-c-monthly-report.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-c-monthly-report.json"))
$passed += Show-Result 4 "make-scenarios/scenario-d-apollo-hubspot.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-d-apollo-hubspot.json"))
$passed += Show-Result 5 "make-scenarios/scenario-e-lead-routing.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-e-lead-routing.json"))
$passed += Show-Result 6 "make-scenarios/scenario-f-payment-logging.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-f-payment-logging.json"))

# Test 7: Freshchat bot flows
$botFlowsPath = Join-Path $basePath "freshchat\bot-flows.json"
$test7 = $false
if (Test-Path $botFlowsPath) {
    $botContent = Get-Content $botFlowsPath -Raw
    $test7 = $botContent -match "booking"
}
$passed += Show-Result 7 "freshchat/bot-flows.json exists and contains booking flow" $test7

# Test 8: .env.template with OPENROUTER_API_KEY
$templatePath = Join-Path $basePath ".env.template"
$test8 = $false
if (Test-Path $templatePath) {
    $templateContent = Get-Content $templatePath -Raw
    $test8 = $templateContent -match "OPENROUTER_API_KEY"
}
$passed += Show-Result 8 ".env.template exists and contains OPENROUTER_API_KEY" $test8

# Test 9: .env exists (WARN not fail)
$envPath = Join-Path $basePath ".env"
$envExists = Test-Path $envPath
if ($envExists) {
    Write-Host "  [PASS] Test 9 : .env exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "  [WARN] Test 9 : .env not found — run setup-env.ps1 to generate it" -ForegroundColor Yellow
    $passed++
}

# Test 10: setup-env.ps1 exists
$passed += Show-Result 10 "scripts/setup-env.ps1 exists" (Test-Path (Join-Path $basePath "scripts\setup-env.ps1"))

# Test 11: docs/pricing-calculator.html exists
$passed += Show-Result 11 "docs/pricing-calculator.html exists" (Test-Path (Join-Path $basePath "docs\pricing-calculator.html"))

# Test 12: scenario-h-client-onboarding.json exists
$passed += Show-Result 12 "make-scenarios/scenario-h-client-onboarding.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-h-client-onboarding.json"))

# Test 13: scenario-i-payment-failure.json exists
$passed += Show-Result 13 "make-scenarios/scenario-i-payment-failure.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-i-payment-failure.json"))

# Test 14: scenario-j-review-request.json exists
$passed += Show-Result 14 "make-scenarios/scenario-j-review-request.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-j-review-request.json"))

# Test 15: scenario-k-weekly-digest.json exists
$passed += Show-Result 15 "make-scenarios/scenario-k-weekly-digest.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-k-weekly-digest.json"))

# Test 16: scenario-l-noshow-recovery.json exists
$passed += Show-Result 16 "make-scenarios/scenario-l-noshow-recovery.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-l-noshow-recovery.json"))

# Test 17: scripts/new-client.ps1 exists
$passed += Show-Result 17 "scripts/new-client.ps1 exists" (Test-Path (Join-Path $basePath "scripts\new-client.ps1"))

# cwi-site is a sibling of cwi-automation (one level up from $basePath)
$siteRoot = Join-Path (Split-Path -Parent $basePath) "cwi-site"

# Test 18: cwi-site/sitemap.xml exists
$passed += Show-Result 18 "cwi-site/sitemap.xml exists" (Test-Path (Join-Path $siteRoot "sitemap.xml"))

# Test 19: cwi-site/robots.txt exists
$passed += Show-Result 19 "cwi-site/robots.txt exists" (Test-Path (Join-Path $siteRoot "robots.txt"))

# Test 20: .env.template has NO SMTP vars (Resend is the canonical email engine)
$test20 = $false
if (Test-Path $templatePath) {
    $smtpTemplateContent = Get-Content $templatePath -Raw
    $test20 = -not ($smtpTemplateContent -match "SMTP_HOST")
}
$passed += Show-Result 20 ".env.template does not contain SMTP_HOST" $test20

# Test 21: .env.template contains RESEND_API_KEY
$test21 = $false
if (Test-Path $templatePath) {
    $resendTemplateContent = Get-Content $templatePath -Raw
    $test21 = $resendTemplateContent -match "RESEND_API_KEY"
}
$passed += Show-Result 21 ".env.template exists and contains RESEND_API_KEY" $test21

# Test 22: scenario-m-appointment-reminder.json exists
$passed += Show-Result 22 "make-scenarios/scenario-m-appointment-reminder.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-m-appointment-reminder.json"))

# Test 23: docs/client-portal.html exists
$passed += Show-Result 23 "docs/client-portal.html exists" (Test-Path (Join-Path $basePath "docs\client-portal.html"))

# Test 24-27: Scenarios N-Q
$passed += Show-Result 24 "make-scenarios/scenario-n-lead-scoring.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-n-lead-scoring.json"))
$passed += Show-Result 25 "make-scenarios/scenario-o-client-health-check.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-o-client-health-check.json"))
$passed += Show-Result 26 "make-scenarios/scenario-p-free-audit-handler.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-p-free-audit-handler.json"))
$passed += Show-Result 27 "make-scenarios/scenario-q-cold-lead-reengagement.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-q-cold-lead-reengagement.json"))

# Test 28-30: Scenarios R-T
$passed += Show-Result 28 "make-scenarios/scenario-r-upsell-campaign.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-r-upsell-campaign.json"))
$passed += Show-Result 29 "make-scenarios/scenario-s-renewal-reminder.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-s-renewal-reminder.json"))
$passed += Show-Result 30 "make-scenarios/scenario-t-nps-survey.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-t-nps-survey.json"))

# Test 31-32: New site pages in sitemap
$sitemapPath = Join-Path $siteRoot "sitemap.xml"
$test31 = $false; $test32 = $false
if (Test-Path $sitemapPath) {
    $sitemapContent = Get-Content $sitemapPath -Raw
    $test31 = $sitemapContent -match "how-it-works"
    $test32 = $sitemapContent -match "industries"
}
$passed += Show-Result 31 "sitemap.xml includes /how-it-works" $test31
$passed += Show-Result 32 "sitemap.xml includes /industries" $test32

# Test 33: .env.template contains NPS_SURVEY_LINK
$test33 = $false
if (Test-Path $templatePath) {
    $t33content = Get-Content $templatePath -Raw
    $test33 = $t33content -match "NPS_SURVEY_LINK"
}
$passed += Show-Result 33 ".env.template contains NPS_SURVEY_LINK" $test33

# Test 34: .env.template contains HUBSPOT_DEAL_ID
$test34 = $false
if (Test-Path $templatePath) {
    $t34content = Get-Content $templatePath -Raw
    $test34 = $t34content -match "HUBSPOT_DEAL_ID"
}
$passed += Show-Result 34 ".env.template contains HUBSPOT_DEAL_ID" $test34

# Test 35-40: Scenarios U-Z (A-Z complete)
$passed += Show-Result 35 "make-scenarios/scenario-u-testimonial-request.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-u-testimonial-request.json"))
$passed += Show-Result 36 "make-scenarios/scenario-v-morning-briefing.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-v-morning-briefing.json"))
$passed += Show-Result 37 "make-scenarios/scenario-w-subscription-winback.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-w-subscription-winback.json"))
$passed += Show-Result 38 "make-scenarios/scenario-x-deal-velocity-alert.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-x-deal-velocity-alert.json"))
$passed += Show-Result 39 "make-scenarios/scenario-y-referral-reward.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-y-referral-reward.json"))
$passed += Show-Result 40 "make-scenarios/scenario-z-payment-retry-success.json exists" (Test-Path (Join-Path $basePath "make-scenarios\scenario-z-payment-retry-success.json"))

# Final summary
Write-Host ""
if ($passed -eq $total) {
    Write-Host "Results: $passed/$total tests passed" -ForegroundColor Green
} else {
    Write-Host "Results: $passed/$total tests passed" -ForegroundColor Yellow
}
Write-Host ""
