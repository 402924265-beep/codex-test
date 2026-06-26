$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$localPython = Join-Path $root "python\python.exe"
$codexPython = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if (Test-Path -LiteralPath $localPython) {
    $python = $localPython
} elseif (Test-Path -LiteralPath $codexPython) {
    $python = $codexPython
} else {
    $python = "python"
}

$dataDir = Join-Path $env:LOCALAPPDATA "DWReconcile"
$env:DW_RECONCILE_DATA_DIR = $dataDir

Set-Location -LiteralPath $root
& $python -m dw_reconcile_app.launcher --host 127.0.0.1 --port 8765
