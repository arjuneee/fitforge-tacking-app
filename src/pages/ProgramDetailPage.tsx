import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { programsApi, workoutsApi, type Program, type Workout } from "../services/api";

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [program, setProgram] = useState<Program | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadProgram();
  }, [id]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const data = await programsApi.get(id!);
      setProgram(data);
      setWorkouts(data.workouts || []);
    } catch (err: any) {
      setError(err.message || "Failed to load program");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string, workoutName: string) => {
    if (!confirm(`Delete "${workoutName}"?`)) return;

    try {
      await workoutsApi.delete(workoutId);
      await loadProgram();
    } catch (err: any) {
      alert(err.message || "Failed to delete workout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading...</div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Program not found"}</p>
          <Link to="/programs" className="text-gold-500 hover:text-gold-400">
            Back to Programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/programs")}
            className="text-gold-500 hover:text-gold-400 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Programs
          </button>

          <div className="flex justify-between items-start">
            <div>
              {program.is_active && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/20 text-gold-500 rounded-full text-xs font-medium mb-3">
                  <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>
                  Active Program
                </div>
              )}
              <h1 className="text-3xl font-bold text-gradient mb-2">{program.name}</h1>
              {program.description && (
                <p className="text-gray-400">{program.description}</p>
              )}
            </div>
            <Link
              to={`/programs/${id}/edit`}
              className="btn-secondary"
            >
              Edit
            </Link>
          </div>

          <div className="flex gap-6 mt-4 text-sm text-gray-400">
            <span>{program.days_per_week} days/week</span>
            <span>{workouts.length} workouts</span>
            <span className="capitalize">{program.type.replace("_", " ")}</span>
          </div>
        </div>

        {/* Workouts List */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Workouts</h2>
            <Link
              to={`/workouts/new?program_id=${id}`}
              className="btn-primary w-auto px-4 py-2 text-sm"
            >
              + Add Workout
            </Link>
          </div>

          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No workouts yet</p>
              <Link
                to={`/workouts/new?program_id=${id}`}
                className="btn-primary w-auto px-6 inline-block"
              >
                Create First Workout
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center text-gold-500 font-semibold">
                      {workout.day_number}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{workout.name}</h3>
                      <div className="flex gap-4 text-xs text-gray-400 mt-1">
                        <span>{workout.exercise_count || 0} exercises</span>
                        {workout.estimated_duration_minutes && (
                          <span>{workout.estimated_duration_minutes} min</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/workouts/${workout.id}`}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-white rounded-lg transition-all text-sm"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteWorkout(workout.id, workout.name)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-lg transition-all text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
