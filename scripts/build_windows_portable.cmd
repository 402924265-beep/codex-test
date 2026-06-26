@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "DIST=%ROOT%\dist"
set "STAGE=%DIST%\DWReconcile"
set "ZIP=%DIST%\DWReconcile.zip"

if exist "%STAGE%" rmdir /s /q "%STAGE%"
mkdir "%STAGE%" || exit /b 1

xcopy "%ROOT%\dw_reconcile_app" "%STAGE%\dw_reconcile_app" /E /I /Y >nul || exit /b 1
for /d /r "%STAGE%" %%D in (__pycache__) do @if exist "%%D" rmdir /s /q "%%D"
copy "%ROOT%\run_dw_reconcile_app.ps1" "%STAGE%\run_dw_reconcile_app.ps1" >nul || exit /b 1
copy "%ROOT%\requirements.txt" "%STAGE%\requirements.txt" >nul || exit /b 1
if exist "%ROOT%\README.md" copy "%ROOT%\README.md" "%STAGE%\README.md" >nul

> "%STAGE%\Start DW Reconcile.cmd" echo @echo off
>> "%STAGE%\Start DW Reconcile.cmd" echo setlocal
>> "%STAGE%\Start DW Reconcile.cmd" echo set "APP_DIR=%%~dp0"
>> "%STAGE%\Start DW Reconcile.cmd" echo set "DW_RECONCILE_DATA_DIR=%%LOCALAPPDATA%%\DWReconcile"
>> "%STAGE%\Start DW Reconcile.cmd" echo if exist "%%APP_DIR%%python\python.exe" ^(
>> "%STAGE%\Start DW Reconcile.cmd" echo   set "PYTHON=%%APP_DIR%%python\python.exe"
>> "%STAGE%\Start DW Reconcile.cmd" echo ^) else ^(
>> "%STAGE%\Start DW Reconcile.cmd" echo   set "PYTHON=python"
>> "%STAGE%\Start DW Reconcile.cmd" echo ^)
>> "%STAGE%\Start DW Reconcile.cmd" echo cd /d "%%APP_DIR%%"
>> "%STAGE%\Start DW Reconcile.cmd" echo "%%PYTHON%%" -m dw_reconcile_app.launcher --host 127.0.0.1 --port 8765
>> "%STAGE%\Start DW Reconcile.cmd" echo if errorlevel 1 ^(
>> "%STAGE%\Start DW Reconcile.cmd" echo   echo.
>> "%STAGE%\Start DW Reconcile.cmd" echo   echo 启动失败。如果提示缺少 openpyxl，请先安装依赖：
>> "%STAGE%\Start DW Reconcile.cmd" echo   echo   python -m pip install -r requirements.txt
>> "%STAGE%\Start DW Reconcile.cmd" echo   echo.
>> "%STAGE%\Start DW Reconcile.cmd" echo   pause
>> "%STAGE%\Start DW Reconcile.cmd" echo ^)

> "%STAGE%\Install dependencies.cmd" echo @echo off
>> "%STAGE%\Install dependencies.cmd" echo setlocal
>> "%STAGE%\Install dependencies.cmd" echo set "APP_DIR=%%~dp0"
>> "%STAGE%\Install dependencies.cmd" echo if exist "%%APP_DIR%%python\python.exe" ^(
>> "%STAGE%\Install dependencies.cmd" echo   set "PYTHON=%%APP_DIR%%python\python.exe"
>> "%STAGE%\Install dependencies.cmd" echo ^) else ^(
>> "%STAGE%\Install dependencies.cmd" echo   set "PYTHON=python"
>> "%STAGE%\Install dependencies.cmd" echo ^)
>> "%STAGE%\Install dependencies.cmd" echo cd /d "%%APP_DIR%%"
>> "%STAGE%\Install dependencies.cmd" echo "%%PYTHON%%" -m pip install -r requirements.txt
>> "%STAGE%\Install dependencies.cmd" echo pause

if exist "%ZIP%" del /f /q "%ZIP%"
powershell.exe -NoProfile -Command "Compress-Archive -LiteralPath '%STAGE%\*' -DestinationPath '%ZIP%' -Force" || exit /b 1

echo Built portable folder: %STAGE%
echo Built zip: %ZIP%
echo Note: this package keeps source files editable. If target machine has no Python/openpyxl, run Install dependencies.cmd first or add a python\ runtime folder.
