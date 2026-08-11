"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { seedUserData } from "@/lib/db/seed";
import { useSettings } from "@/lib/db/hooks";
import { checkBillReminders } from "@/lib/notifications/scheduler";
import { triggerCloudSync } from "@/lib/db/sync";

/**
 * Initializes the local database and reactive theme settings.
 */
export function DBInit() {
  const { user, isLoaded } = useUser();
  const settings = useSettings();

  useEffect(() => {
    if (isLoaded && user?.id) {
      // Seed data for this user if not already done
      seedUserData(user.id)
        .then(() => {
          // Check upcoming bills on database seed/load
          checkBillReminders(user.id);
          // Trigger first cloud sync backup
          return triggerCloudSync(user.id);
        })
        .catch((err) => {
          console.error("Failed to seed/check notifications/sync:", err);
        });

      // Periodically sync changes (every 30 seconds)
      const syncInterval = setInterval(() => {
        triggerCloudSync(user.id);
      }, 30000);

      // Sync immediately when back online
      const handleOnline = () => triggerCloudSync(user.id);
      window.addEventListener("online", handleOnline);

      return () => {
        clearInterval(syncInterval);
        window.removeEventListener("online", handleOnline);
      };
    }
  }, [user?.id, isLoaded]);

  useEffect(() => {
    if (!settings) return;
    const theme = settings.theme || "system";
    const root = document.documentElement;
    
    const applyTheme = () => {
      const isDark = 
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        
      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }

      try {
        localStorage.setItem("mizan_theme", theme);
      } catch (e) {}
    };

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [settings?.theme]);

  // Prevent zoom gestures on mobile (pinch-to-zoom and double-tap zoom)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent pinch-to-zoom (multitouch)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent double-tap to zoom (tap events within 300ms)
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Prevent Safari gesture scaling
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    document.addEventListener("gesturestart", handleGestureStart);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("gesturestart", handleGestureStart);
    };
  }, []);

  return null;
}
