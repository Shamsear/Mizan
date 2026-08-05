"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon/Icon";
import styles from "./PWARegister.module.css";

/**
 * Registers the service worker and handles updates with a visual top banner.
 */
export function PWARegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err: unknown) => {
          console.error("Service worker registration failed:", err);
        });
    }
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className={styles.banner}>
      <Icon name="refresh-cw" size={16} className={styles.spinIcon} />
      <span className={styles.text}>New version available!</span>
      <button className={styles.btn} onClick={() => window.location.reload()}>
        Update Now
      </button>
    </div>
  );
}
