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
      <div className="bg-white/5 rounded-2xl border border-white/5 p-4 mb-4">
        {/* View Mode Toggle */}
        <div className="bg-white/5 rounded-2xl p-1.5 mb-4 flex gap-1">
          <button
            onClick={() => setViewMode("recent")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
              viewMode === "recent"
                ? "bg-gold-500 text-black"
                : "text-gray-400"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
              viewMode === "all"
                ? "bg-gold-500 text-black"
                : "text-gray-400"
            }`}
          >
            All
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Muscle Group</label>
            <select
              value={selectedMuscleGroup}
              onChange={(e) => setSelectedMuscleGroup(e.target.value)}
              className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50 appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
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
      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white font-semibold text-sm">
            {viewMode === "recent" ? "Recent Exercises" : "All Exercises"} 
            <span className="text-gray-500 font-normal ml-2">
              ({filteredExercises.length})
            </span>
          </h2>
        </div>

        <div className="divide-y divide-white/5">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
                <span className="text-xl">💪</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">
                {viewMode === "recent" 
                  ? "No recent exercises found" 
                  : "No exercises found"}
              </p>
              <p className="text-xs text-gray-500">
                {viewMode === "recent"
                  ? "Start logging workouts to see exercises here"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : viewMode === "recent" ? (
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
                  className="w-full p-4 flex items-center gap-4 active:bg-white/5 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💪</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-medium text-sm truncate">{exercise.name}</p>
                      {exercise.is_compound && (
                        <span className="px-1.5 py-0.5 bg-gold-500/20 text-gold-400 rounded text-[10px] font-medium flex-shrink-0">
                          C
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>{exercise.muscle_group?.name || "Unknown"}</span>
                      <span>•</span>
                      <span>{item.set_count} sets</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(item.last_session_date)}</span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })
          ) : (
            (filteredExercises as Exercise[]).map((exercise: Exercise) => (
              <button
                key={exercise.id}
                onClick={() => navigate(`/exercises/${exercise.id}/history`)}
                className="w-full p-4 flex items-center gap-4 active:bg-white/5 transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🏋️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-medium text-sm truncate">{exercise.name}</p>
                    {exercise.is_compound && (
                      <span className="px-1.5 py-0.5 bg-gold-500/20 text-gold-400 rounded text-[10px] font-medium flex-shrink-0">
                        C
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>{exercise.muscle_group?.name || "Unknown"}</span>
                    <span>•</span>
                    <span className="capitalize">{exercise.equipment}</span>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}
