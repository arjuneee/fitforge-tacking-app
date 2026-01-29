import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { workoutsApi, programsApi } from "../services/api";

export function WorkoutEditPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("program_id") || id?.split("-")[0]; // Fallback logic
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [formData, setFormData] = useState({
    name: "",
    day_number: 1,
    notes: "",
    estimated_duration_minutes: 60,
  });

  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (programId) {
      loadProgram();
    }
    if (!isNew && id) {
      loadWorkout();
    }
  }, [id, programId, isNew]);

  const loadProgram = async () => {
    try {
      const data = await programsApi.get(programId!);
      setProgram(data);
      if (isNew) {
        setFormData((prev) => ({
          ...prev,
          day_number: (data.workouts?.length || 0) + 1,
        }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load program");
    }
  };

  const loadWorkout = async () => {
    try {
      setLoading(true);
      const data = await workoutsApi.get(id!);
      setFormData({
        name: data.name,
        day_number: data.day_number,
        notes: data.notes || "",
        estimated_duration_minutes: data.estimated_duration_minutes || 60,
      });
      if (data.program_id) {
        const prog = await programsApi.get(data.program_id);
        setProgram(prog);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load workout");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) {
      setError("Program ID is required");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      if (isNew) {
        const created = await workoutsApi.create({
          program_id: programId,
          ...formData,
        });
        navigate(`/workouts/${created.id}`);
      } else {
        await workoutsApi.update(id!, formData);
        navigate(`/workouts/${id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save workout");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-gold-500">Loading...</div>
      </div>
    );
  }

  if (!programId && !program) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">Program ID is required</p>
          <button onClick={() => navigate(-1)} className="text-gold-500">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(programId ? `/programs/${programId}` : -1)}
            className="text-gold-500 hover:text-gold-400 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gradient">
            {isNew ? "Create Workout" : "Edit Workout"}
          </h1>
          {program && (
            <p className="text-gray-400 mt-2">For: {program.name}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 glow-border">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Workout Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input-field"
                placeholder="e.g., Push Day, Leg Day"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Day Number *
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.day_number}
                onChange={(e) => setFormData({ ...formData, day_number: parseInt(e.target.value) })}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 60 })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="input-field"
                placeholder="Workout notes, focus areas..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(programId ? `/programs/${programId}` : -1)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? "Saving..." : isNew ? "Create Workout" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
