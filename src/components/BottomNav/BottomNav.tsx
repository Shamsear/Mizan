"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon/Icon";
import { useUser } from "@clerk/nextjs";
import { useRecurringRules } from "@/lib/db/hooks";
import styles from "./BottomNav.module.css";

interface Tab {
  href: string;
  label: string;
  icon: IconName;
  activeIcon?: IconName;
  matchExact?: boolean;
}

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: "home", matchExact: true },
  { href: "/transactions", label: "Transactions", icon: "list" },
  { href: "/bills", label: "Bills", icon: "repeat" },
  { href: "/budgets", label: "Budgets", icon: "wallet" },
  { href: "/insights", label: "Insights", icon: "bar-chart-2" },
];

/**
 * Persistent bottom tab bar — rendered on every authenticated page.
 * 5 tabs, SVG icons, safe-area aware, active indicator.
 */
export function BottomNav() {
  const { user, isLoaded } = useUser();
  const recurringRules = useRecurringRules();
  const pathname = usePathname();

  function isActive(tab: Tab): boolean {
    if (tab.matchExact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  }

  // Hide nav bar on auth pages, during loading, or if onboarding is active (no recurring rules configured yet)
  if (
    !isLoaded ||
    !user ||
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    recurringRules === undefined ||
    recurringRules.length === 0
  ) {
    return null;
  }

  return (
    <nav className={styles.nav} role="navigation" aria-label="Main navigation">
      {TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={tab.label}
          >
            <span className={styles.iconWrap}>
              <Icon
                name={tab.icon}
                size={22}
                strokeWidth={active ? 2.25 : 1.75}
              />
              {active && <span className={styles.dot} aria-hidden="true" />}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
