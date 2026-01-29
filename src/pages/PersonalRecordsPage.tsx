import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsApi } from "../services/api";
import { PageLayout } from "../components/PageLayout";

interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group_name: string | null;
  record_type: string;
  estimated_1rm: number;
  best_weight_kg: number | null;
  best_reps: number | null;
  achieved_at: string;
  is_new: boolean;
}

export function PersonalRecordsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"exercise" | "date" | "1rm">("date");

  useEffect(() => {
    loadRecords();
  }, [sortBy]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getPersonalRecords(sortBy);
      setRecords(response.records || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load personal records");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case "exercise": return "Exercise";
      case "date": return "Date";
      case "1rm": return "1RM";
      default: return "Date";
    }
  };

  if (loading) {
    return (
      <PageLayout title="Personal Records">
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading personal records...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Personal Records">
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={loadRecords} className="btn-primary text-sm">
            Retry
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Personal Records">
      {/* Sort Selector */}
      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-4 mb-3 md:mb-6">
        <div className="flex items-center justify-between">
          <label className="text-[10px] md:text-sm text-gray-300">Sort by:</label>
          <div className="flex bg-white/5 rounded-lg p-0.5">
            {(["date", "exercise", "1rm"] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-2.5 py-1.5 md:px-4 md:py-2 rounded-md text-[10px] md:text-xs font-medium transition-all ${
                  sortBy === sort
                    ? "bg-gradient-to-r from-gold-500 to-gold-600 text-black shadow-lg shadow-gold-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {getSortLabel(sort)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6">
        {records.length === 0 ? (
          <div className="text-center py-10 md:py-16">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-gray-400 text-xs md:text-sm mb-1.5">No personal records yet</p>
            <p className="text-[10px] md:text-xs text-gray-500">
              Start logging workouts to track your PRs
            </p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {records.map((record) => (
              <button
                key={record.id}
                onClick={() => navigate(`/exercises/${record.exercise_id}/history`)}
                className="w-full p-3 md:p-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-lg md:rounded-xl transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                      <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors text-xs md:text-lg truncate">
                        {record.exercise_name}
                      </h3>
                      {record.is_new && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[8px] md:text-xs font-medium flex items-center gap-0.5">
                          <svg className="w-2 h-2 md:w-3 md:h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-sm text-gray-400 mb-1">
                      {record.muscle_group_name && (
                        <span>{record.muscle_group_name}</span>
                      )}
                      {record.best_weight_kg && record.best_reps && (
                        <span className="hidden md:inline">Best: {record.best_weight_kg.toFixed(1)}kg × {record.best_reps}</span>
                      )}
                    </div>
                    <p className="text-[8px] md:text-xs text-gray-500">
                      {formatDate(record.achieved_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 ml-2 md:ml-4">
                    <div className="text-right">
                      <p className="text-base md:text-2xl font-bold text-gold-400">
                        {record.estimated_1rm.toFixed(1)}
                      </p>
                      <p className="text-[8px] md:text-xs text-gray-500">kg 1RM</p>
                    </div>
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-gold-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
