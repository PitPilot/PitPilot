"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";
import {
  formatRateLimitUsageMessage,
  readRateLimitSnapshot,
  resolveRateLimitMessage,
} from "@/lib/rate-limit-ui";

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

  async function handleSync() {
    setLoading(true);
    setError(null);
    setStatus("Syncing EPA stats...");

    try {
      const res = await fetch("/api/stats/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventKey }),
      });
      const usage = readRateLimitSnapshot(res.headers);
      if (usage) {
        toast(formatRateLimitUsageMessage(usage, "sync"), "info");
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          resolveRateLimitMessage(
            res.status,
            data.error || "Failed to sync stats",
            "sync"
          )
        );
      }
      setStatus(`Synced EPA for ${data.synced}/${data.total} teams.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      setStatus(null);
    } finally {
      setLoading(false);
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
      {status && <p className="text-xs text-emerald-600 dark:text-emerald-300">{status}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}
