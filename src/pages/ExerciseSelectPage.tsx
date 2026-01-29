import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exercisesApi, type Exercise, type MuscleGroup } from "../services/api";
import { PageLayout } from "../components/PageLayout";

export function ExerciseSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workoutId = searchParams.get("workout_id");
  const sessionId = searchParams.get("session_id");
  const saveToTemplate = searchParams.get("save_to_template") === "true";

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingExerciseId, setSelectingExerciseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");

  useEffect(() => {
    loadMuscleGroups();
    loadExercises();
  }, []);

  useEffect(() => {
    loadExercises();
  }, [search, selectedMuscleGroup, selectedEquipment]);

  const loadMuscleGroups = async () => {
    try {
      const response = await exercisesApi.getMuscleGroups();
      setMuscleGroups(response.data || []);
    } catch (err) {
      console.error("Failed to load muscle groups", err);
    }
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      const response = await exercisesApi.list({
        search: search || undefined,
        muscle_group_id: selectedMuscleGroup || undefined,
        equipment: selectedEquipment || undefined,
      });
      setExercises(response.data || []);
    } catch (err) {
      console.error("Failed to load exercises", err);
    } finally {
      setLoading(false);
    }
  };

  const EQUIPMENT_OPTIONS = [
    { value: "barbell", label: "Barbell" },
    { value: "dumbbell", label: "Dumbbell" },
    { value: "cable", label: "Cable" },
    { value: "machine", label: "Machine" },
    { value: "bodyweight", label: "Bodyweight" },
    { value: "kettlebell", label: "Kettlebell" },
    { value: "resistance_band", label: "Resistance Band" },
    { value: "other", label: "Other" },
  ];

  const handleSelectExercise = async (exercise: Exercise) => {
    setSelectingExerciseId(exercise.id);
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (workoutId) {
      navigate(`/workouts/${workoutId}?exercise_id=${exercise.id}&save_to_template=${saveToTemplate}`, { replace: true });
    } else if (sessionId) {
      navigate(`/workouts/active/${sessionId}?exercise_id=${exercise.id}&save_to_template=${saveToTemplate}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const handleCreateExercise = () => {
    const params = new URLSearchParams();
    if (workoutId) params.set("workout_id", workoutId);
    if (sessionId) params.set("session_id", sessionId);
    if (saveToTemplate) params.set("save_to_template", "true");
    navigate(`/exercises/create?${params.toString()}`);
  };

  return (
    <PageLayout 
      title="Select Exercise" 
      showBackButton
      rightAction={
        <button
          onClick={handleCreateExercise}
          className="w-9 h-9 rounded-full bg-gradient-to-r from-gold-600 to-gold-500 flex items-center justify-center active:opacity-80 active:scale-95 transition-all shadow-lg shadow-gold-500/20"
          title="Add Custom Exercise"
        >
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      }
    >
      {/* Search & Filters */}
      <div className="bg-white/5 rounded-2xl border border-white/5 p-4 mb-4 space-y-3">
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={selectedMuscleGroup}
            onChange={(e) => setSelectedMuscleGroup(e.target.value)}
            className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="">All Muscle Groups</option>
            {muscleGroups.map((mg) => (
              <option key={mg.id} value={mg.id} className="bg-black text-white">
                {mg.name}
              </option>
            ))}
          </select>
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="">All Equipment</option>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <option key={eq.value} value={eq.value} className="bg-black text-white">
                {eq.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exercise List */}
      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white font-semibold text-sm">
            Exercises <span className="text-gray-500 font-normal">({exercises.length})</span>
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm mt-4">Loading exercises...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
                <span className="text-2xl">💪</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">No exercises found</p>
              <button
                onClick={handleCreateExercise}
                className="py-3 px-6 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold text-sm rounded-xl active:opacity-80 active:scale-95 transition-all flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Custom Exercise
              </button>
            </div>
          ) : (
            exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleSelectExercise(exercise)}
                disabled={selectingExerciseId === exercise.id}
                className="w-full p-4 flex items-center gap-3 active:bg-white/5 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-11 h-11 rounded-xl bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                  {selectingExerciseId === exercise.id ? (
                    <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-lg">💪</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm mb-1 truncate">{exercise.name}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>{exercise.muscle_group?.name || "Unknown"}</span>
                    <span>•</span>
                    <span className="capitalize">{exercise.equipment}</span>
                    {exercise.is_compound && (
                      <>
                        <span>•</span>
                        <span className="text-gold-500">Compound</span>
                      </>
                    )}
                  </div>
                </div>
                {selectingExerciseId === exercise.id ? (
                  <div className="text-gold-500 text-xs">Adding...</div>
                ) : (
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Create Exercise Button */}
      {exercises.length > 0 && (
        <div className="mt-4">
          <button
            onClick={handleCreateExercise}
            className="w-full h-12 bg-gradient-to-r from-gold-600/20 to-gold-500/20 border border-gold-500/30 text-gold-400 rounded-xl text-sm font-medium active:bg-gold-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Exercise
          </button>
        </div>
      )}
    </PageLayout>
  );
}
