"use client";

import { Icon } from "@/components/Icon/Icon";
import Link from "next/link";
import styles from "./page.module.css";

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.mark}>▸</span>
        <span className={styles.logoText}>MIZAN</span>
      </header>

      <div className={styles.content}>
        <div className={styles.iconCircle}>
          <Icon name="wifi-off" size={48} color="var(--over)" />
        </div>
        <h1 className={styles.title}>You're offline</h1>
        <p className={styles.subtitle}>
          Mizan is running in offline mode. Any transactions or updates you make will be saved locally on your device and synced automatically once you're back online.
        </p>

        <Link href="/" className={styles.btn}>
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
