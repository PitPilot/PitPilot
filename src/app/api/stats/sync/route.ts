import { NextResponse } from "next/server";
import { POST as createSyncJob } from "@/app/api/events/sync/jobs/route";

export const runtime = "nodejs";
export const maxDuration = 60;

// Backward-compatible endpoint that now queues a stats-only sync job.
export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { eventKey?: string }
    | null;

  if (!payload?.eventKey || typeof payload.eventKey !== "string") {
    return NextResponse.json({ error: "eventKey is required" }, { status: 400 });
  }

  const proxyRequest = new Request(request.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventKey: payload.eventKey,
      mode: "stats",
    }),
  });

  return createSyncJob(proxyRequest);
}
