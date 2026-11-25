$ErrorActionPreference = 'SilentlyContinue'

$proj    = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe     = Join-Path $proj 'cloudflared.exe'
$log     = Join-Path $proj 'public-link.log'
$errlog  = Join-Path $proj 'public-link.err'
$desktop = Split-Path -Parent $proj
$txt     = Join-Path $desktop 'FLEETFORWARD - CURRENT LINK.txt'
$urlFile = Join-Path $desktop 'FLEETFORWARD - WORKING PUBLIC LINK (CLICK THIS).url'

Write-Host ''
Write-Host '   FleetForward - START PUBLIC LINK'
Write-Host '   ================================'
Write-Host ''
Write-Host '   Walang login. Walang password. KEEP THIS LAPTOP ON.'
Write-Host ''

# Start the local server if it is not running.
$server = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'server.js' }
if (-not $server) {
    Write-Host '   Starting local FleetForward server...'
    Start-Process -FilePath 'node.exe' -ArgumentList 'server.js' -WorkingDirectory $proj -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

$working = ''

for ($attempt = 1; $attempt -le 8; $attempt++) {
    Write-Host "   Attempt $attempt..."

    Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Remove-Item $log, $errlog -Force -ErrorAction SilentlyContinue

    # 127.0.0.1 is important: "localhost" can resolve to IPv6 (::1) and cause Error 1033.
    Start-Process -FilePath $exe `
        -ArgumentList @('tunnel','--no-autoupdate','--protocol','http2','--edge-ip-version','4','--url','http://127.0.0.1:3000') `
        -RedirectStandardOutput $log -RedirectStandardError $errlog -WindowStyle Hidden

    Start-Sleep -Seconds 11

    $content = @()
    if (Test-Path $log)    { $content += Get-Content $log }
    if (Test-Path $errlog) { $content += Get-Content $errlog }

    $url = ($content | ForEach-Object { if ($_ -match 'https://([a-z0-9-]+\.trycloudflare\.com)') { $Matches[1] } } | Select-Object -First 1)
    if (-not $url) {
        Write-Host '      no URL yet - retrying'
        continue
    }

    try {
        $r = Invoke-WebRequest -Uri "https://$url" -UseBasicParsing -TimeoutSec 12
        if ($r.StatusCode -eq 200) {
            $working = "https://$url"
            Write-Host "      OK - $working"
            break
        }
    } catch {
        Write-Host '      link not reachable yet - retrying'
    }
}

if (-not $working) {
    Write-Host ''
    Write-Host '   [!] Could not get a working link. Run this file again.'
    Read-Host '   Press Enter to close'
    exit 1
}

$body = @"
FLEETFORWARD - CURRENT PUBLIC LINK

$working

Copy the URL above and send it to other people.

--- PAANO PAG NAG-OFF ANG LAPTOP ---

1. Bukas ang laptop → i-double-click ang START-PUBLIC-LINK.bat
2. Hintayin lumabas ang bagong link. Awtomatikong ire-retry hanggang gumana.
3. I-open ulit 'to para makuha ang pinakabagong link.

NOTE: Patay ang link pag naka-off ang laptop. Laging bagong link ang lalabas.
"@
Set-Content -Path $txt -Value $body -Encoding UTF8

@"
[InternetShortcut]
URL=$working
IconIndex=0
"@ | Set-Content -Path $urlFile -Encoding ASCII

Write-Host ''
Write-Host '   ============================================================'
Write-Host '    YOUR NEW PUBLIC LINK (send this to other people):'
Write-Host ''
Write-Host "    $working"
Write-Host ''
Write-Host '   ============================================================'
Write-Host ''
Write-Host '   Saved on Desktop: CURRENT LINK.txt + shortcut'
Write-Host '   Opening it in your browser...'
Write-Host ''

Start-Process $working
Read-Host '   Press Enter to close'
