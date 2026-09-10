import { signOut as nextAuthSignOut } from "next-auth/react";

/**
 * Sign out and tell the service worker to drop every cache, so a shared device
 * keeps nothing from the previous session.
 */
export async function signOut(options?: { callbackUrl?: string }) {
  try {
    navigator.serviceWorker?.controller?.postMessage("clear-cache");
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // best effort
  }
  return nextAuthSignOut(options);
}
