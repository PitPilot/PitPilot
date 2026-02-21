import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/observability";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LooseSupabaseDatabase } from "@/types/supabase-loose";
import {
  getStripeWebhookSecret,
  retrieveStripeSubscription,
  verifyStripeWebhookSignature,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTER_STATUSES = new Set(["active", "trialing", "past_due", "unpaid"]);

interface StripeEvent<T = unknown> {
  id: string;
  type: string;
  data: {
    object: T;
  };
}

interface StripeCheckoutSessionObject {
  client_reference_id?: string | null;
  metadata?: Record<string, string>;
}

interface StripeSubscriptionObject {
  id: string;
  status: string;
  metadata?: Record<string, string>;
}

interface StripeInvoiceObject {
  subscription?: string | null;
  metadata?: Record<string, string>;
  lines?: {
    data?: Array<{
      metadata?: Record<string, string>;
    }>;
  };
}

type WebhookEventState = "processing" | "processed" | "failed";

function metadataValue(
  metadata: Record<string, string> | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function admin() {
  return createAdminClient<LooseSupabaseDatabase>();
}

async function applyOrgPlan(
  orgId: string,
  planTier: "free" | "supporter",
  context: { eventId: string; eventType: string }
) {
  const { data: existing, error: readError } = await admin()
    .from("organizations")
    .select("plan_tier")
    .eq("id", orgId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (!existing) {
    throw new Error("Organization not found.");
  }

  // Gifted supporter teams are manually managed and should not be overwritten by Stripe events.
  if (existing.plan_tier === "gifted_supporter") {
    return;
  }

  const { error } = await admin()
    .from("organizations")
    .update({ plan_tier: planTier })
    .eq("id", orgId);

  if (error) {
    throw new Error(error.message);
  }

  if (existing.plan_tier === planTier) {
    return;
  }

  // Keep minimal audit metadata in the webhook event row.
  await admin()
    .from("stripe_webhook_events")
    .update({
      payload: {
        last_plan_transition: {
          orgId,
          from: existing.plan_tier,
          to: planTier,
          at: new Date().toISOString(),
          sourceEvent: context.eventId,
          sourceType: context.eventType,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.eventId);
}

async function orgIdFromInvoice(invoice: StripeInvoiceObject) {
  const direct =
    metadataValue(invoice.metadata, "org_id") ??
    metadataValue(invoice.lines?.data?.[0]?.metadata, "org_id");
  if (direct) return direct;

  if (!invoice.subscription || typeof invoice.subscription !== "string") {
    return null;
  }

  try {
    const subscription = await retrieveStripeSubscription(invoice.subscription);
    return metadataValue(subscription.metadata, "org_id");
  } catch {
    return null;
  }
}

async function beginWebhookEvent(
  event: StripeEvent,
  payload: unknown
): Promise<{ shouldProcess: boolean }> {
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await admin()
    .from("stripe_webhook_events")
    .select("status, attempt_count")
    .eq("id", event.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.status === "processed") {
    return { shouldProcess: false };
  }

  if (existing) {
    const { error: updateError } = await admin()
      .from("stripe_webhook_events")
      .update({
        event_type: event.type,
        payload,
        status: "processing" as WebhookEventState,
        attempt_count: Number(existing.attempt_count ?? 0) + 1,
        last_error: null,
        received_at: now,
        updated_at: now,
      })
      .eq("id", event.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { shouldProcess: true };
  }

  const { error: insertError } = await admin().from("stripe_webhook_events").insert({
    id: event.id,
    event_type: event.type,
    payload,
    status: "processing" as WebhookEventState,
    attempt_count: 1,
    last_error: null,
    received_at: now,
    updated_at: now,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { shouldProcess: true };
}

async function finishWebhookEvent(eventId: string) {
  const now = new Date().toISOString();
  const { error } = await admin()
    .from("stripe_webhook_events")
    .update({
      status: "processed" as WebhookEventState,
      processed_at: now,
      last_error: null,
      updated_at: now,
    })
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }
}

async function failWebhookEvent(eventId: string, err: unknown) {
  const now = new Date().toISOString();
  const message =
    err instanceof Error ? err.message : "Webhook processing failed.";

  const { error } = await admin()
    .from("stripe_webhook_events")
    .update({
      status: "failed" as WebhookEventState,
      last_error: message,
      updated_at: now,
    })
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }
}

async function processStripeEvent(event: StripeEvent) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as StripeCheckoutSessionObject;
      const orgId =
        metadataValue(session.metadata, "org_id") ??
        (typeof session.client_reference_id === "string"
          ? session.client_reference_id
          : null);

      if (orgId) {
        await applyOrgPlan(orgId, "supporter", {
          eventId: event.id,
          eventType: event.type,
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.created": {
      const subscription = event.data.object as StripeSubscriptionObject;
      const orgId = metadataValue(subscription.metadata, "org_id");
      if (!orgId) break;

      const planTier =
        event.type === "customer.subscription.deleted"
          ? "free"
          : SUPPORTER_STATUSES.has(subscription.status)
          ? "supporter"
          : "free";

      await applyOrgPlan(orgId, planTier, {
        eventId: event.id,
        eventType: event.type,
      });
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as StripeInvoiceObject;
      const orgId = await orgIdFromInvoice(invoice);
      if (orgId) {
        await applyOrgPlan(orgId, "supporter", {
          eventId: event.id,
          eventType: event.type,
        });
      }
      break;
    }
    case "invoice.payment_failed":
    default:
      break;
  }
}

export async function POST(request: NextRequest) {
  const signatureHeader = request.headers.get("stripe-signature");
  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let webhookSecret: string;
  try {
    webhookSecret = getStripeWebhookSecret();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "STRIPE_WEBHOOK_SECRET is missing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const isValid = verifyStripeWebhookSignature({
    payload,
    signatureHeader,
    webhookSecret,
  });

  if (!isValid) {
    await reportError({
      source: "stripe-webhook",
      title: "Stripe webhook signature verification failed",
      error: "Invalid webhook signature.",
      severity: "warning",
      details: {
        signatureHeaderPresent: Boolean(signatureHeader),
        payloadLength: payload.length,
      },
    });
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: StripeEvent;
  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(payload) as unknown;
    event = parsedPayload as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  try {
    const begin = await beginWebhookEvent(event, parsedPayload);
    if (!begin.shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await processStripeEvent(event);
    await finishWebhookEvent(event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    try {
      await failWebhookEvent(event.id, error);
    } catch {
      // Ignore nested update errors and still return processing failure below.
    }

    await reportError({
      source: "stripe-webhook",
      title: "Stripe webhook processing failed",
      error,
      severity: "critical",
      details: {
        eventId: event.id,
        eventType: event.type,
      },
    });

    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
