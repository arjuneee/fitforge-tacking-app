import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsApi, exercisesApi, type Exercise } from "../services/api";

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
        const response = await analyticsApi.getRecentExercises(50, 90); // Last 90 days, up to 50 exercises
        setExercises(response.data || []);
      } else {
        const response = await exercisesApi.list();
        setAllExercises(response.data || []);
      }

      // Load muscle groups
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

  // Filter exercises based on search and muscle group
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
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading exercises...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={loadData} className="btn-primary">
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
            <h1 className="text-3xl font-bold text-gradient mb-2">Exercises</h1>
            <p className="text-gray-400">View and track your exercise history</p>
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

        {/* View Mode Toggle */}
        <div className="glass-card rounded-3xl p-6 mb-6 glow-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode("recent")}
                className={`px-4 py-2 rounded-md transition-all ${
                  viewMode === "recent"
                    ? "bg-gold-500/20 text-gold-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Recent Exercises
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-4 py-2 rounded-md transition-all ${
                  viewMode === "all"
                    ? "bg-gold-500/20 text-gold-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                All Exercises
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exercises..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Muscle Group</label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="input-field"
              >
                <option value="">All Muscle Groups</option>
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
        <div className="glass-card rounded-3xl p-6 glow-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {viewMode === "recent" ? "Recent Exercises" : "All Exercises"} 
              <span className="text-gray-400 text-base font-normal ml-2">
                ({filteredExercises.length})
              </span>
            </h2>
          </div>

          {filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">
                {viewMode === "recent" 
                  ? "No recent exercises found" 
                  : "No exercises found"}
              </p>
              <p className="text-sm text-gray-500">
                {viewMode === "recent"
                  ? "Start logging workouts to see your recent exercises here"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewMode === "recent" ? (
                // Recent Exercises View
                exercises.map((item) => {
                  const exercise = item.exercise;
                  return (
                    <button
                      key={item.exercise_id}
                      onClick={() => navigate(`/exercises/${item.exercise_id}/history`)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-xl transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors">
                              {exercise.name}
                            </h3>
                            {exercise.is_compound && (
                              <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded text-xs font-medium">
                                Compound
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 text-xs text-gray-400">
                            <span>{exercise.muscle_group?.name || "Unknown"}</span>
                            <span>•</span>
                            <span className="capitalize">{exercise.equipment}</span>
                            <span>•</span>
                            <span>{item.set_count} sets</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-0.5">Last session</p>
                            <p className="text-sm text-gray-400">{formatDate(item.last_session_date)}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-gold-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                // All Exercises View
                (filteredExercises as Exercise[]).map((exercise: Exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => navigate(`/exercises/${exercise.id}/history`)}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors">
                            {exercise.name}
                          </h3>
                          {exercise.is_compound && (
                            <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded text-xs font-medium">
                              Compound
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span>{exercise.muscle_group?.name || "Unknown"}</span>
                          <span>•</span>
                          <span className="capitalize">{exercise.equipment}</span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gold-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
