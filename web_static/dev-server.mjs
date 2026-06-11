import { createServer } from "node:http";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const root = fileURLToPath(new URL(".", import.meta.url));
const appRoot = normalize(join(root, ".."));
const dataDir = normalize(process.env.DW_WEB_DATA_DIR || join(appRoot, "data"));
const port = Number(process.env.PORT || 8780);
const host = process.env.HOST || "0.0.0.0";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

let writeQueue = Promise.resolve();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(res, url);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Server error" });
  }
}).listen(port, host, () => {
  console.log("DW three-sheets LAN web is running.");
  console.log(`Local: http://127.0.0.1:${port}/`);
  for (const ip of lanIps()) console.log(`LAN:   http://${ip}:${port}/`);
  console.log(`Data:  ${dataDir}`);
});

async function serveStatic(res, url) {
  const cleanPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(root, cleanPath));
  if (!filePath.startsWith(normalize(root))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  const body = await readFile(filePath);
  res.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
  res.end(body);
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, mode: "lan-local-json", dataDir });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/analyses") {
    const data = await readJson("analyses.json", {});
    sendJson(res, 200, Object.fromEntries(Object.entries(data).map(([key, item]) => [key, item?.text || ""])));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/analyses") {
    const record = await readBody(req);
    await queueWrite(async () => {
      const data = await readJson("analyses.json", {});
      const key = record.key || `${record.month}:${record.code}`;
      if (!key || key === "undefined:undefined") throw new Error("Invalid analysis key");
      data[key] = {
        month: Number(record.month),
        code: String(record.code || key.split(":")[1] || ""),
        text: record.text || "",
        author: record.author || "",
        updated_at: new Date().toISOString()
      };
      await writeJson("analyses.json", data);
    });
    sendJson(res, 200, record);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/factors") {
    sendJson(res, 200, await readJson("factors.json", []));
    return;
  }
  if (req.method === "PUT" && url.pathname === "/api/factors") {
    const items = await readBody(req);
    if (!Array.isArray(items)) throw new Error("Factors payload must be an array");
    await queueWrite(() => writeJson("factors.json", items));
    sendJson(res, 200, items);
    return;
  }
  sendJson(res, 404, { error: "API not found" });
}

function queueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

async function readJson(name, fallback) {
  await mkdir(dataDir, { recursive: true });
  const filePath = join(dataDir, name);
  if (!existsSync(filePath)) return fallback;
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw.replace(/^﻿/, ""));
  } catch (error) {
    throw new Error(`Data file is not valid JSON: ${filePath}`);
  }
}

async function writeJson(name, value) {
  await mkdir(dataDir, { recursive: true });
  const filePath = join(dataDir, name);
  const tempPath = `${filePath}.tmp`;
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function lanIps() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}
