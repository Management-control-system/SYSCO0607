/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import { authRouter } from "./server/authRoutes";
import {
  chargilyRouter,
  chargilyWebhookHandler,
  chargilyWebhookRawParser,
} from "./server/chargilyRoutes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // IMPORTANT: the Chargily webhook route needs the raw (unparsed) request
  // body to verify its HMAC signature, so it MUST be registered with its own
  // raw body parser *before* the global express.json() middleware below —
  // otherwise the body would already be consumed/transformed and signature
  // verification would fail.
  app.post("/api/chargily/webhook", chargilyWebhookRawParser, chargilyWebhookHandler);

  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use("/api/chargily", chargilyRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
