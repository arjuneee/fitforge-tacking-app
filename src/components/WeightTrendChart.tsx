import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { analyticsApi } from "../services/api";

interface WeightDataPoint {
  date: string;
  weight_kg: number;
  moving_average: number | null;
}

interface WeightTrendData {
  period_days: number;
  start_date: string;
  end_date: string;
  data: WeightDataPoint[];
  start_weight: number | null;
  current_weight: number | null;
  weight_change: number | null;
  rate_of_change_kg_per_week: number | null;
  goal_weight: number | null;
}

export function WeightTrendChart() {
  const [data, setData] = useState<WeightTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState(90);

  useEffect(() => {
    loadData();
  }, [periodDays]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getWeightTrend(periodDays);
      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load weight trend data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Prepare chart data
  const chartData = data?.data.map(point => ({
    date: formatDate(point.date),
    dateFull: point.date,
    "Weight (kg)": point.weight_kg,
    "7-Day Avg": point.moving_average,
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
              {payload.map((entry: any, idx: number) => (
                <p key={idx} className={`text-lg font-bold ${entry.color === "#FFD700" ? "text-gold-400" : "text-cyan-400"}`}>
                  {entry.value?.toFixed(1) || "N/A"} <span className="text-sm font-normal text-gray-400">kg</span>
                  <span className="text-xs text-gray-500 ml-2">({entry.name})</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return "text-gray-400";
    if (change > 0) return "text-red-400";
    if (change < 0) return "text-green-400";
    return "text-gray-400";
  };

  const getChangeIcon = (change: number | null) => {
    if (change === null) return null;
    if (change > 0) {
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    if (change < 0) {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-3xl group">
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold-500/30 via-cyan-500/30 to-purple-500/30 opacity-50 blur-xl transition-opacity duration-500" />
      
      <div className="relative glass-card rounded-3xl p-6 m-[1px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-gradient">Body Weight Trend</h2>
              <p className="text-xs text-gray-500">Track your bulk/cut progress</p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex bg-white/5 rounded-xl p-1">
            {[30, 90, 180, 365].map((days) => (
              <button
                key={days}
                onClick={() => setPeriodDays(days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gold-500/30 rounded-full animate-spin border-t-gold-500" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={loadData} className="btn-primary">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data && data.data.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">No weight data available</p>
            <p className="text-sm text-gray-500">
              Start logging your weight to see your progress here
            </p>
          </div>
        )}

        {/* Chart and Stats */}
        {!loading && !error && data && data.data.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Start Weight</p>
                <p className="text-2xl font-bold text-white">
                  {data.start_weight?.toFixed(1) || "N/A"} <span className="text-sm text-gray-500">kg</span>
                </p>
              </div>
              <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Current Weight</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {data.current_weight?.toFixed(1) || "N/A"} <span className="text-sm text-gray-500">kg</span>
                </p>
              </div>
              <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Change</p>
                <div className="flex items-center gap-2">
                  {getChangeIcon(data.weight_change)}
                  <p className={`text-2xl font-bold ${getChangeColor(data.weight_change)}`}>
                    {data.weight_change !== null ? (data.weight_change > 0 ? "+" : "") + data.weight_change.toFixed(1) : "N/A"} <span className="text-sm text-gray-500">kg</span>
                  </p>
                </div>
              </div>
              <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Rate of Change</p>
                <p className={`text-2xl font-bold ${getChangeColor(data.rate_of_change_kg_per_week)}`}>
                  {data.rate_of_change_kg_per_week !== null ? (data.rate_of_change_kg_per_week > 0 ? "+" : "") + data.rate_of_change_kg_per_week.toFixed(2) : "N/A"} <span className="text-sm text-gray-500">kg/wk</span>
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="w-full" style={{ height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
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
                    label={{ value: "Weight (kg)", angle: -90, position: "insideLeft", fill: "#9CA3AF" }}
                    tickFormatter={(value) => `${value.toFixed(1)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {data.goal_weight && (
                    <ReferenceLine
                      y={data.goal_weight}
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{ value: "Goal", position: "right", fill: "#10B981", fontSize: 11 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="7-Day Avg"
                    stroke="#FFD700"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#FFD700", stroke: "#000", strokeWidth: 2 }}
                    style={{ filter: "drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))" }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Weight (kg)"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    dot={{ fill: "#06B6D4", r: 3, strokeWidth: 1, stroke: "#000" }}
                    activeDot={{ r: 5, fill: "#06B6D4", stroke: "#000", strokeWidth: 2 }}
                    style={{ filter: "drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))" }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                    formatter={(value) => (
                      <span className="text-gray-400 text-xs">{value}</span>
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Goal Weight Info */}
            {data.goal_weight && (
              <div className="mt-4 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-300">
                    Goal Weight: <span className="font-semibold text-green-400">{data.goal_weight.toFixed(1)} kg</span>
                    {data.current_weight && (
                      <span className="ml-2">
                        ({data.current_weight > data.goal_weight ? "↓ " : "↑ "}
                        {Math.abs(data.current_weight - data.goal_weight).toFixed(1)} kg {data.current_weight > data.goal_weight ? "to go" : "above"})
                      </span>
                    )}
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
