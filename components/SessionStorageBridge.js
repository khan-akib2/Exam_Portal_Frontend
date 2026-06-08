"use client";

import { useEffect } from "react";

// Redefine window.localStorage to redirect to window.sessionStorage on the client.
// This is executed as soon as the file is parsed by the client.
if (typeof window !== "undefined") {
  try {
    Object.defineProperty(window, "localStorage", {
      value: window.sessionStorage,
      writable: false,
      configurable: true
    });
  } catch (e) {
    console.warn("Failed to override localStorage with sessionStorage:", e);
  }
}

export default function SessionStorageBridge() {
  useEffect(() => {
    // This is a client-side marker to confirm session isolation is active.
    console.log("[Portal] Tab-isolated session storage active.");
  }, []);

  return null;
}
