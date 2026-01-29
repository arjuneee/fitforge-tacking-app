import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { programsApi, type Program } from "../services/api";
import { PageLayout } from "../components/PageLayout";

export function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await programsApi.list();
      setPrograms(response.data || []);
    } catch (err: any) {
      console.error("Failed to load programs:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to load programs";
      setError(errorMsg);
      if (err.response?.status === 401) {
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all associated workouts.`)) {
      return;
    }

    try {
      await programsApi.delete(id);
      await loadPrograms();
    } catch (err: any) {
      alert(err.message || "Failed to delete program");
    }
  };

  const handleClone = async (id: string) => {
    const newName = prompt("Enter a name for the cloned program:");
    if (!newName) return;

    try {
      const cloned = await programsApi.clone(id, newName);
      navigate(`/programs/${cloned.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to clone program");
    }
  };

  if (loading) {
    return (
      <PageLayout title="Training Programs">
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading programs...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Training Programs"
      rightAction={
        <Link
          to="/programs/new"
          className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black text-xs md:text-sm font-semibold rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden md:inline">New Program</span>
          <span className="md:hidden">New</span>
        </Link>
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs md:text-sm">
          {error}
        </div>
      )}

      {/* Programs Grid */}
      {programs.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 md:p-12 text-center">
          <div className="text-4xl md:text-6xl mb-3 md:mb-4">📋</div>
          <h3 className="text-base md:text-xl font-semibold text-white mb-1.5 md:mb-2">No Programs Yet</h3>
          <p className="text-gray-400 text-xs md:text-sm mb-4 md:mb-6">Create your first training program to get started</p>
          <Link to="/programs/new" className="btn-primary w-auto px-6 md:px-8 inline-block text-xs md:text-sm">
            Create Program
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {programs.map((program) => (
            <div
              key={program.id}
              className={`glass-card rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-gold-500/30 transition-all ${
                program.is_active ? "border-gold-500/50 glow-border" : ""
              }`}
            >
              {program.is_active && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 bg-gold-500/20 text-gold-500 rounded-full text-[10px] md:text-xs font-medium mb-3 md:mb-4">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gold-500 rounded-full animate-pulse"></span>
                  Active
                </div>
              )}

              <h3 className="text-sm md:text-xl font-semibold text-white mb-1 md:mb-2">{program.name}</h3>
              {program.description && (
                <p className="text-gray-400 text-[10px] md:text-sm mb-3 md:mb-4 line-clamp-2">{program.description}</p>
              )}

              <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-sm text-gray-500 mb-3 md:mb-4">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {program.days_per_week} days/week
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {program.workout_count || 0} workouts
                </span>
              </div>

              <div className="flex gap-2 mt-3 md:mt-4">
                <Link
                  to={`/programs/${program.id}`}
                  className="flex-1 btn-secondary text-center text-[10px] md:text-sm py-2"
                >
                  View
                </Link>
                <button
                  onClick={() => handleClone(program.id)}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-white rounded-lg md:rounded-xl transition-all text-xs md:text-sm"
                  title="Clone program"
                >
                  📋
                </button>
                <button
                  onClick={() => handleDelete(program.id, program.name)}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-lg md:rounded-xl transition-all text-xs md:text-sm"
                  title="Delete program"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
