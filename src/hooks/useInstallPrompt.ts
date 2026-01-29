import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsAvailable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app was installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsAvailable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        alert(
          "To install FitForge on iOS:\n\n" +
          "1. Tap the Share button (square with arrow) at the bottom\n" +
          "2. Scroll down and tap 'Add to Home Screen'\n" +
          "3. Tap 'Add' in the top right"
        );
        return false;
      } else {
        alert("Installation is not available. Please use your browser's menu to install the app.");
        return false;
      }
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("[Install] User accepted the install prompt");
        setIsInstalled(true);
        setIsAvailable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log("[Install] User dismissed the install prompt");
        return false;
      }
    } catch (error) {
      console.error("[Install] Error showing prompt:", error);
      return false;
    }
  };

  // Always show install button if not installed (even if prompt not available yet)
  // This allows users to see instructions or try installation
  return {
    isAvailable: !isInstalled, // Show button if not installed
    isInstalled,
    promptInstall,
    hasNativePrompt: deferredPrompt !== null, // Whether native prompt is available
  };
}
