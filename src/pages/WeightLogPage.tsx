import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { weightLogsApi } from "../services/api";

interface WeightLog {
  id: string;
  weight_kg: number;
  logged_date: string;
  time_of_day: string;
  notes: string | null;
  created_at: string;
}

export function WeightLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [weight, setWeight] = useState<string>("");
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeOfDay, setTimeOfDay] = useState<string>("morning");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await weightLogsApi.list(90);
      setLogs(response.entries || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load weight logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight || parseFloat(weight) <= 0) {
      setError("Please enter a valid weight");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        // Update existing log
        await weightLogsApi.update(editingId, {
          weight_kg: parseFloat(weight),
          logged_date: logDate,
          time_of_day: timeOfDay,
          notes: notes || null,
        });
      } else {
        // Create new log
        await weightLogsApi.create({
          weight_kg: parseFloat(weight),
          logged_date: logDate,
          time_of_day: timeOfDay,
          notes: notes || null,
        });
      }
      
      // Reset form
      setWeight("");
      setLogDate(new Date().toISOString().split('T')[0]);
      setTimeOfDay("morning");
      setNotes("");
      setEditingId(null);
      
      // Reload logs
      await loadLogs();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to save weight log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (log: WeightLog) => {
    setEditingId(log.id);
    setWeight(log.weight_kg.toString());
    setLogDate(log.logged_date);
    setTimeOfDay(log.time_of_day);
    setNotes(log.notes || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setWeight("");
    setLogDate(new Date().toISOString().split('T')[0]);
    setTimeOfDay("morning");
    setNotes("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this weight log?")) {
      return;
    }

    try {
      await weightLogsApi.delete(id);
      await loadLogs();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to delete weight log");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const getTimeOfDayLabel = (time: string) => {
    return time.charAt(0).toUpperCase() + time.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading weight logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Weight Log</h1>
            <p className="text-gray-400">Track your daily weight</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Log Form */}
        <div className="glass-card rounded-3xl p-6 mb-6 glow-border">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingId ? "Edit Weight Entry" : "Log Weight"}
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Weight Input */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="75.5"
                  className="input-field"
                  required
                />
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              {/* Time of Day */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Time of Day</label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
                className="input-field"
                maxLength={500}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting ? "Saving..." : editingId ? "Update" : "Log Weight"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Historical Logs */}
        <div className="glass-card rounded-3xl p-6 glow-border">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Entries</h2>
          
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No weight logs yet. Start logging your weight above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-2xl font-bold text-white">
                          {log.weight_kg.toFixed(1)} <span className="text-sm text-gray-500 font-normal">kg</span>
                        </p>
                        <span className="px-2 py-0.5 bg-white/10 text-gray-400 rounded text-xs">
                          {getTimeOfDayLabel(log.time_of_day)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{formatDate(log.logged_date)}</p>
                      {log.notes && (
                        <p className="text-sm text-gray-500 mt-2">{log.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(log)}
                        className="p-2 text-gray-400 hover:text-gold-400 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
