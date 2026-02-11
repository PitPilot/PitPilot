"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

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

  const charts = [
    { title: "User Signups", data: analytics.signups, total: totalSignups, color: "#3b82f6", fill: "#3b82f6" },
    { title: "New Organizations", data: analytics.organizations, total: totalOrgs, color: "#06b6d4", fill: "#06b6d4" },
    { title: "Scouting Entries", data: analytics.scoutingEntries, total: totalEntries, color: "#a855f7", fill: "#a855f7" },
    { title: "Team Messages", data: analytics.messages, total: totalMessages, color: "#22c55e", fill: "#22c55e" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold">Analytics</h2>
      <p className="mt-1 text-sm text-gray-400">Activity over the last 30 days.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {charts.map((chart) => (
          <div
            key={chart.title}
            className="rounded-2xl border border-white/10 bg-gray-900/60 p-5"
          >
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-gray-300">{chart.title}</h3>
              <span className="text-2xl font-bold" style={{ color: chart.color }}>
                {chart.total}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              {chart.total > 0 ? (
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
              ) : (
                <BarChart data={chart.data}>
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
                  <Bar dataKey="count" fill={chart.fill} opacity={0.3} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
