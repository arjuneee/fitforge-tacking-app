import { useState, useEffect } from "react";
import { weightLogsApi } from "../services/api";
import { PageLayout } from "../components/PageLayout";

interface WeightLog {
  id: string;
  weight_kg: number;
  logged_date: string;
  time_of_day: string;
  notes: string | null;
  created_at: string;
}

export function WeightLogPage() {
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
        await weightLogsApi.update(editingId, {
          weight_kg: parseFloat(weight),
          logged_date: logDate,
          time_of_day: timeOfDay,
          notes: notes || null,
        });
      } else {
        await weightLogsApi.create({
          weight_kg: parseFloat(weight),
          logged_date: logDate,
          time_of_day: timeOfDay,
          notes: notes || null,
        });
      }
      
      setWeight("");
      setLogDate(new Date().toISOString().split('T')[0]);
      setTimeOfDay("morning");
      setNotes("");
      setEditingId(null);
      
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
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getTimeOfDayLabel = (time: string) => {
    return time.charAt(0).toUpperCase() + time.slice(1);
  };

  if (loading) {
    return (
      <PageLayout title="Weight Log" showBackButton backPath="/dashboard">
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading weight logs...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Weight Log" showBackButton backPath="/dashboard">
      {/* Log Form */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 mb-3 md:mb-6">
        <h2 className="text-sm md:text-xl font-semibold text-white mb-3 md:mb-4">
          {editingId ? "Edit Entry" : "Log Weight"}
        </h2>
        
        {error && (
          <div className="mb-3 p-2.5 md:p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[10px] md:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {/* Weight Input */}
            <div>
              <label className="block text-[10px] md:text-sm text-gray-300 mb-1.5">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75.5"
                className="input-field text-xs md:text-base"
                required
              />
            </div>

            {/* Date Selector */}
            <div>
              <label className="block text-[10px] md:text-sm text-gray-300 mb-1.5">Date</label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="input-field text-xs md:text-base"
                required
              />
            </div>

            {/* Time of Day */}
            <div>
              <label className="block text-[10px] md:text-sm text-gray-300 mb-1.5">Time</label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="input-field text-xs md:text-base"
                required
              >
                <option value="morning">AM</option>
                <option value="afternoon">PM</option>
                <option value="evening">Eve</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] md:text-sm text-gray-300 mb-1.5">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={2}
              className="input-field text-xs md:text-base"
              maxLength={500}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 md:gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 text-xs md:text-base py-2.5"
            >
              {isSubmitting ? "Saving..." : editingId ? "Update" : "Log Weight"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary text-xs md:text-base px-4"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Historical Logs */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6">
        <h2 className="text-sm md:text-xl font-semibold text-white mb-3 md:mb-4">Recent Entries</h2>
        
        {logs.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-400 text-xs md:text-sm">No weight logs yet. Start logging your weight above!</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg md:rounded-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-1">
                      <p className="text-lg md:text-2xl font-bold text-white">
                        {log.weight_kg.toFixed(1)} <span className="text-[10px] md:text-sm text-gray-500 font-normal">kg</span>
                      </p>
                      <span className="px-1.5 py-0.5 bg-white/10 text-gray-400 rounded text-[8px] md:text-xs">
                        {getTimeOfDayLabel(log.time_of_day)}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-sm text-gray-400">{formatDate(log.logged_date)}</p>
                    {log.notes && (
                      <p className="text-[10px] md:text-sm text-gray-500 mt-1 md:mt-2">{log.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1 md:gap-2">
                    <button
                      onClick={() => handleEdit(log)}
                      className="p-1.5 md:p-2 text-gray-400 hover:text-gold-400 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 md:p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    </PageLayout>
  );
}
