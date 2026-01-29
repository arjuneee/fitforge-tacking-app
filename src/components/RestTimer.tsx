import { useState, useEffect, useRef } from "react";

interface RestTimerProps {
  initialSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function RestTimer({ initialSeconds, onComplete, onSkip }: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationPermissionRef = useRef<NotificationPermission | null>(null);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        notificationPermissionRef.current = permission;
      });
    } else if ("Notification" in window) {
      notificationPermissionRef.current = Notification.permission;
    }

    // Start timer
    if (!isPaused && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            // Timer complete
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            
            // Show notification
            if (
              notificationPermissionRef.current === "granted" &&
              "Notification" in window
            ) {
              new Notification("Rest Complete!", {
                body: "Time to get back to work!",
                icon: "/icon-192x192.png",
              });
            }

            // Vibrate if supported
            if ("vibrate" in navigator) {
              navigator.vibrate([200, 100, 200]);
            }

            setTimeout(() => {
              onComplete();
            }, 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, seconds, onComplete]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const adjustTime = (delta: number) => {
    setSeconds(Math.max(0, seconds + delta));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="glass-card rounded-3xl p-8 w-full max-w-md glow-border text-center">
        <h2 className="text-2xl font-semibold text-white mb-6">Rest Timer</h2>
        
        {/* Large Countdown */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-gold-500 mb-2">
            {formatTime(seconds)}
          </div>
          <div className="text-gray-400 text-sm">Time remaining</div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => adjustTime(-15)}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-white rounded-lg transition-all"
          >
            -15s
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex-1 py-3 bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/30 text-gold-500 rounded-lg transition-all font-semibold"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => adjustTime(15)}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-white rounded-lg transition-all"
          >
            +15s
          </button>
        </div>

        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30 text-white rounded-lg transition-all"
        >
          Skip Rest
        </button>
      </div>
    </div>
  );
}
