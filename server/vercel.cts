// Vercel serverless handler entry point.
// This is a .cts (CommonJS TypeScript) file — bypasses "type": "module" in package.json.
// Compiled by `npm run build` → api/server.js
// Vercel routes all /api/* requests here via vercel.json rewrites.

import type { IncomingMessage, ServerResponse } from "http";

// Use require() for the app module to stay in CJS land
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require("./app");

let appHandler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;

async function getHandler() {
  if (appHandler) return appHandler;
  const { app } = await createApp();
  appHandler = app;
  return appHandler;
}

module.exports = async function handler(req: IncomingMessage, res: ServerResponse) {
  const h = await getHandler();
  h(req, res);
};
