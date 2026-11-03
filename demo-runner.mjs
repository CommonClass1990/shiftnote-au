#!/usr/bin/env node

// ============================================================================
// ShiftNote AU - 1-Click Interactive Demo Launcher
// Automatically starts the app server and opens the browser to /demo
// ============================================================================

import { spawn } from "node:child_process";
import http from "node:http";

const PORT = 3000;
const DEMO_URL = `http://localhost:${PORT}/demo`;

function checkServerReady(url) {
  return new Promise((resolve) => {
    http
      .get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .on("error", () => resolve(false));
  });
}

function openBrowser(url) {
  const platform = process.platform;
  let cmd = "start";
  if (platform === "darwin") cmd = "open";
  else if (platform === "linux") cmd = "xdg-open";

  const proc = spawn(cmd, [url], { shell: true, detached: true, stdio: "ignore" });
  proc.unref();
}

async function main() {
  console.log("============================================================");
  console.log("🚀 Launching ShiftNote AU — Interactive Commercial Demo");
  console.log("============================================================");

  const isAlreadyRunning = await checkServerReady(`http://localhost:${PORT}/dashboard`);

  if (isAlreadyRunning) {
    console.log(`✓ Production server detected running on port ${PORT}.`);
    console.log(`🌐 Opening Interactive Demo Showcase at: ${DEMO_URL}`);
    openBrowser(DEMO_URL);
    return;
  }

  console.log(`Starting Next.js server on port ${PORT}...`);
  const server = spawn("npm", ["run", "start"], {
    shell: true,
    stdio: "inherit",
  });

  // Poll until server responds
  let attempts = 0;
  const maxAttempts = 30;
  const interval = setInterval(async () => {
    attempts++;
    const ready = await checkServerReady(`http://localhost:${PORT}/dashboard`);
    if (ready) {
      clearInterval(interval);
      console.log(`\n✓ ShiftNote AU is ready at ${DEMO_URL}`);
      console.log(`🌐 Launching default browser to ${DEMO_URL}...\n`);
      openBrowser(DEMO_URL);
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
      console.log("Timed out waiting for server. Please open manually: " + DEMO_URL);
    }
  }, 1000);

  process.on("SIGINT", () => {
    server.kill();
    process.exit(0);
  });
}

main().catch(console.error);

