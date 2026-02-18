import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  retryAfterSeconds,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const MESSAGE_TYPES = new Set(["note", "strategy", "question", "alert"]);
const TEAM_PULSE_RATE_WINDOW_MS = 60 * 1000;
const TEAM_PULSE_RATE_LIMIT = 6;
const TEAM_PULSE_MAX_WORDS = 200;

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organization found." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json(
      { error: "Message content is required." },
      { status: 400 }
    );
  }

  const wordCount = countWords(content);
  if (wordCount > TEAM_PULSE_MAX_WORDS) {
    return NextResponse.json(
      {
        error: `Team Pulse messages are limited to ${TEAM_PULSE_MAX_WORDS} words (${wordCount} provided).`,
      },
      { status: 400 }
    );
  }

  const messageTypeRaw =
    typeof body?.messageType === "string" ? body.messageType.toLowerCase() : "";
  const messageType = MESSAGE_TYPES.has(messageTypeRaw) ? messageTypeRaw : "note";

  const matchKey =
    typeof body?.matchKey === "string" && body.matchKey.trim().length > 0
      ? body.matchKey.trim().slice(0, 24)
      : null;

  const replyToId =
    typeof body?.replyToId === "string" && body.replyToId.trim().length > 0
      ? body.replyToId.trim()
      : null;

  if (replyToId) {
    const { data: replyTarget } = await supabase
      .from("team_messages")
      .select("id, org_id")
      .eq("id", replyToId)
      .maybeSingle();

    if (!replyTarget || replyTarget.org_id !== profile.org_id) {
      return NextResponse.json(
        { error: "Reply target is invalid for your team." },
        { status: 400 }
      );
    }
  }

  const limit = await checkRateLimit(
    `team-pulse:${profile.org_id}:${user.id}`,
    TEAM_PULSE_RATE_WINDOW_MS,
    TEAM_PULSE_RATE_LIMIT
  );
  const limitHeaders = buildRateLimitHeaders(limit, TEAM_PULSE_RATE_LIMIT);
  if (!limit.allowed) {
    const retryAfter = retryAfterSeconds(limit.resetAt);
    return NextResponse.json(
      { error: "You are posting too fast. Please wait a moment and try again." },
      {
        status: 429,
        headers: { ...limitHeaders, "Retry-After": retryAfter.toString() },
      }
    );
  }

  const { data, error } = await supabase
    .from("team_messages")
    .insert({
      org_id: profile.org_id,
      author_id: user.id,
      content,
      message_type: messageType,
      match_key: matchKey,
      reply_to_id: replyToId,
    })
    .select(
      "id, content, message_type, match_key, created_at, author_id, reply_to_id, profiles(display_name, team_roles)"
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: limitHeaders }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: data,
    },
    { headers: limitHeaders }
  );
}
