import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsApi } from "../services/api";
import { PageLayout } from "../components/PageLayout";

interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  estimated_1rm: number;
  best_weight: number;
  best_reps: number;
  date_achieved: string;
  is_new_pr: boolean;
}

type SortField = "exercise" | "date" | "1rm";

export function PersonalRecordsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getPersonalRecords();
      // Ensure we always set an array
      setRecords(Array.isArray(data) ? data : (data?.records || []));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  // Ensure records is always an array before sorting
  const recordsArray = Array.isArray(records) ? records : [];
  const sortedRecords = [...recordsArray].sort((a, b) => {
    switch (sortField) {
      case "exercise":
        return a.exercise_name.localeCompare(b.exercise_name);
      case "date":
        return new Date(b.date_achieved).getTime() - new Date(a.date_achieved).getTime();
      case "1rm":
        return b.estimated_1rm - a.estimated_1rm;
      default:
        return 0;
    }
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <PageLayout title="Personal Records" showBackButton>
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Personal Records" showBackButton>
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={loadRecords} className="text-gold-500 text-sm">
            Try Again
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Personal Records" showBackButton>
      {/* Sort Tabs */}
      <div className="bg-white/5 rounded-2xl p-1.5 mb-4 flex gap-1">
        {[
          { id: "date" as SortField, label: "Recent" },
          { id: "1rm" as SortField, label: "Strongest" },
          { id: "exercise" as SortField, label: "A-Z" },
        ].map((sort) => (
          <button
            key={sort.id}
            onClick={() => setSortField(sort.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
              sortField === sort.id
                ? "bg-gold-500 text-black"
                : "text-gray-400"
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>

      {sortedRecords.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">No Records Yet</h2>
          <p className="text-gray-500 text-sm mb-6">Start logging workouts to track your PRs</p>
          <button
            onClick={() => navigate("/workouts/start")}
            className="py-3 px-6 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold text-sm rounded-xl"
          >
            Start Workout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRecords.map((record) => (
            <button
              key={record.exercise_id}
              onClick={() => navigate(`/exercises/${record.exercise_id}/history`)}
              className="w-full bg-white/5 rounded-2xl border border-white/5 overflow-hidden text-left active:bg-white/10 transition-colors"
            >
              <div className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🏆</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm truncate">{record.exercise_name}</p>
                    {record.is_new_pr && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-medium flex-shrink-0">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">{record.muscle_group}</p>
                  <div className="flex gap-3 text-xs mt-1">
                    <span className="text-gray-400">Best: {record.best_weight}kg × {record.best_reps}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gold-500 font-bold text-lg">{record.estimated_1rm.toFixed(0)}</p>
                  <p className="text-gray-500 text-[10px]">Est. 1RM</p>
                  <p className="text-gray-600 text-[10px]">{formatDate(record.date_achieved)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
