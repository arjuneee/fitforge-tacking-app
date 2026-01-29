import { useState, useEffect } from "react";
import { weightLogsApi } from "../services/api";
import { PageLayout } from "../components/PageLayout";

interface WeightLog {
  id: string;
  weight_kg: number;
  logged_date: string;
  time_of_day?: string;
  notes?: string;
  created_at: string;
}

export function WeightLogPage() {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    weight_kg: "",
    logged_date: new Date().toISOString().split("T")[0],
    time_of_day: "morning" as "morning" | "afternoon" | "evening",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await weightLogsApi.list();
      setLogs(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.weight_kg) return;

    try {
      setSubmitting(true);
      await weightLogsApi.create({
        weight_kg: parseFloat(formData.weight_kg),
        logged_date: formData.logged_date,
        time_of_day: formData.time_of_day,
        notes: formData.notes || null,
      });
      setFormData({
        weight_kg: "",
        logged_date: new Date().toISOString().split("T")[0],
        time_of_day: "morning",
        notes: "",
      });
      setShowAddForm(false);
      loadLogs();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to add log");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await weightLogsApi.delete(id);
      loadLogs();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to delete");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getTimeIcon = (time: string) => {
    switch (time) {
      case "morning": return "🌅";
      case "afternoon": return "☀️";
      case "evening": return "🌙";
      default: return "⏰";
    }
  };

  if (loading) {
    return (
      <PageLayout title="Weight Log" showBackButton>
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Weight Log" 
      showBackButton
      rightAction={
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center"
        >
          <svg className={`w-5 h-5 text-black transition-transform ${showAddForm ? "rotate-45" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      }
    >
      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden mb-4">
          <div className="p-4 border-b border-white/5">
            <p className="text-white font-semibold text-sm">Add Entry</p>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-gray-400 text-xs mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
                placeholder="Enter weight"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-2">Date</label>
              <input
                type="date"
                value={formData.logged_date}
                onChange={(e) => setFormData({ ...formData, logged_date: e.target.value })}
                className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-2">Time of Day</label>
              <div className="grid grid-cols-3 gap-2">
                {["morning", "afternoon", "evening"].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setFormData({ ...formData, time_of_day: time as any })}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                      formData.time_of_day === time
                        ? "bg-gold-500 text-black"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {getTimeIcon(time)} {time.charAt(0).toUpperCase() + time.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-2">Notes (optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
                placeholder="e.g., After workout, fasted..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold text-sm rounded-xl disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Logs List */}
      {logs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
            <span className="text-3xl">⚖️</span>
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">No Entries Yet</h2>
          <p className="text-gray-500 text-sm mb-6">Start tracking your weight</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="py-3 px-6 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold text-sm rounded-xl"
          >
            Add First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-white/5 rounded-2xl border border-white/5 p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">{getTimeIcon(log.time_of_day || "morning")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg">{log.weight_kg} kg</p>
                <p className="text-gray-500 text-xs">{formatDate(log.logged_date)}</p>
                {log.notes && (
                  <p className="text-gray-600 text-xs truncate">{log.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(log.id)}
                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
