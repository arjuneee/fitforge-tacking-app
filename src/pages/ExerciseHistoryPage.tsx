import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { analyticsApi, exercisesApi, setsApi, type Exercise } from "../services/api";
import { PageLayout } from "../components/PageLayout";

interface OneRepMaxData {
  current_1rm: number | null;
  pr_1rm: number | null;
  pr_date: string | null;
  previous_1rm: number | null;
  previous_date: string | null;
  trend: "up" | "down" | "same" | "new" | null;
}

interface SetData {
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  is_warmup: boolean;
  is_failure: boolean;
  is_dropset: boolean;
}

interface SessionData {
  date: string;
  sets: SetData[];
  working_sets: number;
  total_volume: number;
  max_weight: number;
  max_reps: number;
}

interface ExerciseHistory {
  exercise_id: string;
  period_days: number;
  total_sessions: number;
  sessions: SessionData[];
  best_volume: number;
  best_weight: number;
}

type TabType = "history" | "stats";

export function ExerciseHistoryPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [oneRepMax, setOneRepMax] = useState<OneRepMaxData | null>(null);
  const [history, setHistory] = useState<ExerciseHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("history");
  const [historyDays, setHistoryDays] = useState(30);

  useEffect(() => {
    if (exerciseId) {
      loadData();
    }
  }, [exerciseId, historyDays]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const exercises = await exercisesApi.list();
      const foundExercise = exercises.data?.find((e: Exercise) => e.id === exerciseId);
      
      if (!foundExercise) {
        setError("Exercise not found");
        return;
      }
      
      setExercise(foundExercise);
      
      if (exerciseId) {
        const [oneRepMaxData, historyData] = await Promise.all([
          analyticsApi.getOneRepMax(exerciseId),
          setsApi.getExerciseHistory(exerciseId, historyDays),
        ]);
        setOneRepMax(oneRepMaxData);
        setHistory(historyData);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load exercise data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", { 
      weekday: "short",
      month: "short", 
      day: "numeric"
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { 
      weekday: "short",
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <PageLayout title="Exercise History" showBackButton>
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !exercise) {
    return (
      <PageLayout title="Exercise History" showBackButton>
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error || "Exercise not found"}</p>
          <button onClick={() => navigate(-1)} className="text-gold-500 text-sm">
            Go Back
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={exercise.name} showBackButton>
      {/* Exercise Info */}
      <div className="bg-white/5 rounded-2xl border border-white/5 p-4 mb-4">
        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          <span className="px-2 py-1 bg-white/5 rounded-lg">{exercise.muscle_group?.name}</span>
          <span className="px-2 py-1 bg-white/5 rounded-lg capitalize">{exercise.equipment}</span>
          {exercise.is_compound && (
            <span className="px-2 py-1 bg-gold-500/20 text-gold-500 rounded-lg">Compound</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 rounded-2xl p-1.5 mb-4 flex gap-1">
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
            activeTab === "history" ? "bg-gold-500 text-black" : "text-gray-400"
          }`}
        >
          📋 Workout History
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
            activeTab === "stats" ? "bg-gold-500 text-black" : "text-gray-400"
          }`}
        >
          📊 1RM Stats
        </button>
      </div>

      {activeTab === "history" && (
        <>
          {/* Time Period Selector */}
          <div className="flex gap-2 mb-4">
            {[
              { days: 7, label: "7 Days" },
              { days: 30, label: "30 Days" },
              { days: 90, label: "3 Months" },
            ].map((option) => (
              <button
                key={option.days}
                onClick={() => setHistoryDays(option.days)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                  historyDays === option.days
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-white/5 text-gray-500 border border-white/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Summary Stats */}
          {history && history.total_sessions > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <p className="text-white font-bold text-lg">{history.total_sessions}</p>
                <p className="text-gray-500 text-[10px]">Sessions</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <p className="text-gold-500 font-bold text-lg">{history.best_weight}</p>
                <p className="text-gray-500 text-[10px]">Best kg</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <p className="text-cyan-400 font-bold text-lg">{(history.best_volume / 1000).toFixed(1)}k</p>
                <p className="text-gray-500 text-[10px]">Best Vol</p>
              </div>
            </div>
          )}

          {/* Session History */}
          {history && history.sessions.length > 0 ? (
            <div className="space-y-3">
              {history.sessions.map((session, idx) => (
                <div key={session.date} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                  {/* Session Header */}
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-gold-500">#{history.sessions.length - idx}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{formatDate(session.date)}</p>
                          <p className="text-gray-500 text-[10px]">{formatFullDate(session.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold text-sm">{session.max_weight} kg</p>
                        <p className="text-gray-500 text-[10px]">{session.working_sets} working sets</p>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex gap-3 text-[10px]">
                      <span className="text-gray-400">Vol: {session.total_volume.toFixed(0)} kg</span>
                      <span className="text-gray-400">Max Reps: {session.max_reps}</span>
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="p-3">
                    <div className="grid grid-cols-5 gap-2 text-[10px] text-gray-500 font-medium mb-2 px-2">
                      <span>Set</span>
                      <span>Weight</span>
                      <span>Reps</span>
                      <span>RPE</span>
                      <span>Type</span>
                    </div>
                    <div className="space-y-1">
                      {session.sets.map((set, setIdx) => (
                        <div 
                          key={setIdx}
                          className={`grid grid-cols-5 gap-2 text-xs px-2 py-2 rounded-lg ${
                            set.is_warmup 
                              ? "bg-blue-500/10 text-blue-300" 
                              : "bg-black/20 text-white"
                          }`}
                        >
                          <span className="text-gray-400">{set.set_number}</span>
                          <span className="font-semibold">{set.weight_kg} kg</span>
                          <span>{set.reps}</span>
                          <span className="text-gray-400">{set.rpe || "-"}</span>
                          <span className="text-[10px]">
                            {set.is_warmup && <span className="text-blue-400">Warm</span>}
                            {set.is_failure && <span className="text-red-400">Fail</span>}
                            {set.is_dropset && <span className="text-purple-400">Drop</span>}
                            {!set.is_warmup && !set.is_failure && !set.is_dropset && <span className="text-gray-500">Work</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">No History Yet</h2>
              <p className="text-gray-500 text-sm mb-6">Log workouts to see your history here</p>
              <button
                onClick={() => navigate("/workouts/start")}
                className="py-3 px-6 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold text-sm rounded-xl"
              >
                Start Workout
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "stats" && oneRepMax && (
        <div className="space-y-4">
          {/* Current 1RM */}
          <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                  <span className="text-lg">💪</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Current Estimated 1RM</p>
                  <p className="text-gray-500 text-xs">Based on recent performance</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {oneRepMax.current_1rm ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gold-400">
                    {oneRepMax.current_1rm.toFixed(1)}
                  </span>
                  <span className="text-xl text-gray-400">kg</span>
                  {oneRepMax.trend === "up" && (
                    <span className="ml-auto text-green-400 text-sm font-medium">↑ Up</span>
                  )}
                  {oneRepMax.trend === "down" && (
                    <span className="ml-auto text-red-400 text-sm font-medium">↓ Down</span>
                  )}
                  {oneRepMax.trend === "new" && (
                    <span className="ml-auto text-gold-400 text-sm font-medium">⭐ New PR!</span>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No recent data</p>
              )}
              
              {oneRepMax.previous_1rm && (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
                  Previous: {oneRepMax.previous_1rm.toFixed(1)} kg 
                  {oneRepMax.previous_date && ` (${formatDate(oneRepMax.previous_date)})`}
                </div>
              )}
            </div>
          </div>

          {/* All-Time PR */}
          {oneRepMax.pr_1rm && (
            <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/10 rounded-2xl border border-gold-500/30 overflow-hidden">
              <div className="p-4 border-b border-gold-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/30 flex items-center justify-center">
                    <span className="text-lg">🏆</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">All-Time Personal Record</p>
                    <p className="text-gray-400 text-xs">{formatDate(oneRepMax.pr_date)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gold-400">
                    {oneRepMax.pr_1rm.toFixed(1)}
                  </span>
                  <span className="text-xl text-gray-400">kg</span>
                </div>
                
                {oneRepMax.current_1rm && oneRepMax.pr_1rm > oneRepMax.current_1rm && (
                  <div className="mt-3 pt-3 border-t border-gold-500/20 text-xs text-gray-400">
                    {(oneRepMax.pr_1rm - oneRepMax.current_1rm).toFixed(1)} kg away from PR
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Data */}
          {!oneRepMax.current_1rm && !oneRepMax.pr_1rm && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">No Stats Yet</h2>
              <p className="text-gray-500 text-sm">Log sets to see your 1RM estimates</p>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}
