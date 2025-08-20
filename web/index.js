import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import dotenv from "dotenv";
import mongoose from "mongoose";
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

// 🔧 TEST: Simple health check endpoint
app.get("/api/health", (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({
    success: true,
    message: "Backend is running",
    timestamp: new Date().toISOString(),
    shopDomain: req.query.shopDomain || 'not provided',
    databaseStatus: {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
    }
  });
});

// 🔧 TEST: Create a test timer for debugging
app.post("/api/test/create-timer", async (req, res) => {
  try {
    const Timer = (await import("./backend/Model/TimerModel.js")).default;
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. Ready state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: "Database connection error",
        readyState: mongoose.connection.readyState
      });
    }
    
    // Create a test timer that expires in 1 hour
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    const testTimer = new Timer({
      shopDomain: "helixo-machine-test.myshopify.com",
      startDate: now,
      endDate: endTime,
      description: "🔥 Test Timer - Limited Time Offer! Don't miss out on this amazing deal!",
      displayOptions: {
        color: "#ff0000",
        position: "top",
        size: "medium"
      },
      urgencySettings: {
        enableBanner: "color_pulse",
        warningTimeMinutes: 5
      }
    });
    
    await testTimer.save();
    
    res.json({
      success: true,
      message: "Test timer created successfully",
      timer: testTimer
    });
  } catch (error) {
    console.error("Error creating test timer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test timer",
      error: error.message
    });
  }
});

// 🔧 TEST: Check existing timers for debugging
app.get("/api/test/timers", async (req, res) => {
  try {
    const Timer = (await import("./backend/Model/TimerModel.js")).default;
    const { shopDomain } = req.query;
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. Ready state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: "Database connection error",
        readyState: mongoose.connection.readyState
      });
    }
    
    const timers = await Timer.find({ shopDomain: shopDomain || "helixo-machine-test.myshopify.com" });
    
    res.json({
      success: true,
      count: timers.length,
      timers: timers
    });
  } catch (error) {
    console.error("Error fetching test timers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch test timers",
      error: error.message
    });
  }
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
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. Ready state:', mongoose.connection.readyState);
      return res.status(500).json({ 
        success: false, 
        message: "Database connection error" 
      });
    }
    
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

// 🔧 TEST: App Proxy health check endpoint
app.get("/helixo-timer/api/health", (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({
    success: true,
    message: "App Proxy is working",
    timestamp: new Date().toISOString(),
    shopDomain: req.query.shopDomain || 'not provided',
    databaseStatus: {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
    }
  });
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
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. Ready state:', mongoose.connection.readyState);
      const errorResponse = { 
        success: false, 
        message: "Database connection error" 
      };
      
      if (req.query.callback) {
        // JSONP error response
        res.set('Content-Type', 'application/javascript');
        res.send(`${req.query.callback}(${JSON.stringify(errorResponse)});`);
      } else {
        // Regular JSON error response
        res.status(500).json(errorResponse);
      }
      return;
    }
    
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
