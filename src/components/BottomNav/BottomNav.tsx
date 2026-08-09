"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon/Icon";
import { useUser } from "@clerk/nextjs";
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
 * Features: Viewport keyboard offset tracking, PWA standalone detection, scroll-to-hide.
 */
export function BottomNav() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isShrunk, setIsShrunk] = useState(false);

  // 1. Standalone PWA detection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMqlStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsStandalone(!!isMqlStandalone);
  }, []);

  // 2. Keyboard detection using visualViewport API
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true");

      if (!isInputFocused) {
        setKeyboardOffset(0);
        return;
      }

      // Compute how much the viewport has shrunk/offset due to the virtual keyboard
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(offset > 50 ? offset : 0);
    };

    const vv = window.visualViewport;
    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);

    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
    };
  }, []);

  // 3. Scroll-to-hide logic
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastScrollY = window.scrollY;
    let accumulatedDiff = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Snap to expanded state at page boundaries
      if (
        currentScrollY < 10 ||
        currentScrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 10
      ) {
        setIsShrunk(false);
        return;
      }

      const diff = currentScrollY - lastScrollY;

      // Accumulate difference to avoid hyper-sensitivity/jittering
      if (diff > 0) {
        if (accumulatedDiff < 0) accumulatedDiff = 0;
        accumulatedDiff += diff;
        if (accumulatedDiff > 15) {
          setIsShrunk(true);
        }
      } else {
        if (accumulatedDiff > 0) accumulatedDiff = 0;
        accumulatedDiff += diff;
        if (accumulatedDiff < -15) {
          setIsShrunk(false);
        }
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function isActive(tab: Tab): boolean {
    if (tab.matchExact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  }

  // Hide nav bar on auth pages, during loading, or if no user is signed in
  if (
    !isLoaded ||
    !user ||
    pathname === "/sign-in" ||
    pathname === "/sign-up"
  ) {
    return null;
  }

  // Determine dynamic bottom offset style values
  const bottomStyle =
    keyboardOffset > 0
      ? `calc(${keyboardOffset}px + ${isStandalone ? "1.5rem" : "0.5rem"})`
      : isStandalone
      ? "max(1.5rem, env(safe-area-inset-bottom, 24px))"
      : "max(0.5rem, env(safe-area-inset-bottom, 8px))";

  return (
    <nav
      className={`${styles.nav} ${isShrunk ? styles.shrunk : ""}`}
      style={{ bottom: bottomStyle }}
      role="navigation"
      aria-label="Main navigation"
    >
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
