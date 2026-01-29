import { useState, useEffect } from "react";
import { sessionsApi } from "../services/api";

interface SetDetail {
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  is_warmup: boolean;
}

interface ExerciseSummary {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string | null;
  total_sets: number;
  sets: SetDetail[];
}

interface LastSessionData {
  found: boolean;
  workout_name: string;
  session_date?: string;
  completed_at?: string;
  duration_minutes?: number;
  overall_rpe?: number;
  total_sets?: number;
  total_volume?: number;
  exercises?: ExerciseSummary[];
  message?: string;
}

interface LastSessionSummaryProps {
  workoutId: string;
  workoutName: string;
}

export function LastSessionSummary({ workoutId, workoutName }: LastSessionSummaryProps) {
  const [data, setData] = useState<LastSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadLastSession();
  }, [workoutId]);

  const loadLastSession = async () => {
    try {
      setLoading(true);
      const response = await sessionsApi.getLastWorkoutSession(workoutId);
      setData(response);
    } catch (err) {
      console.error("Failed to load last session:", err);
      setData({ found: false, workout_name: workoutName, message: "Failed to load" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="p-3 bg-white/5 rounded-lg animate-pulse">
        <div className="h-3 bg-white/10 rounded w-1/2 mb-2"></div>
        <div className="h-2 bg-white/10 rounded w-3/4"></div>
      </div>
    );
  }

  if (!data || !data.found) {
    return (
      <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
        <p className="text-[10px] md:text-xs text-gray-500 text-center">
          No previous session found for this workout
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-violet-500/10 to-gold-500/10 border border-white/10 rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] md:text-xs text-gold-400 font-medium">Last Session</span>
            <span className="text-[8px] md:text-[10px] text-gray-500">
              {data.session_date && formatDate(data.session_date)}
            </span>
          </div>
          <div className="flex gap-3 text-[10px] md:text-xs text-gray-400">
            <span>{data.total_sets} sets</span>
            <span>{data.total_volume?.toFixed(0)} kg</span>
            {data.duration_minutes && <span>{data.duration_minutes} min</span>}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Details */}
      {expanded && data.exercises && data.exercises.length > 0 && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
          {data.exercises.map((exercise, idx) => (
            <div key={idx} className="bg-white/5 rounded-lg p-2.5">
              {/* Exercise Name */}
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0">
                  <h4 className="text-[10px] md:text-xs font-medium text-white truncate">
                    {exercise.exercise_name}
                  </h4>
                  {exercise.muscle_group && (
                    <span className="text-[8px] md:text-[10px] text-gray-500">
                      {exercise.muscle_group}
                    </span>
                  )}
                </div>
                <span className="text-[8px] md:text-[10px] text-gray-400 flex-shrink-0 ml-2">
                  {exercise.total_sets} sets
                </span>
              </div>

              {/* Sets Table */}
              <div className="grid grid-cols-4 gap-1 text-[8px] md:text-[10px]">
                <div className="text-gray-500 font-medium">Set</div>
                <div className="text-gray-500 font-medium">Weight</div>
                <div className="text-gray-500 font-medium">Reps</div>
                <div className="text-gray-500 font-medium">RPE</div>
                
                {exercise.sets.filter(s => !s.is_warmup).map((set) => (
                  <>
                    <div key={`${set.set_number}-num`} className="text-gray-400">{set.set_number}</div>
                    <div key={`${set.set_number}-wt`} className="text-white font-medium">{set.weight_kg} kg</div>
                    <div key={`${set.set_number}-reps`} className="text-white font-medium">{set.reps}</div>
                    <div key={`${set.set_number}-rpe`} className="text-gray-400">{set.rpe || "-"}</div>
                  </>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
