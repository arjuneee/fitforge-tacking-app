import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { workoutsApi, programsApi } from "../services/api";
import { PageLayout } from "../components/PageLayout";

export function WorkoutEditPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("program_id") || id?.split("-")[0];
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
      <PageLayout title={isNew ? "Create Workout" : "Edit Workout"} showBackButton>
        <div className="flex items-center justify-center py-20">
          <div className="text-gold-500 text-sm">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (!programId && !program) {
    return (
      <PageLayout title="Error" showBackButton>
        <div className="text-center py-20">
          <p className="text-red-400 text-sm mb-4">Program ID is required</p>
          <button onClick={() => navigate(-1)} className="text-gold-500 text-sm">
            Go Back
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={isNew ? "Create Workout" : "Edit Workout"} 
      showBackButton
      backPath={programId ? `/programs/${programId}` : undefined}
    >
      {program && (
        <div className="bg-white/5 rounded-2xl border border-white/5 p-3 mb-4">
          <p className="text-xs text-gray-400 mb-1">Program</p>
          <p className="text-white text-sm font-medium">{program.name}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Workout Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
              placeholder="e.g., Push Day, Leg Day"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Day Number *</label>
            <input
              type="number"
              min="1"
              max="7"
              value={formData.day_number}
              onChange={(e) => setFormData({ ...formData, day_number: parseInt(e.target.value) })}
              required
              className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Estimated Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={formData.estimated_duration_minutes}
              onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 60 })}
              className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50 resize-none"
              placeholder="Workout notes, focus areas..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (programId) {
                  navigate(`/programs/${programId}`);
                } else {
                  navigate(-1);
                }
              }}
              className="flex-1 h-11 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium active:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-gradient-to-r from-gold-600 to-gold-500 text-black rounded-xl text-sm font-semibold disabled:opacity-50 active:opacity-80"
            >
              {saving ? "Saving..." : isNew ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </PageLayout>
  );
}
