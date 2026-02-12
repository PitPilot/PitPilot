export const TEAM_RATE_LIMIT_MESSAGE =
  "Your team has reached its shared AI usage limit (Free: 3 interactions per 3 hours, Supporter: 13 per 3 hours). Please try again soon.";

export function resolveRateLimitMessage(status: number, fallback: string) {
  return status === 429 ? TEAM_RATE_LIMIT_MESSAGE : fallback;
}
