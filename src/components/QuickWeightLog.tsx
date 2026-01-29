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
    <div className="glass-card rounded-3xl p-6 glow-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          Quick Log Weight
        </h2>
        <button
          onClick={() => navigate("/weight-log")}
          className="text-sm text-gold-500 hover:text-gold-400 transition-colors"
        >
          View All →
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            Weight logged successfully!
          </div>
        )}

        <div className="grid grid-cols-10 gap-3">
          <input
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight (kg)"
            className="input-field col-span-3"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary col-span-7 text-sm font-medium"
          >
            {isSubmitting ? "Logging..." : "Log"}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Logs today's weight (morning). Edit in full log page.
        </p>
      </form>
    </div>
  );
}
