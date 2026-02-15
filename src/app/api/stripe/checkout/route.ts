import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { createStripeCheckoutSession } from "@/lib/stripe";

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

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("plan_tier")
    .eq("id", profile.org_id)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  if (org.plan_tier === "supporter") {
    return NextResponse.json(
      { error: "Team is already on the Supporter plan." },
      { status: 409 }
    );
  }

  const originHeader = request.headers.get("origin");
  const baseUrl =
    originHeader && originHeader.startsWith("http")
      ? originHeader
      : getSiteUrl();

  try {
    const session = await createStripeCheckoutSession({
      orgId: profile.org_id,
      successUrl: `${baseUrl}/dashboard/settings?billing=success`,
      cancelUrl: `${baseUrl}/dashboard/settings?billing=cancel`,
      customerEmail: user.email ?? undefined,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session created without a redirect URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

