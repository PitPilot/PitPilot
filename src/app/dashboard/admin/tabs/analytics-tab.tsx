"use client";

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { StaggerGroup, StaggerChild } from "@/components/ui/animate-in";

interface TimePoint {
  date: string;
  count: number;
}

interface AnalyticsTabProps {
  analytics: {
    signups: TimePoint[];
    organizations: TimePoint[];
    scoutingEntries: TimePoint[];
    messages: TimePoint[];
  };
}

export function AnalyticsTab({ analytics }: AnalyticsTabProps) {
  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const totalSignups = analytics.signups.reduce((s, d) => s + d.count, 0);
  const totalOrgs = analytics.organizations.reduce((s, d) => s + d.count, 0);
  const totalEntries = analytics.scoutingEntries.reduce((s, d) => s + d.count, 0);
  const totalMessages = analytics.messages.reduce((s, d) => s + d.count, 0);

  const summaryChips = [
    { label: "Signups", value: totalSignups, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Orgs", value: totalOrgs, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Entries", value: totalEntries, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Messages", value: totalMessages, color: "text-green-400", bg: "bg-green-500/10" },
  ];

  const charts = [
    { title: "User Signups", data: analytics.signups, total: totalSignups, color: "#3b82f6", fill: "#3b82f6" },
    { title: "New Organizations", data: analytics.organizations, total: totalOrgs, color: "#06b6d4", fill: "#06b6d4" },
    { title: "Scouting Entries", data: analytics.scoutingEntries, total: totalEntries, color: "#a855f7", fill: "#a855f7" },
    { title: "Team Messages", data: analytics.messages, total: totalMessages, color: "#22c55e", fill: "#22c55e" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Analytics</h2>
          <p className="text-sm text-gray-400">Activity over the last 30 days.</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="mt-5 flex flex-wrap gap-3">
        {summaryChips.map((chip) => (
          <div key={chip.label} className={`inline-flex items-center gap-2 rounded-full ${chip.bg} px-3.5 py-1.5 text-xs font-semibold ${chip.color}`}>
            <span className="text-lg font-bold">{chip.value}</span>
            {chip.label}
          </div>
        ))}
      </div>

      <StaggerGroup className="mt-6 grid gap-6 lg:grid-cols-2">
        {charts.map((chart) => (
          <StaggerChild key={chart.title}>
            <div className="rounded-2xl dashboard-panel dashboard-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chart.color }} />
                  <h3 className="text-sm font-semibold text-gray-300">{chart.title}</h3>
                </div>
                <span className="text-2xl font-bold" style={{ color: chart.color }}>
                  {chart.total}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chart.data}>
                  <defs>
                    <linearGradient id={`grad-${chart.title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.fill} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={chart.fill} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.75rem",
                      fontSize: "0.75rem",
                      color: "#fff",
                    }}
                    labelFormatter={(label) => formatDate(String(label))}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={chart.color}
                    strokeWidth={2}
                    fill={`url(#grad-${chart.title})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </StaggerChild>
        ))}
      </StaggerGroup>
    </div>
  );
}
