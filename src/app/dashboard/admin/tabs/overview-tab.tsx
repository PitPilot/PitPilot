"use client";

import { StaggerGroup, StaggerChild } from "@/components/ui/animate-in";

interface OverviewTabProps {
  stats: {
    organizations: number;
    users: number;
    entries: number;
    matches: number;
    events: number;
  };
}

export function OverviewTab({ stats }: OverviewTabProps) {
  const cards = [
    { label: "Organizations", value: stats.organizations, sub: "Registered teams", color: "text-blue-400" },
    { label: "Users", value: stats.users, sub: "Profiles created", color: "text-cyan-400" },
    { label: "Scouting Entries", value: stats.entries, sub: "Total submissions", color: "text-purple-400" },
    { label: "Matches", value: stats.matches, sub: "Synced matches", color: "text-green-400" },
    { label: "Events", value: stats.events, sub: "Synced events", color: "text-amber-400" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold">Platform Overview</h2>
      <p className="mt-1 text-sm text-gray-400">Key metrics at a glance.</p>
      <StaggerGroup className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((s) => (
          <StaggerChild key={s.label}>
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
              <p className="text-xs uppercase tracking-widest text-gray-400">{s.label}</p>
              <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          </StaggerChild>
        ))}
      </StaggerGroup>
    </div>
  );
}
