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
      if (
        theme === "light" ||
        (theme === "system" && !window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        root.classList.add("light");
      } else {
        root.classList.remove("light");
      }
    };

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [settings?.theme]);

  return null;
}
