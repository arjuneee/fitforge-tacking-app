import { useState, useEffect } from "react";
import { analyticsApi } from "../services/api";

interface HeatmapDay {
  date: string;
  workout_count: number;
  total_volume: number;
  session_ids: string[];
}

interface ConsistencyData {
  period_days: number;
  start_date: string;
  end_date: string;
  days: HeatmapDay[];
  current_streak: number;
  longest_streak: number;
  weekly_average: number;
  total_workouts: number;
}

export function WorkoutConsistencyHeatmap() {
  const [data, setData] = useState<ConsistencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const periodDays = 365; // Always show 365 days

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getWorkoutConsistency(periodDays);
      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load consistency data");
    } finally {
      setLoading(false);
    }
  };

  const getIntensityLevel = (day: HeatmapDay): number => {
    if (day.workout_count === 0) return 0;
    // Calculate intensity based on workout count and volume
    // Level 1-4 based on workout count and volume
    if (day.workout_count >= 2) return 4;
    if (day.total_volume > 5000) return 4; // High volume
    if (day.total_volume > 2500) return 3; // Medium-high volume
    if (day.total_volume > 1000) return 2; // Medium volume
    return 1; // Low volume
  };

  const getColorClass = (intensity: number): string => {
    switch (intensity) {
      case 0:
        return "bg-gray-800 border-gray-700";
      case 1:
        return "bg-green-900 border-green-800";
      case 2:
        return "bg-green-700 border-green-600";
      case 3:
        return "bg-green-500 border-green-400";
      case 4:
        return "bg-green-400 border-green-300";
      default:
        return "bg-gray-800 border-gray-700";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  // Group days by week for display (GitHub-style: weeks as columns)
  // Returns array of weeks, where each week is an array of 7 days (Sun-Sat)
  const groupByWeek = (days: HeatmapDay[]): (HeatmapDay | null)[][] => {
    if (days.length === 0) return [];
    
    const weeks: (HeatmapDay | null)[][] = [];
    const dayMap = new Map<string, HeatmapDay>();
    days.forEach(day => dayMap.set(day.date, day));
    
    // Find first and last dates
    const firstDate = new Date(days[0].date);
    const lastDate = new Date(days[days.length - 1].date);
    
    // Start from the first Sunday before or on the first date
    const startDate = new Date(firstDate);
    const firstDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    // Build weeks
    const currentDate = new Date(startDate);
    let currentWeek: (HeatmapDay | null)[] = [];
    
    // Continue until we've covered the last date
    while (currentDate <= lastDate || currentWeek.length > 0) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const day = dayMap.get(dateKey) || null;
      currentWeek.push(day);
      
      // If we've filled a week (7 days), start a new one
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Stop if we've passed the last date and filled the current week
      if (currentDate > lastDate && currentWeek.length === 0) {
        break;
      }
    }
    
    // Add remaining days of the last week if any
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/30 via-cyan-500/30 to-purple-500/30 opacity-50 blur-xl transition-opacity duration-500" />
        <div className="relative glass-card rounded-3xl p-6 m-[1px]">
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gold-500/30 rounded-full animate-spin border-t-gold-500" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-3xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/30 via-cyan-500/30 to-purple-500/30 opacity-50 blur-xl transition-opacity duration-500" />
        <div className="relative glass-card rounded-3xl p-6 m-[1px]">
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={loadData} className="btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const weeks = groupByWeek(data.days);
  const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="relative overflow-hidden rounded-3xl group">
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold-500/30 via-cyan-500/30 to-purple-500/30 opacity-50 blur-xl transition-opacity duration-500" />
      
      <div className="relative glass-card rounded-3xl p-6 m-[1px]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-gradient">Workout Consistency</h2>
            <p className="text-xs text-gray-500">Track your workout frequency (Last 365 days)</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-black/30 rounded-xl border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-green-400">
              {data.current_streak} <span className="text-sm text-gray-500">days</span>
            </p>
          </div>
          <div className="p-4 bg-black/30 rounded-xl border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Longest Streak</p>
            <p className="text-2xl font-bold text-gold-400">
              {data.longest_streak} <span className="text-sm text-gray-500">days</span>
            </p>
          </div>
          <div className="p-4 bg-black/30 rounded-xl border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Weekly Avg</p>
            <p className="text-2xl font-bold text-white">
              {data.weekly_average.toFixed(1)} <span className="text-sm text-gray-500">workouts</span>
            </p>
          </div>
          <div className="p-4 bg-black/30 rounded-xl border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-violet-400">
              {data.total_workouts} <span className="text-sm text-gray-500">workouts</span>
            </p>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mb-4">
          <div className="flex justify-center overflow-x-auto pb-4">
            <div className="flex gap-1">
            {/* Week day labels */}
            <div className="flex flex-col gap-1 pr-2 flex-shrink-0">
              <div className="h-4"></div>
              {weekLabels.map((label, idx) => (
                <div key={idx} className="h-3 w-3 flex items-center justify-center">
                  <span className="text-[9px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIdx) => {
              // Find first non-null day in this week for month label
              const firstDay = week.find(d => d !== null);
              const weekStartDate = firstDay ? new Date(firstDay.date) : null;
              
              // Get previous week's month for comparison
              const previousWeek = weekIdx > 0 ? weeks[weekIdx - 1] : null;
              const prevFirstDay = previousWeek ? previousWeek.find(d => d !== null) : null;
              const prevWeekDate = prevFirstDay ? new Date(prevFirstDay.date) : null;
              
              // Show month label if it's the first week OR if the month changed from previous week
              const showMonthLabel = weekStartDate && (
                weekIdx === 0 || 
                (prevWeekDate && weekStartDate.getMonth() !== prevWeekDate.getMonth())
              );

              return (
                <div key={weekIdx} className="flex flex-col gap-1 flex-shrink-0">
                  {/* Month label */}
                  {showMonthLabel && weekStartDate ? (
                    <div className="h-4 flex items-center">
                      <span className="text-[9px] text-gray-500 whitespace-nowrap">
                        {weekStartDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>
                  ) : (
                    <div className="h-4"></div>
                  )}

                  {/* Days - week array is already ordered Sun-Sat */}
                  {week.map((day, dayIdx) => {
                    if (!day) {
                      return <div key={dayIdx} className="w-3 h-3 flex-shrink-0"></div>;
                    }

                    const intensity = getIntensityLevel(day);
                    const colorClass = getColorClass(intensity);
                    const isSelected = selectedDay?.date === day.date;

                    return (
                      <button
                        key={dayIdx}
                        onClick={() => setSelectedDay(day)}
                        className={`w-3 h-3 rounded-sm border transition-all hover:scale-125 hover:z-10 relative flex-shrink-0 ${colorClass} ${
                          isSelected ? "ring-2 ring-gold-500 ring-offset-1 ring-offset-black scale-125" : ""
                        }`}
                        title={`${formatDate(day.date)}: ${day.workout_count} workout(s), ${day.total_volume.toFixed(0)}kg volume`}
                      />
                    );
                  })}
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-800 border border-gray-700" />
            <div className="w-3 h-3 rounded-sm bg-green-900 border border-green-800" />
            <div className="w-3 h-3 rounded-sm bg-green-700 border border-green-600" />
            <div className="w-3 h-3 rounded-sm bg-green-500 border border-green-400" />
            <div className="w-3 h-3 rounded-sm bg-green-400 border border-green-300" />
          </div>
          <span>More</span>
        </div>

        {/* Selected Day Summary */}
        {selectedDay && selectedDay.workout_count > 0 && (
          <div className="mt-4 p-4 bg-black/30 rounded-xl border border-gold-500/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">{formatDate(selectedDay.date)}</h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Workouts</p>
                <p className="text-lg font-bold text-white">{selectedDay.workout_count}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Volume</p>
                <p className="text-lg font-bold text-gold-400">{selectedDay.total_volume.toFixed(0)} kg</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
