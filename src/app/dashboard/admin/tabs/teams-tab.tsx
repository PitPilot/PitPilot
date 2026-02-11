"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  updateOrganizationTeamNumber,
} from "@/lib/staff-actions";
import { Button } from "@/components/ui/button";

interface OrgRow {
  id: string;
  name: string;
  team_number: number | null;
  join_code: string;
  created_at: string;
}

interface TeamsTabProps {
  organizations: OrgRow[];
  onStatus: (msg: string) => void;
  onConfirmDelete: (info: { type: string; id: string; label: string }) => void;
}

export function TeamsTab({ organizations, onStatus, onConfirmDelete }: TeamsTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  async function handleUpdateOrg(formData: FormData) {
    const result = await updateOrganizationTeamNumber(formData);
    if (result?.error) { onStatus(result.error); return; }
    onStatus("Team number updated.");
    refresh();
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Registered Teams</h2>
      <p className="mt-1 text-sm text-gray-400">Update team numbers for organizations.</p>

      <div className="mt-6 space-y-4">
        {organizations.map((org) => (
          <div key={org.id} className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{org.name}</p>
                <p className="mt-1 text-xs text-gray-400">Join code: <span className="font-mono text-gray-200">{org.join_code}</span></p>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">Team #{org.team_number ?? "—"}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <form action={handleUpdateOrg} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="orgId" value={org.id} />
                <div>
                  <label className="block text-xs font-medium text-gray-400">Team Number</label>
                  <input name="teamNumber" type="number" defaultValue={org.team_number ?? ""} className="mt-1 w-36 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" min={1} />
                </div>
                <Button type="submit" size="md">Update</Button>
              </form>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() =>
                  onConfirmDelete({
                    type: "organization",
                    id: org.id,
                    label: `team ${org.name}`,
                  })
                }
              >
                Delete Team
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
