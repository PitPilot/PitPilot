"use server";

import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

const ROLE_OPTIONS = ["scout", "captain"] as const;
type UserRole = (typeof ROLE_OPTIONS)[number];
const PLAN_TIER_OPTIONS = ["free", "supporter"] as const;
type PlanTier = (typeof PLAN_TIER_OPTIONS)[number];

async function requireCaptain() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, org_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" } as const;
  }

  if (profile.role !== "captain") {
    return { error: "Captain access required" } as const;
  }

  if (!profile.org_id) {
    return { error: "Organization not found" } as const;
  }

  return { supabase, profile, user } as const;
}

export async function updateMemberRole(formData: FormData) {
  const ctx = await requireCaptain();
  if ("error" in ctx) return ctx;

  const memberId = (formData.get("memberId") as string | null)?.trim();
  const role = (formData.get("role") as string | null)?.trim() as UserRole | null;

  if (!memberId) {
    return { error: "Missing member id" } as const;
  }

  if (!role || !ROLE_OPTIONS.includes(role)) {
    return { error: "Invalid role" } as const;
  }

  // Prevent removing the last captain in the org
  if (role !== "captain") {
    const { data: target } = await ctx.supabase
      .from("profiles")
      .select("id, role")
      .eq("id", memberId)
      .eq("org_id", ctx.profile.org_id!)
      .single();

    if (!target) {
      return { error: "Member not found" } as const;
    }

    if (target.role === "captain") {
      const { count } = await ctx.supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("org_id", ctx.profile.org_id!)
        .eq("role", "captain");

      if ((count ?? 0) <= 1) {
        return { error: "You must keep at least one captain in the organization." } as const;
      }
    }
  }

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("org_id", ctx.profile.org_id!);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/dashboard/settings");
  return { success: true } as const;
}

export async function removeMemberFromOrganization(formData: FormData) {
  const ctx = await requireCaptain();
  if ("error" in ctx) return ctx;

  const memberId = (formData.get("memberId") as string | null)?.trim();
  if (!memberId) {
    return { error: "Missing member id" } as const;
  }

  if (memberId === ctx.user.id) {
    return { error: "Use Leave team to remove yourself." } as const;
  }

  const { data: target, error: targetError } = await ctx.supabase
    .from("profiles")
    .select("id, role")
    .eq("id", memberId)
    .eq("org_id", ctx.profile.org_id!)
    .single();

  if (targetError || !target) {
    return { error: "Member not found" } as const;
  }

  if (target.role === "captain") {
    const { count } = await ctx.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("org_id", ctx.profile.org_id!)
      .eq("role", "captain");

    if ((count ?? 0) <= 1) {
      return { error: "You must keep at least one captain in the organization." } as const;
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!serviceRoleKey || !supabaseUrl) {
    return { error: "Service role key not configured." } as const;
  }

  const admin = createAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: assignmentError } = await admin
    .from("scout_assignments")
    .delete()
    .eq("org_id", ctx.profile.org_id!)
    .eq("assigned_to", memberId);
  if (assignmentError) {
    return { error: assignmentError.message } as const;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      org_id: null,
      role: "scout",
      team_roles: [],
      onboarding_complete: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("org_id", ctx.profile.org_id!);
  if (profileError) {
    return { error: profileError.message } as const;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true } as const;
}

export async function updateOrganizationPlan(formData: FormData) {
  const ctx = await requireCaptain();
  if ("error" in ctx) return ctx;

  const planTier = (formData.get("planTier") as string | null)?.trim() as PlanTier | null;
  if (!planTier || !PLAN_TIER_OPTIONS.includes(planTier)) {
    return { error: "Invalid plan tier" } as const;
  }

  const { error } = await ctx.supabase
    .from("organizations")
    .update({ plan_tier: planTier })
    .eq("id", ctx.profile.org_id!);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/dashboard/settings");
  return { success: true } as const;
}
