"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function removeOrgEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return { error: "No organization found." } as const;
  }

  if (profile.role !== "captain") {
    return { error: "Only captains can remove events." } as const;
  }

  const orgEventId = (formData.get("orgEventId") as string | null)?.trim();
  if (!orgEventId) {
    return { error: "Missing event id." } as const;
  }

  const { error } = await supabase
    .from("org_events")
    .delete()
    .eq("id", orgEventId)
    .eq("org_id", profile.org_id);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/dashboard");
  return { success: true } as const;
}
