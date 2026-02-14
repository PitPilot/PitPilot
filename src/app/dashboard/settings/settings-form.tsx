"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization } from "@/lib/auth-actions";
import { updateMemberRole, updateOrganizationPlan } from "@/lib/captain-actions";
import { DeleteTeamButton } from "@/components/delete-team-button";

interface TeamSettingsFormProps {
  org: {
    name: string;
    teamNumber: number | null;
    joinCode: string;
    planTier: "free" | "supporter";
  };
  members: {
    id: string;
    display_name: string;
    role: string;
    created_at: string;
  }[];
  memberCount: number;
  isCaptain: boolean;
}

export function TeamSettingsForm({
  org,
  members,
  memberCount,
  isCaptain,
}: TeamSettingsFormProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [memberStatus, setMemberStatus] = useState<string | null>(null);

  // Team settings state
  const [teamName, setTeamName] = useState(org.name);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamMessage, setTeamMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planMessage, setPlanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleTeamSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTeamLoading(true);
    setTeamMessage(null);

    const formData = new FormData();
    formData.set("name", teamName);

    const result = await updateOrganization(formData);
    if (result?.error) {
      setTeamMessage({ type: "error", text: result.error });
    } else {
      setTeamMessage({ type: "success", text: "Team name updated." });
      router.refresh();
    }
    setTeamLoading(false);
  }

  async function handleMemberRoleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMemberStatus(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateMemberRole(formData);

    if (result?.error) {
      setMemberStatus(result.error);
      return;
    }

    setMemberStatus("Member role updated.");
    router.refresh();
  }

  async function handlePlanChange(nextPlan: "free" | "supporter") {
    setPlanLoading(true);
    setPlanMessage(null);

    const formData = new FormData();
    formData.set("planTier", nextPlan);
    const result = await updateOrganizationPlan(formData);

    if (result?.error) {
      setPlanMessage({ type: "error", text: result.error });
      setPlanLoading(false);
      return;
    }

    setPlanMessage({
      type: "success",
      text:
        nextPlan === "supporter"
          ? "Team upgraded to Supporter."
          : "Team moved to Free plan.",
    });
    setPlanLoading(false);
    router.refresh();
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(org.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">

        {/* Team Info */}
        <div className="rounded-2xl dashboard-panel p-6">
          <h3 className="text-lg font-semibold text-white">Team Info</h3>
          <p className="mt-1 text-sm text-gray-300">
            {isCaptain
              ? "Manage your team's display name. This overrides the name from The Blue Alliance."
              : "Only captains can edit team settings."}
          </p>

          <div className="mt-4 space-y-4">
            {org.teamNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Team Number
                </label>
                <p className="mt-1 text-sm text-white">{org.teamNumber}</p>
              </div>
            )}

            <form onSubmit={handleTeamSubmit} className="space-y-3">
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-300">
                  Team Name
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={!isCaptain}
                  className="mt-1 block w-full px-3 py-2 text-sm text-white shadow-sm dashboard-input disabled:bg-white/5 disabled:text-gray-400"
                />
              </div>

              {teamMessage && (
                <p className={`text-sm ${teamMessage.type === "success" ? "text-green-400" : "text-red-400"}`}>
                  {teamMessage.text}
                </p>
              )}

              {isCaptain && (
                <button
                  type="submit"
                  disabled={teamLoading || teamName === org.name}
                  className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-400 disabled:opacity-50"
                >
                  {teamLoading ? "Saving..." : "Save team name"}
                </button>
              )}
            </form>
          </div>
        </div>

        {isCaptain && (
          <div className="rounded-2xl dashboard-panel p-6">
            <h3 className="text-lg font-semibold text-white">Team Members</h3>
            <p className="mt-1 text-sm text-gray-300">
              Promote teammates to captain or scout roles.
            </p>

            <div className="mt-4 space-y-3">
              {members.length === 0 ? (
                <p className="text-sm text-gray-400">No members found.</p>
              ) : (
                members.map((member) => (
                  <form
                    key={member.id}
                    onSubmit={handleMemberRoleSubmit}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-gray-950/60 px-3 py-2 dashboard-panel"
                  >
                    <input type="hidden" name="memberId" value={member.id} />
                    <div>
                      <p className="text-sm font-medium text-white">{member.display_name}</p>
                      <p className="text-xs text-gray-400">{member.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        name="role"
                        defaultValue={member.role}
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white dashboard-input"
                      >
                        <option value="scout">Scout</option>
                        <option value="captain">Captain</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-teal-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-400"
                      >
                        Update
                      </button>
                    </div>
                  </form>
                ))
              )}
            </div>

            {memberStatus && (
              <p className="mt-3 text-sm text-gray-200">{memberStatus}</p>
            )}
          </div>
        )}

        {/* Organization */}
        <div className="rounded-2xl dashboard-panel p-6">
          <h3 className="text-lg font-semibold text-white">Organization</h3>
          <p className="mt-1 text-sm text-gray-300">
            Share the join code with teammates so they can join your organization.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Join Code
              </label>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm tracking-widest text-white">
                  {org.joinCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Members
              </label>
              <p className="mt-1 text-sm text-white">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl dashboard-panel p-6">
          <h3 className="text-lg font-semibold text-white">Plan</h3>
          <p className="mt-1 text-sm text-gray-300">
            Plans are shared by your whole team.
          </p>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-white/10 bg-gray-950/60 p-4">
              <p className="text-sm text-gray-300">Current plan</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {org.planTier === "supporter" ? "Supporter ($5.99/team/month)" : "Free"}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {org.planTier === "supporter"
                  ? "Higher AI usage limits for your team."
                  : "Unlimited prompts with usage limits."}
              </p>
            </div>

            {isCaptain ? (
              <div className="flex flex-wrap items-center gap-2">
                {org.planTier !== "supporter" ? (
                  <button
                    type="button"
                    disabled={planLoading}
                    onClick={() => handlePlanChange("supporter")}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {planLoading ? "Updating..." : "Upgrade to Supporter"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={planLoading}
                    onClick={() => handlePlanChange("free")}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {planLoading ? "Updating..." : "Switch to Free"}
                  </button>
                )}
                <p className="text-xs text-gray-400">
                  Billing checkout is not connected yet; this toggles plan status directly for now.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Only captains can change plans.
              </p>
            )}

            {planMessage && (
              <p className={`text-sm ${planMessage.type === "success" ? "text-green-400" : "text-red-400"}`}>
                {planMessage.text}
              </p>
            )}
          </div>
        </div>

        {isCaptain && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
            <h3 className="text-lg font-semibold text-red-200">Danger Zone</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-100/95">
              Delete this team and remove every member from it. This action is
              permanent.
            </p>
            <div className="mt-4">
              <DeleteTeamButton />
            </div>
          </div>
        )}
    </div>
  );
}
