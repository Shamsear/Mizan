"use client";

import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import styles from "./OfflineBanner.module.css";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const toast = useToast();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (isOnline && wasOffline) {
      toast.success("Back online");
      setWasOffline(false);
    }
  }, [isOnline, wasOffline, toast]);

  if (isOnline) return null;

  return (
    <div className={styles.banner}>
      <Icon name="wifi-off" size={14} />
      <span>You're offline — your data is saved locally</span>
    </div>
  );
}
