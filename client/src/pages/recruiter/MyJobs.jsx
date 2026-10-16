import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, Clock, MapPin, Users, CheckCircle, XCircle } from "lucide-react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { formatDate, daysLeft, salaryText } from "../../utils/format";

export default function MyJobs() {
  const toast = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/jobs/my/posted", { params: { status: status === "all" ? undefined : status, page } });
      setJobs(res.data.jobs || []);
      setMeta({ total: res.data.total, totalPages: res.data.totalPages, page: res.data.page });
    } catch (e) { setError(getError(e)); }
    finally { setLoading(false); }
  }, [status, page]);
  useEffect(load, [load]);

  const deleteJob = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This removes all applications too.`)) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success("Job deleted");
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const pendingCount = (jobs || []).filter(j => j.status === "pending").length;
  const activeCount = (jobs || []).filter(j => j.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your job postings and internship listings.</p>
        </div>
        <Link to="/recruiter/jobs/new" className="btn-primary">
          <Plus size={16} /> Post a Job
        </Link>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Briefcase size={18} /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
            <p className="text-xs text-slate-500">Total jobs</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle size={18} /></div>
          <div><p className="text-2xl font-bold text-slate-900">{activeCount}</p><p className="text-xs text-slate-500">Active</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Clock size={18} /></div>
          <div><p className="text-2xl font-bold text-slate-900">{pendingCount}</p><p className="text-xs text-slate-500">Pending approval</p></div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "active", "pending", "closed", "rejected", "draft"].map(s => (
          <button key={s} className={`btn btn-sm ${status === s ? "btn-primary" : "btn-secondary"}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : jobs.length === 0 ? (
        <EmptyState title="No jobs found" subtitle={status === "all" ? "Post your first job to start receiving applicants." : `No ${status} jobs.`} action={<Link to="/recruiter/jobs/new" className="btn-primary btn-sm">Post a Job</Link>} />
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map((job) => {
              const dl = daysLeft(job.deadline);
              const expired = dl === 0;
              return (
                <div key={job._id} className="card p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="font-semibold text-slate-900">{job.title}</h3>
                        <span className={`badge ml-2 ${job.status === "active" ? "bg-emerald-50 text-emerald-700" : job.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{job.status}</span>
                        {job.rejectionReason && <span className="text-xs text-rose-500">{job.rejectionReason}</span>}
                      </div>
                      <p className="text-sm text-slate-500">{job.location} • <span className="capitalize">{job.jobType?.replace("-", " ")}</span></p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-400" /> {job.location}</span>
                        {job.salary && (job.salary.min > 0 || job.salary.max > 0) && <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" /> {salaryText(job.salary)}</span>}
                        {job.deadline && <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" /> {expired ? "Expired" : `Deadline in ${dl}d`}</span>}
                      </div>
                      {job.requiredSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.requiredSkills.slice(0, 4).map(s => <span key={s} className="chip">{s}</span>)}
                          {job.requiredSkills.length > 4 && <span className="text-xs text-slate-400">+{job.requiredSkills.length - 4}</span>}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-slate-400">Posted {formatDate(job.createdAt)} • Views: {job.views || 0}</div>
                    </div>
                    <div className="flex sm:flex-col items-center gap-2 justify-end sm:justify-start sm:items-center sm:gap-2">
                      <div className="text-right text-sm">
                        <span className="font-medium text-slate-900">{job.stats?.applications || 0}</span> applicants
                        {job.stats?.shortlisted ? <span className="block text-xs text-violet-600">{job.stats.shortlisted} shortlisted</span> : null}
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/recruiter/applicants/${job._id}`} className="btn btn-secondary btn-sm">View Applicants</Link>
                        <Link to={`/recruiter/jobs/${job._id}/edit`} className="btn btn-secondary btn-sm"><Edit size={14} /></Link>
                        <button className="btn btn-danger btn-sm text-xs" onClick={() => deleteJob(job._id, job.title)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages}</span>
              <button className="btn-secondary btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
