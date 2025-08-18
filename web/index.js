import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import dotenv from "dotenv";
dotenv.config();

import shopify from "./shopify.js";
import PrivacyWebhookHandlers from "./privacy.js";
import connectDataBase from "./backend/db/db.js";
import cors from "cors";
import timerRouter from "./backend/Router/TimerRouter.js";

const PORT = process.env.BACKEND_PORT || process.env.PORT || 3000;
const STATIC_PATH = process.env.NODE_ENV === "production"
  ? `${process.cwd()}/frontend/dist`
  : `${process.cwd()}/frontend/`;

const app = express();

// CORS 
app.use(cors());
app.use(express.json());

// Shopify auth & webhook
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// Protected API routes
app.use("/api/*", shopify.validateAuthenticatedSession());
// Timer APIs integrated
app.use("/api", timerRouter);  

// Serve frontend
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

// Connect DB and start server
connectDataBase();
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
