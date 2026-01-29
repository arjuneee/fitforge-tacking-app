import { PageLayout } from "../components/PageLayout";
import { VolumePerMuscleGroupChart } from "../components/VolumePerMuscleGroupChart";
import { StrengthProgressionChart } from "../components/StrengthProgressionChart";
import { WorkoutConsistencyHeatmap } from "../components/WorkoutConsistencyHeatmap";
import { WeightTrendChart } from "../components/WeightTrendChart";
import { BMRTDEECalculator } from "../components/BMRTDEECalculator";
import { RecentExercises } from "../components/RecentExercises";

export function AnalyticsPage() {
  return (
    <PageLayout title="Analytics" showBackButton={true}>
      <div className="space-y-4 md:space-y-8">
        {/* Page Intro */}
        <div className="text-center mb-2">
          <p className="text-gray-400 text-xs md:text-sm">
            Track your fitness journey with detailed insights
          </p>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card rounded-lg p-3 text-center">
            <span className="text-lg">📊</span>
            <p className="text-[10px] text-gray-400 mt-1">Volume</p>
          </div>
          <div className="glass-card rounded-lg p-3 text-center">
            <span className="text-lg">💪</span>
            <p className="text-[10px] text-gray-400 mt-1">Strength</p>
          </div>
          <div className="glass-card rounded-lg p-3 text-center">
            <span className="text-lg">📈</span>
            <p className="text-[10px] text-gray-400 mt-1">Progress</p>
          </div>
        </div>

        {/* Workout Consistency Heatmap */}
        <section>
          <h2 className="text-sm md:text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-gold-500">🔥</span>
            Workout Consistency
          </h2>
          <WorkoutConsistencyHeatmap />
        </section>

        {/* Volume Per Muscle Group */}
        <section>
          <h2 className="text-sm md:text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-gold-500">💪</span>
            Volume by Muscle
          </h2>
          <VolumePerMuscleGroupChart />
        </section>

        {/* Strength Progression */}
        <section>
          <h2 className="text-sm md:text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-gold-500">📈</span>
            Strength Progress
          </h2>
          <StrengthProgressionChart />
        </section>

        {/* Weight Trend */}
        <section>
          <h2 className="text-sm md:text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-gold-500">⚖️</span>
            Weight Trend
          </h2>
          <WeightTrendChart />
        </section>

        {/* BMR/TDEE Calculator */}
        <section>
          <h2 className="text-sm md:text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-gold-500">🔥</span>
            Calorie Calculator
          </h2>
          <BMRTDEECalculator />
        </section>

        {/* Recent Exercises */}
        <section>
          <h2 className="text-sm md:text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-gold-500">🏋️</span>
            Recent Exercises
          </h2>
          <RecentExercises />
        </section>
      </div>
    </PageLayout>
  );
}
