import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sessionsApi, setsApi, type Session } from "../services/api";

export function SessionCompletePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [formData, setFormData] = useState({
    overall_rpe: 8,
    notes: "",
  });
  const [lastSession, setLastSession] = useState<Session | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSession();
      loadLastSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionData = await sessionsApi.get(sessionId!);
      setSession(sessionData);

      // Load sets for summary
      const setsData = await setsApi.getBySession(sessionId!);
      // Summary is already in session response, but we can enhance it
    } catch (err: any) {
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const loadLastSession = async () => {
    try {
      const sessions = await sessionsApi.list(1, 1); // Get second most recent (first is current)
      if (sessions.data && sessions.data.length > 0) {
        const lastSessionId = sessions.data[0].id;
        const lastSessionData = await sessionsApi.get(lastSessionId);
        setLastSession(lastSessionData);
      }
    } catch (err) {
      // Ignore errors loading last session
      console.error("Failed to load last session:", err);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      const completed = await sessionsApi.complete(sessionId!, {
        overall_rpe: formData.overall_rpe,
        notes: formData.notes || undefined,
      });
      
      // Navigate to summary or dashboard
      navigate("/dashboard");
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to complete session");
      setCompleting(false);
    }
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

  const summary = session.summary || { total_sets: 0, total_volume: 0, prs_achieved: 0 };
  const lastSummary = lastSession?.summary || { total_sets: 0, total_volume: 0, prs_achieved: 0 };

  const volumeDiff = summary.total_volume - lastSummary.total_volume;
  const setsDiff = summary.total_sets - lastSummary.total_sets;

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Workout Complete!</h1>
          <p className="text-gray-400">Great work today</p>
        </div>

        {/* Summary Stats */}
        <div className="glass-card rounded-3xl p-6 mb-6 glow-border">
          <h2 className="text-xl font-semibold text-white mb-6">Session Summary</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gold-500 mb-1">{summary.total_sets}</div>
              <div className="text-sm text-gray-400">Total Sets</div>
              {lastSession && setsDiff !== 0 && (
                <div className={`text-xs mt-1 ${setsDiff > 0 ? "text-green-400" : "text-red-400"}`}>
                  {setsDiff > 0 ? "+" : ""}{setsDiff} vs last
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold-500 mb-1">
                {summary.total_volume.toFixed(0)}
              </div>
              <div className="text-sm text-gray-400">Total Volume (kg)</div>
              {lastSession && volumeDiff !== 0 && (
                <div className={`text-xs mt-1 ${volumeDiff > 0 ? "text-green-400" : "text-red-400"}`}>
                  {volumeDiff > 0 ? "+" : ""}{volumeDiff.toFixed(0)} vs last
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold-500 mb-1">
                {session.duration_minutes || 0}
              </div>
              <div className="text-sm text-gray-400">Minutes</div>
            </div>
          </div>

          {/* PRs Achieved */}
          {summary.prs_achieved > 0 && (
            <div className="p-4 bg-gold-500/20 border border-gold-500/30 rounded-xl mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="font-semibold text-gold-500">
                    {summary.prs_achieved} Personal Record{summary.prs_achieved > 1 ? "s" : ""} Achieved!
                  </div>
                  <div className="text-xs text-gray-400">Check your PRs in the analytics section</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Completion Form */}
        <div className="glass-card rounded-3xl p-6 glow-border">
          <h2 className="text-xl font-semibold text-white mb-6">Final Notes</h2>

          <div className="space-y-6">
            {/* Overall RPE */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Overall Session RPE
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    onClick={() => setFormData({ ...formData, overall_rpe: value })}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      formData.overall_rpe === value
                        ? "bg-gold-500 text-black"
                        : "bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="input-field"
                placeholder="How did the workout feel? Any notes or observations..."
              />
            </div>

            {/* Complete Button */}
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50"
            >
              {completing ? "Saving..." : "Save & Finish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
