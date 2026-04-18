// Vercel serverless handler
// Requires the pre-built Express app bundle (dist/app.cjs)
// which is produced by `npm run build` (see script/build.ts).
// This file handles ALL requests: /api/* goes to Express routes,
// everything else serves from dist/public (Vite SPA).

const path = require("path");
const express = require("express");

let appPromise = null;

async function getApp() {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    // Load the compiled server bundle
    const { createApp } = require("../dist/app.cjs");
    const { app } = await createApp();

    // Serve static Vite assets
    const distPublic = path.join(__dirname, "..", "dist", "public");
    app.use(express.static(distPublic));

    // SPA fallback for all non-API routes
    app.use("*", (_req, res) => {
      res.sendFile(path.join(distPublic, "index.html"));
    });

    return app;
  })();

  return appPromise;
}

module.exports = async (req, res) => {
  const app = await getApp();
  app(req, res);
};
