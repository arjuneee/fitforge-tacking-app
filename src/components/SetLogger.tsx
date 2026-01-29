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
    <div className="space-y-5 md:space-y-6">
      {/* Weight Control - Large touch targets */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2 md:mb-3">Weight (kg)</label>
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => adjustWeight(-2.5)}
            className="touch-number-btn"
          >
            −
          </button>
          <div className="flex-1 text-center py-2">
            <div className={`text-4xl md:text-5xl font-bold mb-0.5 transition-colors ${
              exceedsWeight ? "text-green-400" : "text-white"
            }`}>
              {weight.toFixed(1)}
              {exceedsWeight && (
                <span className="ml-1 text-xl md:text-2xl">↑</span>
              )}
            </div>
            <div className="text-xs md:text-sm text-gray-400">kg</div>
            {lastPreviousSet && (
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                Last: {lastPreviousSet.weight_kg}kg
              </div>
            )}
          </div>
          <button
            onClick={() => adjustWeight(2.5)}
            className="touch-number-btn"
          >
            +
          </button>
        </div>
        {/* Quick adjust buttons */}
        <div className="flex gap-1.5 md:gap-2 mt-2 md:mt-3 justify-center">
          {[-5, -1, 1, 5].map((delta) => (
            <button
              key={delta}
              onClick={() => adjustWeight(delta)}
              className="flex-1 max-w-[60px] py-2 text-xs bg-white/5 active:bg-gold-500/20 rounded-lg text-gray-400 active:text-gold-500 transition-colors"
            >
              {delta > 0 ? '+' : ''}{delta}kg
            </button>
          ))}
        </div>
      </div>

      {/* Reps Control - Large touch targets */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2 md:mb-3">Reps</label>
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => adjustReps(-1)}
            className="touch-number-btn"
          >
            −
          </button>
          <div className="flex-1 text-center py-2">
            <div className={`text-4xl md:text-5xl font-bold mb-0.5 transition-colors ${
              exceedsReps ? "text-green-400" : "text-white"
            }`}>
              {reps}
              {exceedsReps && (
                <span className="ml-1 text-xl md:text-2xl">↑</span>
              )}
            </div>
            <div className="text-xs md:text-sm text-gray-400">reps</div>
            {lastPreviousSet && (
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                Last: {lastPreviousSet.reps}
              </div>
            )}
          </div>
          <button
            onClick={() => adjustReps(1)}
            className="touch-number-btn"
          >
            +
          </button>
        </div>
      </div>

      {/* RPE Selector - Touch friendly */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2 md:mb-3">
          RPE {rpe && <span className="text-gold-500 font-normal">({RPE_DESCRIPTIONS[rpe]})</span>}
        </label>
        <div className="grid grid-cols-5 gap-1.5 md:gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <button
              key={value}
              onClick={() => setRpe(value)}
              className={`py-2.5 md:py-3 rounded-xl font-semibold transition-all active:scale-95 ${
                rpe === value
                  ? "bg-gold-500 text-black shadow-lg shadow-gold-500/30"
                  : "bg-white/5 text-white active:bg-white/10"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Set Flags - Larger touch targets */}
      <div className="flex gap-2 md:gap-4">
        <button
          onClick={() => setIsWarmup(!isWarmup)}
          className={`flex-1 py-2.5 md:py-3 rounded-xl font-medium transition-all text-sm active:scale-95 ${
            isWarmup
              ? "bg-blue-500/20 text-blue-400 border-2 border-blue-500/40"
              : "bg-white/5 text-gray-400 border border-white/10"
          }`}
        >
          🔥 Warmup
        </button>
        <button
          onClick={() => setIsFailure(!isFailure)}
          className={`flex-1 py-2.5 md:py-3 rounded-xl font-medium transition-all text-sm active:scale-95 ${
            isFailure
              ? "bg-red-500/20 text-red-400 border-2 border-red-500/40"
              : "bg-white/5 text-gray-400 border border-white/10"
          }`}
        >
          💪 Failure
        </button>
        <button
          onClick={() => setIsDropset(!isDropset)}
          className={`flex-1 py-2.5 md:py-3 rounded-xl font-medium transition-all text-sm active:scale-95 ${
            isDropset
              ? "bg-purple-500/20 text-purple-400 border-2 border-purple-500/40"
              : "bg-white/5 text-gray-400 border border-white/10"
          }`}
        >
          ⬇️ Drop
        </button>
      </div>

      {/* Quick Fill Button */}
      {previousSets.length > 0 && (
        <button
          onClick={() => handleQuickFill()}
          className="w-full py-2.5 bg-white/5 active:bg-gold-500/10 border border-white/10 text-white rounded-xl transition-all text-sm"
        >
          ⚡ Quick Fill from Last Session
        </button>
      )}

      {/* Progress Indicator */}
      {exceedsVolume && (
        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm text-center animate-slide-up">
          🎉 Exceeding last session's volume!
        </div>
      )}

      {/* Notes - Collapsed by default on mobile */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-400 py-2">
          <span>📝 Add Notes (optional)</span>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="input-field mt-2"
          placeholder="Form cues, tips..."
        />
      </details>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center animate-slide-up">
          {error}
        </div>
      )}

      {/* Log Set Button - Extra large for mobile */}
      <button
        onClick={handleLogSet}
        disabled={weight <= 0 || reps <= 0}
        className={`w-full py-4 md:py-5 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] ${
          justLogged
            ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
            : weight <= 0 || reps <= 0
            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
            : "btn-primary"
        }`}
      >
        {justLogged ? "✓ Set Logged!" : weight <= 0 || reps <= 0 ? "Set Weight & Reps" : "LOG SET"}
      </button>
    </div>
  );
});

SetLogger.displayName = "SetLogger";
