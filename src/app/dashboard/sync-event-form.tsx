"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import {
  formatRateLimitUsageMessage,
  readRateLimitSnapshot,
  resolveRateLimitMessage,
} from "@/lib/rate-limit-ui";

type SyncJobPhase =
  | "queued"
  | "retrying"
  | "syncing_event"
  | "syncing_stats"
  | "done"
  | "failed"
  | "dead";

type SyncJobStatus = {
  id: string;
  eventKey: string;
  phase: SyncJobPhase;
  progress: number;
  warning: string | null;
  statusMessage: string;
  error: string | null;
  result: {
    synced: number;
    total: number;
  } | null;
};

export function SyncEventForm() {
  const { toast } = useToast();
  const [eventKey, setEventKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "event" | "stats" | "done">("idle");
  const [slow, setSlow] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [activeEventKey, setActiveEventKey] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

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
      if (job.warning) {
        setWarning(job.warning);
      }

      if (
        job.phase === "syncing_event" ||
        job.phase === "queued" ||
        job.phase === "retrying"
      ) {
        setPhase("event");
        return;
      }
      if (job.phase === "syncing_stats") {
        setPhase("stats");
        return;
      }
      if (job.phase === "done") {
        setPhase("done");
        setLoading(false);
        setJobId(null);

        const routeEventKey = (activeEventKey ?? eventKey).trim().toLowerCase();
        setTimeout(() => {
          router.push(`/dashboard/events/${routeEventKey}`);
        }, 1200);
        return;
      }
      if (job.phase === "failed" || job.phase === "dead") {
        throw new Error(job.error ?? "Sync failed.");
      }
    };

    void pollJobStatus().catch((pollError) => {
      setError(pollError instanceof Error ? pollError.message : "Sync failed");
      setLoading(false);
      setJobId(null);
      setStatus(null);
      setPhase("idle");
    });

    pollRef.current = setInterval(() => {
      void pollJobStatus().catch((pollError) => {
        setError(pollError instanceof Error ? pollError.message : "Sync failed");
        setLoading(false);
        setJobId(null);
        setStatus(null);
        setPhase("idle");
      });
    }, 1500);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeEventKey, eventKey, jobId, loading, router]);

  useEffect(() => {
    if (!loading) return;
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [loading, phase]);

  async function handleSync() {
    if (!eventKey.trim()) return;

    const normalizedEventKey = eventKey.trim().toLowerCase();
    setLoading(true);
    setError(null);
    setStatus("Queueing sync job...");
    setWarning(null);
    setProgress(4);
    setPhase("event");
    setActiveEventKey(normalizedEventKey);

    try {
      const queueRes = await fetch("/api/events/sync/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventKey: normalizedEventKey }),
      });

      const queueUsage = readRateLimitSnapshot(queueRes.headers);
      if (queueUsage) {
        toast(formatRateLimitUsageMessage(queueUsage, "sync"), "info");
      }

      const queueData = (await queueRes.json().catch(() => null)) as
        | { error?: string; job?: SyncJobStatus }
        | null;

      if (!queueRes.ok || !queueData?.job) {
        throw new Error(
          resolveRateLimitMessage(
            queueRes.status,
            queueData?.error ?? "Failed to queue sync job",
            "sync"
          )
        );
      }

      setJobId(queueData.job.id);
      setProgress(Math.max(4, Math.min(100, queueData.job.progress ?? 4)));
      setStatus(queueData.job.statusMessage || "Sync job started...");
      if (queueData.job.warning) {
        setWarning(queueData.job.warning);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      setStatus(null);
      setLoading(false);
      setJobId(null);
      setPhase("idle");
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-400 dashboard-panel">
        <p className="font-semibold text-gray-300">Where to find the event key</p>
        <p className="mt-1">
          Open the event on <a href="https://www.thebluealliance.com/events" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">The Blue Alliance</a> and copy the part after
          <span className="font-mono text-gray-200"> /event/ </span>
          in the URL. Example:
          <span className="ml-1 font-mono text-gray-200">2025hiho</span>.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={eventKey}
          onChange={(e) => setEventKey(e.target.value)}
          placeholder="TBA event key (e.g. 2025hiho)"
          className="flex-1 rounded-lg px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 dashboard-input"
          disabled={loading}
        />
        <button
          onClick={handleSync}
          disabled={loading || !eventKey.trim()}
          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-400 disabled:opacity-50"
        >
          {loading ? "Syncing..." : "Sync Event"}
        </button>
      </div>
      {(loading || progress > 0) && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {status}
        </p>
      )}
      {slow && loading && (
        <p className="rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-300">
          This is taking a while — please keep this tab open.
        </p>
      )}
      {warning && (
        <p className="rounded-lg bg-teal-500/10 px-3 py-2 text-sm text-teal-200">
          {warning}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
