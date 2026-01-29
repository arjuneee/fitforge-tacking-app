import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsApi, exercisesApi, type Exercise } from "../services/api";
import { PageLayout } from "../components/PageLayout";

interface RecentExercise {
  exercise_id: string;
  exercise: {
    id: string;
    name: string;
    muscle_group?: {
      id: string;
      name: string;
    };
    equipment: string;
    is_compound?: boolean;
  };
  last_session_date: string;
  set_count: number;
}

export function ExercisesPage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<RecentExercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"recent" | "all">("recent");
  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("");
  const [muscleGroups, setMuscleGroups] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (viewMode === "recent") {
        const response = await analyticsApi.getRecentExercises(50, 90);
        setExercises(response.data || []);
      } else {
        const response = await exercisesApi.list();
        setAllExercises(response.data || []);
      }

      const mgResponse = await exercisesApi.getMuscleGroups();
      setMuscleGroups(mgResponse.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load exercises");
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

  const filteredExercises = viewMode === "recent" 
    ? exercises.filter(ex => {
        const matchesSearch = !search || ex.exercise.name.toLowerCase().includes(search.toLowerCase());
        const matchesMuscleGroup = !selectedMuscleGroup || ex.exercise.muscle_group?.id === selectedMuscleGroup;
        return matchesSearch && matchesMuscleGroup;
      })
    : allExercises.filter((ex: Exercise) => {
        const matchesSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
        const matchesMuscleGroup = !selectedMuscleGroup || ex.muscle_group?.id === selectedMuscleGroup;
        return matchesSearch && matchesMuscleGroup;
      });

  if (loading) {
    return (
      <PageLayout title="Exercises" showBackButton>
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading exercises...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Exercises" showBackButton>
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={loadData} className="btn-primary text-sm">
            Retry
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Exercises" showBackButton>
      {/* View Mode Toggle & Filters */}
      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6 mb-3 md:mb-6">
        {/* View Mode Toggle */}
        <div className="flex bg-white/5 rounded-lg p-0.5 mb-3 md:mb-4">
          <button
            onClick={() => setViewMode("recent")}
            className={`flex-1 px-3 py-1.5 md:py-2 rounded-md transition-all text-[10px] md:text-sm ${
              viewMode === "recent"
                ? "bg-gold-500/20 text-gold-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`flex-1 px-3 py-1.5 md:py-2 rounded-md transition-all text-[10px] md:text-sm ${
              viewMode === "all"
                ? "bg-gold-500/20 text-gold-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div>
            <label className="block text-[10px] md:text-sm text-gray-300 mb-1.5">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="input-field text-xs md:text-base"
            />
          </div>
          <div>
            <label className="block text-[10px] md:text-sm text-gray-300 mb-1.5">Muscle Group</label>
            <select
              value={selectedMuscleGroup}
              onChange={(e) => setSelectedMuscleGroup(e.target.value)}
              className="input-field text-xs md:text-base"
            >
              <option value="">All</option>
              {muscleGroups.map((mg) => (
                <option key={mg.id} value={mg.id}>
                  {mg.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <h2 className="text-xs md:text-xl font-semibold text-white">
            {viewMode === "recent" ? "Recent" : "All"} 
            <span className="text-gray-400 text-[10px] md:text-base font-normal ml-1.5">
              ({filteredExercises.length})
            </span>
          </h2>
        </div>

        {filteredExercises.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-400 text-xs md:text-sm mb-1.5">
              {viewMode === "recent" 
                ? "No recent exercises found" 
                : "No exercises found"}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500">
              {viewMode === "recent"
                ? "Start logging workouts to see exercises here"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {viewMode === "recent" ? (
              exercises.filter(ex => {
                const matchesSearch = !search || ex.exercise.name.toLowerCase().includes(search.toLowerCase());
                const matchesMuscleGroup = !selectedMuscleGroup || ex.exercise.muscle_group?.id === selectedMuscleGroup;
                return matchesSearch && matchesMuscleGroup;
              }).map((item) => {
                const exercise = item.exercise;
                return (
                  <button
                    key={item.exercise_id}
                    onClick={() => navigate(`/exercises/${item.exercise_id}/history`)}
                    className="w-full p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-lg md:rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors text-xs md:text-base truncate">
                            {exercise.name}
                          </h3>
                          {exercise.is_compound && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 bg-gold-500/20 text-gold-400 rounded text-[8px] md:text-xs font-medium">
                              C
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 text-[8px] md:text-xs text-gray-400">
                          <span>{exercise.muscle_group?.name || "Unknown"}</span>
                          <span>•</span>
                          <span>{item.set_count} sets</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="text-right">
                          <p className="text-[10px] md:text-sm text-gray-400">{formatDate(item.last_session_date)}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gold-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              (filteredExercises as Exercise[]).map((exercise: Exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => navigate(`/exercises/${exercise.id}/history`)}
                  className="w-full p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-lg md:rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors text-xs md:text-base truncate">
                          {exercise.name}
                        </h3>
                        {exercise.is_compound && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-gold-500/20 text-gold-400 rounded text-[8px] md:text-xs font-medium">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 text-[8px] md:text-xs text-gray-400">
                        <span>{exercise.muscle_group?.name || "Unknown"}</span>
                        <span>•</span>
                        <span className="capitalize">{exercise.equipment}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-gold-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
