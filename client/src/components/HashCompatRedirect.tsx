import { useEffect } from "react";

/**
 * Redirects legacy hash-based URLs to clean paths.
 * e.g. /#/app → /app, /#/compare → /compare
 * Runs once on mount — no render output.
 */
export default function HashCompatRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#/")) {
      const path = hash.slice(1); // "#/app" → "/app"
      window.history.replaceState(null, "", path + window.location.search);
      // Force wouter to re-evaluate the new location
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  return null;
}
