import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsApi } from "../services/api";

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
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case "exercise":
        return "Exercise";
      case "date":
        return "Date";
      case "1rm":
        return "1RM";
      default:
        return "Date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading personal records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={loadRecords} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Personal Records</h1>
            <p className="text-gray-400">Celebrate your achievements</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Sort Selector */}
        <div className="glass-card rounded-3xl p-6 mb-6 glow-border">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Sort by:</label>
            <div className="flex bg-white/5 rounded-xl p-1">
              {(["date", "exercise", "1rm"] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
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
        <div className="glass-card rounded-3xl p-6 glow-border">
          {records.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-2">No personal records yet</p>
              <p className="text-sm text-gray-500">
                Start logging workouts to track your personal records
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <button
                  key={record.id}
                  onClick={() => navigate(`/exercises/${record.exercise_id}/history`)}
                  className="w-full p-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors text-lg">
                          {record.exercise_name}
                        </h3>
                        {record.is_new && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            New PR
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-400 mb-2">
                        {record.muscle_group_name && (
                          <>
                            <span>{record.muscle_group_name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>1RM: {record.estimated_1rm.toFixed(1)} kg</span>
                        {record.best_weight_kg && record.best_reps && (
                          <>
                            <span>•</span>
                            <span>Best Set: {record.best_weight_kg.toFixed(1)} kg × {record.best_reps}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Achieved on {formatDate(record.achieved_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gold-400">
                          {record.estimated_1rm.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500">kg (1RM)</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gold-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
