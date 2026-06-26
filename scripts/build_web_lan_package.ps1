$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$distRoot = Join-Path $root 'dist'
$out = Join-Path $distRoot 'DWWebLan'
$zip = Join-Path $distRoot 'DWWebLan.zip'

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }
New-Item -ItemType Directory -Force -Path $out | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $out 'data') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $out 'node') | Out-Null

Copy-Item (Join-Path $root 'web_static') (Join-Path $out 'web_static') -Recurse
$nodeExe = @(
  'C:\Program Files\nodejs\node.exe'
  (Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1)
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if ($nodeExe) {
  Copy-Item $nodeExe (Join-Path $out 'node\node.exe')
}

# Remove runtime logs/tests from the LAN package.
Remove-Item (Join-Path $out 'web_static\tests') -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $out 'web_static\dev-server.log') -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $out 'web_static\dev-server.err.log') -Force -ErrorAction SilentlyContinue

# Switch copied index.html from Supabase cloud config to same-origin LAN API config.
$index = Join-Path $out 'web_static\index.html'
$content = Get-Content $index -Raw -Encoding UTF8
$content = [regex]::Replace($content, 'window\.DW_SUPABASE_CONFIG\s*=\s*\{[\s\S]*?\};', 'window.DW_LOCAL_API_CONFIG = { baseUrl: "" };')
Set-Content $index $content -Encoding UTF8

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $out 'data\analyses.json'), '{}', $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $out 'data\factors.json'), '[]', $utf8NoBom)

@'
@echo off
set "APP_DIR=%~dp0"
set "HOST=0.0.0.0"
set "PORT=8780"
set "DW_WEB_DATA_DIR=%APP_DIR%data"

echo =====================================================
echo DW Three-Sheets Workbench - LAN Version
echo =====================================================
echo.
echo Local URL: http://127.0.0.1:%PORT%/
echo LAN URL:   http://YOUR-PC-IP:%PORT%/
echo.
echo Keep this window open. If you close it, colleagues cannot access the website.
echo Backup this whole folder and the data folder before future model changes.
echo To check your PC IP, open another cmd window and run: ipconfig
echo.

set "NODE=%APP_DIR%node\node.exe"
if not exist "%NODE%" (
  where node >nul 2>nul
  if errorlevel 1 (
    echo Node.js was not found, and node\node.exe is not included in this package.
    echo Please use the portable package again or install Node.js 18+.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
  )
  set "NODE=node"
)

"%NODE%" "%APP_DIR%web_static\dev-server.mjs"
pause
'@ | Set-Content (Join-Path $out 'Start DW Web LAN.cmd') -Encoding ASCII

Copy-Item (Join-Path $root 'web_static\README-LAN.md') (Join-Path $out 'README.md')

Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -Force
Write-Host "LAN package created: $zip"
