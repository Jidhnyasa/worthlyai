// Vercel serverless entry point.
// Compiled by `npm run build` → api/server.js via esbuild (CJS format).
// This file intentionally does NOT use ES module syntax for exports
// so that esbuild's CJS output sets module.exports correctly.

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";

let cachedHandler: express.Express | null = null;

async function buildHandler(): Promise<express.Express> {
  if (cachedHandler) return cachedHandler;

  const app = express();
  const httpServer = createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (res.headersSent) return next(err);
    res.status(status).json({ message });
  });

  cachedHandler = app;
  return app;
}

// Export as CommonJS default — esbuild with format:cjs will emit:
// module.exports = <this function>
export = async function handler(
  req: express.Request,
  res: express.Response
) {
  const app = await buildHandler();
  app(req, res);
};
