import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { programsApi, workoutsApi, type Program, type Workout } from "../services/api";
import { PageLayout } from "../components/PageLayout";

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
      <PageLayout title="Loading..." showBackButton backPath="/programs">
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !program) {
    return (
      <PageLayout title="Error" showBackButton backPath="/programs">
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error || "Program not found"}</p>
          <Link to="/programs" className="text-gold-500 hover:text-gold-400 text-sm">
            Back to Programs
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={program.name}
      showBackButton 
      backPath="/programs"
      rightAction={
        <Link
          to={`/programs/${id}/edit`}
          className="px-2.5 py-1.5 md:px-4 md:py-2 bg-white/5 border border-white/10 text-white text-[10px] md:text-sm font-medium rounded-lg"
        >
          Edit
        </Link>
      }
    >
      {/* Program Info */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 mb-3 md:mb-6">
        {program.is_active && (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 bg-gold-500/20 text-gold-500 rounded-full text-[8px] md:text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gold-500 rounded-full animate-pulse"></span>
            Active
          </div>
        )}
        
        {program.description && (
          <p className="text-gray-400 text-[10px] md:text-sm mb-3">{program.description}</p>
        )}

        <div className="flex gap-3 md:gap-6 text-[10px] md:text-sm text-gray-400">
          <span>{program.days_per_week} days/week</span>
          <span>{workouts.length} workouts</span>
          <span className="capitalize">{program.type.replace("_", " ")}</span>
        </div>
      </div>

      {/* Workouts List */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xs md:text-xl font-semibold text-white">Workouts</h2>
          <Link
            to={`/workouts/new?program_id=${id}`}
            className="px-2.5 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black text-[10px] md:text-sm font-semibold rounded-lg"
          >
            + Add
          </Link>
        </div>

        {workouts.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-400 text-xs md:text-sm mb-4">No workouts yet</p>
            <Link
              to={`/workouts/new?program_id=${id}`}
              className="btn-primary w-auto px-4 md:px-6 inline-block text-xs md:text-sm"
            >
              Create First Workout
            </Link>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg md:rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2.5 md:gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gold-500/20 flex items-center justify-center text-gold-500 font-semibold text-xs md:text-base flex-shrink-0">
                    {workout.day_number}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-xs md:text-base truncate">{workout.name}</h3>
                    <div className="flex gap-2 md:gap-4 text-[8px] md:text-xs text-gray-400 mt-0.5">
                      <span>{workout.exercise_count || 0} exercises</span>
                      {workout.estimated_duration_minutes && (
                        <span>{workout.estimated_duration_minutes} min</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 md:gap-2 flex-shrink-0 ml-2">
                  <Link
                    to={`/workouts/${workout.id}`}
                    className="px-2.5 py-1.5 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-white rounded-lg transition-all text-[10px] md:text-sm"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDeleteWorkout(workout.id, workout.name)}
                    className="px-2.5 py-1.5 md:px-3 md:py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-lg transition-all text-[10px] md:text-sm"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
