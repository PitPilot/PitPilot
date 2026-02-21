"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast";
import {
  formatRateLimitUsageMessage,
  readRateLimitSnapshot,
  resolveRateLimitMessage,
} from "@/lib/rate-limit-ui";

type SyncJobPhase = "queued" | "syncing_event" | "syncing_stats" | "done" | "failed";

type SyncJobStatus = {
  id: string;
  phase: SyncJobPhase;
  progress: number;
  statusMessage: string;
  warning: string | null;
  error: string | null;
  result: {
    synced: number;
    total: number;
  } | null;
};

export function SyncStatsButton({
  eventKey,
  compact = false,
}: {
  eventKey: string;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId || !loading) return;

    const pollJobStatus = async () => {
      const res = await fetch(`/api/events/sync/jobs/${jobId}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; job?: SyncJobStatus }
        | null;

      if (!res.ok || !data?.job) {
        throw new Error(data?.error ?? "Failed to read sync job status.");
      }

      const job = data.job;
      setProgress(Math.max(0, Math.min(100, job.progress ?? 0)));
      setStatus(job.statusMessage ?? null);

      if (job.phase === "done") {
        setLoading(false);
        setJobId(null);
        const synced = job.result?.synced ?? 0;
        const total = job.result?.total ?? 0;
        setStatus(`Synced EPA for ${synced}/${total} teams.`);
        return;
      }

      if (job.phase === "failed") {
        throw new Error(job.error ?? "Sync failed.");
      }
    };

    void pollJobStatus().catch((pollError) => {
      setError(pollError instanceof Error ? pollError.message : "Sync failed");
      setLoading(false);
      setJobId(null);
      setStatus(null);
    });

    pollRef.current = setInterval(() => {
      void pollJobStatus().catch((pollError) => {
        setError(pollError instanceof Error ? pollError.message : "Sync failed");
        setLoading(false);
        setJobId(null);
        setStatus(null);
      });
    }, 1500);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [jobId, loading]);

  async function handleSync() {
    setLoading(true);
    setError(null);
    setProgress(4);
    setStatus("Queueing EPA sync...");

    try {
      const res = await fetch("/api/events/sync/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventKey, mode: "stats" }),
      });
      const usage = readRateLimitSnapshot(res.headers);
      if (usage) {
        toast(formatRateLimitUsageMessage(usage, "sync"), "info");
      }
      const data = (await res.json().catch(() => null)) as
        | { error?: string; job?: SyncJobStatus }
        | null;

      if (!res.ok || !data?.job) {
        throw new Error(
          resolveRateLimitMessage(
            res.status,
            data?.error || "Failed to queue stats sync",
            "sync"
          )
        );
      }

      setJobId(data.job.id);
      setProgress(Math.max(4, Math.min(100, data.job.progress ?? 4)));
      setStatus(data.job.statusMessage || "Sync job started...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      setStatus(null);
      setLoading(false);
      setJobId(null);
      setProgress(0);
    }
  }

  return (
    <div className={compact ? "space-y-2" : "mt-4 space-y-2"}>
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
      >
        {loading ? "Syncing..." : "Sync stats"}
      </button>
      {(loading || progress > 0) && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {status && <p className="text-xs text-emerald-600 dark:text-emerald-300">{status}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}
