import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, ClipboardCheck, UserCheck, CalendarClock, Award, Bookmark, Briefcase, ArrowRight, TrendingUp, Calendar } from "lucide-react";
import api, { getError } from "../../services/api";
import { StatCard, ChartCard } from "../../components/ui/StatCard";
import JobCard from "../../components/jobs/JobCard";
import { ErrorState, EmptyState } from "../../components/ui/States";
import { statusColor, formatDate } from "../../utils/format";

const COLORS = ["#4351e8", "#7c3aed", "#059669", "#d97706", "#e11d48", "#0ea5e9"];

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [recs, setRecs] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = () => {
    setError("");
    Promise.all([api.get("/students/dashboard"), api.get("/students/recommendations?limit=4")])
      .then(([d, r]) => {
        setData(d.data.data);
        setRecs(r.data.items || []);
      })
      .catch((e) => setError(getError(e)));
  };
  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-28 skeleton" />)}
        </div>
        <div className="card h-72 skeleton" />
      </div>
    );
  }

  const c = data.counts;
  const chartData = data.statusChart.filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      {/* Welcome + completion */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{data.welcome}</h1>
          <p className="mt-1 text-sm text-brand-100">Here's how your job search is going today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-brand-100">Profile completion</p>
            <p className="text-2xl font-bold">{data.completion}%</p>
          </div>
          <Link to="/profile" className="btn bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/30 hover:bg-white/20">
            {data.completion < 100 ? "Improve now" : "View profile"}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={FileText} label="Applications" value={c.applications} tone="brand" />
        <StatCard icon={ClipboardCheck} label="Under Review" value={c.underReview} tone="amber" />
        <StatCard icon={UserCheck} label="Shortlisted" value={c.shortlisted} tone="violet" />
        <StatCard icon={CalendarClock} label="Interviews" value={c.interviews} tone="sky" />
        <StatCard icon={Award} label="Offers" value={c.offers} tone="emerald" />
        <StatCard icon={Bookmark} label="Saved Jobs" value={c.savedJobs} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Status chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800">Application status</h3>
          {chartData.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center">
              <Briefcase className="text-slate-300" size={32} />
              <p className="mt-3 text-sm font-medium text-slate-500">No applications yet</p>
              <p className="text-xs text-slate-400">Start applying to jobs to see your progress here</p>
              <Link to="/jobs" className="btn-primary btn-sm mt-4">Find Jobs</Link>
            </div>
          ) : (
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
                {chartData.map((s, i) => (
                  <span key={s.status} className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {s.status} ({s.value})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Recent applications</h3>
            <Link to="/applications" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          {data.recentApplications?.length === 0 ? (
            <EmptyState title="No applications yet" subtitle="Start applying to jobs to see them here." />
          ) : (
            <div className="mt-4 divide-y divide-slate-50">
              {data.recentApplications.map((a) => (
                <button key={a._id} onClick={() => navigate(`/applications/${a._id}`)} className="flex w-full items-center gap-4 py-3 text-left hover:bg-slate-50/60 rounded-lg px-2 -mx-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 overflow-hidden">
                    {a.companyId?.logo ? <img src={a.companyId.logo} alt="" className="h-full w-full object-cover" /> : (a.companyId?.name || "J").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{a.jobId?.title}</p>
                    <p className="text-xs text-slate-400">{a.companyId?.name} • {formatDate(a.appliedAt)}</p>
                  </div>
                  <span className={`badge ${statusColor(a.status)}`}>{a.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming interviews */}
      {data.upcomingInterviews?.length > 0 && (
        <ChartCard title="Upcoming interviews">
          <div className="divide-y divide-slate-50">
            {data.upcomingInterviews.map((iv) => (
              <div key={iv._id} className="flex items-center gap-4 py-3">
                <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Calendar size={16} />
                  <span className="text-[10px] font-bold">{formatDate(iv.date, { year: undefined, month: "short", day: "numeric" }).replace(",", "")}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{iv.applicationId?.jobId?.title}</p>
                  <p className="text-xs text-slate-500">{iv.time} • {iv.type} {iv.meetingLink && "• Online link available"}</p>
                </div>
                <span className="badge bg-brand-50 text-brand-700">{iv.status}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Recommended jobs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><TrendingUp size={16} className="text-brand-600" /> Recommended for you <span className="badge bg-emerald-50 text-emerald-700">skill match</span></h3>
          <Link to="/jobs" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Browse all jobs →</Link>
        </div>
        {recs.length === 0 ? (
          <EmptyState
            title="No recommendations yet"
            subtitle="Add skills to your profile and we'll match you with relevant jobs instantly."
            action={<Link to="/profile" className="btn-primary btn-sm">Add skills <ArrowRight size={14} /></Link>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recs.map(({ job, matchPercent }) => (
              <JobCard key={job._id} job={{ ...job, matchPercent, saved: false, applyable: false }} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
