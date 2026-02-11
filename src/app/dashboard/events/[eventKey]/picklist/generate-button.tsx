"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveRateLimitMessage } from "@/lib/rate-limit-ui";

export function GeneratePickListButton({
  eventId,
  label = "Generate Pick List",
}: {
  eventId: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/strategy/picklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          resolveRateLimitMessage(
            res.status,
            data.error ?? "Failed to generate pick list"
          )
        );
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500 disabled:opacity-50"
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
        )}
        {loading ? "Generating... (this may take a moment)" : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
