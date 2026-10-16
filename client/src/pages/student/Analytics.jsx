import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Target, FileText, Briefcase, TrendingUp, Users } from "lucide-react";
import api, { getError } from "../../services/api";
import { StatCard, ChartCard } from "../../components/ui/StatCard";
import { Spinner, EmptyState, ErrorState } from "../../components/ui/States";

const COLORS = ["#4351e8", "#7c3aed", "#059669", "#d97706", "#e11d48", "#0ea5e9"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api.get("/students/analytics").then((r) => setData(r.data.analytics)).catch((e) => setError(getError(e)));
  }, []);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <Spinner />;

  const totals = data.byStatus.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">See what's working across your applications.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total applications" value={totals} tone="brand" />
        <StatCard icon={Briefcase} label="Jobs applied to" value={new Set(data.byStatus.filter(s => s.count > 0).map(() => 1)).size} tone="sky" />
        <StatCard icon={Target} label="Offer rate" value={`${Math.round((data.byStatus.find(s => s.status === "Selected")?.count || 0) / Math.max(1, totals) * 100)}%`} tone="emerald" />
        <StatCard icon={TrendingUp} label="Active outreach" value="As of today" tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By status */}
        <ChartCard title="Applications by status">
          {data.byStatus.length === 0 ? (
            <EmptyState title="No data yet" subtitle="Apply to register jobs in your analytics." />
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byStatus} dataKey="count" nameKey="status" innerRadius={60} outerRadius={85} paddingAngle={4}>
                    {data.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-slate-600">
                {data.byStatus.map((s, i) => (
                  <span key={s.status} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.status}</span>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* By month */}
        <ChartCard title="Applications over time">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byMonth}>
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                <YAxis includeZero fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4351e8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* By job type */}
        <ChartCard title="Applications by job type">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byJobType} layout="vertical">
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="type" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#1e293b" }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[2, 4, 4, 2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Demand skills (top skills in jobs you applied to) */}
        <ChartCard title="In-demand skills (from jobs you applied)">
          {data.demandSkills.length === 0 ? (
            <EmptyState title="Apply to more jobs to see demand trends" />
          ) : (
            <div className="space-y-3">
              {data.demandSkills.slice(0, 8).map((s, i) => (
                <div key={s.skill} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <span className="h-6 flex items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 w-6">{i + 1}</span>
                    {s.skill}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{s.count} application{s.count > 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
