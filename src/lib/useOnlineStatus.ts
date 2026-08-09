"use client";

import { useEffect, useState } from "react";

/**
 * Reactive hook that tracks browser online/offline status.
 * Returns true when the browser has network connectivity.
 * Subscribes to window "online" / "offline" events.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync in case it changed between render and effect
    const timer = setTimeout(() => {
      setIsOnline(navigator.onLine);
    }, 0);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
