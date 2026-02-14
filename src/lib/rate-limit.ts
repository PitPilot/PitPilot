type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type PlanTier = "free" | "supporter";

export const TEAM_AI_WINDOW_MS = 3 * 60 * 60 * 1000;
export const TEAM_AI_LIMITS: Record<PlanTier, number> = {
  free: 3,
  supporter: 13,
};

const storeKey = "__scoutaiRateLimitStore";
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim();
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const canUseUpstashRateLimit =
  !!UPSTASH_REDIS_REST_URL && !!UPSTASH_REDIS_REST_TOKEN;

const RATE_LIMIT_LUA = `
local key = KEYS[1]
local max = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = redis.call("INCR", key)
if current == 1 then
  redis.call("PEXPIRE", key, window)
end

local ttl = redis.call("PTTL", key)
local allowed = 0
if current <= max then
  allowed = 1
end

local remaining = max - current
if remaining < 0 then
  remaining = 0
end

return {allowed, remaining, ttl}
`;

function getStore(): Map<string, RateLimitEntry> {
  const globalAny = globalThis as typeof globalThis & {
    [storeKey]?: Map<string, RateLimitEntry>;
  };

  if (!globalAny[storeKey]) {
    globalAny[storeKey] = new Map();
  }

  return globalAny[storeKey] as Map<string, RateLimitEntry>;
}

function checkRateLimitInMemory(
  key: string,
  windowMs: number,
  max: number
): RateLimitResult {
  const store = getStore();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(max - 1, 0), resetAt };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(key, entry);
  return {
    allowed: true,
    remaining: Math.max(max - entry.count, 0),
    resetAt: entry.resetAt,
  };
}

async function checkRateLimitUpstash(
  key: string,
  windowMs: number,
  max: number
): Promise<RateLimitResult | null> {
  if (!canUseUpstashRateLimit) return null;

  try {
    const response = await fetch(`${UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["EVAL", RATE_LIMIT_LUA, "1", key, String(max), String(windowMs)],
      ]),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Upstash response status ${response.status}`);
    }

    const payload = (await response.json()) as Array<{
      result?: unknown;
      error?: string | null;
    }>;
    const first = Array.isArray(payload) ? payload[0] : null;
    if (!first) {
      throw new Error("Invalid Upstash response");
    }
    if (first.error) {
      throw new Error(first.error);
    }

    const result = Array.isArray(first.result)
      ? first.result
      : (first.result as { result?: unknown } | undefined)?.result;
    if (!Array.isArray(result) || result.length < 3) {
      throw new Error("Missing Upstash rate limit result");
    }

    const allowed = Number(result[0]) === 1;
    const remaining = Math.max(0, Number(result[1]) || 0);
    const ttl = Number(result[2]);
    const resetAt = Date.now() + (Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs);

    return {
      allowed,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error("Upstash rate limit failed, falling back to in-memory store.", error);
    return null;
  }
}

export async function checkRateLimit(
  key: string,
  windowMs: number,
  max: number
): Promise<RateLimitResult> {
  const distributed = await checkRateLimitUpstash(key, windowMs, max);
  if (distributed) return distributed;
  return checkRateLimitInMemory(key, windowMs, max);
}

export function retryAfterSeconds(resetAt: number): number {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
}

export function normalizePlanTier(value: string | null | undefined): PlanTier {
  return value === "supporter" ? "supporter" : "free";
}

export function getTeamAiLimit(planTier: string | null | undefined): number {
  return TEAM_AI_LIMITS[normalizePlanTier(planTier)];
}

export function buildRateLimitHeaders(
  limit: Pick<RateLimitResult, "remaining" | "resetAt">,
  max: number
): HeadersInit {
  return {
    "X-RateLimit-Limit": String(Math.max(0, max)),
    "X-RateLimit-Remaining": String(Math.max(0, limit.remaining)),
    "X-RateLimit-Reset": String(limit.resetAt),
  };
}
