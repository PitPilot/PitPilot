import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/observability";
import { findStripeSubscriptionByOrgId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LooseSupabaseDatabase } from "@/types/supabase-loose";

export const runtime = "nodejs";
export const maxDuration = 180;
export const dynamic = "force-dynamic";

const SUPPORTER_STATUSES = new Set(["active", "trialing", "past_due", "unpaid"]);

function isAuthorized(request: NextRequest) {
  const secret = process.env.STRIPE_RECONCILE_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 && token === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { dryRun?: boolean; limit?: number }
    | null;
  const dryRun = Boolean(payload?.dryRun);
  const limit = Math.max(1, Math.min(payload?.limit ?? 500, 2000));

  try {
    const admin = createAdminClient<LooseSupabaseDatabase>();
    const { data: organizations, error } = await admin
      .from("organizations")
      .select("id, plan_tier")
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    let reviewed = 0;
    let changed = 0;
    let skippedGifted = 0;
    const updates: Array<{
      orgId: string;
      from: string;
      to: "free" | "supporter";
      reason: string;
    }> = [];

    for (const org of organizations ?? []) {
      const orgId = String(org.id);
      const currentPlan = String(org.plan_tier ?? "free");
      reviewed += 1;

      if (currentPlan === "gifted_supporter") {
        skippedGifted += 1;
        continue;
      }

      const subscription = await findStripeSubscriptionByOrgId(orgId);
      const targetPlan: "free" | "supporter" =
        subscription && SUPPORTER_STATUSES.has(subscription.status)
          ? "supporter"
          : "free";

      if (currentPlan === targetPlan) {
        continue;
      }

      updates.push({
        orgId,
        from: currentPlan,
        to: targetPlan,
        reason: subscription ? `subscription:${subscription.status}` : "no_subscription",
      });

      if (!dryRun) {
        const { error: updateError } = await admin
          .from("organizations")
          .update({ plan_tier: targetPlan })
          .eq("id", orgId);
        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      changed += 1;
    }

    return NextResponse.json({
      success: true,
      dryRun,
      reviewed,
      changed,
      skippedGifted,
      updates,
    });
  } catch (error) {
    await reportError({
      source: "stripe-reconcile",
      title: "Stripe reconciliation failed",
      error,
      severity: "critical",
    });

    const message = error instanceof Error ? error.message : "Reconciliation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
