import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check visit count from localStorage
    const storedCount = localStorage.getItem("fitforge_visit_count");
    const count = storedCount ? parseInt(storedCount, 10) : 0;
    const newCount = count + 1;
    setVisitCount(newCount);
    localStorage.setItem("fitforge_visit_count", newCount.toString());

    // Show prompt after 2 visits
    if (newCount >= 2) {
      setShowPrompt(true);
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem("fitforge_visit_count");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        alert(
          "To install FitForge on iOS:\n\n" +
          "1. Tap the Share button (square with arrow)\n" +
          "2. Scroll down and tap 'Add to Home Screen'\n" +
          "3. Tap 'Add' in the top right"
        );
      } else {
        alert("Installation is not available. Please use your browser's menu to install the app.");
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("[Install] User accepted the install prompt");
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem("fitforge_visit_count");
    } else {
      console.log("[Install] User dismissed the install prompt");
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("fitforge_install_dismissed", "true");
  };

  // Don't show if dismissed this session or already installed
  if (!showPrompt || isInstalled || sessionStorage.getItem("fitforge_install_dismissed")) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="glass-card rounded-2xl p-4 border border-gold-500/30 shadow-lg shadow-gold-500/20">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white mb-1">Install FitForge</h3>
            <p className="text-sm text-gray-400 mb-3">
              Add FitForge to your home screen for quick access and a better experience.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold rounded-lg text-sm hover:from-gold-400 hover:to-gold-500 transition-all"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-800/50 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800/70 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
