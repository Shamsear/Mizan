"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import styles from "./PWAGate.module.css";

type PWAGateProps = {
  children: React.ReactNode;
};

export function PWAGate({ children }: PWAGateProps) {
  const toast = useToast();
  const [isInstalled, setIsInstalled] = useState(true); // Default to true during SSR
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Detect standalone mode (already installed & opened from home screen)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // 2. Detect Apple iOS
    const ua = navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    // 3. Detect Safari on iOS specifically
    const isSafariBrowser =
      iosDevice &&
      /Safari/.test(ua) &&
      !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
    setIsSafari(isSafariBrowser);

    // 4. Capture standard Android/Chrome PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleAndroidInstall() {
    if (!deferredPrompt) {
      toast.error("Install prompt not available. Please install via browser settings menu.");
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        toast.success("Mizan installed successfully!");
      }
      setDeferredPrompt(null);
    } catch {
      toast.error("Failed to install app");
    }
  }

  function handleCopyLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied! Open in Safari.");
    }
  }

  // If installed, render app content normally
  if (isInstalled) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>▸ MIZAN</div>
        
        <div className={styles.appIconCircle}>
          <Icon name="target" size={40} color="var(--electric)" />
        </div>

        <h1 className={styles.title}>Install Mizan</h1>
        <p className={styles.desc}>
          Mizan is built to run as a native app on your phone. To begin tracking your expenses, you must install it on your home screen.
        </p>

        {isIOS ? (
          isSafari ? (
            /* Apple iOS in Safari: Share-sheet installation instructions */
            <div className={styles.iosInstructions}>
              <div className={styles.step}>
                <div className={styles.stepNum}>1</div>
                <div className={styles.stepText}>
                  Tap the <strong>Share</strong> button at the bottom of your Safari browser:
                  <div className={styles.iconBox}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className={styles.step}>
                <div className={styles.stepNum}>2</div>
                <div className={styles.stepText}>
                  Scroll down the menu and tap <strong>Add to Home Screen</strong>:
                  <div className={styles.iconBox}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNum}>3</div>
                <div className={styles.stepText}>
                  Tap <strong>Add</strong> in the top right to complete installation.
                </div>
              </div>
            </div>
          ) : (
            /* Apple iOS but opened in Chrome/WebView (Safari required) */
            <div className={styles.appleNotice}>
              <div className={styles.warningIcon}>
                <Icon name="alert-triangle" size={24} color="var(--over)" />
              </div>
              <h2 className={styles.warningTitle}>Safari Browser Required</h2>
              <p className={styles.warningText}>
                On iOS, Web App installation is only supported when opened directly inside the native Apple **Safari** browser.
              </p>
              <button className={styles.copyBtn} onClick={handleCopyLink}>
                <Icon name="copy" size={16} />
                Copy Website Link
              </button>
            </div>
          )
        ) : (
          /* Android / Chrome: Native Installation Prompt */
          <div className={styles.androidPrompt}>
            <button className={styles.installBtn} onClick={handleAndroidInstall}>
              <Icon name="download" size={18} />
              Install App
            </button>
            <p className={styles.installSub}>
              Tap the button above, or select "Install App" or "Add to Home Screen" in your browser's options menu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
