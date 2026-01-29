import axios from "axios";
import { supabase } from "../lib/supabase";
import { offlineService } from "./offline";

const API_URL = import.meta.env.VITE_API_URL || "https://fitforge-tacking-backend.onrender.com";

// Check if online
const isOnline = () => navigator.onLine;

// Create axios instance with auth interceptor
export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("[API] Session check:", session ? "Found session" : "No session");
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    console.warn("[API] No access token available");
  }
  return config;
});

// Handle errors and offline detection
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("[API] Error:", error.response?.status, error.response?.data);
    
    // If offline or network error, the specific API methods will handle queuing
    if (!isOnline() || error.code === "ERR_NETWORK") {
      console.log("[API] Offline detected, request will be queued");
    }
    
    // Don't auto-redirect on 401 - let the page handle it
    // The ProtectedRoute will redirect if there's no session
    return Promise.reject(error);
  }
);

// Sync status
let isSyncing = false;
let syncStatusListeners: Array<(status: { isSyncing: boolean; pendingCount: number }) => void> = [];

export const syncService = {
  // Get sync status
  getStatus: async () => {
    const pendingCount = await offlineService.getPendingCount();
    return { isSyncing, pendingCount };
  },

  // Subscribe to sync status changes
  onStatusChange: (callback: (status: { isSyncing: boolean; pendingCount: number }) => void) => {
    syncStatusListeners.push(callback);
    return () => {
      syncStatusListeners = syncStatusListeners.filter(cb => cb !== callback);
    };
  },

  // Notify listeners of status change
  notifyStatusChange: async () => {
    const status = await syncService.getStatus();
    syncStatusListeners.forEach(cb => cb(status));
  },

  // Manual sync trigger
  sync: async () => {
    if (isSyncing || !isOnline()) return;
    return syncPendingItems();
  },
};

// Sync pending items when online (with conflict resolution and retry logic)
const syncPendingItems = async () => {
  if (!isOnline() || isSyncing) return;

  isSyncing = true;
  await syncService.notifyStatusChange();

  try {
    // Sync pending sets (sorted by timestamp for conflict resolution)
    const pendingSets = await offlineService.getPendingSets();
    pendingSets.sort((a, b) => a.timestamp - b.timestamp); // Oldest first
    
    for (const pending of pendingSets) {
      try {
        // Last-write-wins: use the timestamp from the offline item
        const response = await api.post("/sets", pending.setData);
        await offlineService.markSetSynced(pending.id!);
        console.log("[Sync] Synced set:", pending.id);
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
        console.error("[Sync] Failed to sync set:", errorMsg);
        await offlineService.markSetFailed(pending.id!, errorMsg);
      }
    }

    // Sync pending sessions (sorted by timestamp)
    const pendingSessions = await offlineService.getPendingSessions();
    pendingSessions.sort((a, b) => a.timestamp - b.timestamp);
    
    for (const pending of pendingSessions) {
      try {
        if (pending.action === "complete") {
          await api.post(`/sessions/${pending.sessionId}/complete`, pending.data);
          await offlineService.markSessionSynced(pending.id!);
          console.log("[Sync] Synced session:", pending.id);
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
        console.error("[Sync] Failed to sync session:", errorMsg);
        await offlineService.markSessionFailed(pending.id!, errorMsg);
      }
    }

    // Sync pending weight logs (sorted by timestamp)
    const pendingWeightLogs = await offlineService.getPendingWeightLogs();
    pendingWeightLogs.sort((a, b) => a.timestamp - b.timestamp);
    
    for (const pending of pendingWeightLogs) {
      try {
        await api.post("/weight-logs", pending.weightData);
        await offlineService.markWeightLogSynced(pending.id!);
        console.log("[Sync] Synced weight log:", pending.id);
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
        console.error("[Sync] Failed to sync weight log:", errorMsg);
        await offlineService.markWeightLogFailed(pending.id!, errorMsg);
      }
    }

    // Clean up old synced items
    await offlineService.clearSyncedItems();
  } catch (err) {
    console.error("[Sync] Error syncing pending items:", err);
  } finally {
    isSyncing = false;
    await syncService.notifyStatusChange();
  }
};

// Listen for sync events
if (typeof window !== "undefined") {
  window.addEventListener("syncPendingItems", syncPendingItems);
  window.addEventListener("online", () => {
    console.log("[Sync] Online detected, starting sync...");
    syncPendingItems();
  });
  
  // Sync on page load if online
  if (isOnline()) {
    setTimeout(syncPendingItems, 1000);
  }
  
  // Periodic sync check (every 30 seconds when online)
  setInterval(() => {
    if (isOnline() && !isSyncing) {
      syncPendingItems();
    }
  }, 30000);
}

// Types
export interface Program {
  id: string;
  name: string;
  description?: string;
  type: "push_pull_legs" | "upper_lower" | "full_body" | "bro_split" | "custom";
  days_per_week: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  workout_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramCreate {
  name: string;
  description?: string;
  type: "push_pull_legs" | "upper_lower" | "full_body" | "bro_split" | "custom";
  days_per_week: number;
  start_date?: string;
  is_active?: boolean;
}

export interface Workout {
  id: string;
  program_id: string;
  name: string;
  day_number: number;
  notes?: string;
  estimated_duration_minutes?: number;
  exercise_count?: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: {
    id: string;
    name: string;
  };
  secondary_muscle_group?: {
    id: string;
    name: string;
  };
  equipment: string;
  is_compound: boolean;
  is_unilateral: boolean;
  instructions?: string;
  is_custom: boolean;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise?: Exercise;
  order_index: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  target_rpe: number;
  rest_seconds: number;
  notes?: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  display_order: number;
}

// Programs API
export const programsApi = {
  list: async (isActive?: boolean) => {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append("is_active", String(isActive));
    const { data } = await api.get(`/programs?${params}`);
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get(`/programs/${id}`);
    return data;
  },

  create: async (program: ProgramCreate) => {
    const { data } = await api.post("/programs", program);
    return data;
  },

  update: async (id: string, updates: Partial<ProgramCreate>) => {
    const { data } = await api.patch(`/programs/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/programs/${id}`);
  },

  clone: async (id: string, name: string, startDate?: string) => {
    const { data } = await api.post(`/programs/${id}/clone`, { name, start_date: startDate });
    return data;
  },
};

// Workouts API
export const workoutsApi = {
  create: async (workout: { program_id: string; name: string; day_number: number; notes?: string; estimated_duration_minutes?: number }) => {
    const { data } = await api.post("/programs/workouts", workout);
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get(`/programs/workouts/${id}`);
    return data;
  },

  update: async (id: string, updates: Partial<{ name: string; day_number: number; notes?: string; estimated_duration_minutes?: number }>) => {
    const { data } = await api.patch(`/programs/workouts/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/programs/workouts/${id}`);
  },

  addExercise: async (workoutId: string, exercise: { exercise_id: string; order_index: number; target_sets: number; target_reps_min: number; target_reps_max: number; target_rpe: number; rest_seconds: number; notes?: string }) => {
    const { data } = await api.post(`/programs/workouts/${workoutId}/exercises`, exercise);
    return data;
  },

  updateExercise: async (workoutId: string, exerciseId: string, updates: Partial<{ order_index: number; target_sets: number; target_reps_min: number; target_reps_max: number; target_rpe: number; rest_seconds: number; notes?: string }>) => {
    const { data } = await api.patch(`/programs/workouts/${workoutId}/exercises/${exerciseId}`, updates);
    return data;
  },

  removeExercise: async (workoutId: string, exerciseId: string) => {
    await api.delete(`/programs/workouts/${workoutId}/exercises/${exerciseId}`);
  },

  reorderExercises: async (workoutId: string, exerciseOrder: string[]) => {
    const { data } = await api.patch(`/programs/workouts/${workoutId}/reorder`, { exercise_order: exerciseOrder });
    return data;
  },
};

// Exercises API
export const exercisesApi = {
  list: async (filters?: { muscle_group_id?: string; equipment?: string; is_compound?: boolean; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.muscle_group_id) params.append("muscle_group_id", filters.muscle_group_id);
    if (filters?.equipment) params.append("equipment", filters.equipment);
    if (filters?.is_compound !== undefined) params.append("is_compound", String(filters.is_compound));
    if (filters?.search) params.append("search", filters.search);
    const { data } = await api.get(`/exercises?${params}`);
    return data;
  },

  getMuscleGroups: async () => {
    const { data } = await api.get("/exercises/muscle-groups");
    return data;
  },

  create: async (exercise: { name: string; muscle_group_id: string; secondary_muscle_group_id?: string; equipment: string; is_compound?: boolean; is_unilateral?: boolean; instructions?: string }) => {
    const { data } = await api.post("/exercises", exercise);
    return data;
  },
};

// Sessions API
export interface Session {
  id: string;
  workout_id: string;
  workout_name: string;
  session_date: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  overall_rpe?: number;
  notes?: string;
  exercises: ExerciseInSession[];
  summary?: {
    total_sets: number;
    total_volume: number;
    prs_achieved: number;
  };
}

export interface ExerciseInSession {
  id: string;
  exercise: Exercise;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  target_rpe: number;
  rest_seconds: number;
  last_session?: {
    date: string;
    sets: Array<{ weight_kg: number; reps: number; rpe?: number }>;
  };
}

export interface Set {
  id: string;
  user_id: string;
  workout_exercise_id: string;
  exercise_id: string;
  exercise?: Exercise;
  session_date: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe?: number;
  is_warmup: boolean;
  is_failure: boolean;
  is_dropset: boolean;
  rest_seconds?: number;
  notes?: string;
  completed_at: string;
  created_at: string;
}

export interface SetCreate {
  workout_exercise_id: string;
  exercise_id: string;
  session_date: string;
  set_number?: number;
  weight_kg: number;
  reps: number;
  rpe?: number;
  is_warmup?: boolean;
  is_failure?: boolean;
  is_dropset?: boolean;
  rest_seconds?: number;
  notes?: string;
}

export const sessionsApi = {
  start: async (workoutId: string) => {
    const { data } = await api.post("/sessions/start", { workout_id: workoutId });
    return data;
  },

  get: async (sessionId: string) => {
    const { data } = await api.get(`/sessions/${sessionId}`);
    return data;
  },

  complete: async (sessionId: string, data: { overall_rpe?: number; notes?: string }) => {
    if (!isOnline()) {
      // Save offline
      await offlineService.saveSessionOffline(sessionId, "complete", data);
      // Return mock response
      return {
        id: sessionId,
        ...data,
        completed_at: new Date().toISOString(),
      };
    }

    try {
      const { data: response } = await api.post(`/sessions/${sessionId}/complete`, data);
      return response;
    } catch (error: any) {
      // If network error, save offline
      if (error.code === "ERR_NETWORK" || !isOnline()) {
        await offlineService.saveSessionOffline(sessionId, "complete", data);
        return {
          id: sessionId,
          ...data,
          completed_at: new Date().toISOString(),
        };
      }
      throw error;
    }
  },

  list: async (limit: number = 20, offset: number = 0) => {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("offset", String(offset));
    const { data } = await api.get(`/sessions?${params}`);
    return data;
  },

  getLastWorkoutSession: async (workoutId: string) => {
    const { data } = await api.get(`/sessions/workout/${workoutId}/last`);
    return data;
  },
};

// Analytics API
export const analyticsApi = {
  getVolumePerMuscleGroup: async (days: number = 7) => {
    const { data } = await api.get(`/analytics/volume-per-muscle-group?days=${days}`);
    return data;
  },
  
  getOneRepMax: async (exerciseId: string) => {
    const { data } = await api.get(`/analytics/one-rep-max/${exerciseId}`);
    return data;
  },
  
  getOneRepMaxHistory: async (exerciseId: string, days: number = 90) => {
    const { data } = await api.get(`/analytics/one-rep-max/${exerciseId}/history?days=${days}`);
    return data;
  },
  
  getRecentExercises: async (limit: number = 10, days: number = 30) => {
    const { data } = await api.get(`/analytics/recent-exercises?limit=${limit}&days=${days}`);
    return data;
  },
  
  getWorkoutConsistency: async (days: number = 90) => {
    const { data } = await api.get(`/analytics/workout-consistency?days=${days}`);
    return data;
  },
  
  getWeightTrend: async (days: number = 90) => {
    const { data } = await api.get(`/analytics/weight-trend?days=${days}`);
    return data;
  },
  
  getPersonalRecords: async (sortBy: string = "date") => {
    const { data } = await api.get(`/analytics/personal-records?sort_by=${sortBy}`);
    return data;
  },
  
  getProgressiveOverloadSuggestion: async (exerciseId: string) => {
    const { data } = await api.get(`/analytics/progressive-overload/${exerciseId}`);
    return data;
  },
  
  getDashboardStats: async () => {
    const { data } = await api.get("/analytics/dashboard-stats");
    return data;
  },
};

export const weightLogsApi = {
  create: async (logData: {
    weight_kg: number;
    logged_date: string;
    time_of_day: string;
    notes?: string | null;
  }) => {
    if (!isOnline()) {
      // Save offline - convert null to undefined for notes
      const offlineData = {
        ...logData,
        notes: logData.notes ?? undefined,
      };
      await offlineService.saveWeightLogOffline(offlineData);
      // Return mock response for immediate UI feedback
      return {
        id: `temp-${Date.now()}`,
        ...logData,
        created_at: new Date().toISOString(),
      };
    }

    try {
      const { data } = await api.post("/weight-logs", logData);
      return data;
    } catch (error: any) {
      // If network error, save offline - convert null to undefined for notes
      if (error.code === "ERR_NETWORK" || !isOnline()) {
        const offlineData = {
          ...logData,
          notes: logData.notes ?? undefined,
        };
        await offlineService.saveWeightLogOffline(offlineData);
        return {
          id: `temp-${Date.now()}`,
          ...logData,
          created_at: new Date().toISOString(),
        };
      }
      throw error;
    }
  },
  
  list: async (days: number = 30) => {
    const { data } = await api.get(`/weight-logs?days=${days}`);
    return data;
  },
  
  update: async (id: string, logData: {
    weight_kg?: number;
    logged_date?: string;
    time_of_day?: string;
    notes?: string | null;
  }) => {
    const { data } = await api.put(`/weight-logs/${id}`, logData);
    return data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/weight-logs/${id}`);
  },
};

export const setsApi = {
  create: async (set: SetCreate) => {
    if (!isOnline()) {
      // Save offline
      await offlineService.saveSetOffline(set);
      // Return a mock response for immediate UI feedback
      return {
        id: `offline-${Date.now()}`,
        ...set,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }

    try {
      const { data } = await api.post("/sets", set);
      return data;
    } catch (error: any) {
      // If network error, save offline
      if (error.code === "ERR_NETWORK" || !isOnline()) {
        await offlineService.saveSetOffline(set);
        return {
          id: `offline-${Date.now()}`,
          ...set,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
      }
      throw error;
    }
  },

  getPrevious: async (exerciseId: string) => {
    const { data } = await api.get(`/sets/exercise/${exerciseId}/previous`);
    return data;
  },

  getBySession: async (sessionId: string) => {
    const { data } = await api.get(`/sets/session/${sessionId}`);
    return data;
  },

  update: async (setId: string, updates: Partial<SetCreate>) => {
    const { data } = await api.patch(`/sets/${setId}`, updates);
    return data;
  },

  delete: async (setId: string) => {
    await api.delete(`/sets/${setId}`);
  },
};
