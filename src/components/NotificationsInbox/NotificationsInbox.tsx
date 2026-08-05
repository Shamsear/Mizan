"use client";

import { useNotifications, useUnreadNotificationsCount } from "@/lib/db/hooks";
import { markNotificationAsRead, clearAllNotifications, deleteNotification } from "@/lib/db/repository";
import { Sheet } from "@/components/Sheet/Sheet";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import styles from "./NotificationsInbox.module.css";

type NotificationsInboxProps = {
  onClose: () => void;
};

export function NotificationsInbox({ onClose }: NotificationsInboxProps) {
  const { user } = useUser();
  const router = useRouter();
  const notifications = useNotifications();
  const unreadCount = useUnreadNotificationsCount() ?? 0;
  const toast = useToast();

  async function handleNotificationClick(id: string, url: string) {
    try {
      await markNotificationAsRead(id);
      router.push(url);
      onClose();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function handleMarkAllAsRead() {
    if (!user?.id || !notifications) return;
    try {
      const unreadList = notifications.filter((n) => !n.isRead);
      await Promise.all(unreadList.map((n) => markNotificationAsRead(n.id)));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  }

  async function handleClearAll() {
    if (!user?.id) return;
    try {
      await clearAllNotifications(user.id);
      toast.success("Inbox cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  }

  async function handleDeleteSingle(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  }

  function getCategoryIcon(category: string) {
    switch (category) {
      case "bills":
        return <Icon name="repeat" size={18} color="var(--electric)" />;
      case "budgets":
        return <Icon name="alert-triangle" size={18} color="var(--over)" />;
      case "goals":
        return <Icon name="target" size={18} color="var(--ok)" />;
      default:
        return <Icon name="info" size={18} color="var(--ink-mute)" />;
    }
  }

  return (
    <Sheet open onClose={onClose} label="Notifications">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Notifications</h2>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount} new</span>}
        </div>
        {notifications && notifications.length > 0 && (
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
            <span className={styles.dotSeparator}>•</span>
            <button className={styles.actionBtn} onClick={handleClearAll}>
              Clear all
            </button>
          </div>
        )}
      </header>

      <div className={styles.inboxBody}>
        {!notifications || notifications.length === 0 ? (
          <div className={styles.emptyInbox}>
            <div className={styles.emptyIconCircle}>
              <Icon name="bell" size={32} color="var(--ink-faint)" />
            </div>
            <p className={styles.emptyTitle}>Your inbox is empty</p>
            <p className={styles.emptyText}>You will see reminders, budget limits, and milestones alerts here.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`${styles.item} ${!n.isRead ? styles.unreadItem : ""}`}
                onClick={() => handleNotificationClick(n.id, n.url)}
              >
                <div className={styles.iconCol}>{getCategoryIcon(n.category)}</div>
                <div className={styles.contentCol}>
                  <div className={styles.itemTitle}>{n.title}</div>
                  <div className={styles.itemBody}>{n.body}</div>
                  <div className={styles.itemMeta}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => handleDeleteSingle(e, n.id)}
                  aria-label="Delete notification"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
