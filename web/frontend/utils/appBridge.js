
import createApp from "@shopify/app-bridge";

const app = createApp({
  apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
  host: new URLSearchParams(window.location.search).get("host"), // ✅ important
  forceRedirect: true,
});

export default app;
