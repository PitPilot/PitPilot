import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEventSyncJob, toPublicJob } from "@/lib/sync-job-queue";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  const job = getEventSyncJob(jobId);
  if (!job || job.orgId !== profile.org_id) {
    return NextResponse.json({ error: "Sync job not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, job: toPublicJob(job) });
}
