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
        },
        elements: {
          card: { boxShadow: "0 12px 32px -12px rgba(0,0,0,0.6)" },
        },
      }}
    >
      <html lang="en" className={`${mech.variable} ${grotesk.variable}`}>
        <body>
          <PWARegister />
          <DBInit />
          <ToastProvider>
            <OfflineBanner />
            <ConfirmProvider>
              <PageTransition>{children}</PageTransition>
              <BottomNav />
            </ConfirmProvider>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
