import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { analyticsApi, exercisesApi, type Exercise } from "../services/api";

interface HistoryPoint {
  date: string;
  estimated_1rm: number;
  weight_kg: number;
  reps: number;
}

interface HistoryData {
  exercise_id: string;
  exercise_name: string;
  period_days: number;
  start_date: string;
  end_date: string;
  data: HistoryPoint[];
  trend: "improving" | "maintaining" | "declining" | null;
  trend_percentage: number | null;
}

export function StrengthProgressionChart() {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [periodDays, setPeriodDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    if (selectedExerciseId) {
      loadHistory();
    } else {
      setHistoryData(null);
    }
  }, [selectedExerciseId, periodDays]);

  const loadExercises = async () => {
    try {
      setLoadingExercises(true);
      const response = await analyticsApi.getRecentExercises(50, 365); // Get exercises from last year
      const exerciseList = response.data || [];
      
      // Extract unique exercises from the response
      // Response format: [{ exercise_id, exercise: { id, name, ... }, last_session_date, set_count }, ...]
      const uniqueExercisesMap = new Map<string, Exercise>();
      
      for (const item of exerciseList) {
        if (item.exercise && item.exercise.id) {
          uniqueExercisesMap.set(item.exercise.id, item.exercise);
        }
      }
      
      const uniqueExercises = Array.from(uniqueExercisesMap.values());
      setExercises(uniqueExercises);
      
      // Auto-select first exercise if available
      if (uniqueExercises.length > 0 && !selectedExerciseId) {
        setSelectedExerciseId(uniqueExercises[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load exercises");
    } finally {
      setLoadingExercises(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedExerciseId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getOneRepMaxHistory(selectedExerciseId, periodDays);
      setHistoryData(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load progression data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getTrendColor = (trend: string | null) => {
    switch (trend) {
      case "improving":
        return "text-green-400";
      case "declining":
        return "text-red-400";
      case "maintaining":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "improving":
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case "declining":
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case "maintaining":
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Prepare chart data
  const chartData = historyData?.data.map(point => ({
    date: formatDate(point.date),
    dateFull: point.date,
    "1RM (kg)": point.estimated_1rm,
    weight: point.weight_kg,
    reps: point.reps,
  })) || [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/20 to-purple-500/20 rounded-xl blur-xl" />
          <div className="relative bg-black/90 border border-gold-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
            <p className="text-white font-semibold mb-2">{data.dateFull}</p>
            <div className="space-y-1">
              <p className="text-gold-400 text-lg font-bold">
                {data["1RM (kg)"].toFixed(1)} <span className="text-sm font-normal text-gray-400">kg (1RM)</span>
              </p>
              <div className="flex gap-3 text-xs text-gray-400 pt-2 border-t border-white/10">
                <span>Best Set: {data.weight}kg × {data.reps}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl group">
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold-500/30 via-cyan-500/30 to-purple-500/30 opacity-50 blur-xl transition-opacity duration-500" />
      
      <div className="relative glass-card rounded-3xl p-6 m-[1px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-gradient">Strength Progression</h2>
              <p className="text-xs text-gray-500">Track your 1RM over time</p>
            </div>
          </div>
        </div>

        {/* Exercise Selector and Period Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Exercise Selector */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Exercise</label>
            {loadingExercises ? (
              <div className="input-field text-gray-500">Loading exercises...</div>
            ) : (
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="input-field"
                disabled={exercises.length === 0}
              >
                <option value="">Select an exercise...</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Time Period</label>
            <div className="flex bg-white/5 rounded-xl p-1">
              {[30, 90, 180, 365].map((days) => (
                <button
                  key={days}
                  onClick={() => setPeriodDays(days)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    periodDays === days
                      ? "bg-gradient-to-r from-gold-500 to-gold-600 text-black shadow-lg shadow-gold-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gold-500/30 rounded-full animate-spin border-t-gold-500" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={loadHistory} className="btn-primary">
              Retry
            </button>
          </div>
        )}

        {/* Empty State - No Exercise Selected */}
        {!loading && !error && !selectedExerciseId && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">Select an exercise to view progression</p>
            <p className="text-sm text-gray-500">
              Choose an exercise from the dropdown above
            </p>
          </div>
        )}

        {/* Empty State - Insufficient Data */}
        {!loading && !error && selectedExerciseId && historyData && historyData.data.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">Insufficient data</p>
            <p className="text-sm text-gray-500">
              Not enough workout data for {historyData.exercise_name} in the selected period
            </p>
          </div>
        )}

        {/* Chart */}
        {!loading && !error && historyData && historyData.data.length > 0 && (
          <>
            {/* Trend Indicator */}
            {historyData.trend && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTrendIcon(historyData.trend)}
                    <div>
                      <p className={`text-sm font-semibold ${getTrendColor(historyData.trend)} capitalize`}>
                        {historyData.trend}
                      </p>
                      {historyData.trend_percentage !== null && (
                        <p className="text-xs text-gray-400">
                          {historyData.trend_percentage > 0 ? "+" : ""}{historyData.trend_percentage}% change
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Period</p>
                    <p className="text-sm text-white">
                      {new Date(historyData.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(historyData.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD700" stopOpacity={1} />
                      <stop offset="100%" stopColor="#FFD700" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#ffffff10" }}
                    tickLine={{ stroke: "#ffffff10" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#ffffff10" }}
                    tickLine={{ stroke: "#ffffff10" }}
                    label={{ value: "1RM (kg)", angle: -90, position: "insideLeft", fill: "#9CA3AF" }}
                    tickFormatter={(value) => `${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="1RM (kg)"
                    stroke="#FFD700"
                    strokeWidth={3}
                    dot={{ fill: "#FFD700", r: 4, strokeWidth: 2, stroke: "#000" }}
                    activeDot={{ r: 6, fill: "#FFD700", stroke: "#000", strokeWidth: 2 }}
                    style={{ filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            {historyData.data.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-black/30 rounded-xl">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Starting 1RM</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {historyData.data[0].estimated_1rm.toFixed(1)} <span className="text-sm text-gray-500">kg</span>
                  </p>
                </div>
                <div className="text-center p-3 bg-black/30 rounded-xl">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Current 1RM</p>
                  <p className="text-2xl font-bold text-gold-400">
                    {historyData.data[historyData.data.length - 1].estimated_1rm.toFixed(1)} <span className="text-sm text-gray-500">kg</span>
                  </p>
                </div>
                <div className="text-center p-3 bg-black/30 rounded-xl">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Data Points</p>
                  <p className="text-2xl font-bold text-white">
                    {historyData.data.length}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
