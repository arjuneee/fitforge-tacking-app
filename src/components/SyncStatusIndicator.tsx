import { useState, useEffect } from "react";
import { syncService } from "../services/api";

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<{ isSyncing: boolean; pendingCount: number }>({
    isSyncing: false,
    pendingCount: 0,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Get initial status
    syncService.getStatus().then(setStatus);

    // Subscribe to status changes
    const unsubscribe = syncService.onStatusChange(setStatus);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncService.sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic status check
    const interval = setInterval(() => {
      syncService.getStatus().then(setStatus);
    }, 2000);

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Don't show if everything is synced and online
  if (isOnline && !status.isSyncing && status.pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="glass-card rounded-xl p-3 border border-gold-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          {!isOnline ? (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-gray-300">Offline</span>
            </>
          ) : status.isSyncing ? (
            <>
              <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gold-400">Syncing...</span>
            </>
          ) : status.pendingCount > 0 ? (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm text-yellow-400">
                {status.pendingCount} pending
              </span>
              <button
                onClick={() => syncService.sync()}
                className="text-xs px-2 py-1 bg-gold-500/20 text-gold-400 rounded hover:bg-gold-500/30 transition-colors"
              >
                Sync Now
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
