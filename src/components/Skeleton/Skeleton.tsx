"use client";

import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

interface SkeletonBaseProps {
  className?: string;
  style?: CSSProperties;
}

interface SkeletonProps extends SkeletonBaseProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

/** Base shimmer skeleton — use width/height/borderRadius for custom shapes */
export function Skeleton({ width, height, borderRadius, className, style }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ""}`}
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}

/** Single text line skeleton */
Skeleton.Line = function SkeletonLine({
  width = "100%",
  height = "1rem",
  className,
  style,
}: SkeletonProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius="4px"
      className={className}
      style={style}
    />
  );
};

/** Card / panel skeleton */
Skeleton.Card = function SkeletonCard({
  height = "5rem",
  className,
  style,
}: SkeletonProps) {
  return (
    <Skeleton
      width="100%"
      height={height}
      borderRadius="var(--r-lg)"
      className={className}
      style={style}
    />
  );
};

/** Circle / avatar skeleton */
Skeleton.Circle = function SkeletonCircle({
  size = 40,
  className,
  style,
}: SkeletonBaseProps & { size?: number }) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
      className={className}
      style={style}
    />
  );
};
