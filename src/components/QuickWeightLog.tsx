import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { weightLogsApi } from "../services/api";

export function QuickWeightLog() {
  const navigate = useNavigate();
  const [weight, setWeight] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight || parseFloat(weight) <= 0) {
      setError("Please enter a valid weight");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await weightLogsApi.create({
        weight_kg: parseFloat(weight),
        logged_date: new Date().toISOString().split('T')[0],
        time_of_day: "morning",
        notes: null,
      });
      
      setWeight("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to log weight");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-6 glow-border">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <span className="hidden md:inline">Quick Log Weight</span>
          <span className="md:hidden">Log Weight</span>
        </h2>
        <button
          onClick={() => navigate("/weight-log")}
          className="text-xs md:text-sm text-gold-500 active:text-gold-400 transition-colors"
        >
          History →
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 md:space-y-3">
        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs md:text-sm animate-slide-up">
            {error}
          </div>
        )}

        {success && (
          <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs md:text-sm animate-slide-up">
            ✓ Weight logged!
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative w-[30%] min-w-[80px]">
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75.0"
              className="input-field w-full pr-8 text-sm"
              required
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] md:text-xs">kg</span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-[70%] text-xs md:text-sm font-semibold"
          >
            {isSubmitting ? "..." : "Log Today"}
          </button>
        </div>
        <p className="text-[10px] md:text-xs text-gray-500">
          Logs as morning weight. <span className="hidden md:inline">Edit details in history.</span>
        </p>
      </form>
    </div>
  );
}
