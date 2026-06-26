$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$distRoot = Join-Path $root "dist"
$packageName = "Candy_DW_Cost_Turkey_4plus8"
$out = Join-Path $distRoot $packageName
$zip = Join-Path $distRoot "$packageName.zip"
$nodePackageName = "${packageName}_Node"
$nodeOut = Join-Path $distRoot $nodePackageName
$nodeZip = Join-Path $distRoot "$nodePackageName.zip"
$site = Join-Path $out "site"
$input = Join-Path $site "input"
$data = Join-Path $out "data"
$validatedInputs = Join-Path $root "outputs\package-validation-inputs"

$sourceFiles = @{
  forecast = Join-Path $validatedInputs "01_Forecast_4plus8.xlsx"
  jiang = Join-Path $validatedInputs "02_Domestic_Finance_4plus8.xlsx"
  sap = Join-Path $validatedInputs "03_April_Actual.xlsx"
}

foreach ($entry in $sourceFiles.GetEnumerator()) {
  if (-not (Test-Path -LiteralPath $entry.Value)) {
    throw "Missing source file: $($entry.Value)"
  }
}

if (Test-Path -LiteralPath $out) {
  $resolvedOut = [IO.Path]::GetFullPath($out)
  $resolvedDist = [IO.Path]::GetFullPath($distRoot)
  if (-not $resolvedOut.StartsWith($resolvedDist, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove path outside dist: $resolvedOut"
  }
  Remove-Item -LiteralPath $out -Recurse -Force
}
if (Test-Path -LiteralPath $zip) {
  Remove-Item -LiteralPath $zip -Force
}
if (Test-Path -LiteralPath $nodeOut) {
  $resolvedNodeOut = [IO.Path]::GetFullPath($nodeOut)
  $resolvedDist = [IO.Path]::GetFullPath($distRoot)
  if (-not $resolvedNodeOut.StartsWith($resolvedDist, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove path outside dist: $resolvedNodeOut"
  }
  Remove-Item -LiteralPath $nodeOut -Recurse -Force
}
if (Test-Path -LiteralPath $nodeZip) {
  Remove-Item -LiteralPath $nodeZip -Force
}

New-Item -ItemType Directory -Force -Path $site, $input, $data | Out-Null
Copy-Item -LiteralPath (Join-Path $root "web_static\index.html") -Destination $site
Copy-Item -LiteralPath (Join-Path $root "web_static\src") -Destination $site -Recurse
Copy-Item -LiteralPath (Join-Path $root "web_static\vendor") -Destination $site -Recurse

Copy-Item -LiteralPath $sourceFiles.forecast -Destination (Join-Path $input "01_Forecast_4plus8.xlsx")
Copy-Item -LiteralPath $sourceFiles.jiang -Destination (Join-Path $input "02_Domestic_Finance_4plus8.xlsx")
Copy-Item -LiteralPath $sourceFiles.sap -Destination (Join-Path $input "03_April_Actual.xlsx")

$indexPath = Join-Path $site "index.html"
$indexContent = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
$replacement = @'
window.DW_LOCAL_API_CONFIG = { baseUrl: "" };
      window.DW_BUNDLED_FILES = {
        forecast: "./input/01_Forecast_4plus8.xlsx",
        forecastName: "2026 MFG Variance Reporting_ DW_4+8 v1.xlsx",
        jiang: "./input/02_Domestic_Finance_4plus8.xlsx",
        jiangName: "4+8 Domestic Finance.xlsx",
        sap: "./input/03_April_Actual.xlsx",
        sapName: "2026 monthly Renta DW _APRIL ACT.xlsx",
        language: "tr"
      };
'@
$indexContent = [regex]::Replace(
  $indexContent,
  'window\.DW_SUPABASE_CONFIG\s*=\s*\{[\s\S]*?\};',
  $replacement
)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($indexPath, $indexContent, $utf8NoBom)
[IO.File]::WriteAllText((Join-Path $data "analyses.json"), "{}", $utf8NoBom)
[IO.File]::WriteAllText((Join-Path $data "factors.json"), "[]", $utf8NoBom)

$server = @'
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$site = Join-Path $root "site"
$data = Join-Path $root "data"
$prefix = "http://127.0.0.1:8780/"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Send-Bytes($response, [byte[]]$bytes, [string]$contentType, [int]$status = 200) {
  $response.StatusCode = $status
  $response.ContentType = $contentType
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
  $response.OutputStream.Close()
}

function Send-Json($response, $value, [int]$status = 200) {
  $json = if ($value -is [string]) { $value } else { $value | ConvertTo-Json -Depth 30 -Compress }
  Send-Bytes $response ([Text.Encoding]::UTF8.GetBytes($json)) "application/json; charset=utf-8" $status
}

function Read-Body($request) {
  $reader = New-Object IO.StreamReader($request.InputStream, $request.ContentEncoding)
  try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}

$listener = New-Object Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
if (-not $env:DW_NO_BROWSER) {
  Start-Process $prefix
}
Write-Host "Candy DW Cost Workbench is running."
Write-Host "URL: $prefix"
Write-Host "Keep this window open. Press Ctrl+C to stop."

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    try {
      $path = [Uri]::UnescapeDataString($request.Url.AbsolutePath)
      if ($path -eq "/api/health") {
        Send-Json $response @{ ok = $true; mode = "portable-powershell" }
        continue
      }
      if ($path -eq "/api/analyses" -and $request.HttpMethod -eq "GET") {
        Send-Bytes $response ([IO.File]::ReadAllBytes((Join-Path $data "analyses.json"))) "application/json; charset=utf-8"
        continue
      }
      if ($path -eq "/api/analyses" -and $request.HttpMethod -eq "POST") {
        $record = (Read-Body $request) | ConvertFrom-Json
        $file = Join-Path $data "analyses.json"
        $all = Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json
        $key = if ($record.key) { [string]$record.key } else { "$($record.month):$($record.code)" }
        $saved = [pscustomobject]@{
          month = $record.month
          code = $record.code
          text = $record.text
          author = $record.author
          updated_at = [DateTime]::UtcNow.ToString("o")
        }
        $all | Add-Member -NotePropertyName $key -NotePropertyValue $saved -Force
        [IO.File]::WriteAllText($file, ($all | ConvertTo-Json -Depth 30), $utf8NoBom)
        Send-Json $response $record
        continue
      }
      if ($path -eq "/api/factors" -and $request.HttpMethod -eq "GET") {
        Send-Bytes $response ([IO.File]::ReadAllBytes((Join-Path $data "factors.json"))) "application/json; charset=utf-8"
        continue
      }
      if ($path -eq "/api/factors" -and $request.HttpMethod -eq "PUT") {
        $body = Read-Body $request
        $null = $body | ConvertFrom-Json
        [IO.File]::WriteAllText((Join-Path $data "factors.json"), $body, $utf8NoBom)
        Send-Json $response $body
        continue
      }

      $relative = if ($path -eq "/") { "index.html" } else { $path.TrimStart("/").Replace("/", "\") }
      $filePath = [IO.Path]::GetFullPath((Join-Path $site $relative))
      $sitePath = [IO.Path]::GetFullPath($site)
      if (-not $filePath.StartsWith($sitePath, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        Send-Json $response @{ error = "Not found" } 404
        continue
      }
      $mime = switch ([IO.Path]::GetExtension($filePath).ToLowerInvariant()) {
        ".html" { "text/html; charset=utf-8" }
        ".css" { "text/css; charset=utf-8" }
        ".js" { "text/javascript; charset=utf-8" }
        ".mjs" { "text/javascript; charset=utf-8" }
        ".json" { "application/json; charset=utf-8" }
        ".xlsx" { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        default { "application/octet-stream" }
      }
      Send-Bytes $response ([IO.File]::ReadAllBytes($filePath)) $mime
    } catch {
      try { Send-Json $response @{ error = $_.Exception.Message } 500 } catch {}
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
'@
[IO.File]::WriteAllText((Join-Path $out "server.ps1"), $server, $utf8NoBom)

$launcher = @'
@echo off
title Candy DW Cost Workbench
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
if errorlevel 1 (
  echo.
  echo The website could not start. Please send a screenshot of this window.
  pause
)
'@
[IO.File]::WriteAllText((Join-Path $out "START_WEBSITE.cmd"), $launcher, [Text.Encoding]::ASCII)

$readme = @'
# Candy DW Cost Workbench - Turkey Portable Package

## Start

1. Extract the complete ZIP file to a normal local folder.
2. Double-click `START_WEBSITE.cmd`.
3. Keep the command window open.
4. The browser opens automatically at:

   http://127.0.0.1:8780/

The three Excel files are loaded automatically in this order:

1. Forecast 4+8
2. Domestic finance 4+8
3. April actual

The interface starts in Turkish. Use the language menu to switch to Chinese or English.

## Important

- Use Windows 10 or Windows 11.
- Do not open `index.html` directly. Always use `START_WEBSITE.cmd`.
- The package runs only on the local computer and does not upload the Excel files to the internet.
- Keep the extracted folder together. Do not remove the `site`, `input`, or `data` folders.
- Close the command window to stop the website.
'@
[IO.File]::WriteAllText((Join-Path $out "README_EN.md"), $readme, $utf8NoBom)

Compress-Archive -Path (Join-Path $out "*") -DestinationPath $zip -CompressionLevel Optimal
Write-Host "Created: $zip"

Copy-Item -LiteralPath $out -Destination $nodeOut -Recurse
Remove-Item -LiteralPath (Join-Path $nodeOut "server.ps1") -Force
New-Item -ItemType Directory -Force -Path (Join-Path $nodeOut "node") | Out-Null
$nodeExe = @(
  "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  "C:\Program Files\nodejs\node.exe"
  (Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1)
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $nodeExe) {
  throw "Node executable was not found for the portable package."
}
Copy-Item -LiteralPath $nodeExe -Destination (Join-Path $nodeOut "node\runtime.dat")

$nodeServer = @'
import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const root = fileURLToPath(new URL(".", import.meta.url));
const site = normalize(join(root, "site"));
const data = normalize(join(root, "data"));
const host = "127.0.0.1";
const port = 8780;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${host}:${port}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    const relative = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const filePath = normalize(join(site, relative));
    if (!filePath.startsWith(site) || !existsSync(filePath)) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    const body = readFileSync(filePath);
    res.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
}).listen(port, host, () => {
  const url = `http://${host}:${port}/`;
  console.log("Candy DW Cost Workbench is running.");
  console.log(`URL: ${url}`);
  console.log("Keep this window open. Press Ctrl+C to stop.");
  if (!process.env.DW_NO_BROWSER) exec(`start "" "${url}"`);
});

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, mode: "portable-node" });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/analyses") {
    const records = JSON.parse(readFileSync(join(data, "analyses.json"), "utf8"));
    sendJson(res, 200, Object.fromEntries(Object.entries(records).map(([key, item]) => [key, item?.text || item || ""])));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/analyses") {
    const record = await readBody(req);
    const file = join(data, "analyses.json");
    const records = JSON.parse(readFileSync(file, "utf8"));
    const key = record.key || `${record.month}:${record.code}`;
    records[key] = {
      month: Number(record.month),
      code: String(record.code || ""),
      text: record.text || "",
      author: record.author || "",
      updated_at: new Date().toISOString()
    };
    writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    sendJson(res, 200, record);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/factors") {
    sendJson(res, 200, JSON.parse(readFileSync(join(data, "factors.json"), "utf8")));
    return;
  }
  if (req.method === "PUT" && url.pathname === "/api/factors") {
    const items = await readBody(req);
    if (!Array.isArray(items)) throw new Error("Factors payload must be an array");
    writeFileSync(join(data, "factors.json"), `${JSON.stringify(items, null, 2)}\n`, "utf8");
    sendJson(res, 200, items);
    return;
  }
  sendJson(res, 404, { error: "API not found" });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "null");
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
'@
[IO.File]::WriteAllText((Join-Path $nodeOut "server.mjs"), $nodeServer, $utf8NoBom)

$nodeLauncher = @'
@echo off
title Candy DW Cost Workbench
cd /d "%~dp0"
if not exist "%~dp0node\node.exe" copy /b "%~dp0node\runtime.dat" "%~dp0node\node.exe" >nul
"%~dp0node\node.exe" "%~dp0server.mjs"
if errorlevel 1 (
  echo.
  echo The website could not start. Please send a screenshot of this window.
  pause
)
'@
[IO.File]::WriteAllText((Join-Path $nodeOut "START_WEBSITE.cmd"), $nodeLauncher, [Text.Encoding]::ASCII)
$nodeReadme = $readme.Replace(
  "The package runs only on the local computer and does not upload the Excel files to the internet.",
  "This backup package includes its own Node runtime. It runs only on the local computer and does not upload the Excel files to the internet."
)
[IO.File]::WriteAllText((Join-Path $nodeOut "README_EN.md"), $nodeReadme, $utf8NoBom)

Add-Type -AssemblyName System.IO.Compression
$zipStream = [IO.File]::Open($nodeZip, [IO.FileMode]::CreateNew, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
try {
  $archive = New-Object IO.Compression.ZipArchive(
    $zipStream,
    [IO.Compression.ZipArchiveMode]::Create,
    $true,
    [Text.Encoding]::UTF8
  )
  try {
    foreach ($file in Get-ChildItem -LiteralPath $nodeOut -Recurse -File) {
      $relative = $file.FullName.Substring($nodeOut.Length).TrimStart("\").Replace("\", "/")
      $entry = $archive.CreateEntry($relative, [IO.Compression.CompressionLevel]::Optimal)
      $entry.LastWriteTime = $file.LastWriteTime
      $entry.ExternalAttributes = 0
      $sourceStream = [IO.File]::Open(
        $file.FullName,
        [IO.FileMode]::Open,
        [IO.FileAccess]::Read,
        [IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete
      )
      $entryStream = $entry.Open()
      try {
        $sourceStream.CopyTo($entryStream)
      } finally {
        $entryStream.Dispose()
        $sourceStream.Dispose()
      }
    }
  } finally {
    $archive.Dispose()
  }
} finally {
  $zipStream.Dispose()
}
Write-Host "Created: $nodeZip"
