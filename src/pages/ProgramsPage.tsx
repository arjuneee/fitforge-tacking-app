import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { programsApi, type Program } from "../services/api";

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
      // If 401, the interceptor will handle redirect
      if (err.response?.status === 401) {
        return; // Don't show error, redirecting to login
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
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading programs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Training Programs</h1>
            <p className="text-gray-400">Manage your workout programs</p>
          </div>
          <Link
            to="/programs/new"
            className="btn-primary w-auto px-6"
          >
            + New Program
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Programs Grid */}
        {programs.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Programs Yet</h3>
            <p className="text-gray-400 mb-6">Create your first training program to get started</p>
            <Link to="/programs/new" className="btn-primary w-auto px-8 inline-block">
              Create Program
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div
                key={program.id}
                className={`glass-card rounded-2xl p-6 hover:border-gold-500/30 transition-all ${
                  program.is_active ? "border-gold-500/50 glow-border" : ""
                }`}
              >
                {program.is_active && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/20 text-gold-500 rounded-full text-xs font-medium mb-4">
                    <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>
                    Active
                  </div>
                )}

                <h3 className="text-xl font-semibold text-white mb-2">{program.name}</h3>
                {program.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{program.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {program.days_per_week} days/week
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {program.workout_count || 0} workouts
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/programs/${program.id}`}
                    className="flex-1 btn-secondary text-center text-sm py-2"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleClone(program.id)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-white rounded-xl transition-all text-sm"
                    title="Clone program"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleDelete(program.id, program.name)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl transition-all text-sm"
                    title="Delete program"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
