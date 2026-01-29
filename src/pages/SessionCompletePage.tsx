import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sessionsApi, setsApi, type Session } from "../services/api";
import { PageLayout } from "../components/PageLayout";

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
      await setsApi.getBySession(sessionId!);
    } catch (err: any) {
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const loadLastSession = async () => {
    try {
      const sessions = await sessionsApi.list(1, 1);
      if (sessions.data && sessions.data.length > 0) {
        const lastSessionId = sessions.data[0].id;
        const lastSessionData = await sessionsApi.get(lastSessionId);
        setLastSession(lastSessionData);
      }
    } catch (err) {
      console.error("Failed to load last session:", err);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await sessionsApi.complete(sessionId!, {
        overall_rpe: formData.overall_rpe,
        notes: formData.notes || undefined,
      });
      navigate("/dashboard");
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || "Failed to complete session");
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Workout Complete" hideBottomNav>
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !session) {
    return (
      <PageLayout title="Workout Complete" hideBottomNav>
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">{error || "Session not found"}</p>
          <button
            onClick={() => navigate("/workouts/start")}
            className="text-gold-500 hover:text-gold-400 text-sm"
          >
            Go Back
          </button>
        </div>
      </PageLayout>
    );
  }

  const summary = session.summary || { total_sets: 0, total_volume: 0, prs_achieved: 0 };
  const lastSummary = lastSession?.summary || { total_sets: 0, total_volume: 0, prs_achieved: 0 };

  const volumeDiff = summary.total_volume - lastSummary.total_volume;
  const setsDiff = summary.total_sets - lastSummary.total_sets;

  return (
    <PageLayout title="Workout Complete!" hideBottomNav>
      {/* Summary Stats */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 mb-3 md:mb-6">
        <h2 className="text-sm md:text-xl font-semibold text-white mb-4 md:mb-6">Session Summary</h2>
        
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="text-center">
            <div className="text-xl md:text-3xl font-bold text-gold-500 mb-0.5 md:mb-1">{summary.total_sets}</div>
            <div className="text-[10px] md:text-sm text-gray-400">Total Sets</div>
            {lastSession && setsDiff !== 0 && (
              <div className={`text-[8px] md:text-xs mt-0.5 md:mt-1 ${setsDiff > 0 ? "text-green-400" : "text-red-400"}`}>
                {setsDiff > 0 ? "+" : ""}{setsDiff} vs last
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-xl md:text-3xl font-bold text-gold-500 mb-0.5 md:mb-1">
              {summary.total_volume.toFixed(0)}
            </div>
            <div className="text-[10px] md:text-sm text-gray-400">Volume (kg)</div>
            {lastSession && volumeDiff !== 0 && (
              <div className={`text-[8px] md:text-xs mt-0.5 md:mt-1 ${volumeDiff > 0 ? "text-green-400" : "text-red-400"}`}>
                {volumeDiff > 0 ? "+" : ""}{volumeDiff.toFixed(0)} vs last
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-xl md:text-3xl font-bold text-gold-500 mb-0.5 md:mb-1">
              {session.duration_minutes || 0}
            </div>
            <div className="text-[10px] md:text-sm text-gray-400">Minutes</div>
          </div>
        </div>

        {/* PRs Achieved */}
        {summary.prs_achieved > 0 && (
          <div className="p-3 md:p-4 bg-gold-500/20 border border-gold-500/30 rounded-lg md:rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl">🏆</span>
              <div>
                <div className="font-semibold text-gold-500 text-xs md:text-base">
                  {summary.prs_achieved} PR{summary.prs_achieved > 1 ? "s" : ""} Achieved!
                </div>
                <div className="text-[8px] md:text-xs text-gray-400">Check your PRs in analytics</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Form */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6">
        <h2 className="text-sm md:text-xl font-semibold text-white mb-4 md:mb-6">Final Notes</h2>

        <div className="space-y-4 md:space-y-6">
          {/* Overall RPE */}
          <div>
            <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-2 md:mb-3">
              Overall Session RPE
            </label>
            <div className="grid grid-cols-5 gap-1.5 md:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  onClick={() => setFormData({ ...formData, overall_rpe: value })}
                  className={`py-2 md:py-3 rounded-lg font-semibold transition-all text-xs md:text-base ${
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
            <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
              Session Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="input-field text-xs md:text-base"
              placeholder="How did the workout feel?"
            />
          </div>

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full btn-primary py-3 md:py-4 text-sm md:text-lg font-bold disabled:opacity-50"
          >
            {completing ? "Saving..." : "Save & Finish"}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
