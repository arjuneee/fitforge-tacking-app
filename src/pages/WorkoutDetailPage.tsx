import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { workoutsApi, type WorkoutExercise, type Exercise } from "../services/api";
import { ExerciseSelector } from "../components/ExerciseSelector";

function SortableExerciseItem({
  exercise: we,
  onEdit,
  onDelete,
}: {
  exercise: WorkoutExercise;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: we.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-gold-500/30 transition-all"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gold-500 cursor-grab active:cursor-grabbing"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <div className="flex-1">
        <h3 className="font-semibold text-white mb-1">
          {we.exercise?.name || "Unknown Exercise"}
        </h3>
        <div className="flex gap-4 text-xs text-gray-400">
          <span>{we.target_sets} sets</span>
          <span>{we.target_reps_min}-{we.target_reps_max} reps</span>
          <span>RPE {we.target_rpe}</span>
          <span>{we.rest_seconds}s rest</span>
        </div>
        {we.notes && (
          <p className="text-xs text-gray-500 mt-1">{we.notes}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-white rounded-lg transition-all text-sm"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-lg transition-all text-sm"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) loadWorkout();
  }, [id]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      const data = await workoutsApi.get(id!);
      setWorkout(data);
      setExercises(data.exercises || []);
    } catch (err: any) {
      setError(err.message || "Failed to load workout");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = exercises.findIndex((e) => e.id === active.id);
    const newIndex = exercises.findIndex((e) => e.id === over.id);

    const newExercises = arrayMove(exercises, oldIndex, newIndex);
    setExercises(newExercises);

    // Update order on server
    try {
      await workoutsApi.reorderExercises(
        id!,
        newExercises.map((e) => e.id)
      );
    } catch (err: any) {
      alert(err.message || "Failed to reorder exercises");
      await loadWorkout(); // Revert on error
    }
  };

  const handleAddExercise = async (exercise: Exercise) => {
    try {
      const newWe = await workoutsApi.addExercise(id!, {
        exercise_id: exercise.id,
        order_index: exercises.length,
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        target_rpe: 8,
        rest_seconds: 90,
      });
      await loadWorkout();
    } catch (err: any) {
      alert(err.message || "Failed to add exercise");
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm("Remove this exercise from the workout?")) return;

    try {
      await workoutsApi.removeExercise(id!, exerciseId);
      await loadWorkout();
    } catch (err: any) {
      alert(err.message || "Failed to remove exercise");
    }
  };

  const handleUpdateExercise = async (exerciseId: string, updates: any) => {
    try {
      await workoutsApi.updateExercise(id!, exerciseId, updates);
      await loadWorkout();
      setEditingExercise(null);
    } catch (err: any) {
      alert(err.message || "Failed to update exercise");
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading...</div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Workout not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-gold-500 hover:text-gold-400"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gold-500 hover:text-gold-400 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gradient mb-2">{workout.name}</h1>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>Day {workout.day_number}</span>
            {workout.estimated_duration_minutes && (
              <span>{workout.estimated_duration_minutes} minutes</span>
            )}
            <span>{exercises.length} exercises</span>
          </div>
        </div>

        {/* Exercises */}
        <div className="glass-card rounded-3xl p-6 glow-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Exercises</h2>
            <button
              onClick={() => setShowExerciseSelector(true)}
              className="btn-primary w-auto px-4 py-2 text-sm"
            >
              + Add Exercise
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No exercises yet</p>
              <button
                onClick={() => setShowExerciseSelector(true)}
                className="btn-primary w-auto px-6"
              >
                Add First Exercise
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={exercises.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {exercises.map((exercise) => (
                    <SortableExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      onEdit={() => setEditingExercise(exercise)}
                      onDelete={() => handleDeleteExercise(exercise.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Exercise Selector Modal */}
        {showExerciseSelector && (
          <ExerciseSelector
            onSelect={handleAddExercise}
            onClose={() => setShowExerciseSelector(false)}
          />
        )}

        {/* Edit Exercise Modal */}
        {editingExercise && (
          <ExerciseEditModal
            exercise={editingExercise}
            onSave={(updates) => handleUpdateExercise(editingExercise.id, updates)}
            onClose={() => setEditingExercise(null)}
          />
        )}
      </div>
    </div>
  );
}

function ExerciseEditModal({
  exercise,
  onSave,
  onClose,
}: {
  exercise: WorkoutExercise;
  onSave: (updates: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    target_sets: exercise.target_sets,
    target_reps_min: exercise.target_reps_min,
    target_reps_max: exercise.target_reps_max,
    target_rpe: exercise.target_rpe,
    rest_seconds: exercise.rest_seconds,
    notes: exercise.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-card rounded-3xl p-6 w-full max-w-md glow-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Exercise</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Sets</label>
              <input
                type="number"
                min="1"
                value={formData.target_sets}
                onChange={(e) => setFormData({ ...formData, target_sets: parseInt(e.target.value) })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">RPE</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.target_rpe}
                onChange={(e) => setFormData({ ...formData, target_rpe: parseInt(e.target.value) })}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Reps Min</label>
              <input
                type="number"
                min="1"
                value={formData.target_reps_min}
                onChange={(e) => setFormData({ ...formData, target_reps_min: parseInt(e.target.value) })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Reps Max</label>
              <input
                type="number"
                min="1"
                value={formData.target_reps_max}
                onChange={(e) => setFormData({ ...formData, target_reps_max: parseInt(e.target.value) })}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Rest (seconds)</label>
            <input
              type="number"
              min="0"
              value={formData.rest_seconds}
              onChange={(e) => setFormData({ ...formData, rest_seconds: parseInt(e.target.value) })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="input-field"
              placeholder="Form cues, tips..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
