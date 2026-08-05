"use client";

import type { CSSProperties } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   Icon Component — Real Inline SVG System
   Replaces all emoji usage across the app with proper, native SVGs.
   Zero external dependencies.
   Usage: <Icon name="briefcase" size={20} />
   ───────────────────────────────────────────────────────────────────────────── */

export type IconName =
  | "home" | "list" | "repeat" | "wallet" | "bar-chart-2" | "settings"
  | "briefcase" | "monitor" | "trending-up" | "trending-down" | "circle-dollar"
  | "utensils" | "car" | "shopping-cart" | "zap" | "heart-pulse"
  | "clapperboard" | "shopping-bag" | "book-open" | "smartphone"
  | "bus" | "coffee" | "target" | "calendar" | "clock"
  | "trash-2" | "alert-triangle" | "check-circle" | "plus" | "plus-circle"
  | "x" | "chevron-left" | "chevron-right" | "chevron-down" | "chevron-up"
  | "search" | "info" | "sparkles" | "arrow-up" | "arrow-down" | "tag" | "pen"
  | "heart" | "users" | "bell";

interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
}

const EMOJI_MAP: Record<string, IconName> = {
  "💼": "briefcase",
  "💻": "monitor",
  "📈": "trending-up",
  "💰": "circle-dollar",
  "🏠": "home",
  "🍽️": "utensils",
  "🍽": "utensils",
  "🚗": "car",
  "🛒": "shopping-cart",
  "⚡": "zap",
  "🏥": "heart-pulse",
  "🎬": "clapperboard",
  "🛍️": "shopping-bag",
  "🛍": "shopping-bag",
  "📚": "book-open",
  "📱": "smartphone",
  "💸": "wallet",
  "☕": "coffee",
  "🚌": "bus",
  "🎯": "target",
  "🎨": "settings",
  "✈️": "zap",
  "✈": "zap",
  "🏋️": "heart-pulse",
  "🏋": "heart-pulse",
  "🎁": "sparkles",
};

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.75,
  className,
  style,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
}: IconProps) {
  const resolvedName = EMOJI_MAP[name] || name;

  const baseProps = {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    style,
    "aria-hidden": ariaHidden,
    ...(ariaLabel ? { "aria-label": ariaLabel, role: "img" } : {}),
  };

  switch (resolvedName) {
    case "home":
      return (
        <svg {...baseProps}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "list":
      return (
        <svg {...baseProps}>
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
      );
    case "repeat":
      return (
        <svg {...baseProps}>
          <path d="m17 2 4 4-4 4" />
          <path d="M3 10a7 7 0 0 1 14-4H3" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 14a7 7 0 0 1-14 4h14" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...baseProps}>
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
      );
    case "bar-chart-2":
      return (
        <svg {...baseProps}>
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      );
    case "settings":
      return (
        <svg {...baseProps}>
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...baseProps}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case "monitor":
      return (
        <svg {...baseProps}>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
      );
    case "trending-up":
      return (
        <svg {...baseProps}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case "trending-down":
      return (
        <svg {...baseProps}>
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
          <polyline points="17 18 23 18 23 12" />
        </svg>
      );
    case "circle-dollar":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="16" />
          <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
        </svg>
      );
    case "utensils":
      return (
        <svg {...baseProps}>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <line x1="7" x2="7" y1="2" y2="22" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
      );
    case "car":
      return (
        <svg {...baseProps}>
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "shopping-cart":
      return (
        <svg {...baseProps}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    case "zap":
      return (
        <svg {...baseProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "heart-pulse":
      return (
        <svg {...baseProps}>
          <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0 5.4 5.4 0 0 0 0 7.65l.77.78L12 20.8l7.65-7.65.77-.78a5.4 5.4 0 0 0 0-7.65z" />
          <path d="M3.22 12H7l2-4 3 8 2-4h4.3" />
        </svg>
      );
    case "clapperboard":
      return (
        <svg {...baseProps}>
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="22" y2="7" />
          <line x1="9" y1="2" x2="9" y2="7" />
          <line x1="17" y1="2" x2="17" y2="7" />
          <line x1="13" y1="7" x2="13" y2="12" />
          <line x1="5" y1="7" x2="5" y2="12" />
          <line x1="21" y1="7" x2="21" y2="12" />
        </svg>
      );
    case "shopping-bag":
      return (
        <svg {...baseProps}>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "book-open":
      return (
        <svg {...baseProps}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "smartphone":
      return (
        <svg {...baseProps}>
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    case "bus":
      return (
        <svg {...baseProps}>
          <rect x="4" y="3" width="16" height="15" rx="2" />
          <line x1="8" y1="6" x2="8" y2="12" />
          <line x1="16" y1="6" x2="16" y2="12" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <circle cx="7.5" cy="18" r="1.5" />
          <circle cx="16.5" cy="18" r="1.5" />
        </svg>
      );
    case "coffee":
      return (
        <svg {...baseProps}>
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    case "target":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...baseProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "clock":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "trash-2":
      return (
        <svg {...baseProps}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      );
    case "alert-triangle":
      return (
        <svg {...baseProps}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "check-circle":
      return (
        <svg {...baseProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "plus":
      return (
        <svg {...baseProps}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case "plus-circle":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case "x":
      return (
        <svg {...baseProps}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...baseProps}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...baseProps}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...baseProps}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
    case "chevron-up":
      return (
        <svg {...baseProps}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      );
    case "search":
      return (
        <svg {...baseProps}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "info":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...baseProps}>
          <path d="M12 3l1.91 5.81a2 2 0 0 0 1.28 1.28L21 12l-5.81 1.91a2 2 0 0 0-1.28 1.28L12 21l-1.91-5.81a2 2 0 0 0-1.28-1.28L3 12l5.81-1.91a2 2 0 0 0 1.28-1.28L12 3z" />
          <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5z" />
          <path d="M19 17l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" />
        </svg>
      );
    case "arrow-up":
      return (
        <svg {...baseProps}>
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      );
    case "arrow-down":
      return (
        <svg {...baseProps}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      );
    case "tag":
      return (
        <svg {...baseProps}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case "pen":
      return (
        <svg {...baseProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case "heart":
      return (
        <svg {...baseProps}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case "users":
      return (
        <svg {...baseProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "bell":
      return (
        <svg {...baseProps}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    default:
      return null;
  }
}
