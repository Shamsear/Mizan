"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

/**
 * Route-change transition wrapper. Watch pathname changes and
 * remount elements to trigger the CSS .page-enter opacity fade.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="route-transition">
      {children}
    </div>
  );
}
