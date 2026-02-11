import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScoutingForm } from "./scouting-form";

export default async function ScoutPage({
  params,
}: {
  params: Promise<{ matchId: string; teamNumber: string }>;
}) {
  const { matchId, teamNumber } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) redirect("/join");

  // Get match info
  const { data: match } = await supabase
    .from("matches")
    .select("*, events(name, tba_key, year)")
    .eq("id", matchId)
    .single();

  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-400">Match not found.</p>
      </div>
    );
  }

  // Check for existing entry
  const { data: existing } = await supabase
    .from("scouting_entries")
    .select("*")
    .eq("match_id", matchId)
    .eq("team_number", parseInt(teamNumber))
    .eq("scouted_by", user.id)
    .maybeSingle();

  const hasLegacy =
    match.comp_level !== "qm" && !match.set_number && match.match_number >= 100;
  const normalizedSet = hasLegacy
    ? Math.floor(match.match_number / 100)
    : match.set_number ?? null;
  const normalizedMatch = hasLegacy
    ? match.match_number % 100
    : match.match_number;
  const prefix =
    match.comp_level === "sf"
      ? "SF"
      : match.comp_level === "f"
      ? "F"
      : match.comp_level.toUpperCase();
  const compLabel =
    match.comp_level === "qm"
      ? `Qual ${normalizedMatch}`
      : normalizedSet
      ? `${prefix} ${normalizedSet}-${normalizedMatch}`
      : `${prefix} ${normalizedMatch}`;

  const eventTitle =
    match.events?.year && match.events?.name
      ? `${match.events.year} ${match.events.name}`
      : match.events?.name ?? "Event";

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs text-gray-400">
              {eventTitle}
            </p>
            <h1 className="text-lg font-bold text-white">
              {compLabel} &mdash; Team {teamNumber}
            </h1>
          </div>
          <Link
            href={
              match.events?.tba_key
                ? `/dashboard/events/${match.events.tba_key}/matches`
                : "/dashboard"
            }
            className="back-button"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <ScoutingForm
          matchId={matchId}
          teamNumber={parseInt(teamNumber)}
          orgId={profile.org_id}
          userId={user.id}
          eventKey={match.events?.tba_key ?? null}
          existing={existing}
        />
      </main>
    </div>
  );
}
