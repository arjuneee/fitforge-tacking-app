import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { sessionsApi, setsApi, workoutsApi, exercisesApi, type Session, type ExerciseInSession, type Set, type Exercise } from "../services/api";
import { SetLogger, type SetLoggerRef } from "../components/SetLogger";
import { RestTimer } from "../components/RestTimer";
import { PreviousPerformance } from "../components/PreviousPerformance";
import { ProgressiveOverloadSuggestion } from "../components/ProgressiveOverloadSuggestion";
import { offlineService } from "../services/offline";

interface LoggedSet extends Set {
  workout_exercise_id: string;
}

export function ActiveWorkoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [session, setSession] = useState<Session | null>(null);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState<Set | null>(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [skippedExercises, setSkippedExercises] = useState<globalThis.Set<string>>(new globalThis.Set<string>());
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const setLoggerRef = useRef<SetLoggerRef>(null);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  // Handle exercise selection from URL params
  useEffect(() => {
    const exerciseId = searchParams.get("exercise_id");
    const saveToTemplate = searchParams.get("save_to_template") === "true";
    if (exerciseId && session && !loading && !addingExercise) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("exercise_id");
      newParams.delete("save_to_template");
      setSearchParams(newParams, { replace: true });
      handleAddExerciseById(exerciseId, saveToTemplate);
    }
  }, [sessionId, session?.id, searchParams.toString(), loading, addingExercise]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleSync = async () => {
      const count = await offlineService.getPendingCount();
      setPendingCount(count);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("syncPendingItems", handleSync);

    // Check pending count periodically
    const interval = setInterval(handleSync, 5000);
    handleSync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("syncPendingItems", handleSync);
      clearInterval(interval);
    };
  }, []);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionData = await sessionsApi.get(sessionId!);
      setSession(sessionData);

      // Load logged sets
      const setsData = await setsApi.getBySession(sessionId!);
      const allSets: LoggedSet[] = [];
      if (setsData.exercises) {
        for (const ex of setsData.exercises) {
          for (const set of ex.sets || []) {
            allSets.push({
              ...set,
              workout_exercise_id: "", // Will be set from exercise mapping
              exercise: ex.exercise,
            } as LoggedSet);
          }
        }
      }
      setLoggedSets(allSets);
    } catch (err: any) {
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const handleLogSet = async (setData: {
    weight_kg: number;
    reps: number;
    rpe?: number;
    is_warmup?: boolean;
    is_failure?: boolean;
    is_dropset?: boolean;
    rest_seconds?: number;
    notes?: string;
  }) => {
    if (!session) return;

    const currentExercise = session.exercises[activeExerciseIndex];
    if (!currentExercise) return;

    try {
      const newSet = await setsApi.create({
        workout_exercise_id: currentExercise.id,
        exercise_id: currentExercise.exercise.id,
        session_date: session.session_date,
        set_number: 0, // Auto-calculated
        weight_kg: setData.weight_kg,
        reps: setData.reps,
        rpe: setData.rpe,
        is_warmup: setData.is_warmup || false,
        is_failure: setData.is_failure || false,
        is_dropset: setData.is_dropset || false,
        rest_seconds: setData.rest_seconds || currentExercise.rest_seconds,
        notes: setData.notes,
      });

      setLoggedSets([...loggedSets, newSet as LoggedSet]);

      // Start rest timer if enabled
      if (setData.rest_seconds !== undefined && setData.rest_seconds > 0) {
        setRestTimerSeconds(setData.rest_seconds);
        setRestTimerActive(true);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to log set";
      console.error("[ActiveWorkout] Error logging set:", err);
      alert(errorMsg);
      throw err; // Re-throw so SetLogger can handle it
    }
  };

  const handleSkipExercise = (exerciseId: string) => {
    setSkippedExercises(new Set([...skippedExercises, exerciseId]));
  };

  const handleAddExerciseById = async (exerciseId: string, saveToTemplate: boolean = true) => {
    if (!session || addingExercise) return;

    // Check if exercise already exists in session
    const existingExercise = session.exercises.find(ex => ex.exercise?.id === exerciseId);
    if (existingExercise) {
      // Exercise already exists, just navigate to it
      const index = session.exercises.findIndex(ex => ex.exercise?.id === exerciseId);
      if (index >= 0) {
        setActiveExerciseIndex(index);
      }
      return;
    }

    // Store original session for rollback
    const originalSession = session;
    let optimisticExercise: ExerciseInSession | null = null;

    try {
      setAddingExercise(true);
      
      // Fetch exercise details for optimistic update
      const allExercises = await exercisesApi.list();
      const exerciseData = allExercises.data?.find((e: Exercise) => e.id === exerciseId);
      
      if (exerciseData) {
        // Create optimistic exercise entry
        optimisticExercise = {
          id: `temp-${Date.now()}`,
          exercise: exerciseData,
          target_sets: 3,
          target_reps_min: 8,
          target_reps_max: 12,
          target_rpe: 8,
          rest_seconds: 90,
        };
        
        // Optimistically add to session
        const updatedExercises = [...session.exercises, optimisticExercise] as ExerciseInSession[];
        setSession({
          ...session,
          exercises: updatedExercises,
        });
        
        // Move to the new exercise
        setActiveExerciseIndex(updatedExercises.length - 1);
      }
      
      // Add exercise to workout template (this makes it available for future sessions too)
      if (saveToTemplate) {
        await workoutsApi.addExercise(session.workout_id, {
          exercise_id: exerciseId,
          order_index: session.exercises.length, // Add at the end
          target_sets: 3,
          target_reps_min: 8,
          target_reps_max: 12,
          target_rpe: 8,
          rest_seconds: 90,
        });
      }

      // Retry loading session until the new exercise appears (with max retries)
      let retries = 0;
      const maxRetries = 5;
      let found = false;
      
      while (retries < maxRetries && !found) {
        // Small delay before checking
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          await loadSession();
          
          // Check if exercise now exists in the session
          const currentSession = await sessionsApi.get(sessionId!);
          const foundExercise = currentSession.exercises?.find((ex: ExerciseInSession) => 
            ex.exercise?.id === exerciseId
          );
          
          if (foundExercise) {
            // Exercise found, move to it
            const exerciseIndex = currentSession.exercises.findIndex((ex: ExerciseInSession) => 
              ex.exercise?.id === exerciseId
            );
            if (exerciseIndex >= 0) {
              setActiveExerciseIndex(exerciseIndex);
            }
            found = true;
            break;
          }
        } catch (err) {
          // If error, continue retrying
          console.warn("Retry failed, attempting again...", err);
        }
        
        retries++;
      }
      
      // If we exhausted retries, still try to load and navigate
      if (!found && retries >= maxRetries) {
        await loadSession();
        const currentSession = await sessionsApi.get(sessionId!);
        const exerciseIndex = currentSession.exercises?.findIndex((ex: ExerciseInSession) => 
          ex.exercise?.id === exerciseId
        );
        if (exerciseIndex >= 0) {
          setActiveExerciseIndex(exerciseIndex);
        }
      }
    } catch (err: any) {
      // Revert optimistic update on error
      if (optimisticExercise) {
        setSession(originalSession);
      }
      alert(err.response?.data?.detail || err.message || "Failed to add exercise");
    } finally {
      setAddingExercise(false);
    }
  };

  const handleEditSet = async (setId: string, updates: Partial<Set>) => {
    try {
      const updated = await setsApi.update(setId, updates);
      setLoggedSets(loggedSets.map((s) => (s.id === setId ? (updated as LoggedSet) : s)));
      setEditingSet(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to update set");
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!confirm("Delete this set?")) return;

    try {
      await setsApi.delete(setId);
      setLoggedSets(loggedSets.filter((s) => s.id !== setId));
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to delete set");
    }
  };

  const handleFinishWorkout = () => {
    if (!session) return;
    navigate(`/workouts/complete/${session.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Session not found"}</p>
          <button
            onClick={() => navigate("/workouts/start")}
            className="text-gold-500 hover:text-gold-400"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentExercise = session.exercises[activeExerciseIndex];
  const exerciseSets = loggedSets.filter(
    (s) => s.exercise_id === currentExercise?.exercise.id
  );

  return (
    <div className="min-h-dvh bg-black pb-24 md:pb-6">
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-10 glass-card border-b border-white/10 px-3 md:px-4 py-3 md:py-4 safe-top">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-white truncate">{session.workout_name}</h1>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
              <span>{activeExerciseIndex + 1}/{session.exercises.length}</span>
              {!isOnline && (
                <span className="text-yellow-500">• Offline</span>
              )}
              {pendingCount > 0 && (
                <span className="text-blue-400">• {pendingCount} pending</span>
              )}
            </div>
          </div>
          <button
            onClick={handleFinishWorkout}
            className="btn-primary px-3 md:px-4 py-2 text-sm whitespace-nowrap ml-3"
          >
            <span className="hidden md:inline">Finish Workout</span>
            <span className="md:hidden">Finish</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Exercise Pills - Horizontal Scroll */}
        <div className="mb-4 md:mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
            {session.exercises.map((ex, idx) => {
              const isSkipped = skippedExercises.has(ex.id);
              const setsCount = loggedSets.filter((s) => s.exercise_id === ex.exercise.id).length;
              const isActive = idx === activeExerciseIndex;

              return (
                <button
                  key={ex.id}
                  onClick={() => setActiveExerciseIndex(idx)}
                  className={`flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? "bg-gold-500/20 text-gold-500 border-2 border-gold-500/40 font-medium"
                      : isSkipped
                      ? "bg-gray-800/50 text-gray-500 border border-gray-700"
                      : "bg-white/5 text-white border border-white/10"
                  }`}
                >
                  {ex.exercise.name}
                  {setsCount > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-gold-500/30' : 'bg-white/10'}`}>
                      {setsCount}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => navigate(`/exercises/select?session_id=${sessionId}&save_to_template=true`)}
              className="flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-sm bg-gold-500/10 text-gold-500 border border-gold-500/20 active:scale-95"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Current Exercise */}
        {currentExercise && !skippedExercises.has(currentExercise.id) && (
          <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6 glow-border">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2 truncate">
                  {currentExercise.exercise.name}
                </h2>
                <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-400">
                  <span className="bg-white/5 px-2 py-0.5 rounded-full">{currentExercise.exercise.muscle_group?.name}</span>
                  <span className="bg-white/5 px-2 py-0.5 rounded-full capitalize">{currentExercise.exercise.equipment}</span>
                  {currentExercise.exercise.is_compound && (
                    <span className="bg-gold-500/10 text-gold-500 px-2 py-0.5 rounded-full">Compound</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSkipExercise(currentExercise.id)}
                className="ml-2 px-3 py-1.5 bg-gray-800/50 active:bg-gray-800 text-gray-400 rounded-lg text-sm whitespace-nowrap"
              >
                Skip
              </button>
            </div>

            {/* Progressive Overload Suggestion */}
            <ProgressiveOverloadSuggestion
              exerciseId={currentExercise.exercise.id}
              onAccept={(suggestion) => {
                if (suggestion.suggested_weight_kg || suggestion.suggested_reps) {
                  setLoggerRef.current?.quickFill({
                    weight_kg: suggestion.suggested_weight_kg || 0,
                    reps: suggestion.suggested_reps || 0,
                  });
                }
              }}
            />

            {/* Previous Performance */}
            {currentExercise.last_session && (
              <PreviousPerformance
                lastSession={currentExercise.last_session}
                onQuickFill={(data) => {
                  setLoggerRef.current?.quickFill(data);
                }}
              />
            )}

            {/* Logged Sets */}
            {exerciseSets.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Logged Sets</h3>
                <div className="space-y-2">
                  {exerciseSets.map((set) => (
                    <div
                      key={set.id}
                      onClick={() => setEditingSet(set)}
                      className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-gold-500/30 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-white font-medium">
                            Set {set.set_number}: {set.weight_kg}kg × {set.reps}
                          </span>
                          {set.rpe && (
                            <span className="text-gray-400 text-sm ml-2">RPE {set.rpe}</span>
                          )}
                          <div className="flex gap-2 mt-1">
                            {set.is_warmup && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                Warmup
                              </span>
                            )}
                            {set.is_failure && (
                              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                                Failure
                              </span>
                            )}
                            {set.is_dropset && (
                              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                Dropset
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSet(set.id);
                          }}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Set Logger */}
            <SetLogger
              ref={setLoggerRef}
              exercise={currentExercise}
              previousSets={currentExercise.last_session?.sets || []}
              onLogSet={handleLogSet}
              defaultRestSeconds={currentExercise.rest_seconds}
            />
          </div>
        )}

        {/* Skipped Exercise Message */}
        {currentExercise && skippedExercises.has(currentExercise.id) && (
          <div className="glass-card rounded-3xl p-6 mb-6 glow-border">
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Exercise Skipped</p>
              <button
                onClick={() => {
                  const newSkipped = new Set(skippedExercises);
                  newSkipped.delete(currentExercise.id);
                  setSkippedExercises(newSkipped);
                }}
                className="btn-secondary"
              >
                Undo Skip
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveExerciseIndex(Math.max(0, activeExerciseIndex - 1))}
            disabled={activeExerciseIndex === 0}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            ← Previous
          </button>
          <button
            onClick={() =>
              setActiveExerciseIndex(
                Math.min(session.exercises.length - 1, activeExerciseIndex + 1)
              )
            }
            disabled={activeExerciseIndex === session.exercises.length - 1}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Rest Timer */}
      {restTimerActive && (
        <RestTimer
          initialSeconds={restTimerSeconds}
          onComplete={() => setRestTimerActive(false)}
          onSkip={() => setRestTimerActive(false)}
        />
      )}

      {/* Exercise Selector */}

      {/* Edit Set Modal */}
      {editingSet && (
        <EditSetModal
          set={editingSet}
          onSave={(updates) => handleEditSet(editingSet.id, updates)}
          onClose={() => setEditingSet(null)}
        />
      )}
    </div>
  );
}

function EditSetModal({
  set,
  onSave,
  onClose,
}: {
  set: Set;
  onSave: (updates: Partial<Set>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    weight_kg: set.weight_kg,
    reps: set.reps,
    rpe: set.rpe || 8,
    is_warmup: set.is_warmup,
    is_failure: set.is_failure,
    is_dropset: set.is_dropset,
    notes: set.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-card rounded-3xl p-6 w-full max-w-md glow-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Set</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Reps</label>
              <input
                type="number"
                min="0"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) })}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">RPE</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.rpe}
              onChange={(e) => setFormData({ ...formData, rpe: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_warmup}
                onChange={(e) => setFormData({ ...formData, is_warmup: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-300">Warmup</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_failure}
                onChange={(e) => setFormData({ ...formData, is_failure: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-300">Failure</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_dropset}
                onChange={(e) => setFormData({ ...formData, is_dropset: e.target.checked })}
                className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-300">Dropset</span>
            </label>
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
