import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LooseSupabaseDatabase } from "@/types/supabase-loose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "warn" | "fail";

type CheckResult = {
  status: CheckStatus;
  details?: string;
  data?: Record<string, unknown>;
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function healthSecretAuthorized(request: NextRequest) {
  const secret = process.env.HEALTHCHECK_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return auth.slice("Bearer ".length).trim() === secret;
}

async function checkSupabaseConnection(): Promise<CheckResult> {
  try {
    const db = createAdminClient<LooseSupabaseDatabase>();
    const { error } = await db.from("platform_settings").select("id").limit(1);
    if (error) {
      return { status: "fail", details: error.message };
    }
    return { status: "ok" };
  } catch (error) {
    return {
      status: "fail",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkSyncQueue(): Promise<CheckResult> {
  try {
    const db = createAdminClient<LooseSupabaseDatabase>();
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const [dueCount, deadCount] = await Promise.all([
      db
        .from("sync_jobs")
        .select("id", { count: "exact", head: true })
        .in("phase", ["queued", "retrying"])
        .lte("run_after", new Date().toISOString()),
      db
        .from("sync_jobs")
        .select("id", { count: "exact", head: true })
        .eq("phase", "dead")
        .gte("created_at", since24h),
    ]);

    if (dueCount.error || deadCount.error) {
      return {
        status: "warn",
        details: dueCount.error?.message ?? deadCount.error?.message ?? "Queue stats unavailable.",
      };
    }

    const due = dueCount.count ?? 0;
    const dead = deadCount.count ?? 0;
    if (dead > 0) {
      return {
        status: "warn",
        details: "Dead-letter sync jobs detected.",
        data: { due, deadLast24h: dead },
      };
    }

    return { status: "ok", data: { due, deadLast24h: dead } };
  } catch (error) {
    return {
      status: "warn",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkStripeWebhookFailures(): Promise<CheckResult> {
  try {
    const db = createAdminClient<LooseSupabaseDatabase>();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await db
      .from("stripe_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("received_at", since24h);

    if (error) {
      return { status: "warn", details: error.message };
    }

    if ((count ?? 0) > 0) {
      return {
        status: "warn",
        details: "Stripe webhook failures detected.",
        data: { failedLast24h: count ?? 0 },
      };
    }

    return { status: "ok", data: { failedLast24h: count ?? 0 } };
  } catch (error) {
    return {
      status: "warn",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET(request: NextRequest) {
  const envCheck: CheckResult = {
    status:
      hasEnv("NEXT_PUBLIC_SUPABASE_URL") &&
      hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
      hasEnv("SUPABASE_SERVICE_ROLE_KEY")
        ? "ok"
        : "fail",
    details:
      hasEnv("NEXT_PUBLIC_SUPABASE_URL") &&
      hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
      hasEnv("SUPABASE_SERVICE_ROLE_KEY")
        ? undefined
        : "Missing required Supabase environment variables.",
  };

  const [supabaseCheck, queueCheck, stripeCheck] = await Promise.all([
    checkSupabaseConnection(),
    checkSyncQueue(),
    checkStripeWebhookFailures(),
  ]);

  const checks = {
    env: envCheck,
    supabase: supabaseCheck,
    syncQueue: queueCheck,
    stripeWebhook: stripeCheck,
  };

  const statuses: CheckStatus[] = [
    envCheck.status,
    supabaseCheck.status,
    queueCheck.status,
    stripeCheck.status,
  ];

  const overall =
    statuses.includes("fail") ? "fail" : statuses.includes("warn") ? "warn" : "ok";
  const statusCode = overall === "fail" ? 503 : 200;

  const full = healthSecretAuthorized(request);
  return NextResponse.json(
    full
      ? {
          ok: overall !== "fail",
          overall,
          timestamp: new Date().toISOString(),
          checks,
        }
      : {
          ok: overall !== "fail",
          overall,
          timestamp: new Date().toISOString(),
        },
    { status: statusCode }
  );
}
