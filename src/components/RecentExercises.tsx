import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsApi } from "../services/api";

interface RecentExercise {
  exercise_id: string;
  exercise: {
    id: string;
    name: string;
    muscle_group?: {
      id: string;
      name: string;
    };
    equipment: string;
    is_compound?: boolean;
  };
  last_session_date: string;
  set_count: number;
}

export function RecentExercises() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<RecentExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentExercises();
  }, []);

  const loadRecentExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getRecentExercises(5, 30); // Show only 5 on dashboard
      setExercises(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load recent exercises");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/20 via-cyan-500/20 to-purple-500/20 opacity-30 blur-xl" />
        <div className="relative glass-card rounded-3xl p-6 m-[1px]">
          <div className="flex items-center justify-center py-8">
            <div className="text-gold-500">Loading exercises...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-3xl p-6 glow-border">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={loadRecentExercises} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
        <div className="relative glass-card rounded-3xl p-6 m-[1px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Recent Exercises</h2>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">No recent exercises</p>
            <p className="text-sm text-gray-500">
              Start logging workouts to see your exercise history here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl group">
      <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      <div className="relative glass-card rounded-2xl md:rounded-3xl p-4 md:p-6 m-[1px]">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-gold-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-lg md:text-xl">🏋️</span>
            </div>
            <h2 className="text-base md:text-xl font-semibold text-white">Recent Exercises</h2>
          </div>
          <button
            onClick={() => navigate("/exercises")}
            className="text-xs md:text-sm text-gold-500 active:text-gold-400 transition-colors font-medium"
          >
            All →
          </button>
        </div>

        <div className="space-y-2 md:space-y-3">
          {exercises.map((item, index) => {
            const exercise = item.exercise;
            return (
              <button
                key={item.exercise_id}
                onClick={() => navigate(`/exercises/${item.exercise_id}/history`)}
                className={`w-full p-3 md:p-4 bg-white/5 active:bg-white/10 border border-white/5 rounded-xl transition-all text-left animate-slide-up stagger-${index + 1}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                      <h3 className="font-semibold text-white text-sm md:text-base truncate">
                        {exercise.name}
                      </h3>
                      {exercise.is_compound && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-gold-500/20 text-gold-400 rounded text-[10px] md:text-xs font-medium">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] md:text-xs text-gray-400">
                      <span>{exercise.muscle_group?.name || "Unknown"}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="capitalize hidden md:inline">{exercise.equipment}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs md:text-sm text-gray-400">{formatDate(item.last_session_date)}</p>
                      <p className="text-[10px] text-gray-500 md:hidden">{item.set_count} sets</p>
                    </div>
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
