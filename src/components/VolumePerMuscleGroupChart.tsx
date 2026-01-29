import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar, Legend } from "recharts";
import { analyticsApi } from "../services/api";

interface MuscleGroupVolume {
  muscle_group_id: string;
  muscle_group_name: string;
  total_volume: number;
  set_count: number;
  exercise_count: number;
}

interface VolumeData {
  period_days: number;
  start_date: string;
  end_date: string;
  data: MuscleGroupVolume[];
}

// Futuristic neon color palette
const NEON_COLORS = [
  { main: "#FFD700", glow: "rgba(255, 215, 0, 0.5)" },      // Gold
  { main: "#00FFFF", glow: "rgba(0, 255, 255, 0.5)" },      // Cyan
  { main: "#FF00FF", glow: "rgba(255, 0, 255, 0.5)" },      // Magenta
  { main: "#00FF88", glow: "rgba(0, 255, 136, 0.5)" },      // Neon Green
  { main: "#FF6B6B", glow: "rgba(255, 107, 107, 0.5)" },    // Coral
  { main: "#A855F7", glow: "rgba(168, 85, 247, 0.5)" },     // Purple
  { main: "#3B82F6", glow: "rgba(59, 130, 246, 0.5)" },     // Blue
  { main: "#F97316", glow: "rgba(249, 115, 22, 0.5)" },     // Orange
  { main: "#EC4899", glow: "rgba(236, 72, 153, 0.5)" },     // Pink
  { main: "#14B8A6", glow: "rgba(20, 184, 166, 0.5)" },     // Teal
];

export function VolumePerMuscleGroupChart() {
  const [data, setData] = useState<VolumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState(7);
  const [selectedBar, setSelectedBar] = useState<MuscleGroupVolume | null>(null);
  const [chartType, setChartType] = useState<"bar" | "radial">("bar");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [periodDays]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getVolumePerMuscleGroup(periodDays);
      setData(response);
      setSelectedBar(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load volume data");
    } finally {
      setLoading(false);
    }
  };

  const handleBarClick = (data: any) => {
    if (data && data.fullData) {
      setSelectedBar(data.fullData);
    }
  };

  // Calculate max volume for percentage calculations
  const maxVolume = data?.data ? Math.max(...data.data.map(d => d.total_volume)) : 0;

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500 via-cyan-500 to-purple-500 animate-pulse opacity-30 blur-xl" />
        <div className="relative glass-card rounded-3xl p-6 m-[1px]">
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gold-500/30 rounded-full animate-spin border-t-gold-500" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-cyan-500/20 rounded-full animate-ping" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-purple-500/20 blur-xl" />
        <div className="relative glass-card rounded-3xl p-6 m-[1px]">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={loadData} className="btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl group">
        {/* Animated border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/50 via-transparent to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
        <div className="relative glass-card rounded-3xl p-6 m-[1px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/20 to-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-bold text-gradient">Volume Analytics</h2>
            </div>
            <PeriodSelector value={periodDays} onChange={setPeriodDays} />
          </div>
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-500/10 to-purple-500/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-500/20 to-purple-500/20 animate-pulse" />
            </div>
            <p className="text-gray-400 mb-2 font-medium">No workout data available</p>
            <p className="text-sm text-gray-500">
              Start logging workouts to see your volume analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.data.map((item, index) => ({
    name: item.muscle_group_name,
    volume: item.total_volume,
    sets: item.set_count,
    exercises: item.exercise_count,
    fullData: item,
    color: NEON_COLORS[index % NEON_COLORS.length],
    fill: NEON_COLORS[index % NEON_COLORS.length].main,
    percentage: maxVolume > 0 ? (item.total_volume / maxVolume) * 100 : 0,
  }));

  // Radial chart data (top 6 for better visibility)
  const radialData = chartData.slice(0, 6).map((item, index) => ({
    ...item,
    fill: NEON_COLORS[index % NEON_COLORS.length].main,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/20 to-purple-500/20 rounded-xl blur-xl" />
          <div className="relative bg-black/90 border border-gold-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ 
                  backgroundColor: data.color?.main || data.fill,
                  boxShadow: `0 0 10px ${data.color?.glow || data.fill}`
                }} 
              />
              <p className="text-white font-semibold">{data.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gold-400 text-lg font-bold">
                {data.volume.toFixed(1)} <span className="text-sm font-normal text-gray-400">kg volume</span>
              </p>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{data.sets} sets</span>
                <span>•</span>
                <span>{data.exercises} exercises</span>
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
      
      {/* Scanning line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent animate-scan" />
      </div>

      <div className="relative glass-card rounded-3xl p-6 m-[1px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-purple-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-gradient">Volume Analytics</h2>
              <p className="text-xs text-gray-500">
                {new Date(data.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {new Date(data.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Chart Type Toggle */}
            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
              <button
                onClick={() => setChartType("bar")}
                className={`p-2 rounded-md transition-all ${
                  chartType === "bar"
                    ? "bg-gold-500 text-black"
                    : "text-gray-400"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              <button
                onClick={() => setChartType("radial")}
                className={`p-2 rounded-md transition-all ${
                  chartType === "radial"
                    ? "bg-gold-500 text-black"
                    : "text-gray-400"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </button>
            </div>
            
            <PeriodSelector value={periodDays} onChange={setPeriodDays} />
          </div>
        </div>

        {/* Chart */}
        {chartType === "bar" ? (
          <div className="w-full" style={{ height: "320px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 60 }}
              >
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color.main} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color.main} stopOpacity={0.3} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  axisLine={{ stroke: "#ffffff10" }}
                  tickLine={{ stroke: "#ffffff10" }}
                />
                <YAxis
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  axisLine={{ stroke: "#ffffff10" }}
                  tickLine={{ stroke: "#ffffff10" }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} />
                <Bar
                  dataKey="volume"
                  radius={[8, 8, 0, 0]}
                  onClick={handleBarClick}
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: "pointer" }}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#gradient-${index})`}
                      style={{
                        filter: hoveredIndex === index || selectedBar?.muscle_group_id === entry.fullData.muscle_group_id
                          ? `drop-shadow(0 0 12px ${entry.color.glow})`
                          : "none",
                        transition: "filter 0.3s ease",
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full" style={{ height: "320px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                barSize={18}
                data={radialData}
                startAngle={180}
                endAngle={-180}
              >
                <RadialBar
                  background={{ fill: "#ffffff08" }}
                  dataKey="volume"
                  cornerRadius={10}
                  onClick={handleBarClick}
                >
                  {radialData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color.main}
                      style={{
                        filter: selectedBar?.muscle_group_id === entry.fullData.muscle_group_id
                          ? `drop-shadow(0 0 12px ${entry.color.glow})`
                          : "none",
                      }}
                    />
                  ))}
                </RadialBar>
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed Breakdown */}
        {selectedBar && (
          <div className="mt-6 relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-purple-500/10 blur-xl" />
            <div className="relative p-5 bg-white/5 rounded-2xl border border-gold-500/20">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: NEON_COLORS[data.data.findIndex(d => d.muscle_group_id === selectedBar.muscle_group_id) % NEON_COLORS.length].main,
                      boxShadow: `0 0 15px ${NEON_COLORS[data.data.findIndex(d => d.muscle_group_id === selectedBar.muscle_group_id) % NEON_COLORS.length].glow}`
                    }}
                  />
                  <h3 className="text-lg font-semibold text-white">{selectedBar.muscle_group_name}</h3>
                </div>
                <button
                  onClick={() => setSelectedBar(null)}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  label="Total Volume"
                  value={`${(selectedBar.total_volume / 1000).toFixed(1)}k`}
                  unit="kg"
                  color="gold"
                />
                <StatCard
                  label="Sets"
                  value={selectedBar.set_count.toString()}
                  color="cyan"
                />
                <StatCard
                  label="Exercises"
                  value={selectedBar.exercise_count.toString()}
                  color="purple"
                />
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        {!selectedBar && (
          <div className="mt-6 flex flex-wrap gap-3">
            {chartData.slice(0, 6).map((item, index) => (
              <button
                key={item.name}
                onClick={() => setSelectedBar(item.fullData)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full transition-shadow"
                  style={{
                    backgroundColor: NEON_COLORS[index % NEON_COLORS.length].main,
                    boxShadow: `0 0 8px ${NEON_COLORS[index % NEON_COLORS.length].glow}`,
                  }}
                />
                <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{item.name}</span>
              </button>
            ))}
            {chartData.length > 6 && (
              <span className="flex items-center text-xs text-gray-500 px-2">+{chartData.length - 6} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Period Selector Component
function PeriodSelector({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div className="flex bg-white/5 rounded-xl p-1">
      {[7, 14, 30].map((days) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === days
              ? "bg-gradient-to-r from-gold-500 to-gold-600 text-black shadow-lg shadow-gold-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {days}d
        </button>
      ))}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color: "gold" | "cyan" | "purple" }) {
  const colors = {
    gold: { text: "text-gold-400", glow: "shadow-gold-500/20" },
    cyan: { text: "text-cyan-400", glow: "shadow-cyan-500/20" },
    purple: { text: "text-purple-400", glow: "shadow-purple-500/20" },
  };

  return (
    <div className={`text-center p-3 bg-black/30 rounded-xl ${colors[color].glow}`}>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color].text}`}>
        {value}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
