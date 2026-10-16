import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, Building2, Briefcase, FileText, Award, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import api, { getError } from "../../services/api";
import { StatCard, ChartCard } from "../../components/ui/StatCard";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { Link } from "react-router-dom";

const COLORS = ["#4351e8", "#7c3aed", "#059669", "#d97706", "#e11d48", "#0ea5e9"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api.get("/admin/statistics")
      .then(r => setStats(r.data.statistics))
      .catch(e => setError(getError(e)));
  }, []);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!stats) return <Spinner />;

  const c = stats.counts;
  const charts = stats.charts || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">Platform-wide statistics and oversight.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard icon={Users} label="Total Students" value={c.totalStudents} tone="brand" />
        <StatCard icon={Building2} label="Total Companies" value={c.totalCompanies} tone="violet" />
        <StatCard icon={Briefcase} label="Total Jobs" value={c.totalJobs} tone="sky" />
        <StatCard icon={FileText} label="Applications" value={c.totalApplications} tone="amber" />
        <StatCard icon={Award} label="Placements" value={c.totalPlacements} tone="emerald" />
        <StatCard icon={TrendingUp} label="Placement Rate" value={`${c.placementRate}%`} tone="brand" sub="of students" />
      </div>

      {/* Pending / attention row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{c.pendingJobs}</p>
            <p className="text-sm text-slate-500">Pending job approvals</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><User size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{c.pendingRecruiters}</p>
            <p className="text-sm text-slate-500">Recruiters pending approval</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{c.openReports}</p>
            <p className="text-sm text-slate-500">Open reports</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Briefcase size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{c.totalInterviews}</p>
            <p className="text-sm text-slate-500">Total interviews scheduled</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Applications over time">
          {charts.appsOverTime?.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.appsOverTime}>
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis includeZero fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4351e8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No application data" />
          )}
        </ChartCard>

        <ChartCard title="Placements over time">
          {charts.placementsOverTime?.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.placementsOverTime}>
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis includeZero fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: "#059669" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No placement data" />
          )}
        </ChartCard>

        <ChartCard title="Jobs by category">
          {charts.jobsByType?.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.jobsByType} dataKey="count" nameKey="type" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {charts.jobsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px] text-slate-600">
                {charts.jobsByType.map((s, i) => (
                  <span key={s.type} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.type}</span>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="No job data" />
          )}
        </ChartCard>

        <ChartCard title="Students by branch">
          {charts.studentsByBranch?.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.studentsByBranch} layout="vertical">
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis type="category" dataKey="branch" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#1e293b" }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[2, 4, 4, 2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No branch data yet" />
          )}
        </ChartCard>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800">Top hiring companies</h3>
          <div className="mt-3 space-y-2">
            {(charts.topCompanies || []).slice(0, 6).map((c, i) => (
              <Link key={c._id} to="/admin/companies" className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded">
                <span className="w-5 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 overflow-hidden">
                  {c.logo ? <img src={c.logo} alt="" className="h-full w-full object-cover" /> : (c.name || "C").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.jobs} job{c.jobs !== 1 ? "s" : ""}</p>
                </div>
              </Link>
            ))}
            {(!charts.topCompanies || charts.topCompanies.length === 0) && <EmptyState title="No hiring data yet" />}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800">Quick actions</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link to="/admin/users" className="btn btn-secondary btn-sm">Manage Users</Link>
            <Link to="/admin/jobs" className="btn btn-secondary btn-sm">Review Jobs</Link>
            <Link to="/admin/companies" className="btn btn-secondary btn-sm">Companies</Link>
            <Link to="/admin/applications" className="btn btn-secondary btn-sm">Applications</Link>
            <Link to="/admin/reports" className="btn btn-secondary btn-sm">Flagged Content</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function User({ size }) {
  // inline minimal user icon to avoid import collision; callers pass size
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
