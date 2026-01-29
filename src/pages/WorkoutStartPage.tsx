import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { programsApi, sessionsApi, type Program, type Workout } from "../services/api";
import { PageLayout } from "../components/PageLayout";
import { LastSessionSummary } from "../components/LastSessionSummary";

interface ProgramWithWorkouts extends Program {
  workouts?: Workout[];
}

export function WorkoutStartPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramWithWorkouts[]>([]);
  const [activeProgram, setActiveProgram] = useState<ProgramWithWorkouts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingWorkout, setStartingWorkout] = useState<string | null>(null);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await programsApi.list();
      const programsList = response.data || [];
      
      const programsWithWorkouts = await Promise.all(
        programsList.map(async (p: Program) => {
          try {
            const programDetail = await programsApi.get(p.id);
            return { ...p, workouts: programDetail.workouts || [] };
          } catch {
            return { ...p, workouts: [] };
          }
        })
      );
      
      setPrograms(programsWithWorkouts);
      
      const active = programsWithWorkouts.find((p) => p.is_active);
      if (active) {
        setActiveProgram(active);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async (workoutId: string) => {
    try {
      setStartingWorkout(workoutId);
      const session = await sessionsApi.start(workoutId);
      navigate(`/workouts/active/${session.id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to start workout");
      setStartingWorkout(null);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Start Workout">
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Start Workout">
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate("/programs")}
            className="text-gold-500 hover:text-gold-400 text-sm"
          >
            Go to Programs
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Start Workout">
      {/* Today's Suggested Workout */}
      {activeProgram && activeProgram.workouts && activeProgram.workouts.length > 0 && (
        <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 mb-3 md:mb-6 glow-border">
          <h2 className="text-sm md:text-xl font-semibold text-white mb-2 md:mb-4">Suggested Workout</h2>
          <p className="text-gray-400 text-[10px] md:text-sm mb-3 md:mb-4">
            From: <span className="text-gold-500">{activeProgram.name}</span>
          </p>
          <div className="space-y-3 md:space-y-4">
            {activeProgram.workouts.map((workout) => (
              <div key={workout.id} className="space-y-2">
                <button
                  onClick={() => handleStartWorkout(workout.id)}
                  disabled={startingWorkout === workout.id}
                  className="w-full p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-lg md:rounded-xl transition-all text-left disabled:opacity-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white text-xs md:text-base mb-0.5 md:mb-1">{workout.name}</h3>
                      <div className="flex gap-2 md:gap-4 text-[8px] md:text-xs text-gray-400">
                        <span>Day {workout.day_number}</span>
                        <span>{workout.exercise_count || 0} exercises</span>
                        {workout.estimated_duration_minutes && (
                          <span>{workout.estimated_duration_minutes} min</span>
                        )}
                      </div>
                    </div>
                    <div className="text-gold-500 font-semibold text-xs md:text-base">
                      {startingWorkout === workout.id ? "Starting..." : "Start →"}
                    </div>
                  </div>
                </button>
                {/* Last Session Summary */}
                <LastSessionSummary workoutId={workout.id} workoutName={workout.name} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Workouts */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6">
        <h2 className="text-sm md:text-xl font-semibold text-white mb-3 md:mb-4">All Workouts</h2>
        <div className="space-y-3 md:space-y-4">
          {programs.map((program) => (
            <div key={program.id} className="border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4">
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div>
                  <h3 className="font-semibold text-white text-xs md:text-base mb-0.5 md:mb-1">{program.name}</h3>
                  <p className="text-gray-400 text-[10px] md:text-sm line-clamp-1">{program.description || "No description"}</p>
                </div>
                {program.is_active && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 md:px-2 md:py-1 bg-gold-500/20 text-gold-500 rounded text-[8px] md:text-xs">Active</span>
                )}
              </div>
              {program.workouts && program.workouts.length > 0 ? (
                <div className="space-y-2 md:space-y-3 mt-2 md:mt-3">
                  {program.workouts.map((workout) => (
                    <div key={workout.id} className="space-y-1.5">
                      <button
                        onClick={() => handleStartWorkout(workout.id)}
                        disabled={startingWorkout === workout.id}
                        className="w-full p-2 md:p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-lg transition-all text-left disabled:opacity-50"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-white font-medium text-[10px] md:text-sm">{workout.name}</span>
                            <span className="text-gray-400 text-[8px] md:text-xs ml-1.5 md:ml-2">Day {workout.day_number}</span>
                          </div>
                          <span className="text-gold-500 text-[10px] md:text-sm">
                            {startingWorkout === workout.id ? "..." : "Start"}
                          </span>
                        </div>
                      </button>
                      {/* Last Session Summary */}
                      <LastSessionSummary workoutId={workout.id} workoutName={workout.name} />
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/programs/${program.id}`)}
                  className="text-gold-500 hover:text-gold-400 text-[10px] md:text-sm mt-2"
                >
                  View Program →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Link */}
      <div className="mt-4 md:mt-6 text-center">
        <button
          onClick={() => navigate("/programs")}
          className="btn-secondary text-xs md:text-sm py-2 px-4"
        >
          Browse All Programs
        </button>
      </div>
    </PageLayout>
  );
}
