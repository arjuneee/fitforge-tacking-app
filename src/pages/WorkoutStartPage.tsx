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
      <PageLayout title="Start Workout" showBackButton>
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Start Workout" showBackButton>
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate("/programs")}
            className="text-gold-500 text-sm"
          >
            Go to Programs
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Start Workout" showBackButton>
      {/* Active Program Workouts */}
      {activeProgram && activeProgram.workouts && activeProgram.workouts.length > 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden mb-4">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                <span className="text-lg">⭐</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Suggested Workout</p>
                <p className="text-gray-500 text-xs">{activeProgram.name}</p>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {activeProgram.workouts.map((workout) => (
              <div key={workout.id}>
                <button
                  onClick={() => handleStartWorkout(workout.id)}
                  disabled={startingWorkout === workout.id}
                  className="w-full p-4 flex items-center gap-4 active:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">D{workout.day_number}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium text-sm">{workout.name}</p>
                    <div className="flex gap-2 text-gray-500 text-xs">
                      <span>{workout.exercise_count || 0} exercises</span>
                      {workout.estimated_duration_minutes && (
                        <>
                          <span>•</span>
                          <span>{workout.estimated_duration_minutes} min</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-gold-500 text-sm font-semibold">
                    {startingWorkout === workout.id ? "..." : "Start"}
                  </div>
                </button>
                <div className="px-4 pb-3">
                  <LastSessionSummary workoutId={workout.id} workoutName={workout.name} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Programs */}
      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">All Workouts</p>
                <p className="text-gray-500 text-xs">Select from your programs</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/programs")}
              className="text-gold-500 text-xs font-medium"
            >
              Manage
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-white/5">
          {programs.map((program) => (
            <div key={program.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{program.name}</p>
                  {program.is_active && (
                    <span className="px-2 py-0.5 bg-gold-500/20 text-gold-500 rounded-full text-[10px] font-medium">
                      Active
                    </span>
                  )}
                </div>
              </div>
              
              {program.workouts && program.workouts.length > 0 ? (
                <div className="space-y-2">
                  {program.workouts.map((workout) => (
                    <button
                      key={workout.id}
                      onClick={() => handleStartWorkout(workout.id)}
                      disabled={startingWorkout === workout.id}
                      className="w-full p-3 bg-black/30 rounded-xl flex items-center justify-between active:bg-black/50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 text-xs font-medium">
                          D{workout.day_number}
                        </div>
                        <span className="text-gray-300 text-sm">{workout.name}</span>
                      </div>
                      <span className="text-gold-500 text-xs font-medium">
                        {startingWorkout === workout.id ? "..." : "Start"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/programs/${program.id}`)}
                  className="text-gold-500 text-xs"
                >
                  Add workouts →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Link */}
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate("/programs")}
          className="py-3 px-6 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm font-medium"
        >
          Browse All Programs
        </button>
      </div>
    </PageLayout>
  );
}
