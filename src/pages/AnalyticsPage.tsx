import { useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { VolumePerMuscleGroupChart } from "../components/VolumePerMuscleGroupChart";
import { StrengthProgressionChart } from "../components/StrengthProgressionChart";
import { WorkoutConsistencyHeatmap } from "../components/WorkoutConsistencyHeatmap";
import { WeightTrendChart } from "../components/WeightTrendChart";
import { BMRTDEECalculator } from "../components/BMRTDEECalculator";
import { RecentExercises } from "../components/RecentExercises";

type TabType = "overview" | "strength" | "body" | "calories";

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "strength", label: "Strength", icon: "💪" },
    { id: "body", label: "Body", icon: "⚖️" },
    { id: "calories", label: "Calories", icon: "🔥" },
  ];

  return (
    <PageLayout title="Analytics" showBackButton>
      {/* Tabs */}
      <div className="bg-white/5 rounded-2xl p-1.5 mb-4 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-gold-500 text-black"
                : "text-gray-400"
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "overview" && (
          <>
            {/* Consistency Heatmap */}
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <span className="text-lg">🔥</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Workout Streak</p>
                    <p className="text-gray-500 text-xs">Your consistency over time</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <WorkoutConsistencyHeatmap />
              </div>
            </div>

            {/* Volume Chart */}
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Volume by Muscle</p>
                    <p className="text-gray-500 text-xs">Weekly training volume</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <VolumePerMuscleGroupChart />
              </div>
            </div>

            {/* Recent Exercises */}
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-lg">🏋️</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Recent Exercises</p>
                    <p className="text-gray-500 text-xs">Your latest activity</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <RecentExercises />
              </div>
            </div>
          </>
        )}

        {activeTab === "strength" && (
          <>
            {/* Strength Progression */}
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                    <span className="text-lg">📈</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Strength Progress</p>
                    <p className="text-gray-500 text-xs">Estimated 1RM over time</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <StrengthProgressionChart />
              </div>
            </div>
          </>
        )}

        {activeTab === "body" && (
          <>
            {/* Weight Trend */}
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <span className="text-lg">⚖️</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Weight Trend</p>
                    <p className="text-gray-500 text-xs">Body weight over time</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <WeightTrendChart />
              </div>
            </div>
          </>
        )}

        {activeTab === "calories" && (
          <>
            {/* BMR/TDEE Calculator */}
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <span className="text-lg">🔥</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Calorie Calculator</p>
                    <p className="text-gray-500 text-xs">BMR & TDEE estimates</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <BMRTDEECalculator />
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
