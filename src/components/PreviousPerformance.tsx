import { type ExerciseInSession } from "../services/api";

interface PreviousPerformanceProps {
  lastSession: {
    date: string;
    sets: Array<{ weight_kg: number; reps: number; rpe?: number }>;
  };
  onQuickFill?: (data: { weight_kg: number; reps: number; rpe?: number }) => void;
}

export function PreviousPerformance({ lastSession, onQuickFill }: PreviousPerformanceProps) {
  if (!lastSession || !lastSession.sets || lastSession.sets.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const totalVolume = lastSession.sets.reduce(
    (sum, set) => sum + set.weight_kg * set.reps,
    0
  );

  return (
    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-300">Last Session</h3>
          <p className="text-xs text-gray-500">{formatDate(lastSession.date)}</p>
        </div>
        {onQuickFill && (
          <button
            onClick={() => {
              const lastSet = lastSession.sets[lastSession.sets.length - 1];
              onQuickFill({
                weight_kg: lastSet.weight_kg,
                reps: lastSet.reps,
                rpe: lastSet.rpe,
              });
            }}
            className="px-3 py-1.5 bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/30 text-gold-500 rounded-lg text-xs font-medium transition-all"
          >
            Quick Fill
          </button>
        )}
      </div>

      <div className="space-y-2">
        {lastSession.sets.map((set, idx) => (
          <button
            key={idx}
            onClick={() => onQuickFill?.(set)}
            className="w-full flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <span className="text-gray-400">
              Set {idx + 1}: {set.weight_kg}kg × {set.reps}
            </span>
            <div className="flex items-center gap-2">
              {set.rpe && (
                <span className="text-gray-500">RPE {set.rpe}</span>
              )}
              {onQuickFill && (
                <span className="text-gold-500 text-xs">Tap to fill</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Total Volume</span>
          <span className="text-white font-medium">{totalVolume.toFixed(0)} kg</span>
        </div>
      </div>
    </div>
  );
}
