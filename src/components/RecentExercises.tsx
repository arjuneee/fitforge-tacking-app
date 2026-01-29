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
    <div className="relative overflow-hidden rounded-3xl group">
      <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      <div className="relative glass-card rounded-3xl p-6 m-[1px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Recent Exercises</h2>
          </div>
        </div>

        <div className="space-y-3">
          {exercises.map((item) => {
            const exercise = item.exercise;
            return (
              <button
                key={item.exercise_id}
                onClick={() => navigate(`/exercises/${item.exercise_id}/history`)}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-xl transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors">
                        {exercise.name}
                      </h3>
                      {exercise.is_compound && (
                        <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded text-xs font-medium">
                          Compound
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>{exercise.muscle_group?.name || "Unknown"}</span>
                      <span>•</span>
                      <span className="capitalize">{exercise.equipment}</span>
                      <span>•</span>
                      <span>{item.set_count} sets</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Last session</p>
                      <p className="text-sm text-gray-400">{formatDate(item.last_session_date)}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-gold-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {exercises.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <button
              onClick={() => navigate("/exercises")}
              className="text-sm text-gold-500 hover:text-gold-400 transition-colors font-medium"
            >
              View All Exercises →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
