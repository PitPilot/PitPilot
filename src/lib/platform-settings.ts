import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const DEFAULT_EVENT_SYNC_MIN_YEAR = 2025;

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
