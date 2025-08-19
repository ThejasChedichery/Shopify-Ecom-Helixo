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

// 🔧 FIX: Configure CORS for theme extensions
app.use(cors({
  origin: true, // Allow all origins for now to debug
  credentials: false, // Don't send credentials for public API
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// 🔧 FIX: Handle preflight requests explicitly
app.options('*', cors());

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

// 🔧 PERMANENT SOLUTION: Auto-discovery endpoint that returns current backend URL
app.get("/api/discover", (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  
  // Get the current backend URL from the request
  const currentBackendUrl = `${req.protocol}://${req.get('host')}`;
  
  res.json({
    success: true,
    backendUrl: currentBackendUrl,
    timestamp: new Date().toISOString()
  });
});

// 🔧 FIX: App Proxy endpoint for theme extensions (helixo-timer)
app.get("/helixo-timer/api/timers", async (req, res) => {
  // 🔧 FIX: Add CORS headers for App Proxy requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { shopDomain } = req.query;
    
    if (!shopDomain) {
      return res.status(400).json({ 
        success: false, 
        message: "shopDomain parameter is required" 
      });
    }
    
    // Import Timer model
    const Timer = (await import("./backend/Model/TimerModel.js")).default;
    
    // Find timers for the specific shop
    const timers = await Timer.find({ shopDomain });
    
    console.log(`App Proxy API: Found ${timers.length} timers for ${shopDomain}`);
    
    res.status(200).json({ 
      success: true, 
      timers: timers 
    });
  } catch (error) {
    console.error("Error fetching timers via App Proxy:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// 🔧 FIX: Public API endpoint for theme extensions (no authentication required)
app.get("/api/public/timers", async (req, res) => {
  // 🔧 FIX: Add explicit CORS headers for all origins
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { shopDomain, callback } = req.query;
    
    if (!shopDomain) {
      return res.status(400).json({ 
        success: false, 
        message: "shopDomain parameter is required" 
      });
    }
    
    // Import Timer model
    const Timer = (await import("./backend/Model/TimerModel.js")).default;
    
    // Find timers for the specific shop
    const timers = await Timer.find({ shopDomain });
    
    console.log(`Public API: Found ${timers.length} timers for ${shopDomain}`);
    
    const responseData = { 
      success: true, 
      timers: timers 
    };
    
    // 🔧 FIX: Support JSONP if callback parameter is provided
    if (callback) {
      // JSONP response
      res.set('Content-Type', 'application/javascript');
      res.send(`${callback}(${JSON.stringify(responseData)});`);
    } else {
      // Regular JSON response
      res.status(200).json(responseData);
    }
  } catch (error) {
    console.error("Error fetching public timers:", error);
    const errorResponse = { 
      success: false, 
      message: "Internal server error" 
    };
    
    if (req.query.callback) {
      // JSONP error response
      res.set('Content-Type', 'application/javascript');
      res.send(`${req.query.callback}(${JSON.stringify(errorResponse)});`);
    } else {
      // Regular JSON error response
      res.status(500).json(errorResponse);
    }
  }
});

// Protected API routes (for admin dashboard)
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
