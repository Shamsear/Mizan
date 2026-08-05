"use client";

import styles from "@/app/auth.module.css";

export function AuthVisual({ tagline }: { tagline: string }) {
  return (
    <div className={styles.illustrationSide}>
      <div className={styles.illustratorWrap}>
        <div className={styles.visualBrand}>
          <span className={styles.visualMark}>▸</span>
          <span className={styles.visualWordmark}>MIZAN</span>
        </div>
        <p className={styles.tagline}>{tagline}</p>
        <svg
          viewBox="0 0 400 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.svgGraphic}
        >
          {/* Glowing grids and mechanical details */}
          <rect x="10" y="10" width="380" height="220" rx="10" fill="#171b22" stroke="#2a3140" stroke-width="2" />
          
          {/* Flap rows */}
          <g opacity="0.8">
            {/* Header row */}
            <rect x="20" y="25" width="360" height="30" rx="4" fill="#0e1116" />
            <text x="35" y="44" fill="#8a93a2" fontFamily="var(--font-board)" fontSize="10" fontWeight="700" letterSpacing="1.5">DEPARTURE</text>
            <text x="200" y="44" fill="#8a93a2" fontFamily="var(--font-board)" fontSize="10" fontWeight="700" letterSpacing="1.5">TIME</text>
            <text x="290" y="44" fill="#8a93a2" fontFamily="var(--font-board)" fontSize="10" fontWeight="700" letterSpacing="1.5">STATUS</text>
          </g>

          {/* Row 1: SALARY */}
          <g>
            <rect x="20" y="65" width="360" height="36" rx="4" fill="#1f2530" stroke="#2a3140" />
            {/* Split flaps background lines */}
            <line x1="20" y1="83" x2="380" y2="83" stroke="#0e1116" strokeWidth="1.5" />
            <text x="35" y="88" fill="#f5b942" fontFamily="var(--font-board)" fontSize="14" fontWeight="700" letterSpacing="0.5">SALARY</text>
            <text x="200" y="88" fill="#f5b942" fontFamily="var(--font-board)" fontSize="14" fontWeight="700" letterSpacing="0.5">01:00</text>
            <rect x="290" y="73" width="76" height="20" rx="3" fill="rgba(87,219,163,0.12)" />
            <text x="303" y="87" fill="#57d9a3" fontFamily="var(--font-board)" fontSize="10" fontWeight="700">ARRIVED</text>
          </g>

          {/* Row 2: RENT */}
          <g>
            <rect x="20" y="110" width="360" height="36" rx="4" fill="#1f2530" stroke="#2a3140" />
            <line x1="20" y1="128" x2="380" y2="128" stroke="#0e1116" strokeWidth="1.5" />
            <text x="35" y="133" fill="#f5b942" fontFamily="var(--font-board)" fontSize="14" fontWeight="700" letterSpacing="0.5">RENT</text>
            <text x="200" y="133" fill="#f5b942" fontFamily="var(--font-board)" fontSize="14" fontWeight="700" letterSpacing="0.5">05:00</text>
            <rect x="290" y="118" width="76" height="20" rx="3" fill="rgba(255,107,90,0.12)" />
            <text x="313" y="132" fill="#ff6b5a" fontFamily="var(--font-board)" fontSize="10" fontWeight="700">PAID</text>
          </g>

          {/* Row 3: SAVINGS */}
          <g>
            <rect x="20" y="155" width="360" height="36" rx="4" fill="#1f2530" stroke="#2a3140" />
            <line x1="20" y1="173" x2="380" y2="173" stroke="#0e1116" strokeWidth="1.5" />
            <text x="35" y="178" fill="#f5b942" fontFamily="var(--font-board)" fontSize="14" fontWeight="700" letterSpacing="0.5">SAVINGS</text>
            <text x="200" y="178" fill="#f5b942" fontFamily="var(--font-board)" fontSize="14" fontWeight="700" letterSpacing="0.5">12:00</text>
            <rect x="290" y="163" width="76" height="20" rx="3" fill="rgba(45,212,232,0.12)" />
            <text x="303" y="177" fill="#2dd4e8" fontFamily="var(--font-board)" fontSize="10" fontWeight="700">BOOSTED</text>
          </g>
          
          {/* Glowing scanning overlays */}
          <rect x="15" y="15" width="370" height="210" rx="8" fill="none" stroke="rgba(45,212,232,0.06)" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}
