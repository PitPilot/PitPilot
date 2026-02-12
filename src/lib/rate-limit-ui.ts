export const TEAM_RATE_LIMIT_MESSAGE =
  "Your team has reached its shared AI usage limit. Supporter plans have higher limits. Please try again soon.";

export function resolveRateLimitMessage(status: number, fallback: string) {
  return status === 429 ? TEAM_RATE_LIMIT_MESSAGE : fallback;
}
