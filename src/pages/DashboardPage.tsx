import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { VolumePerMuscleGroupChart } from "../components/VolumePerMuscleGroupChart";
import { RecentExercises } from "../components/RecentExercises";
import { StrengthProgressionChart } from "../components/StrengthProgressionChart";
import { WorkoutConsistencyHeatmap } from "../components/WorkoutConsistencyHeatmap";
import { WeightTrendChart } from "../components/WeightTrendChart";
import { QuickWeightLog } from "../components/QuickWeightLog";
import { BMRTDEECalculator } from "../components/BMRTDEECalculator";
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
  const { isAvailable, promptInstall, hasNativePrompt } = useInstallPrompt();
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

  return (
    <div className="min-h-dvh relative overflow-hidden pb-20 md:pb-8">
      {/* Background - optimized for mobile */}
      <div className="fixed inset-0 bg-black -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-black to-gold-900/5" />
        <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Header - Mobile: Icons only */}
      <header className="sticky top-0 z-50 glass-card border-t-0 border-x-0 rounded-none safe-top">
        <div className="max-w-6xl mx-auto px-3 md:px-4 py-2.5 md:py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="font-display font-bold text-sm md:text-xl text-gradient tracking-wide">FITFORGE</span>
          </div>
          
          {/* Desktop buttons - with text */}
          <div className="hidden md:flex items-center gap-3">
            {isAvailable && (
              <button
                onClick={promptInstall}
                className="btn-secondary text-sm flex items-center gap-2"
                title={hasNativePrompt ? "Install App" : "Install App (tap for instructions)"}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install
              </button>
            )}
            <button
              onClick={() => navigate("/profile")}
              className="btn-secondary text-sm flex items-center gap-2"
              title="Edit Profile"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button
              onClick={handleSignOut}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Mobile buttons - icons only */}
          <div className="flex md:hidden items-center gap-1">
            {isAvailable && (
              <button
                onClick={promptInstall}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gold-500/20 text-gold-500 active:bg-gold-500/30"
                title="Install App"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-gray-300 active:bg-white/10"
              title="Profile"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button
              onClick={handleSignOut}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-gray-300 active:bg-white/10"
              title="Sign Out"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 md:px-4 py-3 md:py-8">
        {/* Welcome Banner - Compact on mobile */}
        <div className="glass-card rounded-xl md:rounded-3xl p-3 md:p-8 mb-3 md:mb-8 glow-border relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-24 md:w-64 h-24 md:h-64 bg-gradient-to-br from-gold-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <p className="text-gray-400 text-[10px] md:text-sm uppercase tracking-wider mb-0.5 md:mb-2">Welcome back</p>
            <h1 className="text-base md:text-3xl font-bold text-white mb-0.5 md:mb-2">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "Athlete"}
            </h1>
            <p className="text-gray-500 text-xs md:text-base">Ready to crush your goals today?</p>
          </div>
        </div>

        {/* Stats Grid - Mobile optimized with smaller fonts */}
        <div className="grid grid-cols-4 gap-1.5 md:grid-cols-4 md:gap-4 mb-3 md:mb-8">
          {[
            { 
              label: "Workouts", 
              value: statsLoading ? "..." : stats.total_workouts.toString(), 
              icon: "🏋️", 
              color: "gold" 
            },
            { 
              label: "Volume", 
              value: statsLoading ? "..." : `${(stats.total_volume_kg / 1000).toFixed(1)}t`, 
              fullValue: statsLoading ? "..." : `${stats.total_volume_kg.toFixed(0)} kg`,
              icon: "📊", 
              color: "violet" 
            },
            { 
              label: "Streak", 
              value: statsLoading ? "..." : `${stats.current_streak_days}d`, 
              fullValue: statsLoading ? "..." : `${stats.current_streak_days} days`,
              icon: "🔥", 
              color: "gold" 
            },
            { 
              label: "PRs", 
              value: statsLoading ? "..." : stats.total_prs.toString(), 
              icon: "🏆", 
              color: "violet" 
            },
          ].map((stat, i) => (
            <div 
              key={i} 
              className={`glass-card rounded-lg md:rounded-2xl p-2 md:p-5 hover:border-gold-500/30 transition-all group animate-slide-up stagger-${i + 1}`}
            >
              <div className="flex items-center justify-between mb-1 md:mb-3">
                <span className="text-sm md:text-2xl">{stat.icon}</span>
                <span className={`w-1 h-1 md:w-2 md:h-2 rounded-full ${stat.color === 'gold' ? 'bg-gold-500' : 'bg-violet-500'} opacity-60`} />
              </div>
              <p className="text-sm md:text-2xl font-bold text-white mb-0 md:mb-1">
                <span className="md:hidden">{stat.value}</span>
                <span className="hidden md:inline">{stat.fullValue || stat.value}</span>
              </p>
              <p className="text-[8px] md:text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Start Workout CTA - Compact on mobile */}
        <button
          onClick={() => navigate("/workouts/start")}
          className="w-full glass-card rounded-xl md:rounded-2xl p-3 md:p-6 mb-3 md:mb-8 glow-border flex items-center justify-between group active:scale-[0.98] transition-transform animate-slide-up"
        >
          <div className="flex items-center gap-2.5 md:gap-4">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-white text-sm md:text-xl">Start Workout</p>
              <p className="text-gray-400 text-[10px] md:text-sm">Begin a new session</p>
            </div>
          </div>
          <svg className="w-5 h-5 md:w-6 md:h-6 text-gold-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Quick Actions Grid - Smaller on mobile */}
        <div className="glass-card rounded-xl md:rounded-3xl p-2.5 md:p-6 mb-3 md:mb-8">
          <h2 className="text-xs md:text-lg font-semibold text-white mb-2 md:mb-4 flex items-center gap-1.5 px-1">
            <svg className="w-3.5 h-3.5 md:w-5 md:h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-3">
            {[
              { label: "Programs", desc: "Training plans", icon: "programs", link: "/programs" },
              { label: "PRs", desc: "Records", icon: "trophy", link: "/personal-records" },
              { label: "Weight", desc: "Log weight", icon: "scale", link: "/weight-log" },
              { label: "Profile", desc: "Settings", icon: "profile", link: "/profile" },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => action.link && navigate(action.link)}
                className={`flex flex-col items-center justify-center p-2 md:p-4 rounded-lg md:rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 transition-all text-center group w-full active:scale-95 animate-slide-up stagger-${i + 1}`}
              >
                <div className="w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 flex items-center justify-center transition-colors mb-1 md:mb-2">
                  {action.icon === "scale" && (
                    <svg className="w-3.5 h-3.5 md:w-5 md:h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  )}
                  {action.icon === "programs" && (
                    <svg className="w-3.5 h-3.5 md:w-5 md:h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                  {action.icon === "trophy" && (
                    <svg className="w-3.5 h-3.5 md:w-5 md:h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  )}
                  {action.icon === "profile" && (
                    <svg className="w-3.5 h-3.5 md:w-5 md:h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <p className="font-medium text-white text-[10px] md:text-base">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Volume Per Muscle Group Chart */}
        <div className="mb-3 md:mb-8">
          <VolumePerMuscleGroupChart />
        </div>

        {/* Recent Exercises */}
        <div className="mb-3 md:mb-8">
          <RecentExercises />
        </div>

        {/* Strength Progression Chart */}
        <div className="mb-3 md:mb-8">
          <StrengthProgressionChart />
        </div>

        {/* Workout Consistency Heatmap */}
        <div className="mb-3 md:mb-8">
          <WorkoutConsistencyHeatmap />
        </div>

        {/* Quick Weight Log */}
        <div className="mb-3 md:mb-8">
          <QuickWeightLog />
        </div>

        {/* Weight Trend Chart */}
        <div className="mb-3 md:mb-8">
          <WeightTrendChart />
        </div>

        {/* BMR & TDEE Calculator */}
        <div className="mb-3 md:mb-8">
          <BMRTDEECalculator />
        </div>

        {/* Coming Soon - Version 2 Features */}
        <div className="glass-card rounded-xl md:rounded-3xl p-3 md:p-8">
          <div className="flex items-center gap-2 mb-3 md:mb-6">
            <div className="inline-flex items-center justify-center w-7 h-7 md:w-12 md:h-12 rounded-full bg-violet-500/20">
              <svg className="w-3.5 h-3.5 md:w-6 md:h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
            </div>
            <h3 className="text-xs md:text-xl font-semibold text-white">Version 2 Coming Soon</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 md:gap-4">
            {/* Progress Tracking */}
            <div className="p-2 md:p-3 bg-white/5 rounded-lg md:rounded-xl">
              <h4 className="text-[10px] md:text-xs font-semibold text-gold-400 mb-1 md:mb-2">📸 Progress</h4>
              <div className="space-y-0.5 text-[9px] md:text-xs text-gray-400">
                <div>Photos</div>
                <div>Compare</div>
              </div>
            </div>

            {/* Tools & Calculators */}
            <div className="p-2 md:p-3 bg-white/5 rounded-lg md:rounded-xl">
              <h4 className="text-[10px] md:text-xs font-semibold text-gold-400 mb-1 md:mb-2">🔧 Tools</h4>
              <div className="space-y-0.5 text-[9px] md:text-xs text-gray-400">
                <div>Plate Calc</div>
                <div>Rest Timer</div>
              </div>
            </div>

            {/* Notifications & Updates */}
            <div className="p-2 md:p-3 bg-white/5 rounded-lg md:rounded-xl">
              <h4 className="text-[10px] md:text-xs font-semibold text-gold-400 mb-1 md:mb-2">🔔 Notifs</h4>
              <div className="space-y-0.5 text-[9px] md:text-xs text-gray-400">
                <div>Push</div>
                <div>Weekly</div>
              </div>
            </div>

            {/* Settings & Preferences */}
            <div className="p-2 md:p-3 bg-white/5 rounded-lg md:rounded-xl">
              <h4 className="text-[10px] md:text-xs font-semibold text-gold-400 mb-1 md:mb-2">⚙️ Settings</h4>
              <div className="space-y-0.5 text-[9px] md:text-xs text-gray-400">
                <div>Units</div>
                <div>Export</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
