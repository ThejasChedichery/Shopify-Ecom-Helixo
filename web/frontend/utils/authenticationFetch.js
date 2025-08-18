import { getSessionToken } from "@shopify/app-bridge-utils";
import app from "./appBridge";

export async function authenticatedFetch(url, options = {}) {
  const token = await getSessionToken(app);

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`, // ✅ send token to backend
    },
  });
}
