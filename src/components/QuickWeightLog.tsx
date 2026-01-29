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
    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <span className="text-lg">⚖️</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Log Weight</p>
            <p className="text-gray-500 text-xs">Quick daily entry</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/weight-log")}
          className="text-gold-500 text-xs font-medium"
        >
          History
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs">
            ✓ Weight logged successfully!
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              className="w-full h-12 px-4 pr-12 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">kg</span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 px-6 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold text-sm rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {isSubmitting ? "..." : "Log"}
          </button>
        </div>
      </form>
    </div>
  );
}
