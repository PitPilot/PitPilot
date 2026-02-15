import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import {
  createStripeBillingPortalSession,
  findStripeSubscriptionByOrgId,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.org_id) {
    return NextResponse.json({ error: "Organization not found" }, { status: 400 });
  }

  if (profile.role !== "captain") {
    return NextResponse.json({ error: "Captain access required" }, { status: 403 });
  }

  try {
    const subscription = await findStripeSubscriptionByOrgId(profile.org_id);
    if (!subscription?.customer) {
      return NextResponse.json(
        { error: "No Stripe subscription found for this team." },
        { status: 404 }
      );
    }

    const originHeader = request.headers.get("origin");
    const baseUrl =
      originHeader && originHeader.startsWith("http")
        ? originHeader
        : getSiteUrl();

    const portalSession = await createStripeBillingPortalSession({
      customerId: subscription.customer,
      returnUrl: `${baseUrl}/dashboard/settings?billing=portal`,
    });

    return NextResponse.json({ success: true, url: portalSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

