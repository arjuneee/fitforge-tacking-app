import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { type ExerciseInSession, type Set } from "../services/api";

interface SetLoggerProps {
  exercise: ExerciseInSession;
  previousSets: Array<{ weight_kg: number; reps: number; rpe?: number }>;
  onLogSet: (setData: {
    weight_kg: number;
    reps: number;
    rpe?: number;
    is_warmup?: boolean;
    is_failure?: boolean;
    is_dropset?: boolean;
    rest_seconds?: number;
    notes?: string;
  }) => Promise<void>;
  defaultRestSeconds: number;
}

export interface SetLoggerRef {
  quickFill: (data: { weight_kg: number; reps: number; rpe?: number }) => void;
}

export const SetLogger = forwardRef<SetLoggerRef, SetLoggerProps>(({
  exercise,
  previousSets,
  onLogSet,
  defaultRestSeconds,
}, ref) => {
  // Initialize weight from previous session or default to 20kg
  const getInitialWeight = () => {
    if (previousSets.length > 0) {
      return previousSets[previousSets.length - 1].weight_kg;
    }
    return 20; // Default starting weight
  };

  const [weight, setWeight] = useState(getInitialWeight());
  const [reps, setReps] = useState(exercise.target_reps_min);
  const [rpe, setRpe] = useState<number | undefined>(exercise.target_rpe);
  const [isWarmup, setIsWarmup] = useState(false);
  const [isFailure, setIsFailure] = useState(false);
  const [isDropset, setIsDropset] = useState(false);
  const [notes, setNotes] = useState("");
  const [justLogged, setJustLogged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update weight when previous sets change
  useEffect(() => {
    if (previousSets.length > 0) {
      const lastSet = previousSets[previousSets.length - 1];
      setWeight(lastSet.weight_kg);
      setReps(lastSet.reps);
      if (lastSet.rpe) {
        setRpe(lastSet.rpe);
      }
    }
  }, [previousSets]);

  const handleQuickFill = (data?: { weight_kg: number; reps: number; rpe?: number }) => {
    const fillData = data || (previousSets.length > 0 ? previousSets[previousSets.length - 1] : null);
    if (fillData) {
      setWeight(fillData.weight_kg);
      setReps(fillData.reps);
      if (fillData.rpe) {
        setRpe(fillData.rpe);
      }
    }
  };

  // Expose quickFill method via ref
  useImperativeHandle(ref, () => ({
    quickFill: handleQuickFill,
  }));

  // Get previous set for comparison
  const lastPreviousSet = previousSets.length > 0 ? previousSets[previousSets.length - 1] : null;
  const exceedsWeight = lastPreviousSet && weight > lastPreviousSet.weight_kg;
  const exceedsReps = lastPreviousSet && reps > lastPreviousSet.reps;
  const exceedsVolume = lastPreviousSet && (weight * reps) > (lastPreviousSet.weight_kg * lastPreviousSet.reps);

  const handleLogSet = async () => {
    if (weight <= 0) {
      setError("Please set a weight");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (reps <= 0) {
      setError("Please set reps");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setError(null);
    
    try {
      await onLogSet({
        weight_kg: weight,
        reps,
        rpe,
        is_warmup: isWarmup,
        is_failure: isFailure,
        is_dropset: isDropset,
        rest_seconds: defaultRestSeconds,
        notes: notes || undefined,
      });

      // Reset for next set (keep weight, increment reps slightly or keep same)
      setReps(exercise.target_reps_min);
      setNotes("");
      setIsWarmup(false);
      setIsFailure(false);
      setIsDropset(false);

      // Show confirmation
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 2000);
    } catch (err) {
      setError("Failed to log set. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const adjustWeight = (delta: number) => {
    setWeight(Math.max(0, weight + delta));
  };

  const adjustReps = (delta: number) => {
    setReps(Math.max(0, reps + delta));
  };

  const RPE_DESCRIPTIONS: Record<number, string> = {
    1: "Very Easy",
    2: "Easy",
    3: "Moderate",
    4: "Somewhat Hard",
    5: "Hard",
    6: "Very Hard",
    7: "Extremely Hard",
    8: "Maximum Effort",
    9: "Near Failure",
    10: "Failure",
  };

  return (
    <div className="space-y-6">
      {/* Weight Control */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Weight (kg)</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => adjustWeight(-2.5)}
            className="w-16 h-16 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-2xl font-bold text-white transition-all active:scale-95"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <div className={`text-5xl font-bold mb-1 transition-colors ${
              exceedsWeight ? "text-green-400" : "text-white"
            }`}>
              {weight.toFixed(1)}
              {exceedsWeight && (
                <span className="ml-2 text-2xl">↑</span>
              )}
            </div>
            <div className="text-sm text-gray-400">kg</div>
            {lastPreviousSet && (
              <div className="text-xs text-gray-500 mt-1">
                Last: {lastPreviousSet.weight_kg}kg
              </div>
            )}
          </div>
          <button
            onClick={() => adjustWeight(2.5)}
            className="w-16 h-16 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-2xl font-bold text-white transition-all active:scale-95"
          >
            +
          </button>
        </div>
        <div className="flex gap-2 mt-2 justify-center">
          <button
            onClick={() => adjustWeight(-5)}
            className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-400"
          >
            -5kg
          </button>
          <button
            onClick={() => adjustWeight(-1)}
            className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-400"
          >
            -1kg
          </button>
          <button
            onClick={() => adjustWeight(1)}
            className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-400"
          >
            +1kg
          </button>
          <button
            onClick={() => adjustWeight(5)}
            className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-400"
          >
            +5kg
          </button>
        </div>
      </div>

      {/* Reps Control */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Reps</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => adjustReps(-1)}
            className="w-16 h-16 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-2xl font-bold text-white transition-all active:scale-95"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <div className={`text-5xl font-bold mb-1 transition-colors ${
              exceedsReps ? "text-green-400" : "text-white"
            }`}>
              {reps}
              {exceedsReps && (
                <span className="ml-2 text-2xl">↑</span>
              )}
            </div>
            <div className="text-sm text-gray-400">reps</div>
            {lastPreviousSet && (
              <div className="text-xs text-gray-500 mt-1">
                Last: {lastPreviousSet.reps}
              </div>
            )}
          </div>
          <button
            onClick={() => adjustReps(1)}
            className="w-16 h-16 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-2xl font-bold text-white transition-all active:scale-95"
          >
            +
          </button>
        </div>
      </div>

      {/* RPE Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          RPE {rpe && `(${RPE_DESCRIPTIONS[rpe]})`}
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <button
              key={value}
              onClick={() => setRpe(value)}
              className={`py-3 rounded-lg font-semibold transition-all ${
                rpe === value
                  ? "bg-gold-500 text-black"
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        {rpe && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            {RPE_DESCRIPTIONS[rpe]}
          </p>
        )}
      </div>

      {/* Set Flags */}
      <div className="flex gap-4">
        <button
          onClick={() => setIsWarmup(!isWarmup)}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            isWarmup
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-white/5 text-gray-400 border border-white/10 hover:border-blue-500/30"
          }`}
        >
          Warmup
        </button>
        <button
          onClick={() => setIsFailure(!isFailure)}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            isFailure
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-white/5 text-gray-400 border border-white/10 hover:border-red-500/30"
          }`}
        >
          Failure
        </button>
        <button
          onClick={() => setIsDropset(!isDropset)}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            isDropset
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-white/5 text-gray-400 border border-white/10 hover:border-purple-500/30"
          }`}
        >
          Dropset
        </button>
      </div>

      {/* Quick Fill Button */}
      {previousSets.length > 0 && (
        <button
          onClick={() => handleQuickFill()}
          className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30 text-white rounded-lg transition-all text-sm"
        >
          Quick Fill from Last Session
        </button>
      )}

      {/* Progress Indicator */}
      {exceedsVolume && (
        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm text-center">
          🎉 You're exceeding your last session's volume!
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="input-field"
          placeholder="Form cues, tips..."
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Log Set Button */}
      <button
        onClick={handleLogSet}
        disabled={weight <= 0 || reps <= 0}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          justLogged
            ? "bg-green-500 text-white"
            : weight <= 0 || reps <= 0
            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
            : "btn-primary"
        }`}
      >
        {justLogged ? "✓ Set Logged!" : weight <= 0 || reps <= 0 ? "Set Weight & Reps" : "Log Set"}
      </button>
    </div>
  );
});

SetLogger.displayName = "SetLogger";
