import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exercisesApi, type MuscleGroup } from "../services/api";
import { PageLayout } from "../components/PageLayout";

interface ExerciseCreateForm {
  name: string;
  muscle_group_id: string;
  secondary_muscle_group_id?: string;
  equipment: string;
  is_compound: boolean;
  is_unilateral: boolean;
  instructions?: string;
}

export function ExerciseCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workoutId = searchParams.get("workout_id");
  const sessionId = searchParams.get("session_id");
  const saveToTemplate = searchParams.get("save_to_template") === "true";

  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ExerciseCreateForm>({
    name: "",
    muscle_group_id: "",
    equipment: "dumbbell",
    is_compound: false,
    is_unilateral: false,
    instructions: "",
  });

  useEffect(() => {
    loadMuscleGroups();
  }, []);

  const loadMuscleGroups = async () => {
    try {
      const response = await exercisesApi.getMuscleGroups();
      setMuscleGroups(response.data || []);
    } catch (err) {
      console.error("Failed to load muscle groups", err);
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

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.muscle_group_id) {
      alert("Please fill in exercise name and muscle group");
      return;
    }

    try {
      setCreating(true);
      const newExercise = await exercisesApi.create({
        name: createForm.name,
        muscle_group_id: createForm.muscle_group_id,
        secondary_muscle_group_id: createForm.secondary_muscle_group_id || undefined,
        equipment: createForm.equipment,
        is_compound: createForm.is_compound,
        is_unilateral: createForm.is_unilateral,
        instructions: createForm.instructions || undefined,
      });

      // Navigate back and pass the exercise ID
      if (workoutId) {
        navigate(`/workouts/${workoutId}?exercise_id=${newExercise.id}&save_to_template=${saveToTemplate}`, { replace: true });
      } else if (sessionId) {
        navigate(`/workouts/active/${sessionId}?exercise_id=${newExercise.id}&save_to_template=${saveToTemplate}`, { replace: true });
      } else {
        navigate(-1);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to create exercise");
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageLayout title="Create Exercise" showBackButton>
      <form onSubmit={handleCreateExercise} className="space-y-4 pb-6">
        {/* Exercise Name */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium">Exercise Name *</label>
          <input
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all"
            placeholder="e.g., Chest Press"
            required
          />
        </div>

        {/* Muscle Groups */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Primary Muscle *</label>
            <select
              value={createForm.muscle_group_id}
              onChange={(e) => setCreateForm({ ...createForm, muscle_group_id: e.target.value })}
              className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all appearance-none"
              required
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
              <option value="">Select...</option>
              {muscleGroups.map((mg) => (
                <option key={mg.id} value={mg.id} className="bg-black text-white">
                  {mg.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Secondary Muscle</label>
            <select
              value={createForm.secondary_muscle_group_id || ""}
              onChange={(e) => setCreateForm({ ...createForm, secondary_muscle_group_id: e.target.value || undefined })}
              className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
              <option value="">None</option>
              {muscleGroups.map((mg) => (
                <option key={mg.id} value={mg.id} className="bg-black text-white">
                  {mg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium">Equipment *</label>
          <select
            value={createForm.equipment}
            onChange={(e) => setCreateForm({ ...createForm, equipment: e.target.value })}
            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all appearance-none"
            required
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            {EQUIPMENT_OPTIONS.map((eq) => (
              <option key={eq.value} value={eq.value} className="bg-black text-white">
                {eq.label}
              </option>
            ))}
          </select>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={createForm.is_compound}
              onChange={(e) => setCreateForm({ ...createForm, is_compound: e.target.checked })}
              className="w-4 h-4 rounded bg-white/5 border-white/20 text-gold-500 focus:ring-gold-500 focus:ring-1"
            />
            <span className="text-xs text-gray-300 group-hover:text-white transition-colors">Compound</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={createForm.is_unilateral}
              onChange={(e) => setCreateForm({ ...createForm, is_unilateral: e.target.checked })}
              className="w-4 h-4 rounded bg-white/5 border-white/20 text-gold-500 focus:ring-gold-500 focus:ring-1"
            />
            <span className="text-xs text-gray-300 group-hover:text-white transition-colors">Unilateral</span>
          </label>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium">Instructions</label>
          <textarea
            value={createForm.instructions || ""}
            onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all resize-none"
            placeholder="Exercise instructions, form cues..."
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-12 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium active:bg-white/10 active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="flex-1 h-12 bg-gradient-to-r from-gold-600 to-gold-500 text-black rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:opacity-80 active:scale-[0.98] transition-all shadow-lg shadow-gold-500/20"
          >
            {creating ? "Creating..." : "Create & Add"}
          </button>
        </div>
      </form>
    </PageLayout>
  );
}
