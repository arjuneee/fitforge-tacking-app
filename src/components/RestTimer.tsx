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

  // Calculate progress percentage for ring
  const progress = ((initialSeconds - seconds) / initialSeconds) * 100;
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 safe-top safe-bottom">
      <div className="glass-card rounded-3xl p-6 md:p-8 w-full max-w-md glow-border text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 md:mb-6">⏱️ Rest Timer</h2>
        
        {/* Circular Progress Timer */}
        <div className="relative w-64 h-64 mx-auto mb-6 md:mb-8">
          {/* Background ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
            />
            {/* Progress ring */}
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="url(#goldGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b8941f" />
                <stop offset="50%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#e6c55a" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Time display in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl md:text-6xl font-bold transition-colors ${
              seconds <= 5 ? "text-red-500 animate-pulse" : "text-gold-500"
            }`}>
              {formatTime(seconds)}
            </div>
            <div className="text-gray-400 text-sm mt-1">remaining</div>
          </div>
        </div>

        {/* Controls - Large touch targets */}
        <div className="flex gap-3 mb-4 md:mb-6">
          <button
            onClick={() => adjustTime(-15)}
            className="flex-1 py-3.5 md:py-4 bg-white/5 active:bg-white/10 border border-white/10 text-white rounded-xl transition-all text-lg font-medium active:scale-95"
          >
            -15s
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex-1 py-3.5 md:py-4 bg-gold-500/20 active:bg-gold-500/30 border border-gold-500/30 text-gold-500 rounded-xl transition-all font-bold text-lg active:scale-95"
          >
            {isPaused ? "▶️ Resume" : "⏸️ Pause"}
          </button>
          <button
            onClick={() => adjustTime(15)}
            className="flex-1 py-3.5 md:py-4 bg-white/5 active:bg-white/10 border border-white/10 text-white rounded-xl transition-all text-lg font-medium active:scale-95"
          >
            +15s
          </button>
        </div>

        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="w-full py-3.5 md:py-4 bg-red-500/10 active:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all font-medium active:scale-[0.98]"
        >
          Skip Rest →
        </button>
      </div>
    </div>
  );
}
