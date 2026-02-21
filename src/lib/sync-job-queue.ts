import { randomUUID } from "node:crypto";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { syncEventData, syncEventStats } from "@/lib/event-sync";

const JOB_TTL_MS = 2 * 60 * 60 * 1000;

export type EventSyncJobPhase =
  | "queued"
  | "syncing_event"
  | "syncing_stats"
  | "done"
  | "failed";

export type EventSyncJobKind = "full" | "stats_only";

type EventSyncJobResult = {
  eventName: string;
  teams: number | null;
  matches: number | null;
  synced: number;
  errors: number;
  total: number;
  failedTeams: number[];
};

type EventSyncJobRecord = {
  id: string;
  orgId: string;
  requestedBy: string;
  eventKey: string;
  kind: EventSyncJobKind;
  createdAt: number;
  updatedAt: number;
  phase: EventSyncJobPhase;
  progress: number;
  warning: string | null;
  statusMessage: string;
  error: string | null;
  result: EventSyncJobResult | null;
};

const STORE_KEY = "__pitpilotSyncJobs";

function getStore(): Map<string, EventSyncJobRecord> {
  const globalAny = globalThis as typeof globalThis & {
    [STORE_KEY]?: Map<string, EventSyncJobRecord>;
  };
  if (!globalAny[STORE_KEY]) {
    globalAny[STORE_KEY] = new Map<string, EventSyncJobRecord>();
  }
  return globalAny[STORE_KEY] as Map<string, EventSyncJobRecord>;
}

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service credentials are missing.");
  }

  return createAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function updateJob(
  jobId: string,
  updates: Partial<
    Omit<
      EventSyncJobRecord,
      "id" | "orgId" | "requestedBy" | "eventKey" | "kind" | "createdAt"
    >
  >
) {
  const store = getStore();
  const current = store.get(jobId);
  if (!current) return;

  store.set(jobId, {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  });
}

function pruneJobs() {
  const cutoff = Date.now() - JOB_TTL_MS;
  const store = getStore();
  for (const [jobId, job] of store.entries()) {
    if (job.updatedAt >= cutoff) continue;
    store.delete(jobId);
  }
}

function findActiveJob(orgId: string, eventKey: string): EventSyncJobRecord | null {
  const store = getStore();
  for (const job of store.values()) {
    if (job.orgId !== orgId) continue;
    if (job.eventKey !== eventKey) continue;
    if (job.phase === "queued" || job.phase === "syncing_event" || job.phase === "syncing_stats") {
      return job;
    }
  }
  return null;
}

export function getActiveEventSyncJob(orgId: string, eventKey: string) {
  pruneJobs();
  return findActiveJob(orgId, eventKey);
}

async function runJob(
  jobId: string,
  params: {
    orgId: string;
    eventKey: string;
    orgTeamNumber: number | null;
    kind: EventSyncJobKind;
  }
) {
  try {
    const supabase = createServiceClient();
    if (params.kind === "stats_only") {
      updateJob(jobId, {
        phase: "syncing_stats",
        progress: 12,
        statusMessage: "Syncing EPA stats from Statbotics...",
        error: null,
      });

      const { data: dbEvent, error: eventLookupError } = await supabase
        .from("events")
        .select("id, name")
        .eq("tba_key", params.eventKey)
        .single();

      if (eventLookupError || !dbEvent?.id) {
        throw new Error("Event not found. Sync the event first.");
      }

      const statsResult = await syncEventStats({
        supabase,
        eventKey: params.eventKey,
        eventId: dbEvent.id,
      });

      updateJob(jobId, {
        phase: "done",
        progress: 100,
        statusMessage: `Done! Synced EPA for ${statsResult.synced}/${statsResult.total} teams.`,
        result: {
          eventName: dbEvent.name ?? params.eventKey.toUpperCase(),
          teams: null,
          matches: null,
          synced: statsResult.synced,
          errors: statsResult.errors,
          total: statsResult.total,
          failedTeams: statsResult.failedTeams,
        },
        error: null,
      });
      return;
    }

    updateJob(jobId, {
      phase: "syncing_event",
      progress: 8,
      statusMessage: "Syncing event data from TBA...",
      error: null,
    });

    const eventResult = await syncEventData({
      supabase,
      eventKey: params.eventKey,
      orgId: params.orgId,
      orgTeamNumber: params.orgTeamNumber,
    });

    updateJob(jobId, {
      phase: "syncing_stats",
      progress: 58,
      warning: eventResult.warning,
      statusMessage: `Synced ${eventResult.eventName}: ${eventResult.teamCount} teams, ${eventResult.matchCount} matches. Syncing EPA stats...`,
    });

    const statsResult = await syncEventStats({
      supabase,
      eventKey: params.eventKey,
      eventId: eventResult.eventId,
    });

    updateJob(jobId, {
      phase: "done",
      progress: 100,
      statusMessage: `Done! Synced EPA for ${statsResult.synced}/${statsResult.total} teams.`,
      result: {
        eventName: eventResult.eventName,
        teams: eventResult.teamCount,
        matches: eventResult.matchCount,
        synced: statsResult.synced,
        errors: statsResult.errors,
        total: statsResult.total,
        failedTeams: statsResult.failedTeams,
      },
      error: null,
    });
  } catch (error) {
    updateJob(jobId, {
      phase: "failed",
      progress: 100,
      error: error instanceof Error ? error.message : "Sync failed",
      statusMessage: "Sync failed.",
    });
  }
}

export function enqueueEventSyncJob(params: {
  orgId: string;
  requestedBy: string;
  eventKey: string;
  orgTeamNumber: number | null;
  kind?: EventSyncJobKind;
}) {
  pruneJobs();

  const active = findActiveJob(params.orgId, params.eventKey);
  if (active) {
    return active;
  }

  const kind = params.kind ?? "full";
  const now = Date.now();
  const job: EventSyncJobRecord = {
    id: randomUUID(),
    orgId: params.orgId,
    requestedBy: params.requestedBy,
    eventKey: params.eventKey,
    kind,
    createdAt: now,
    updatedAt: now,
    phase: "queued",
    progress: 2,
    warning: null,
    statusMessage:
      kind === "stats_only"
        ? "Job queued. Starting EPA sync..."
        : "Job queued. Starting sync...",
    error: null,
    result: null,
  };

  const store = getStore();
  store.set(job.id, job);

  setTimeout(() => {
    void runJob(job.id, {
      orgId: params.orgId,
      eventKey: params.eventKey,
      orgTeamNumber: params.orgTeamNumber,
      kind,
    });
  }, 0);

  return job;
}

export function getEventSyncJob(jobId: string) {
  pruneJobs();
  return getStore().get(jobId) ?? null;
}

export function toPublicJob(record: EventSyncJobRecord) {
  return {
    id: record.id,
    orgId: record.orgId,
    requestedBy: record.requestedBy,
    eventKey: record.eventKey,
    kind: record.kind,
    phase: record.phase,
    progress: record.progress,
    warning: record.warning,
    statusMessage: record.statusMessage,
    error: record.error,
    result: record.result,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
