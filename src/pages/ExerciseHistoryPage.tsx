import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { analyticsApi, exercisesApi, type Exercise } from "../services/api";

interface OneRepMaxData {
  current_1rm: number | null;
  pr_1rm: number | null;
  pr_date: string | null;
  previous_1rm: number | null;
  previous_date: string | null;
  trend: "up" | "down" | "same" | "new" | null;
}

export function ExerciseHistoryPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [oneRepMax, setOneRepMax] = useState<OneRepMaxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exerciseId) {
      loadData();
    }
  }, [exerciseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load exercise details
      const exercises = await exercisesApi.list();
      const foundExercise = exercises.data?.find((e: Exercise) => e.id === exerciseId);
      
      if (!foundExercise) {
        setError("Exercise not found");
        return;
      }
      
      setExercise(foundExercise);
      
      // Load 1RM data
      const oneRepMaxData = await analyticsApi.getOneRepMax(exerciseId);
      setOneRepMax(oneRepMaxData);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load exercise data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading...</div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Exercise not found"}</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "up":
        return (
          <div className="flex items-center gap-1 text-green-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm font-medium">Improved</span>
          </div>
        );
      case "down":
        return (
          <div className="flex items-center gap-1 text-red-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            <span className="text-sm font-medium">Decreased</span>
          </div>
        );
      case "new":
        return (
          <div className="flex items-center gap-1 text-gold-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-sm font-medium">New Record</span>
          </div>
        );
      case "same":
        return (
          <div className="flex items-center gap-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
            <span className="text-sm font-medium">Same</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gold-500 hover:text-gold-400 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Exercise Info */}
        <div className="glass-card rounded-3xl p-6 mb-6 glow-border">
          <h1 className="text-3xl font-bold text-gradient mb-2">{exercise.name}</h1>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>{exercise.muscle_group?.name}</span>
            <span>•</span>
            <span className="capitalize">{exercise.equipment}</span>
            {exercise.is_compound && (
              <>
                <span>•</span>
                <span className="text-gold-500">Compound</span>
              </>
            )}
          </div>
        </div>

        {/* 1RM Display */}
        {oneRepMax && (
          <div className="space-y-6">
            {/* Current 1RM Card */}
            <div className="relative overflow-hidden rounded-3xl group">
              <div className="absolute inset-0 bg-gradient-to-r from-gold-500/20 via-cyan-500/20 to-purple-500/20 opacity-50 blur-xl transition-opacity duration-500" />
              <div className="relative glass-card rounded-3xl p-6 m-[1px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Current Estimated 1RM</h2>
                  {oneRepMax.trend && getTrendIcon(oneRepMax.trend)}
                </div>
                
                {oneRepMax.current_1rm ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold text-gold-400">
                      {oneRepMax.current_1rm.toFixed(1)}
                    </span>
                    <span className="text-2xl text-gray-400">kg</span>
                  </div>
                ) : (
                  <p className="text-gray-400">No recent data available</p>
                )}

                {/* Comparison */}
                {oneRepMax.previous_1rm && oneRepMax.current_1rm && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Previous: {oneRepMax.previous_1rm.toFixed(1)} kg</span>
                      {oneRepMax.trend === "up" && (
                        <span className="text-green-400 font-medium">
                          +{(oneRepMax.current_1rm - oneRepMax.previous_1rm).toFixed(1)} kg
                        </span>
                      )}
                      {oneRepMax.trend === "down" && (
                        <span className="text-red-400 font-medium">
                          {(oneRepMax.current_1rm - oneRepMax.previous_1rm).toFixed(1)} kg
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PR 1RM Card */}
            {oneRepMax.pr_1rm && (
              <div className="relative overflow-hidden rounded-3xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-gold-500/20 opacity-50 blur-xl" />
                <div className="relative glass-card rounded-3xl p-6 m-[1px] border border-gold-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-white">All-Time PR</h2>
                  </div>
                  
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-5xl font-bold text-gold-400">
                      {oneRepMax.pr_1rm.toFixed(1)}
                    </span>
                    <span className="text-2xl text-gray-400">kg</span>
                  </div>

                  {oneRepMax.pr_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Achieved on {formatDate(oneRepMax.pr_date)}</span>
                    </div>
                  )}

                  {/* Difference from current */}
                  {oneRepMax.current_1rm && oneRepMax.pr_1rm && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      {oneRepMax.current_1rm >= oneRepMax.pr_1rm ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          <span className="text-sm font-medium">
                            You're at your PR! Keep pushing! 💪
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          <span>{(oneRepMax.pr_1rm - oneRepMax.current_1rm).toFixed(1)} kg away from PR</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No PR Message */}
            {!oneRepMax.pr_1rm && oneRepMax.current_1rm && (
              <div className="glass-card rounded-3xl p-6 text-center">
                <p className="text-gray-400 mb-2">No PR recorded yet</p>
                <p className="text-sm text-gray-500">
                  Your current 1RM will become your PR once you log more sets
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Data Message */}
        {oneRepMax && !oneRepMax.current_1rm && !oneRepMax.pr_1rm && (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">No workout data available</p>
            <p className="text-sm text-gray-500">
              Start logging sets for this exercise to see your estimated 1RM
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
