import type { Metadata, Viewport } from "next";
import { Space_Mono, Inter_Tight } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { PWARegister } from "@/components/PWARegister";
import { OfflineBanner } from "@/components/OfflineBanner/OfflineBanner";
import { DBInit } from "@/components/DBInit";
import { ToastProvider } from "@/components/Toast/Toast";
import { ConfirmProvider } from "@/components/ConfirmDialog/ConfirmDialog";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import { PWAGate } from "@/components/PWAGate/PWAGate";
import "./globals.css";

/* Display / board: Space Mono — wide, mechanical, signage-like character. */
const mech = Space_Mono({
  variable: "--font-mech",
  subsets: ["latin"],
  weight: ["400", "700"],
});

/* Body: Inter Tight — clean grotesque with a tighter, intentional feel. */
const grotesk = Inter_Tight({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mizan — spend today with confidence",
  description:
    "A departures board for your money: know exactly how much is safe to spend today.",
  applicationName: "Mizan",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Mizan" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0e1116",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorBackground: "#171b22",
          colorPrimary: "#2dd4e8",
          borderRadius: "8px",
          fontSize: "0.85rem",      // Compact text sizing (default is 0.9375rem)
          spacingUnit: "0.85rem",   // Compact padding/margins (default is 1rem)
        },
        elements: {
          card: { 
            boxShadow: "0 12px 32px -12px rgba(0,0,0,0.6)",
            maxWidth: "380px",      // Narrower card for modern, compact layouts
            width: "100%",
          },
        },
      }}
    >
      <html lang="en" className={`${mech.variable} ${grotesk.variable}`}>
        <body>
          <div className="desktop-blocker">
            <div className="blocker-content">
              <div className="blocker-brand">▸ MIZAN</div>
              <div className="blocker-graphic">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="28" y="10" width="44" height="80" rx="8" stroke="var(--ink)" strokeWidth="4" />
                  <circle cx="50" cy="80" r="4" fill="var(--ink)" />
                  <circle cx="50" cy="45" r="14" stroke="var(--electric)" strokeWidth="3" />
                  <path d="M42 45 H58 M50 37 V53" stroke="var(--electric)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="blocker-title">Mobile & Tablet Only</h1>
              <p className="blocker-text">
                Mizan is designed to be a premium, tactical, mobile-first budgeting assistant. Please scan the QR code or open this URL on your mobile phone or tablet device.
              </p>
            </div>
          </div>
          <div className="app-layout-wrapper">
            <PWARegister />
            <DBInit />
            <ToastProvider>
              <PWAGate>
                <OfflineBanner />
                <ConfirmProvider>
                  <PageTransition>{children}</PageTransition>
                  <BottomNav />
                </ConfirmProvider>
              </PWAGate>
            </ToastProvider>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
