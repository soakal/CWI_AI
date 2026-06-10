# ============================================================
# cwi-tray.ps1 — CWI Control Center (System Tray App)
# Requires STA mode — launch via Start-CWI.vbs (no console window)
# or:  powershell -STA -File cwi-tray.ps1
# ============================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ── Paths ────────────────────────────────────────────────────
$SCRIPT_DIR = $PSScriptRoot
$AUTO_DIR   = Split-Path $SCRIPT_DIR -Parent      # cwi-automation/
$ROOT       = Split-Path $AUTO_DIR   -Parent      # project root
$SITE_DIR   = Join-Path $ROOT 'cwi-site'
$SITE_PORT  = 8000
$SITE_URL   = "http://localhost:$SITE_PORT"
$LOG_FILE   = Join-Path $SCRIPT_DIR 'cwi-tray.log'

function Write-TrayLog { param($msg)
    "[$([datetime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] $msg" | Add-Content $LOG_FILE -Encoding UTF8
}

# ── CWI waveform icon (4 orange bars on dark background) ─────
function New-CWIIcon {
    $bmp = New-Object System.Drawing.Bitmap(16, 16)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(10, 10, 12))   # #0A0A0C

    $bars = @(
        @{ x=1;  h=6;  a=255 },   # short  — full orange
        @{ x=5;  h=11; a=217 },   # medium — slightly dimmer
        @{ x=9;  h=14; a=179 },   # tall   — center, slightly dimmer
        @{ x=13; h=11; a=140 }    # medium — dimmest (matches SVG opacities)
    )
    foreach ($bar in $bars) {
        $c = [System.Drawing.Color]::FromArgb($bar.a, 255, 90, 31)
        $b = New-Object System.Drawing.SolidBrush($c)
        $g.FillRectangle($b, $bar.x, (15 - $bar.h), 3, $bar.h)
        $b.Dispose()
    }
    $g.Dispose()
    return [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
}

# ── State ────────────────────────────────────────────────────
$script:siteProc = $null
$script:appCtx   = $null

function Get-SiteRunning {
    return ($script:siteProc -and -not $script:siteProc.HasExited)
}

function Start-SiteServer {
    $py = (Get-Command python -ErrorAction SilentlyContinue) ??
          (Get-Command python3 -ErrorAction SilentlyContinue)
    if (-not $py) {
        $tray.ShowBalloonTip(5000, 'CWI — Error',
            'Python not found. Install Python to enable site preview.',
            [System.Windows.Forms.ToolTipIcon]::Error)
        return $false
    }
    $psi                  = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName         = $py.Source
    $psi.Arguments        = "-m http.server $SITE_PORT"
    $psi.WorkingDirectory = $SITE_DIR
    $psi.UseShellExecute  = $false
    $psi.CreateNoWindow   = $true
    $script:siteProc      = [System.Diagnostics.Process]::Start($psi)
    Write-TrayLog "Site preview started (PID $($script:siteProc.Id))"
    return $true
}

function Stop-SiteServer {
    if (Get-SiteRunning) {
        $script:siteProc.Kill()
        $script:siteProc.WaitForExit(2000) | Out-Null
        Write-TrayLog 'Site preview stopped'
    }
    $script:siteProc = $null
}

# ── NotifyIcon ───────────────────────────────────────────────
$tray          = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon     = New-CWIIcon
$tray.Text     = 'CWI Control Center'
$tray.Visible  = $true

# ── Context menu ─────────────────────────────────────────────
$menu = New-Object System.Windows.Forms.ContextMenuStrip

# Section header helper
function Add-Section { param($text)
    $lbl          = New-Object System.Windows.Forms.ToolStripMenuItem($text)
    $lbl.Enabled  = $false
    $lbl.ForeColor = [System.Drawing.Color]::FromArgb(255, 90, 31)
    $lbl.Font      = New-Object System.Drawing.Font('Segoe UI', 8,
                         [System.Drawing.FontStyle]::Bold)
    $menu.Items.Add($lbl) | Out-Null
}

# ── SITE PREVIEW ─────────────────────────────────────────────
Add-Section '  SITE PREVIEW'
$miStart   = New-Object System.Windows.Forms.ToolStripMenuItem('Start  (localhost:8000)')
$miStop    = New-Object System.Windows.Forms.ToolStripMenuItem('Stop')
$miRestart = New-Object System.Windows.Forms.ToolStripMenuItem('Restart')
$miOpenBr  = New-Object System.Windows.Forms.ToolStripMenuItem('Open in Browser')
foreach ($mi in $miStart,$miStop,$miRestart,$miOpenBr) { $menu.Items.Add($mi) | Out-Null }
$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

# ── AUTOMATION ───────────────────────────────────────────────
Add-Section '  AUTOMATION'
$miTests   = New-Object System.Windows.Forms.ToolStripMenuItem('Run Test Suite')
$miVerify  = New-Object System.Windows.Forms.ToolStripMenuItem('Verify Connections')
$miClient  = New-Object System.Windows.Forms.ToolStripMenuItem('New Client Setup')
$miLogs    = New-Object System.Windows.Forms.ToolStripMenuItem('View Logs')
foreach ($mi in $miTests,$miVerify,$miClient,$miLogs) { $menu.Items.Add($mi) | Out-Null }
$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

# ── EXIT ─────────────────────────────────────────────────────
$miExit = New-Object System.Windows.Forms.ToolStripMenuItem('Exit CWI Control Center')
$menu.Items.Add($miExit) | Out-Null

$tray.ContextMenuStrip = $menu

# ── Click handlers ───────────────────────────────────────────
$miStart.Add_Click({
    if (Get-SiteRunning) {
        $tray.ShowBalloonTip(3000, 'CWI', 'Site preview already running at localhost:8000',
            [System.Windows.Forms.ToolTipIcon]::Info); return
    }
    if (Start-SiteServer) {
        $tray.Text = 'CWI — Site Live  ●'
        $tray.ShowBalloonTip(3000, 'CWI Site Preview',
            "Running at $SITE_URL", [System.Windows.Forms.ToolTipIcon]::Info)
    }
})

$miStop.Add_Click({
    if (-not (Get-SiteRunning)) {
        $tray.ShowBalloonTip(2000, 'CWI', 'Site preview is not running',
            [System.Windows.Forms.ToolTipIcon]::Info); return
    }
    Stop-SiteServer
    $tray.Text = 'CWI Control Center'
    $tray.ShowBalloonTip(2000, 'CWI', 'Site preview stopped',
        [System.Windows.Forms.ToolTipIcon]::Info)
})

$miRestart.Add_Click({
    Stop-SiteServer
    Start-Sleep -Milliseconds 600
    if (Start-SiteServer) {
        $tray.Text = 'CWI — Site Live  ●'
        $tray.ShowBalloonTip(3000, 'CWI Site Preview',
            "Restarted at $SITE_URL", [System.Windows.Forms.ToolTipIcon]::Info)
    }
})

$miOpenBr.Add_Click({
    if (-not (Get-SiteRunning)) {
        if (Start-SiteServer) { $tray.Text = 'CWI — Site Live  ●'; Start-Sleep -Milliseconds 900 }
        else { return }
    }
    Start-Process $SITE_URL
})

$miTests.Add_Click({
    $f = Join-Path $SCRIPT_DIR 'test-suite.ps1'
    if (Test-Path $f) {
        Start-Process powershell -ArgumentList "-STA -NoExit -File `"$f`"" -WorkingDirectory $SCRIPT_DIR
        Write-TrayLog 'Launched test-suite.ps1'
    } else {
        $tray.ShowBalloonTip(3000, 'CWI', 'test-suite.ps1 not found',
            [System.Windows.Forms.ToolTipIcon]::Warning)
    }
})

$miVerify.Add_Click({
    $f = Join-Path $SCRIPT_DIR 'verify-connections.ps1'
    if (Test-Path $f) {
        Start-Process powershell -ArgumentList "-STA -NoExit -File `"$f`"" -WorkingDirectory $SCRIPT_DIR
        Write-TrayLog 'Launched verify-connections.ps1'
    } else {
        $tray.ShowBalloonTip(3000, 'CWI', 'verify-connections.ps1 not found',
            [System.Windows.Forms.ToolTipIcon]::Warning)
    }
})

$miClient.Add_Click({
    $f = Join-Path $SCRIPT_DIR 'new-client.ps1'
    if (Test-Path $f) {
        Start-Process powershell -ArgumentList "-STA -NoExit -File `"$f`"" -WorkingDirectory $SCRIPT_DIR
        Write-TrayLog 'Launched new-client.ps1'
    } else {
        $tray.ShowBalloonTip(3000, 'CWI', 'new-client.ps1 not found',
            [System.Windows.Forms.ToolTipIcon]::Warning)
    }
})

$miLogs.Add_Click({
    if (Test-Path $LOG_FILE) { Start-Process notepad $LOG_FILE }
    else { $tray.ShowBalloonTip(2000, 'CWI', 'No log file yet',
        [System.Windows.Forms.ToolTipIcon]::Info) }
})

$miExit.Add_Click({
    Stop-SiteServer
    $tray.Visible = $false
    $tray.Dispose()
    Write-TrayLog 'CWI Control Center exited'
    $script:appCtx.ExitThread()
})

# Double-click → open browser (auto-start if needed)
$tray.Add_DoubleClick({
    if (-not (Get-SiteRunning)) {
        if (Start-SiteServer) { $tray.Text = 'CWI — Site Live  ●'; Start-Sleep -Milliseconds 900 }
        else { return }
    }
    Start-Process $SITE_URL
})

# ── Start ────────────────────────────────────────────────────
Write-TrayLog 'CWI Control Center started'
$tray.ShowBalloonTip(3000, 'CWI Control Center', 'Running — right-click for options',
    [System.Windows.Forms.ToolTipIcon]::None)

$script:appCtx = New-Object System.Windows.Forms.ApplicationContext
[System.Windows.Forms.Application]::Run($script:appCtx)
