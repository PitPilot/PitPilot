import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { TEAM_AI_LIMITS, type PlanTier, normalizePlanTier } from "@/lib/rate-limit";

const DEFAULT_EVENT_SYNC_MIN_YEAR = 2025;
const DEFAULT_SCOUTING_ABILITY_QUESTIONS = [
  "Can go under the trench?",
  "Can go over the ramp?",
];
const MIN_AI_PROMPT_LIMIT = 1;
const MAX_AI_PROMPT_LIMIT = 50;

export type TeamAiPromptLimits = Record<PlanTier, number>;

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

export function getDefaultTeamAiPromptLimits(): TeamAiPromptLimits {
  return { ...TEAM_AI_LIMITS };
}

function normalizeAiPromptLimit(
  value: unknown,
  fallback: number
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(MIN_AI_PROMPT_LIMIT, Math.min(MAX_AI_PROMPT_LIMIT, parsed));
}

export function normalizeTeamAiPromptLimits(
  value: unknown
): TeamAiPromptLimits {
  const defaults = getDefaultTeamAiPromptLimits();
  if (!value || typeof value !== "object") return defaults;

  const obj = value as Record<string, unknown>;
  return {
    free: normalizeAiPromptLimit(obj.free, defaults.free),
    supporter: normalizeAiPromptLimit(obj.supporter, defaults.supporter),
  };
}

type PlatformQuestionSettings = {
  questions: string[];
  aiPromptLimits: TeamAiPromptLimits;
};

function parseQuestionSettingsPayload(value: unknown): PlatformQuestionSettings {
  const defaults = {
    questions: getDefaultScoutingAbilityQuestions(),
    aiPromptLimits: getDefaultTeamAiPromptLimits(),
  };

  if (!value) return defaults;

  if (Array.isArray(value)) {
    return {
      questions: normalizeScoutingAbilityQuestions(value),
      aiPromptLimits: defaults.aiPromptLimits,
    };
  }

  if (typeof value !== "object") return defaults;

  const obj = value as Record<string, unknown>;
  const questionSource =
    obj.questions ??
    obj.scoutingAbilityQuestions ??
    obj.scouting_ability_questions;
  const aiLimitSource = obj.aiPromptLimits ?? obj.ai_prompt_limits;

  return {
    questions: normalizeScoutingAbilityQuestions(questionSource),
    aiPromptLimits: normalizeTeamAiPromptLimits(aiLimitSource),
  };
}

export function serializeQuestionSettingsPayload({
  questions,
  aiPromptLimits,
}: {
  questions: string[];
  aiPromptLimits: TeamAiPromptLimits;
}): Record<string, unknown> {
  return {
    questions: normalizeScoutingAbilityQuestions(questions),
    aiPromptLimits: normalizeTeamAiPromptLimits(aiPromptLimits),
  };
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

  return parseQuestionSettingsPayload(data?.scouting_ability_questions)
    .questions;
}

export async function getTeamAiPromptLimits(
  supabase: SupabaseClient<Database>
): Promise<TeamAiPromptLimits> {
  const fallback = getDefaultTeamAiPromptLimits();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("scouting_ability_questions")
    .eq("id", 1)
    .maybeSingle();

  if (error) return fallback;

  return parseQuestionSettingsPayload(data?.scouting_ability_questions)
    .aiPromptLimits;
}

export function getTeamAiLimitFromSettings(
  limits: TeamAiPromptLimits,
  planTier: string | null | undefined
): number {
  const normalizedPlan = normalizePlanTier(planTier);
  return limits[normalizedPlan];
}
