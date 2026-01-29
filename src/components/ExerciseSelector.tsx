import { useState, useEffect } from "react";
import { exercisesApi, type Exercise, type MuscleGroup } from "../services/api";

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise, saveToTemplate?: boolean) => void;
  onClose: () => void;
  showSaveToTemplate?: boolean;
  defaultSaveToTemplate?: boolean;
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
    if (!showCreateForm) {
      loadExercises();
    }
  }, [search, selectedMuscleGroup, selectedEquipment, showCreateForm]);

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

      await loadExercises();
      onSelect(newExercise, saveToTemplate);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to create exercise");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Modal Container */}
      <div className={`bg-black border-t md:border border-white/10 w-full max-w-md flex flex-col rounded-t-3xl md:rounded-3xl overflow-hidden ${
        showCreateForm 
          ? 'h-[80vh] md:h-auto md:max-h-[85vh]' 
          : 'h-[85vh] md:h-auto md:max-h-[85vh]'
      }`}>
        
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 border-b border-white/5 bg-black/50">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-base">
              {showCreateForm ? "Create Exercise" : "Select Exercise"}
            </h2>
            <div className="flex items-center gap-2">
              {!showCreateForm && (
                <button
                  onClick={handleShowCreateForm}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-gold-600 to-gold-500 flex items-center justify-center text-black active:opacity-80 active:scale-95 transition-all shadow-lg shadow-gold-500/20"
                  title="Add Custom Exercise"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 active:text-white active:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {showCreateForm ? (
          /* CREATE EXERCISE FORM */
          <form onSubmit={handleCreateExercise} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Content Area - Includes buttons so they can scroll up */}
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="p-4 space-y-4">
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

                {/* Action Buttons - Inside scrollable area with padding */}
                <div className="pt-4 pb-8 border-t border-white/5 mt-4">
                  <div className="flex gap-3">
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
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* EXERCISE SELECTION VIEW */
          <>
            {/* Search & Filters - Fixed */}
            <div className="flex-shrink-0 p-4 border-b border-white/5 bg-black/50 space-y-3">
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedMuscleGroup}
                  onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all appearance-none"
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
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50 focus:bg-white/10 transition-all appearance-none"
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

            {/* Exercise List - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 space-y-2">
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
                      onClick={handleShowCreateForm}
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
                      onClick={() => {
                        onSelect(exercise, saveToTemplate);
                        onClose();
                      }}
                      className="w-full p-4 bg-white/5 active:bg-white/10 border border-white/5 active:border-gold-500/30 rounded-xl text-left transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">💪</span>
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
                        <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Footer Actions - Fixed */}
            <div className="flex-shrink-0 border-t border-white/5 bg-black/50">
              {/* Save to Template Option */}
              {showSaveToTemplate && exercises.length > 0 && (
                <div className="p-4 border-b border-white/5">
                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer active:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={saveToTemplate}
                      onChange={(e) => setSaveToTemplate(e.target.checked)}
                      className="w-5 h-5 rounded bg-white/5 border-white/20 text-gold-500 focus:ring-gold-500 focus:ring-1"
                    />
                    <div className="flex-1">
                      <span className="text-white text-sm font-medium block">Save to workout template</span>
                      <p className="text-xs text-gray-400 mt-0.5">Add this exercise to the workout for future sessions</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Create Exercise Button */}
              <div className="p-4">
                <button
                  onClick={handleShowCreateForm}
                  className="w-full h-12 bg-gradient-to-r from-gold-600/20 to-gold-500/20 border border-gold-500/30 text-gold-400 rounded-xl text-sm font-medium active:bg-gold-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Custom Exercise
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
