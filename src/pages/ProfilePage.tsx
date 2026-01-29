import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { PageLayout } from "../components/PageLayout";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  body_fat_percent: number | null;
  bmr: number | null;
  date_of_birth: string | null;
  gender: string | null;
  unit_preference: "metric" | "imperial";
  created_at: string;
  updated_at: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    height_cm: "",
    current_weight_kg: "",
    body_fat_percent: "",
    date_of_birth: "",
    gender: "",
    unit_preference: "metric" as "metric" | "imperial",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<UserProfile>("/users/me");
      const data = response.data;
      setProfile(data);
      setFormData({
        name: data.name || "",
        height_cm: data.height_cm?.toString() || "",
        current_weight_kg: data.current_weight_kg?.toString() || "",
        body_fat_percent: data.body_fat_percent?.toString() || "",
        date_of_birth: data.date_of_birth || "",
        gender: data.gender || "",
        unit_preference: data.unit_preference || "metric",
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to load profile";
      setError(errorMsg);
      console.error("[Profile] Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: any = {};
      
      if (formData.name !== (profile?.name || "")) {
        updateData.name = formData.name || null;
      }
      if (formData.height_cm !== (profile?.height_cm?.toString() || "")) {
        updateData.height_cm = formData.height_cm ? parseFloat(formData.height_cm) : null;
      }
      if (formData.current_weight_kg !== (profile?.current_weight_kg?.toString() || "")) {
        updateData.current_weight_kg = formData.current_weight_kg ? parseFloat(formData.current_weight_kg) : null;
      }
      if (formData.body_fat_percent !== (profile?.body_fat_percent?.toString() || "")) {
        updateData.body_fat_percent = formData.body_fat_percent ? parseFloat(formData.body_fat_percent) : null;
      }
      if (formData.date_of_birth !== (profile?.date_of_birth || "")) {
        updateData.date_of_birth = formData.date_of_birth || null;
      }
      if (formData.gender !== (profile?.gender || "")) {
        updateData.gender = formData.gender || null;
      }
      if (formData.unit_preference !== profile?.unit_preference) {
        updateData.unit_preference = formData.unit_preference;
      }

      if (Object.keys(updateData).length === 0) {
        setSuccess(true);
        setSaving(false);
        setTimeout(() => setSuccess(false), 3000);
        return;
      }

      await api.patch("/users/me", updateData);
      setSuccess(true);
      await loadProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to update profile";
      setError(errorMsg);
      console.error("[Profile] Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Edit Profile" showBackButton backPath="/dashboard">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-gold-500"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Edit Profile" showBackButton backPath="/dashboard">
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-8 space-y-4 md:space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 md:p-4 text-green-400 text-xs md:text-sm">
            Profile updated successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 md:p-4 text-red-400 text-xs md:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Basic Information */}
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-xs md:text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Basic Information
            </h2>

            {/* Name */}
            <div>
              <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-1.5">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field text-xs md:text-base"
                placeholder="Your name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="input-field text-xs md:text-base bg-gray-800/30 text-gray-500 cursor-not-allowed"
              />
              <p className="text-[8px] md:text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Physical Metrics */}
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-xs md:text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Physical Metrics
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {/* Height */}
              <div>
                <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-1.5">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                  className="input-field text-xs md:text-base"
                  placeholder="175"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-1.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1000"
                  value={formData.current_weight_kg}
                  onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
                  className="input-field text-xs md:text-base"
                  placeholder="75"
                />
              </div>

              {/* Body Fat */}
              <div>
                <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-1.5">
                  Body Fat (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.body_fat_percent}
                  onChange={(e) => setFormData({ ...formData, body_fat_percent: e.target.value })}
                  className="input-field text-xs md:text-base"
                  placeholder="15"
                />
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-xs md:text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Personal Details
            </h2>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {/* Date of Birth */}
              <div>
                <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="input-field text-xs md:text-base"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-1.5">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="input-field text-xs md:text-base"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Unit Preference */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] md:text-sm font-medium text-gray-300 mb-1.5">
                  Unit Preference
                </label>
                <select
                  value={formData.unit_preference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_preference: e.target.value as "metric" | "imperial",
                    })
                  }
                  className="input-field text-xs md:text-base"
                >
                  <option value="metric">Metric (kg, cm)</option>
                  <option value="imperial">Imperial (lbs, ft)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 md:pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 px-4 py-2.5 md:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white hover:bg-gray-800/70 transition-colors font-medium text-xs md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-4 py-2.5 md:py-3 rounded-lg font-bold transition-all shadow-lg text-xs md:text-base ${
                saving
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-gold-500 to-gold-600 text-black hover:from-gold-400 hover:to-gold-500 shadow-gold-500/20 hover:shadow-gold-500/30"
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
