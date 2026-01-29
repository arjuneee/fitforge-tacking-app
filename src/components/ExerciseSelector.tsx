import { useState, useEffect } from "react";
import { exercisesApi, type Exercise, type MuscleGroup } from "../services/api";

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise, saveToTemplate?: boolean) => void;
  onClose: () => void;
  showSaveToTemplate?: boolean; // Show option to save to template
  defaultSaveToTemplate?: boolean; // Default value for save to template
}

interface ExerciseCreateForm {
  name: string;
  muscle_group_id: string;
  secondary_muscle_group_id?: string;
  equipment: string;
  is_compound: boolean;
  is_unilateral: boolean;
  instructions?: string;
}

export function ExerciseSelector({ 
  onSelect, 
  onClose, 
  showSaveToTemplate = false,
  defaultSaveToTemplate = true 
}: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saveToTemplate, setSaveToTemplate] = useState(defaultSaveToTemplate);
  const [createForm, setCreateForm] = useState<ExerciseCreateForm>({
    name: "",
    muscle_group_id: "",
    equipment: "dumbbell",
    is_compound: false,
    is_unilateral: false,
    instructions: "",
  });

  // When showing create form, pre-fill with search/filter values
  const handleShowCreateForm = () => {
    setCreateForm({
      name: search || "",
      muscle_group_id: selectedMuscleGroup || "",
      equipment: selectedEquipment || "dumbbell",
      is_compound: false,
      is_unilateral: false,
      instructions: "",
    });
    setShowCreateForm(true);
  };

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

      // Reload exercises to include the new one
      await loadExercises();
      
      // Select the newly created exercise
      onSelect(newExercise, saveToTemplate);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to create exercise");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-card rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col glow-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Select Exercise</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
          <div className="grid grid-cols-2 gap-4">
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
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="input-field"
            >
              <option value="">All Equipment</option>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <option key={eq.value} value={eq.value}>
                  {eq.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercise List or Create Form */}
        {showCreateForm ? (
          <form onSubmit={handleCreateExercise} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Exercise Name *
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Chest Press"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Primary Muscle Group *
                </label>
                <select
                  value={createForm.muscle_group_id}
                  onChange={(e) => setCreateForm({ ...createForm, muscle_group_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select...</option>
                  {muscleGroups.map((mg) => (
                    <option key={mg.id} value={mg.id}>
                      {mg.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Secondary Muscle Group
                </label>
                <select
                  value={createForm.secondary_muscle_group_id || ""}
                  onChange={(e) => setCreateForm({ ...createForm, secondary_muscle_group_id: e.target.value || undefined })}
                  className="input-field"
                >
                  <option value="">None</option>
                  {muscleGroups.map((mg) => (
                    <option key={mg.id} value={mg.id}>
                      {mg.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Equipment *
              </label>
              <select
                value={createForm.equipment}
                onChange={(e) => setCreateForm({ ...createForm, equipment: e.target.value })}
                className="input-field"
                required
              >
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <option key={eq.value} value={eq.value}>
                    {eq.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.is_compound}
                  onChange={(e) => setCreateForm({ ...createForm, is_compound: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-gold-500 focus:ring-gold-500"
                />
                <span className="text-sm text-gray-300">Compound Exercise</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.is_unilateral}
                  onChange={(e) => setCreateForm({ ...createForm, is_unilateral: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-gold-500 focus:ring-gold-500"
                />
                <span className="text-sm text-gray-300">Unilateral</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instructions
              </label>
              <textarea
                value={createForm.instructions || ""}
                onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                rows={3}
                className="input-field"
                placeholder="Exercise instructions, form cues..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({
                    name: "",
                    muscle_group_id: "",
                    equipment: "dumbbell",
                    is_compound: false,
                    is_unilateral: false,
                    instructions: "",
                  });
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create & Add"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No exercises found</p>
                  <button
                    onClick={handleShowCreateForm}
                    className="btn-primary w-auto px-6"
                  >
                    + Create New Exercise
                  </button>
                </div>
              ) : (
                exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      onSelect(exercise, saveToTemplate);
                      onClose();
                    }}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold-500/30 rounded-xl transition-all text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white mb-1">{exercise.name}</h3>
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span>{exercise.muscle_group.name}</span>
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
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Save to Template Option */}
            {showSaveToTemplate && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={saveToTemplate}
                    onChange={(e) => setSaveToTemplate(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
                  />
                  <div>
                    <span className="text-white text-sm font-medium">Save to workout template</span>
                    <p className="text-xs text-gray-400">Add this exercise to the workout for future sessions</p>
                  </div>
                </label>
              </div>
            )}

            {/* Create Exercise Button */}
            {exercises.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={handleShowCreateForm}
                  className="w-full btn-secondary"
                >
                  + Create New Exercise
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
