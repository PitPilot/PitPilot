import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/observability";
import { processDueSyncJobs } from "@/lib/sync-job-queue";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.SYNC_JOB_WORKER_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  return token.length > 0 && token === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { maxJobs?: number }
    | null;
  const maxJobs = Math.max(1, Math.min(payload?.maxJobs ?? 5, 25));

  try {
    const result = await processDueSyncJobs({
      maxJobs,
      workerId: `manual-${Date.now()}`,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    await reportError({
      source: "sync-jobs-worker-api",
      title: "Sync worker execution failed",
      error,
      severity: "critical",
      details: { maxJobs },
    });
    const message = error instanceof Error ? error.message : "Worker failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
