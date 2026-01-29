import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { workoutsApi, exercisesApi, type WorkoutExercise, type Exercise } from "../services/api";
import { PageLayout } from "../components/PageLayout";

function SortableExerciseItem({
  exercise: we,
  onEdit,
  onDelete,
  isOptimistic,
}: {
  exercise: WorkoutExercise;
  onEdit: () => void;
  onDelete: () => void;
  isOptimistic?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: we.id,
    disabled: isOptimistic,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isOptimistic ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-white/5 rounded-xl border ${isOptimistic ? 'border-gold-500/30' : 'border-white/5'} active:bg-white/10 relative`}
    >
      {isOptimistic && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <button
        {...attributes}
        {...listeners}
        disabled={isOptimistic}
        className="text-gray-500 active:text-gold-500 disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <div className="flex-1 min-w-0" onClick={onEdit}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-white text-sm truncate">
            {we.exercise?.name || "Unknown Exercise"}
          </h3>
          {isOptimistic && (
            <span className="text-xs text-gold-500 font-medium">Adding...</span>
          )}
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{we.target_sets} sets</span>
          <span>{we.target_reps_min}-{we.target_reps_max} reps</span>
          <span>RPE {we.target_rpe}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          disabled={isOptimistic}
          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-medium active:bg-white/10 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isOptimistic}
          className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium active:bg-red-500/20 disabled:opacity-50"
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [addingExercise, setAddingExercise] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) loadWorkout();
  }, [id]);

  // Handle exercise selection from URL params
  useEffect(() => {
    const exerciseId = searchParams.get("exercise_id");
    if (exerciseId && id && !loading && workout && !addingExercise) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("exercise_id");
      newParams.delete("save_to_template");
      setSearchParams(newParams, { replace: true });
      handleAddExerciseById(exerciseId);
    }
  }, [id, searchParams.toString(), loading, workout, addingExercise]);

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

    try {
      await workoutsApi.reorderExercises(
        id!,
        newExercises.map((e) => e.id)
      );
    } catch (err: any) {
      alert(err.message || "Failed to reorder exercises");
      await loadWorkout();
    }
  };

  const handleAddExerciseById = async (exerciseId: string) => {
    // Prevent duplicate adds
    if (addingExercise) return;
    
    // Check if exercise already exists in workout
    const existingExercise = exercises.find(ex => ex.exercise?.id === exerciseId);
    if (existingExercise) {
      // Exercise already exists, no need to add again
      return;
    }

    // Store original exercises for rollback
    const originalExercises = [...exercises];
    let optimisticExercise: WorkoutExercise | null = null;

    try {
      setAddingExercise(true);
      
      // Fetch exercise details for optimistic update
      const allExercises = await exercisesApi.list();
      const exerciseData = allExercises.data?.find((e: Exercise) => e.id === exerciseId);
      
      if (exerciseData) {
        // Create optimistic exercise entry
        optimisticExercise = {
          id: `temp-${Date.now()}`,
          workout_id: id!,
          exercise_id: exerciseId,
          exercise: exerciseData,
          order_index: exercises.length,
          target_sets: 3,
          target_reps_min: 8,
          target_reps_max: 12,
          target_rpe: 8,
          rest_seconds: 90,
        };
        
        // Optimistically add to list immediately
        setExercises([...exercises, optimisticExercise]);
      }
      
      // Make API call
      await workoutsApi.addExercise(id!, {
        exercise_id: exerciseId,
        order_index: exercises.length,
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        target_rpe: 8,
        rest_seconds: 90,
      });
      
      // Retry loading workout until the new exercise appears (with max retries)
      // This ensures we get the latest data from the database
      let retries = 0;
      const maxRetries = 5;
      let found = false;
      
      while (retries < maxRetries && !found) {
        // Small delay before checking (give database time to commit)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          const workoutData = await workoutsApi.get(id!);
          const foundExercise = workoutData.exercises?.find((ex: WorkoutExercise) => 
            ex.exercise?.id === exerciseId || ex.exercise_id === exerciseId
          );
          
          if (foundExercise) {
            // Exercise found in response, update the list immediately
            setWorkout(workoutData);
            setExercises(workoutData.exercises || []);
            found = true;
            break;
          } else {
            // Exercise not found yet, but still update with latest data
            setWorkout(workoutData);
            setExercises(workoutData.exercises || []);
          }
        } catch (err) {
          // If error, continue retrying
          console.warn("Retry failed, attempting again...", err);
        }
        
        retries++;
      }
      
      // Final load to ensure we have the latest data
      if (!found) {
        await loadWorkout();
      }
      
    } catch (err: any) {
      // Revert optimistic update on error
      if (optimisticExercise) {
        setExercises(originalExercises);
      }
      alert(err.message || "Failed to add exercise");
    } finally {
      setAddingExercise(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm("Remove this exercise from the workout?")) return;

    try {
      await workoutsApi.removeExercise(id!, exerciseId);
      // Refresh immediately
      await loadWorkout();
    } catch (err: any) {
      alert(err.message || "Failed to remove exercise");
    }
  };

  const handleUpdateExercise = async (exerciseId: string, updates: any) => {
    try {
      await workoutsApi.updateExercise(id!, exerciseId, updates);
      // Refresh immediately
      await loadWorkout();
      setEditingExercise(null);
    } catch (err: any) {
      alert(err.message || "Failed to update exercise");
    }
  };

  if (loading) {
    return (
      <PageLayout title="Workout" showBackButton>
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !workout) {
    return (
      <PageLayout title="Error" showBackButton>
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error || "Workout not found"}</p>
          <button onClick={() => navigate(-1)} className="text-gold-500 text-sm">
            Go Back
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={workout.name} 
      showBackButton
      rightAction={
        <button
          onClick={() => navigate(`/exercises/select?workout_id=${id}`)}
          className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center active:opacity-80 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      }
    >
      {/* Workout Info */}
      <div className="bg-white/5 rounded-2xl border border-white/5 p-4 mb-4">
        <div className="flex gap-4 text-xs text-gray-400">
          <span>Day {workout.day_number}</span>
          {workout.estimated_duration_minutes && (
            <>
              <span>•</span>
              <span>{workout.estimated_duration_minutes} min</span>
            </>
          )}
          <span>•</span>
          <span>{exercises.length} exercises</span>
        </div>
      </div>

      {/* Exercises */}
      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden relative">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white font-semibold text-sm">Exercises</h2>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
              <span className="text-xl">💪</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">No exercises yet</p>
            <button
              onClick={() => navigate(`/exercises/select?workout_id=${id}`)}
              className="py-3 px-6 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold text-sm rounded-xl active:opacity-80 active:scale-95 transition-all"
            >
              Add First Exercise
            </button>
          </div>
        ) : (
          <div className="p-4">
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
                      isOptimistic={exercise.id.startsWith('temp-')}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* Edit Exercise Modal */}
      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise}
          onSave={(updates) => handleUpdateExercise(editingExercise.id, updates)}
          onClose={() => setEditingExercise(null)}
        />
      )}
    </PageLayout>
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white/5 rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-white font-semibold text-base">Edit Exercise</h2>
          <button onClick={onClose} className="text-gray-400 active:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Sets</label>
              <input
                type="number"
                min="1"
                value={formData.target_sets}
                onChange={(e) => setFormData({ ...formData, target_sets: parseInt(e.target.value) })}
                className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">RPE</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.target_rpe}
                onChange={(e) => setFormData({ ...formData, target_rpe: parseInt(e.target.value) })}
                className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Reps Min</label>
              <input
                type="number"
                min="1"
                value={formData.target_reps_min}
                onChange={(e) => setFormData({ ...formData, target_reps_min: parseInt(e.target.value) })}
                className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Reps Max</label>
              <input
                type="number"
                min="1"
                value={formData.target_reps_max}
                onChange={(e) => setFormData({ ...formData, target_reps_max: parseInt(e.target.value) })}
                className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Rest (seconds)</label>
            <input
              type="number"
              min="0"
              value={formData.rest_seconds}
              onChange={(e) => setFormData({ ...formData, rest_seconds: parseInt(e.target.value) })}
              className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50 resize-none"
              placeholder="Form cues, tips..."
            />
          </div>

          <div className="flex gap-3 pt-2 pb-4">
            <button type="button" onClick={onClose} className="flex-1 h-11 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium active:bg-white/10">
              Cancel
            </button>
            <button type="submit" className="flex-1 h-11 bg-gradient-to-r from-gold-600 to-gold-500 text-black rounded-xl text-sm font-semibold active:opacity-80">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
