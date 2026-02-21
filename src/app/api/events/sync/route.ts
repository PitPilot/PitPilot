import { POST as createSyncJob } from "@/app/api/events/sync/jobs/route";

export const runtime = "nodejs";
export const maxDuration = 60;

// Backward-compatible endpoint that now uses queued sync jobs.
export async function POST(request: Request) {
  return createSyncJob(request);
}
