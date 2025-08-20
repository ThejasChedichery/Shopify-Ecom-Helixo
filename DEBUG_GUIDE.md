# 🔧 Timer Widget Debugging Guide

## Current Issues Identified

Based on the console logs, the timer widget is failing to connect to the backend and falling back to mock data. Here are the main issues:

### 1. **App Proxy 404 Error**
- The app proxy endpoint `/apps/helixo-timer/api/timers` is returning 404
- This suggests the app proxy isn't properly configured or the endpoint isn't working

### 2. **Backend URL Issues**
- The timer widget is trying old backend URLs that are no longer active
- The current backend URL is `bacteria-dns-te-becomes.trycloudflare.com`

### 3. **Database Connection Issues**
- MongoDB connection might be failing silently
- No timers in the database to fetch

## 🔧 Solutions Applied

### 1. **Updated Timer Widget Backend URLs**
- ✅ Updated `extensions/timer-widget/assets/index.js` with current backend URL
- ✅ Added health check endpoints for debugging
- ✅ Improved error handling and logging

### 2. **Enhanced Backend Error Handling**
- ✅ Added database connection status checks
- ✅ Added comprehensive health check endpoints
- ✅ Added test endpoints for creating and checking timers

### 3. **Improved Database Connection**
- ✅ Enhanced MongoDB connection with better error handling
- ✅ Added connection status monitoring

## 🧪 Testing Steps

### Step 1: Test Backend Health
Open the test file in your browser: `test-backend.html`

This will automatically test:
1. Direct backend connection
2. App proxy connection  
3. Database status
4. Timer creation
5. Timer fetching

### Step 2: Check Database Connection
Look for these console messages when starting the backend:
```
🔧 Attempting to connect to MongoDB...
✅ MongoDB connected successfully
```

If you see database errors, check your `MONGO_URL` environment variable.

### Step 3: Create Test Timer
Use the test endpoint to create a timer:
```bash
curl -X POST https://bacteria-dns-te-becomes.trycloudflare.com/api/test/create-timer
```

### Step 4: Check App Proxy Configuration
Verify in your Shopify Partners dashboard:
1. Go to your app settings
2. Check "App proxy" configuration:
   - Subpath: `helixo-timer`
   - Proxy URL: `https://bacteria-dns-te-becomes.trycloudflare.com`

## 🔍 Debugging Commands

### Check Backend Health
```bash
curl https://bacteria-dns-te-becomes.trycloudflare.com/api/health
```

### Check App Proxy Health
```bash
curl https://helixo-machine-test.myshopify.com/apps/helixo-timer/api/health
```

### Create Test Timer
```bash
curl -X POST https://bacteria-dns-te-becomes.trycloudflare.com/api/test/create-timer
```

### Check Existing Timers
```bash
curl "https://bacteria-dns-te-becomes.trycloudflare.com/api/test/timers?shopDomain=helixo-machine-test.myshopify.com"
```

## 🚨 Common Issues & Solutions

### Issue 1: App Proxy 404
**Symptoms:** `App Proxy failed: HTTP error! status: 404`

**Solutions:**
1. Check app proxy configuration in Shopify Partners dashboard
2. Ensure the backend is running and accessible
3. Verify the subpath matches the endpoint (`helixo-timer`)

### Issue 2: Database Connection Failed
**Symptoms:** `Database connection error` or no timers found

**Solutions:**
1. Check `MONGO_URL` environment variable
2. Ensure MongoDB is running and accessible
3. Check network connectivity to MongoDB

### Issue 3: CORS Issues
**Symptoms:** Network errors in browser console

**Solutions:**
1. The app proxy should handle CORS automatically
2. Direct backend calls use JSONP as fallback
3. Check if backend CORS headers are properly set

## 📋 Next Steps

1. **Run the test file** (`test-backend.html`) to identify specific issues
2. **Check backend logs** for database connection errors
3. **Verify app proxy configuration** in Shopify Partners dashboard
4. **Create a test timer** using the admin interface or test endpoint
5. **Refresh the product page** to see if the timer loads

## 🔧 Manual Timer Creation

If the admin interface isn't working, you can create a timer manually:

1. Go to your app admin: `https://bacteria-dns-te-becomes.trycloudflare.com`
2. Navigate to the timer management page
3. Create a new timer with:
   - Start date: Now
   - End date: 1 hour from now
   - Description: "Test Timer"
   - Shop domain: `helixo-machine-test.myshopify.com`

## 📞 Support

If issues persist:
1. Check the browser console for detailed error messages
2. Check the backend server logs
3. Use the test endpoints to isolate the problem
4. Verify all environment variables are set correctly
