"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateOrganizationTeamNumber } from "@/lib/staff-actions";
import { Button } from "@/components/ui/button";
import { StaggerGroup, StaggerChild } from "@/components/ui/animate-in";

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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function TeamsTab({ organizations, onStatus, onConfirmDelete }: TeamsTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());
  const [search, setSearch] = useState("");

  const filtered = search
    ? organizations.filter(
        (org) =>
          org.name.toLowerCase().includes(search.toLowerCase()) ||
          (org.team_number && String(org.team_number).includes(search))
      )
    : organizations;

  async function handleUpdateOrg(formData: FormData) {
    const result = await updateOrganizationTeamNumber(formData);
    if (result?.error) { onStatus(result.error); return; }
    onStatus("Team number updated.");
    refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Registered Teams</h2>
          <p className="text-sm text-gray-400">{organizations.length} organizations registered.</p>
        </div>
      </div>

      {/* Search */}
      <div className="mt-5 relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="dashboard-input w-full py-2.5 pl-10 pr-3 text-sm"
          placeholder="Search by name or team number..."
        />
      </div>

      <StaggerGroup className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 dashboard-panel p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <p className="text-sm font-medium text-gray-300">{search ? "No teams match your search" : "No teams registered yet"}</p>
          </div>
        ) : (
          filtered.map((org) => (
            <StaggerChild key={org.id}>
              <div className="rounded-2xl dashboard-panel dashboard-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="text-sm font-semibold text-white">{org.name}</p>
                      {org.team_number && (
                        <span className="inline-flex items-center rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-bold text-teal-400 ring-1 ring-teal-500/20">
                          #{org.team_number}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full dashboard-chip px-2.5 py-1 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <span className="font-mono">{org.join_code}</span>
                      </span>
                      <span className="text-xs text-gray-500">Joined {timeAgo(org.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <form action={handleUpdateOrg} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="orgId" value={org.id} />
                    <div>
                      <label className="block text-xs font-medium text-gray-400">Team Number</label>
                      <input name="teamNumber" type="number" defaultValue={org.team_number ?? ""} className="dashboard-input mt-1 w-32 px-3 py-2 text-sm" min={1} />
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
            </StaggerChild>
          ))
        )}
      </StaggerGroup>
    </div>
  );
}
