import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { QuickWeightLog } from "../components/QuickWeightLog";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { analyticsApi } from "../services/api";

interface DashboardStats {
  total_workouts: number;
  total_volume_kg: number;
  current_streak_days: number;
  total_prs: number;
}

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isAvailable, promptInstall } = useInstallPrompt();
  const [stats, setStats] = useState<DashboardStats>({
    total_workouts: 0,
    total_volume_kg: 0,
    current_streak_days: 0,
    total_prs: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await analyticsApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("[Dashboard] Error loading stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Athlete";

  return (
    <div className="min-h-dvh bg-black pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5 safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo & User */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
              <span className="text-black font-bold text-lg">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{userName}</p>
              <p className="text-gray-500 text-xs">Let's crush it today! 💪</p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {isAvailable && (
              <button
                onClick={promptInstall}
                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* Start Workout Banner */}
        <button
          onClick={() => navigate("/workouts/start")}
          className="w-full bg-gradient-to-r from-gold-600 to-gold-500 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-black font-bold text-base">Start Workout</p>
              <p className="text-black/70 text-xs">Begin your training session</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Stats Grid */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Your Progress</h2>
            <button 
              onClick={() => navigate("/analytics")}
              className="text-gold-500 text-xs font-medium"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Workouts", value: statsLoading ? "..." : stats.total_workouts, icon: "🏋️" },
              { label: "Volume", value: statsLoading ? "..." : `${(stats.total_volume_kg / 1000).toFixed(1)}t`, icon: "📊" },
              { label: "Streak", value: statsLoading ? "..." : `${stats.current_streak_days}d`, icon: "🔥" },
              { label: "PRs", value: statsLoading ? "..." : stats.total_prs, icon: "🏆" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <p className="text-white font-bold text-sm">{stat.value}</p>
                <p className="text-gray-500 text-[10px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Programs", icon: "📋", link: "/programs", color: "from-violet-500/20 to-violet-600/20" },
              { label: "Analytics", icon: "📊", link: "/analytics", color: "from-cyan-500/20 to-cyan-600/20" },
              { label: "Records", icon: "🏆", link: "/personal-records", color: "from-gold-500/20 to-gold-600/20" },
              { label: "Weight", icon: "⚖️", link: "/weight-log", color: "from-green-500/20 to-green-600/20" },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.link)}
                className="flex flex-col items-center active:scale-95 transition-transform"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} border border-white/10 flex items-center justify-center mb-2`}>
                  <span className="text-2xl">{action.icon}</span>
                </div>
                <p className="text-gray-300 text-[11px] font-medium">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Weight Log */}
        <QuickWeightLog />

        {/* Feature Cards */}
        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-white font-semibold text-sm">Features</h2>
          </div>
          
          <div className="divide-y divide-white/5">
            <button
              onClick={() => navigate("/programs")}
              className="w-full p-4 flex items-center gap-4 active:bg-white/5 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📋</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">Training Programs</p>
                <p className="text-gray-500 text-xs">Create & manage your workout plans</p>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => navigate("/analytics")}
              className="w-full p-4 flex items-center gap-4 active:bg-white/5 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📈</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">Analytics & Insights</p>
                <p className="text-gray-500 text-xs">Track your progress over time</p>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => navigate("/exercises")}
              className="w-full p-4 flex items-center gap-4 active:bg-white/5 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💪</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">Exercise Library</p>
                <p className="text-gray-500 text-xs">Browse all exercises & history</p>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-gradient-to-br from-violet-500/10 to-gold-500/10 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <span className="text-lg">🚀</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Coming Soon</p>
              <p className="text-gray-400 text-xs">Version 2 features</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["📸 Progress Photos", "🧮 Plate Calculator", "🔔 Notifications", "📤 Data Export"].map((feature, i) => (
              <div key={i} className="bg-black/30 rounded-xl px-3 py-2">
                <p className="text-gray-400 text-xs">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 text-gray-500 text-sm font-medium"
        >
          Sign Out
        </button>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
