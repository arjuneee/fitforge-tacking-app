import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { programsApi, type Program, type ProgramCreate } from "../services/api";

const PROGRAM_TYPES = [
  { value: "push_pull_legs", label: "Push/Pull/Legs" },
  { value: "upper_lower", label: "Upper/Lower" },
  { value: "full_body", label: "Full Body" },
  { value: "bro_split", label: "Bro Split" },
  { value: "custom", label: "Custom" },
] as const;

export function ProgramEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Check if this is a new program - either no id param or id is "new"
  const isNew = !id || id === "new";

  const [formData, setFormData] = useState<ProgramCreate>({
    name: "",
    description: "",
    type: "custom",
    days_per_week: 3,
    start_date: undefined,
    is_active: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load if editing an existing program (has id and it's not "new")
    if (id && id !== "new") {
      setLoading(true);
      loadProgram();
    } else {
      // For new programs, ensure loading is false
      setLoading(false);
    }
  }, [id]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      setError(null);
      const program = await programsApi.get(id!);
      setFormData({
        name: program.name,
        description: program.description || "",
        type: program.type,
        days_per_week: program.days_per_week,
        start_date: program.start_date,
        is_active: program.is_active,
      });
    } catch (err: any) {
      console.error("Failed to load program:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to load program";
      setError(errorMsg);
      if (err.response?.status === 401) {
        return; // Interceptor will handle redirect
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const data = {
        ...formData,
        start_date: formData.start_date || undefined,
      };

      if (isNew) {
        const created = await programsApi.create(data);
        navigate(`/programs/${created.id}`);
      } else {
        await programsApi.update(id!, data);
        navigate(`/programs/${id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save program");
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

  return (
    <div className="min-h-dvh bg-black px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/programs")}
            className="text-gold-500 hover:text-gold-400 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Programs
          </button>
          <h1 className="text-3xl font-bold text-gradient">
            {isNew ? "Create Program" : "Edit Program"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 glow-border">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Program Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input-field"
                placeholder="e.g., Push Pull Legs"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="input-field"
                placeholder="Brief description of your program..."
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Program Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
                className="input-field"
              >
                {PROGRAM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Days per Week */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Days Per Week *
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.days_per_week}
                onChange={(e) => setFormData({ ...formData, days_per_week: parseInt(e.target.value) })}
                required
                className="input-field"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.start_date || ""}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value || undefined })}
                  className="input-field pr-12 cursor-pointer"
                  style={{
                    colorScheme: "dark",
                    WebkitAppearance: "none",
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gold-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tap to open calendar picker
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-gold-500 focus:ring-gold-500"
              />
              <label htmlFor="is_active" className="text-gray-300">
                Set as active program (will deactivate others)
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/programs")}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? "Saving..." : isNew ? "Create Program" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
