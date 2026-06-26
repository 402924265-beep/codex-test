$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$distRoot = Join-Path $root "dist"
$appName = "DWReconcile"
$stage = Join-Path $distRoot $appName
$zipPath = Join-Path $distRoot "$appName.zip"

if (Test-Path -LiteralPath $stage) {
    Remove-Item -LiteralPath $stage -Recurse -Force
}
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item -LiteralPath (Join-Path $root "dw_reconcile_app") -Destination (Join-Path $stage "dw_reconcile_app") -Recurse
Copy-Item -LiteralPath (Join-Path $root "run_dw_reconcile_app.ps1") -Destination (Join-Path $stage "run_dw_reconcile_app.ps1")
Copy-Item -LiteralPath (Join-Path $root "requirements.txt") -Destination (Join-Path $stage "requirements.txt")
if (Test-Path -LiteralPath (Join-Path $root "README.md")) {
    Copy-Item -LiteralPath (Join-Path $root "README.md") -Destination (Join-Path $stage "README.md")
}

$cmd = @'
@echo off
setlocal
set "APP_DIR=%~dp0"
set "DW_RECONCILE_DATA_DIR=%LOCALAPPDATA%\DWReconcile"

if exist "%APP_DIR%python\python.exe" (
  set "PYTHON=%APP_DIR%python\python.exe"
) else (
  set "PYTHON=python"
)

cd /d "%APP_DIR%"
"%PYTHON%" -m dw_reconcile_app.launcher --host 127.0.0.1 --port 8765
if errorlevel 1 (
  echo.
  echo 启动失败。如果提示缺少 openpyxl，请先安装依赖：
  echo   python -m pip install -r requirements.txt
  echo.
  pause
)
'@
Set-Content -LiteralPath (Join-Path $stage "Start DW Reconcile.cmd") -Value $cmd -Encoding ASCII

$installDeps = @'
@echo off
setlocal
set "APP_DIR=%~dp0"
if exist "%APP_DIR%python\python.exe" (
  set "PYTHON=%APP_DIR%python\python.exe"
) else (
  set "PYTHON=python"
)
cd /d "%APP_DIR%"
"%PYTHON%" -m pip install -r requirements.txt
pause
'@
Set-Content -LiteralPath (Join-Path $stage "Install dependencies.cmd") -Value $installDeps -Encoding ASCII

if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}
Compress-Archive -LiteralPath (Join-Path $stage "*") -DestinationPath $zipPath -Force

Write-Host "Built portable folder: $stage"
Write-Host "Built zip: $zipPath"
Write-Host "Note: this package keeps source files editable. If target machine has no Python/openpyxl, run Install dependencies.cmd first or add a python\\ runtime folder."
