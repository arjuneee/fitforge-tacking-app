import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { programsApi, sessionsApi, type Program, type Workout } from "../services/api";

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
      
      // Load workouts for each program
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
      
      // Find active program
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
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/programs")}
            className="text-gold-500 hover:text-gold-400"
          >
            Go to Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Start Workout</h1>
          <p className="text-gray-400">Select a workout to begin your session</p>
        </div>

        {/* Today's Suggested Workout */}
        {activeProgram && activeProgram.workouts && activeProgram.workouts.length > 0 && (
          <div className="glass-card rounded-3xl p-6 mb-6 glow-border">
            <h2 className="text-xl font-semibold text-white mb-4">Today's Suggested Workout</h2>
            <p className="text-gray-400 text-sm mb-4">
              From your active program: <span className="text-gold-500">{activeProgram.name}</span>
            </p>
            <div className="space-y-3">
              {activeProgram.workouts.map((workout) => (
                <button
                  key={workout.id}
                  onClick={() => handleStartWorkout(workout.id)}
                  disabled={startingWorkout === workout.id}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-xl transition-all text-left disabled:opacity-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white mb-1">{workout.name}</h3>
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>Day {workout.day_number}</span>
                        <span>{workout.exercise_count || 0} exercises</span>
                        {workout.estimated_duration_minutes && (
                          <span>{workout.estimated_duration_minutes} min</span>
                        )}
                      </div>
                    </div>
                    <div className="text-gold-500 font-semibold">
                      {startingWorkout === workout.id ? "Starting..." : "Start →"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Workouts */}
        <div className="glass-card rounded-3xl p-6 glow-border">
          <h2 className="text-xl font-semibold text-white mb-4">All Workouts</h2>
          <div className="space-y-4">
            {programs.map((program) => (
              <div key={program.id} className="border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white mb-1">{program.name}</h3>
                    <p className="text-gray-400 text-sm">{program.description || "No description"}</p>
                  </div>
                  {program.is_active && (
                    <span className="px-2 py-1 bg-gold-500/20 text-gold-500 rounded text-xs">Active</span>
                  )}
                </div>
                {program.workouts && program.workouts.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {program.workouts.map((workout) => (
                      <button
                        key={workout.id}
                        onClick={() => handleStartWorkout(workout.id)}
                        disabled={startingWorkout === workout.id}
                        className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-lg transition-all text-left disabled:opacity-50"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-white font-medium">{workout.name}</span>
                            <span className="text-gray-400 text-xs ml-2">Day {workout.day_number}</span>
                          </div>
                          <span className="text-gold-500 text-sm">
                            {startingWorkout === workout.id ? "Starting..." : "Start"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(`/programs/${program.id}`)}
                    className="text-gold-500 hover:text-gold-400 text-sm mt-2"
                  >
                    View Program →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start from Program Detail */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/programs")}
            className="btn-secondary"
          >
            Browse All Programs
          </button>
        </div>
      </div>
    </div>
  );
}
