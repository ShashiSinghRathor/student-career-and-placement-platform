import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Briefcase, Users, CheckCircle, CalendarClock, Award, FileText } from "lucide-react";
import api, { getError } from "../../services/api";
import { StatCard, ChartCard } from "../../components/ui/StatCard";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { statusColor, formatDate } from "../../utils/format";

const COLORS = ["#4351e8", "#7c3aed", "#059669", "#d97706", "#e11d48", "#0ea5e9"];

export default function RecruiterDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api.get("/recruiter/dashboard")
      .then(r => setData(r.data.data))
      .catch(e => setError(getError(e)));
  }, []);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <Spinner />;

  const c = data.counts;
  const byJobType = data.jobsByType || [];
  const applicantsOverTime = data.applicantsOverTime || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recruiter Dashboard</h1>
        <p className="text-sm text-slate-500">Your hiring overview at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Jobs Posted" value={data.jobsPosted} tone="brand" />
        <StatCard icon={Users} label="Total Applicants" value={c.totalApplicants} tone="sky" />
        <StatCard icon={CheckCircle} label="Shortlisted" value={c.shortlisted} tone="violet" />
        <StatCard icon={CalendarClock} label="Interviews" value={c.interviews} tone="amber" />
        <StatCard icon={Award} label="Selected" value={c.selected} tone="emerald" />
        <StatCard icon={FileText} label="Under Review" value={c.underReview} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Jobs by type">
          {byJobType.length === 0 ? (
            <EmptyState title="No jobs posted yet" subtitle="Post jobs to see breakdowns." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byJobType}>
                  <XAxis dataKey="type" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis includeZero fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4351e8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Applicants over time">
          {applicantsOverTime.length === 0 ? (
            <EmptyState title="No applicant traffic yet" subtitle="Applications will appear here over time." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={applicantsOverTime}>
                  <XAxis dataKey="period" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis includeZero fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#059669" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800">Application status breakdown</h3>
          <div className="h-48 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusChart} dataKey="value" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {data.statusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px] text-slate-600">
              {data.statusChart.map((s, i) => (
                <span key={s.status} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.status}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Recent applicants</h3>
            <Link to="/recruiter/applicants" className="text-xs font-semibold text-brand-600 hover:text-brand-700">All →</Link>
          </div>
          {data.recentApplications?.length === 0 ? (
            <EmptyState title="No applicants yet" subtitle="Start posting jobs to attract candidates." />
          ) : (
            <div className="mt-3 divide-y divide-slate-50">
              {data.recentApplications.map(a => (
                <div key={a._id} className="flex items-center gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 overflow-hidden">
                    {a.studentId?.profileImage ? <img src={a.studentId.profileImage} alt="" className="h-full w-full object-cover" /> : a.studentId?.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.studentId?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{a.jobId?.title}</p>
                  </div>
                  <span className={`badge ${statusColor(a.status)}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming interviews */}
      {data.upcomingInterviews?.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800">Upcoming interviews</h3>
          <div className="mt-3 space-y-3">
            {data.upcomingInterviews.map(iv => (
              <div key={iv._id} className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><CalendarClock size={16} /></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{iv.round}</p>
                  <p className="text-xs text-slate-500">{formatDate(iv.date)} • {iv.time}</p>
                </div>
                <span className="badge bg-brand-50 text-brand-700">{iv.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
