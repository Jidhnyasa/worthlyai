const path = require("path");
const express = require("express");

let appPromise = null;

async function getApp() {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const { createApp } = require("../dist/app.cjs");
    const { app } = await createApp();

    const distPublic = path.join(__dirname, "..", "dist", "public");
    app.use(express.static(distPublic));

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
