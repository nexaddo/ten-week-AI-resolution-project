import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Rate limiter for production HTML serving to prevent DoS attacks
  // More generous than API limits since this serves the main application
  const htmlLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute should be more than sufficient for production
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", htmlLimiter, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
