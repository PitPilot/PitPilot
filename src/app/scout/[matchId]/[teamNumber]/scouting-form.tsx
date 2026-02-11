"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CounterButton } from "@/components/counter-button";
import { StarRating } from "@/components/star-rating";
import { saveOffline, getPendingCount } from "@/lib/offline-queue";
import type { Tables } from "@/types/supabase";

interface ScoutingFormProps {
  matchId: string;
  teamNumber: number;
  orgId: string;
  userId: string;
  eventKey?: string | null;
  existing: Tables<"scouting_entries"> | null;
}

export function ScoutingForm({
  matchId,
  teamNumber,
  orgId,
  userId,
  eventKey,
  existing,
}: ScoutingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [autoScore, setAutoScore] = useState(existing?.auto_score ?? 0);
  const [teleopScore, setTeleopScore] = useState(existing?.teleop_score ?? 0);
  const [endgameScore, setEndgameScore] = useState(
    existing?.endgame_score ?? 0
  );
  const [defenseRating, setDefenseRating] = useState(
    existing?.defense_rating ?? 3
  );
  const [reliabilityRating, setReliabilityRating] = useState(
    existing?.reliability_rating ?? 3
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const autoRef = useRef<HTMLDivElement | null>(null);
  const teleopRef = useRef<HTMLDivElement | null>(null);
  const endgameRef = useRef<HTMLDivElement | null>(null);
  const ratingsRef = useRef<HTMLDivElement | null>(null);
  const notesRef = useRef<HTMLDivElement | null>(null);

  const steps = [
    { label: "Auto", ref: autoRef },
    { label: "Teleop", ref: teleopRef },
    { label: "Endgame", ref: endgameRef },
    { label: "Ratings", ref: ratingsRef },
    { label: "Notes", ref: notesRef },
  ];

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const stepMap = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = stepMap.get(entry.target);
          if (typeof index === "number") {
            setActiveStep(index);
          }
        });
      },
      {
        root: null,
        threshold: 0.3,
        rootMargin: "-20% 0px -50% 0px",
      }
    );

    steps.forEach((step, index) => {
      if (step.ref.current) {
        stepMap.set(step.ref.current, index);
        observer.observe(step.ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  const entryData = {
    match_id: matchId,
    team_number: teamNumber,
    auto_score: autoScore,
    teleop_score: teleopScore,
    endgame_score: endgameScore,
    defense_rating: defenseRating,
    reliability_rating: reliabilityRating,
    notes: notes.trim(),
  };

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const entry = {
      ...entryData,
      org_id: orgId,
      scouted_by: userId,
    };

    try {
      const result = await supabase
        .from("scouting_entries")
        .upsert(entry, { onConflict: "match_id,team_number,scouted_by" });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Submitted online successfully
      setSubmitted(true);
      setSavedOffline(false);
      setLoading(false);
      setTimeout(() => {
        if (eventKey) {
          router.push(`/dashboard/events/${eventKey}/matches?updated=1`);
          router.refresh();
        } else {
          router.back();
        }
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save.";
      const lowerMessage = message.toLowerCase();
      const shouldSaveOffline =
        typeof navigator !== "undefined" &&
        (!navigator.onLine ||
          lowerMessage.includes("fetch") ||
          lowerMessage.includes("network") ||
          lowerMessage.includes("timeout"));

      if (!shouldSaveOffline) {
        setError(message);
        setLoading(false);
        return;
      }

      // Network issue (offline/timeout) — save to IndexedDB
      try {
        await saveOffline({
          id: `${matchId}-${teamNumber}-${userId}`,
          ...entry,
          created_at: new Date().toISOString(),
        });
        const count = await getPendingCount();
        setPendingCount(count);
        setSubmitted(true);
        setSavedOffline(true);
        setLoading(false);
      } catch {
        setError("Failed to save. Please try again.");
        setLoading(false);
      }
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 pb-8">
        <div
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 backdrop-blur-sm ${
            savedOffline
              ? "border-amber-400/30 bg-amber-500/10"
              : "border-emerald-400/30 bg-emerald-500/10"
          }`}
        >
          <div className="text-4xl">{savedOffline ? "📱" : "✓"}</div>
          <p
            className={`text-lg font-semibold ${
              savedOffline ? "text-amber-200" : "text-emerald-200"
            }`}
          >
            {savedOffline
              ? "Saved Offline"
              : existing
              ? "Entry Updated!"
              : "Entry Submitted!"}
          </p>
          {savedOffline && (
            <>
              <p className="text-sm text-amber-200/80 text-center">
                Your entry is saved on this device and will sync automatically
                when you reconnect.
              </p>
              <p className="text-xs text-amber-200/70">
                {pendingCount} {pendingCount === 1 ? "entry" : "entries"} queued
              </p>
            </>
          )}
          {!savedOffline && (
            <p className="text-sm text-emerald-200/80">Returning to match list...</p>
          )}
        </div>

        {savedOffline && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Offline mode is active. You can keep scouting and we&apos;ll sync your
            entries when the connection returns. Some pages (like the dashboard)
            won&apos;t load until you&apos;re back online.
          </div>
        )}

        {savedOffline && (
          <button
            onClick={() => router.back()}
            className="back-button back-button-block back-button-lg"
          >
            Back to Matches
          </button>
        )}
      </div>
    );
  }

  return (
      <div className="space-y-6 pb-8">
      {error && (
        <div className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="scout-panel p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-200">
            Progress
          </p>
          <p className="text-xs text-gray-400">
            Step {activeStep + 1} of {steps.length}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {steps.map((step, index) => (
            <button
              key={step.label}
              type="button"
              onClick={() =>
                step.ref.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              className="text-left"
            >
              <span
                className={`block h-1.5 rounded-full ${
                  index <= activeStep ? "bg-cyan-400" : "bg-white/10"
                }`}
              />
              <span
                className={`mt-1 block text-[10px] uppercase tracking-widest ${
                  index === activeStep ? "text-cyan-200" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Auto Section */}
      <section ref={autoRef} className="scout-panel p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">
          Autonomous
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          <CounterButton
            label="Game Pieces"
            value={autoScore}
            onChange={setAutoScore}
          />
        </div>
      </section>

      {/* Teleop Section */}
      <section ref={teleopRef} className="scout-panel p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-300">
          Teleop
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          <CounterButton
            label="Game Pieces"
            value={teleopScore}
            onChange={setTeleopScore}
          />
        </div>
      </section>

      {/* Endgame Section */}
      <section ref={endgameRef} className="scout-panel p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-300">
          Endgame
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          <CounterButton
            label="Endgame Points"
            value={endgameScore}
            onChange={setEndgameScore}
          />
        </div>
      </section>

      {/* Ratings Section */}
      <section ref={ratingsRef} className="scout-panel p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-300">
          Ratings
        </h2>
        <div className="space-y-4">
          <StarRating
            label="Defense Ability"
            value={defenseRating}
            onChange={setDefenseRating}
          />
          <StarRating
            label="Overall Reliability"
            value={reliabilityRating}
            onChange={setReliabilityRating}
          />
        </div>
      </section>

      {/* Notes Section */}
      <section ref={notesRef} className="scout-panel p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">
          Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Quick observations..."
          rows={3}
          className="w-full px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 scout-input"
        />
      </section>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-lg bg-cyan-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50"
      >
        {loading
          ? "Submitting..."
          : existing
            ? "Update Entry"
            : "Submit Scouting Entry"}
      </button>
    </div>
  );
}
