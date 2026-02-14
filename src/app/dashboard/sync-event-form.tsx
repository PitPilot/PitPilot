"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import {
  formatRateLimitUsageMessage,
  readRateLimitSnapshot,
  resolveRateLimitMessage,
} from "@/lib/rate-limit-ui";

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
  const rafRef = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const tick = () => {
      setProgress((prev) => {
        const ceiling = phase === "event" ? 45 : phase === "stats" ? 90 : phase === "done" ? 100 : 0;
        if (prev >= ceiling) return prev;
        const next = prev + Math.max(0.4, (ceiling - prev) * 0.03);
        return Math.min(next, ceiling);
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [loading, phase]);

  useEffect(() => {
    if (!loading) return;
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [loading, phase]);

  async function handleSync() {
    if (!eventKey.trim()) return;

    setLoading(true);
    setError(null);
    setStatus("Syncing event data from TBA...");
    setWarning(null);
    setProgress(6);
    setPhase("event");

    try {
      // Step 1: Sync event, teams, and matches
      const eventRes = await fetch("/api/events/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventKey: eventKey.trim() }),
      });
      const eventUsage = readRateLimitSnapshot(eventRes.headers);
      if (eventUsage) {
        toast(formatRateLimitUsageMessage(eventUsage, "sync"), "info");
      }

      const eventData = await eventRes.json();
      if (!eventRes.ok) {
        throw new Error(
          resolveRateLimitMessage(
            eventRes.status,
            eventData.error ?? "Failed to sync event",
            "sync"
          )
        );
      }

      setStatus(
        `Synced ${eventData.event}: ${eventData.teams} teams, ${eventData.matches} matches. Now syncing EPA stats...`
      );
      if (eventData.warning) {
        setWarning(eventData.warning);
      }
      setPhase("stats");

      // Step 2: Sync stats from Statbotics
      const statsRes = await fetch("/api/stats/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventKey: eventKey.trim() }),
      });
      const statsUsage = readRateLimitSnapshot(statsRes.headers);
      if (statsUsage) {
        toast(formatRateLimitUsageMessage(statsUsage, "sync"), "info");
      }

      const statsData = await statsRes.json();
      if (!statsRes.ok) {
        throw new Error(
          resolveRateLimitMessage(
            statsRes.status,
            statsData.error ?? "Failed to sync stats",
            "sync"
          )
        );
      }

      setStatus(
        `Done! Synced EPA for ${statsData.synced}/${statsData.total} teams.`
      );
      setPhase("done");
      setProgress(100);

      // Redirect to event page after short delay
      setTimeout(() => {
        router.push(`/dashboard/events/${eventKey.trim()}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      setStatus(null);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setProgress(0);
        setPhase("idle");
      }, 800);
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
