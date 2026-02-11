"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteAllScoutingReports() {
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
    return { error: "Only captains can delete scouting reports." } as const;
  }

  const { error } = await supabase
    .from("scouting_entries")
    .delete()
    .eq("org_id", profile.org_id);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  return { success: true } as const;
}

export async function deleteScoutingReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const reportId = (formData.get("reportId") as string | null)?.trim();
  if (!reportId) {
    return { error: "Missing report id" } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return { error: "No organization found." } as const;
  }

  const { error } = await supabase
    .from("scouting_entries")
    .delete()
    .eq("id", reportId)
    .eq("org_id", profile.org_id);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  return { success: true } as const;
}
