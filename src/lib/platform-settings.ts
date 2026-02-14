import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const DEFAULT_EVENT_SYNC_MIN_YEAR = 2025;
const DEFAULT_SCOUTING_ABILITY_QUESTIONS = [
  "Can go under the trench?",
  "Can go over the ramp?",
];

function normalizeYear(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_EVENT_SYNC_MIN_YEAR;
  return Math.max(1992, Math.min(parsed, 2100));
}

export function getDefaultEventSyncMinYear(): number {
  const envYear = process.env.TBA_SYNC_MIN_YEAR?.trim();
  if (!envYear) return DEFAULT_EVENT_SYNC_MIN_YEAR;
  return normalizeYear(envYear);
}

function normalizeQuestionText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, 120);
}

export function normalizeScoutingAbilityQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_SCOUTING_ABILITY_QUESTIONS];

  const unique = new Set<string>();
  for (const item of value) {
    const normalized = normalizeQuestionText(item);
    if (!normalized) continue;
    if (unique.has(normalized.toLowerCase())) continue;
    unique.add(normalized.toLowerCase());
    if (unique.size >= 24) break;
  }

  const questions = Array.from(unique.values()).map((key) => {
    // Recover original casing from source array when possible.
    const match = value.find(
      (item) =>
        typeof item === "string" &&
        item.trim().replace(/\s+/g, " ").toLowerCase() === key
    );
    return (match as string).trim().replace(/\s+/g, " ").slice(0, 120);
  });

  return questions.length > 0
    ? questions
    : [...DEFAULT_SCOUTING_ABILITY_QUESTIONS];
}

export function getDefaultScoutingAbilityQuestions(): string[] {
  return [...DEFAULT_SCOUTING_ABILITY_QUESTIONS];
}

export async function getEventSyncMinYear(
  supabase: SupabaseClient<Database>
): Promise<number> {
  const fallbackYear = getDefaultEventSyncMinYear();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("event_sync_min_year")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data?.event_sync_min_year) {
    return fallbackYear;
  }

  return normalizeYear(data.event_sync_min_year);
}

export async function getScoutingAbilityQuestions(
  supabase: SupabaseClient<Database>
): Promise<string[]> {
  const fallback = getDefaultScoutingAbilityQuestions();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("scouting_ability_questions")
    .eq("id", 1)
    .maybeSingle();

  if (error) return fallback;

  return normalizeScoutingAbilityQuestions(data?.scouting_ability_questions);
}
