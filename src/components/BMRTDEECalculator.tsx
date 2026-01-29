import { useState, useEffect } from "react";
import { api } from "../services/api";

type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active";

interface BMRTDEEData {
  bmr: number;
  tdee: Record<ActivityLevel, number>;
  calorie_targets: {
    maintain: number;
    cut: number;
    bulk: number;
  };
  activity_level_used: ActivityLevel;
  primary_tdee: number;
}

const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: { label: "Sedentary", description: "Little to no exercise" },
  lightly_active: { label: "Lightly Active", description: "Light exercise 1-3 days/week" },
  moderately_active: { label: "Moderately Active", description: "Moderate exercise 3-5 days/week" },
  very_active: { label: "Very Active", description: "Hard exercise 6-7 days/week" },
  extremely_active: { label: "Extremely Active", description: "Very hard exercise, physical job" },
};

export function BMRTDEECalculator() {
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderately_active");
  const [data, setData] = useState<BMRTDEEData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBMRTDEE = async (level: ActivityLevel) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<BMRTDEEData>(`/users/bmr-tdee?activity_level=${level}`);
      setData(response.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to calculate BMR/TDEE";
      setError(errorMsg);
      console.error("[BMR/TDEE] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBMRTDEE(activityLevel);
  }, [activityLevel]);

  if (loading && !data) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-display font-bold text-gradient mb-4">BMR & TDEE Calculator</h2>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          <p className="font-medium">{error}</p>
          {error.includes("Missing required profile data") && (
            <p className="text-sm mt-2 text-red-300">
              Please update your profile with height, weight, date of birth, and gender to use this calculator.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold text-gradient">BMR & TDEE Calculator</h2>
        <div className="text-xs text-gray-400">Mifflin-St Jeor Formula</div>
      </div>

      {/* Activity Level Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Activity Level</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setActivityLevel(level)}
              className={`px-4 py-3 rounded-lg border transition-all text-left ${
                activityLevel === level
                  ? "border-gold-500 bg-gold-500/10 text-gold-400"
                  : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"
              }`}
            >
              <div className="font-medium text-sm">{ACTIVITY_LEVELS[level].label}</div>
              <div className="text-xs text-gray-400 mt-1">{ACTIVITY_LEVELS[level].description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* BMR Display */}
      <div className="bg-gradient-to-br from-violet-500/10 to-gold-500/10 border border-violet-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Basal Metabolic Rate</div>
            <div className="text-3xl font-bold text-gradient mt-1">{data.bmr.toFixed(0)}</div>
            <div className="text-xs text-gray-400 mt-1">calories/day at rest</div>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-gold-500/20 flex items-center justify-center border border-violet-500/30">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Primary TDEE */}
      <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/10 border border-gold-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Total Daily Energy Expenditure</div>
            <div className="text-3xl font-bold text-gold-400 mt-1">{data.primary_tdee.toFixed(0)}</div>
            <div className="text-xs text-gray-400 mt-1">
              {ACTIVITY_LEVELS[data.activity_level_used].label}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Based on</div>
            <div className="text-sm font-medium text-gold-400">{data.bmr.toFixed(0)} BMR</div>
            <div className="text-xs text-gray-400">× Activity Multiplier</div>
          </div>
        </div>
      </div>

      {/* Calorie Targets */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-300">Calorie Targets</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Maintain</div>
            <div className="text-xl font-bold text-gray-200">{data.calorie_targets.maintain}</div>
            <div className="text-xs text-gray-500 mt-1">cal/day</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
            <div className="text-xs text-red-400 mb-1">Cut (-500)</div>
            <div className="text-xl font-bold text-red-400">{data.calorie_targets.cut}</div>
            <div className="text-xs text-red-500/70 mt-1">cal/day</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
            <div className="text-xs text-green-400 mb-1">Bulk (+300)</div>
            <div className="text-xl font-bold text-green-400">{data.calorie_targets.bulk}</div>
            <div className="text-xs text-green-500/70 mt-1">cal/day</div>
          </div>
        </div>
      </div>

      {/* All TDEE Levels */}
      <div className="space-y-2 pt-2 border-t border-gray-700">
        <div className="text-sm font-medium text-gray-300">TDEE by Activity Level</div>
        <div className="space-y-1.5">
          {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((level) => (
            <div
              key={level}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                level === activityLevel
                  ? "bg-gold-500/10 border border-gold-500/30"
                  : "bg-gray-800/30 border border-gray-700/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{ACTIVITY_LEVELS[level].label}</span>
                {level === activityLevel && (
                  <span className="text-xs px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded">Selected</span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-200">{data.tdee[level].toFixed(0)} cal</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
