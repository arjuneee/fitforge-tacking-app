import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { programsApi, type Program } from "../services/api";
import { PageLayout } from "../components/PageLayout";

export function ProgramsPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.response?.data?.detail || err.message || "Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Programs" showBackButton>
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Programs" showBackButton>
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={loadPrograms} className="text-gold-500 text-sm">
            Try Again
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Programs" 
      showBackButton
      rightAction={
        <button
          onClick={() => navigate("/programs/new")}
          className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      }
    >
      {programs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">No Programs Yet</h2>
          <p className="text-gray-500 text-sm mb-6">Create your first training program</p>
          <button
            onClick={() => navigate("/programs/new")}
            className="py-3 px-6 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold text-sm rounded-xl"
          >
            Create Program
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <button
              key={program.id}
              onClick={() => navigate(`/programs/${program.id}`)}
              className="w-full bg-white/5 rounded-2xl border border-white/5 overflow-hidden text-left active:bg-white/10 transition-colors"
            >
              <div className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  program.is_active 
                    ? "bg-gradient-to-br from-gold-500/30 to-gold-600/30" 
                    : "bg-white/5"
                }`}>
                  <span className="text-xl">📋</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm truncate">{program.name}</p>
                    {program.is_active && (
                      <span className="px-2 py-0.5 bg-gold-500/20 text-gold-500 rounded-full text-[10px] font-medium flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs truncate">
                    {program.description || "No description"}
                  </p>
                  <div className="flex gap-3 text-gray-500 text-xs mt-1">
                    <span>{program.days_per_week || 0} days/week</span>
                    {program.workout_count && (
                      <>
                        <span>•</span>
                        <span>{program.workout_count} workouts</span>
                      </>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
