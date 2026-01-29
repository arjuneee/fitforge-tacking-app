import Dexie, { Table } from "dexie";
import { type SetCreate } from "./api";

export interface PendingSet {
  id?: number;
  setData: SetCreate;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastRetryAt?: number;
  error?: string;
}

export interface PendingSession {
  id?: number;
  sessionId: string;
  action: "complete";
  data: { overall_rpe?: number; notes?: string };
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastRetryAt?: number;
  error?: string;
}

export interface PendingWeightLog {
  id?: number;
  weightData: {
    weight_kg: number;
    logged_date: string;
    time_of_day?: string;
    notes?: string;
  };
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastRetryAt?: number;
  error?: string;
}

class FitnessTrackerDB extends Dexie {
  pendingSets!: Table<PendingSet>;
  pendingSessions!: Table<PendingSession>;
  pendingWeightLogs!: Table<PendingWeightLog>;

  constructor() {
    super("FitnessTrackerDB");
    this.version(1).stores({
      pendingSets: "++id, timestamp, synced",
      pendingSessions: "++id, sessionId, timestamp, synced",
    });
    this.version(2).stores({
      pendingSets: "++id, timestamp, synced, retryCount",
      pendingSessions: "++id, sessionId, timestamp, synced, retryCount",
      pendingWeightLogs: "++id, timestamp, synced, retryCount",
    }).upgrade(async (tx) => {
      // Migrate existing data to include retryCount
      await tx.table("pendingSets").toCollection().modify((set: PendingSet) => {
        if (set.retryCount === undefined) {
          set.retryCount = 0;
        }
      });
      await tx.table("pendingSessions").toCollection().modify((session: PendingSession) => {
        if (session.retryCount === undefined) {
          session.retryCount = 0;
        }
      });
    });
  }
}

const db = new FitnessTrackerDB();

// Calculate exponential backoff delay
function getBackoffDelay(retryCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 60s
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  return delay;
}

// Check if item should be retried
function shouldRetry(retryCount: number, lastRetryAt?: number): boolean {
  if (retryCount >= 10) return false; // Max 10 retries
  if (!lastRetryAt) return true; // Never retried
  
  const delay = getBackoffDelay(retryCount);
  return Date.now() - lastRetryAt >= delay;
}

export const offlineService = {
  // Save set offline
  async saveSetOffline(setData: SetCreate): Promise<number> {
    const id = await db.pendingSets.add({
      setData,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    });
    return id as number;
  },

  // Save session action offline
  async saveSessionOffline(
    sessionId: string,
    action: "complete",
    data: { overall_rpe?: number; notes?: string }
  ): Promise<number> {
    const id = await db.pendingSessions.add({
      sessionId,
      action,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    });
    return id as number;
  },

  // Save weight log offline
  async saveWeightLogOffline(weightData: {
    weight_kg: number;
    logged_date: string;
    time_of_day?: string;
    notes?: string;
  }): Promise<number> {
    const id = await db.pendingWeightLogs.add({
      weightData,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    });
    return id as number;
  },

  // Get pending sets (ready for retry)
  async getPendingSets(): Promise<PendingSet[]> {
    const all = await db.pendingSets.filter(set => !set.synced).toArray();
    return all.filter(item => shouldRetry(item.retryCount, item.lastRetryAt));
  },

  // Get pending sessions (ready for retry)
  async getPendingSessions(): Promise<PendingSession[]> {
    const all = await db.pendingSessions.filter(session => !session.synced).toArray();
    return all.filter(item => shouldRetry(item.retryCount, item.lastRetryAt));
  },

  // Get pending weight logs (ready for retry)
  async getPendingWeightLogs(): Promise<PendingWeightLog[]> {
    const all = await db.pendingWeightLogs.filter(log => !log.synced).toArray();
    return all.filter(item => shouldRetry(item.retryCount, item.lastRetryAt));
  },

  // Mark set as synced
  async markSetSynced(id: number): Promise<void> {
    await db.pendingSets.update(id, { synced: true });
  },

  // Mark session as synced
  async markSessionSynced(id: number): Promise<void> {
    await db.pendingSessions.update(id, { synced: true });
  },

  // Mark weight log as synced
  async markWeightLogSynced(id: number): Promise<void> {
    await db.pendingWeightLogs.update(id, { synced: true });
  },

  // Mark set as failed (increment retry count)
  async markSetFailed(id: number, error: string): Promise<void> {
    const item = await db.pendingSets.get(id);
    if (item) {
      await db.pendingSets.update(id, {
        retryCount: item.retryCount + 1,
        lastRetryAt: Date.now(),
        error,
      });
    }
  },

  // Mark session as failed (increment retry count)
  async markSessionFailed(id: number, error: string): Promise<void> {
    const item = await db.pendingSessions.get(id);
    if (item) {
      await db.pendingSessions.update(id, {
        retryCount: item.retryCount + 1,
        lastRetryAt: Date.now(),
        error,
      });
    }
  },

  // Mark weight log as failed (increment retry count)
  async markWeightLogFailed(id: number, error: string): Promise<void> {
    const item = await db.pendingWeightLogs.get(id);
    if (item) {
      await db.pendingWeightLogs.update(id, {
        retryCount: item.retryCount + 1,
        lastRetryAt: Date.now(),
        error,
      });
    }
  },

  // Get pending count
  async getPendingCount(): Promise<number> {
    const sets = await this.getPendingSets();
    const sessions = await this.getPendingSessions();
    const weightLogs = await this.getPendingWeightLogs();
    return sets.length + sessions.length + weightLogs.length;
  },

  // Get all pending items (for status display)
  async getAllPendingItems(): Promise<{
    sets: PendingSet[];
    sessions: PendingSession[];
    weightLogs: PendingWeightLog[];
  }> {
    const sets = await db.pendingSets.filter(set => !set.synced).toArray();
    const sessions = await db.pendingSessions.filter(session => !session.synced).toArray();
    const weightLogs = await db.pendingWeightLogs.filter(log => !log.synced).toArray();
    return { sets, sessions, weightLogs };
  },

  // Clear synced items (cleanup)
  async clearSyncedItems(): Promise<void> {
    await db.pendingSets.filter(set => set.synced).delete();
    await db.pendingSessions.filter(session => session.synced).delete();
    await db.pendingWeightLogs.filter(log => log.synced).delete();
  },
};

// Auto-sync when online
if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    console.log("[Offline] Connection restored, syncing...");
    // Trigger sync (will be handled by API service)
    window.dispatchEvent(new CustomEvent("syncPendingItems"));
  });
}
