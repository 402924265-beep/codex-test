const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const distRoot = path.join(root, 'dist');
const stage = path.join(distRoot, 'DWReconcile');
const zipPath = path.join(distRoot, 'DWReconcile.zip');

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function dosTime(date = new Date()) {
  return ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1f);
}
function dosDate(date = new Date()) {
  return (((date.getFullYear() - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0xf) << 5) | (date.getDate() & 0x1f);
}
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '__pycache__') continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
function collectFiles(dir, base = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(full, base));
    else files.push({ full, name: path.relative(base, full).replace(/\\/g, '/') });
  }
  return files;
}
function writeZip(files, outPath) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const data = fs.readFileSync(file.full);
    const compressed = zlib.deflateRawSync(data);
    const name = Buffer.from(file.name, 'utf8');
    const crc = crc32(data);
    const time = dosTime(fs.statSync(file.full).mtime);
    const date = dosDate(fs.statSync(file.full).mtime);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + compressed.length;
  }
  const cdOffset = offset;
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);
  fs.writeFileSync(outPath, Buffer.concat([...locals, cd, eocd]));
}

fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
copyDir(path.join(root, 'dw_reconcile_app'), path.join(stage, 'dw_reconcile_app'));
fs.copyFileSync(path.join(root, 'run_dw_reconcile_app.ps1'), path.join(stage, 'run_dw_reconcile_app.ps1'));
fs.copyFileSync(path.join(root, 'requirements.txt'), path.join(stage, 'requirements.txt'));
if (fs.existsSync(path.join(root, 'README.md'))) fs.copyFileSync(path.join(root, 'README.md'), path.join(stage, 'README.md'));

fs.writeFileSync(path.join(stage, 'Start DW Reconcile.cmd'), `@echo off\r\nsetlocal\r\nset "APP_DIR=%~dp0"\r\nset "DW_RECONCILE_DATA_DIR=%LOCALAPPDATA%\\DWReconcile"\r\nif exist "%APP_DIR%python\\python.exe" (\r\n  set "PYTHON=%APP_DIR%python\\python.exe"\r\n) else (\r\n  set "PYTHON=python"\r\n)\r\ncd /d "%APP_DIR%"\r\n"%PYTHON%" -m dw_reconcile_app.launcher --host 127.0.0.1 --port 8765\r\nif errorlevel 1 (\r\n  echo.\r\n  echo 启动失败。如果提示缺少 openpyxl，请先安装依赖：\r\n  echo   python -m pip install -r requirements.txt\r\n  echo.\r\n  pause\r\n)\r\n`, 'utf8');

fs.writeFileSync(path.join(stage, 'Install dependencies.cmd'), `@echo off\r\nsetlocal\r\nset "APP_DIR=%~dp0"\r\nif exist "%APP_DIR%python\\python.exe" (\r\n  set "PYTHON=%APP_DIR%python\\python.exe"\r\n) else (\r\n  set "PYTHON=python"\r\n)\r\ncd /d "%APP_DIR%"\r\n"%PYTHON%" -m pip install -r requirements.txt\r\npause\r\n`, 'utf8');

fs.mkdirSync(distRoot, { recursive: true });
writeZip(collectFiles(stage), zipPath);
console.log(`Built portable folder: ${stage}`);
console.log(`Built zip: ${zipPath}`);
console.log('Note: this package keeps source files editable. If target machine has no Python/openpyxl, run Install dependencies.cmd first or add a python\\ runtime folder.');
